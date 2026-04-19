import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../plugins/auth.js";
import {
  compareTastesMulti,
  type MultiCompareResult,
  type RatedRef,
} from "../lib/gemini.js";
import {
  buildRatedWorksRefs,
  buildTasteProfile,
  findOverlapWorks,
} from "../lib/profile.js";
import { enrichWorkRefs } from "../lib/enrich.js";
import { gatherRecommendationCandidates } from "../lib/recommend.js";
import { prisma } from "../lib/prisma.js";
import type { NormalizedWork } from "../types/normalized-work.js";

const compareBody = z.object({
  friendCodes: z.array(z.string().min(4)).min(1).max(4),
  save: z.boolean().optional(),
});

function nick(u: { nickname: string | null; friendCode: string }) {
  const n = u.nickname?.trim();
  if (n) return `${n}님`;
  return `테이퍼${u.friendCode.slice(-4)}님`;
}

function workKey(provider: string, externalId: string, mediaType: string) {
  return `${provider}:${externalId}:${mediaType}`;
}

const PLACEHOLDER_PARAGRAPH =
  "The model did not return a detailed comparison. Check ratings, notes, and genre overlap yourself.";

/** AI가 환각한 provider/id 조합 제거: 반드시 실제 목록(ref)에 있는 작품만 유지 */
function strictFilterComparePicks(
  result: MultiCompareResult,
  myRated: RatedRef[],
  friendPayload: Array<{ label: string; rated: RatedRef[] }>,
  newCandidates: NormalizedWork[]
): MultiCompareResult {
  const myKeys = new Set(
    myRated.map((r) => workKey(r.work.provider, r.work.externalId, r.work.mediaType))
  );

  const friendOwnedKeys = new Set<string>();
  for (const fp of friendPayload) {
    for (const r of fp.rated) {
      friendOwnedKeys.add(
        workKey(r.work.provider, r.work.externalId, r.work.mediaType)
      );
    }
  }

  const candidateKeys = new Set(
    newCandidates.map((c) =>
      workKey(c.externalRef.provider, c.externalRef.id, c.mediaType)
    )
  );

  return {
    ...result,
    watchTogetherNew: result.watchTogetherNew.filter((w) =>
      candidateKeys.has(workKey(w.provider, w.externalId, w.mediaType))
    ),
    picksFromFriendLibsForMe: result.picksFromFriendLibsForMe.filter((p) =>
      friendOwnedKeys.has(workKey(p.provider, p.externalId, p.mediaType))
    ),
    picksFromMyLibForFriends: result.picksFromMyLibForFriends.filter((p) =>
      myKeys.has(workKey(p.provider, p.externalId, p.mediaType))
    ),
  };
}

function patchMultiCompareResult(
  result: MultiCompareResult,
  friendPayload: Array<{ label: string; rated: RatedRef[] }>
): MultiCompareResult {
  const fallbackFriend = friendPayload[0]?.label ?? "Friend";

  const friends = friendPayload.map((fp, i) => {
    const f = result.friends[i];
    return {
      nicknameLabel: f?.nicknameLabel?.trim() || fp.label,
      similarityScore:
        typeof f?.similarityScore === "number" ? f.similarityScore : 50,
      paragraph: f?.paragraph?.trim() || PLACEHOLDER_PARAGRAPH,
    };
  });

  const picksFromFriendLibsForMe = result.picksFromFriendLibsForMe.map((p) => {
    if (p.friendNicknameLabel?.trim()) return { ...p, friendNicknameLabel: p.friendNicknameLabel };
    const k = workKey(p.provider, p.externalId, p.mediaType);
    for (const fp of friendPayload) {
      const hit = fp.rated.some(
        (r) =>
          workKey(r.work.provider, r.work.externalId, r.work.mediaType) === k
      );
      if (hit) return { ...p, friendNicknameLabel: fp.label };
    }
    return { ...p, friendNicknameLabel: fallbackFriend };
  });

  const picksFromMyLibForFriends = result.picksFromMyLibForFriends.map((p, i) => {
    if (p.toFriendNicknameLabel?.trim()) return { ...p, toFriendNicknameLabel: p.toFriendNicknameLabel };
    const labels = friendPayload.map((f) => f.label);
    if (labels.length === 1) {
      return { ...p, toFriendNicknameLabel: labels[0] };
    }
    return {
      ...p,
      toFriendNicknameLabel: labels[i % labels.length] ?? fallbackFriend,
    };
  }).map((p) => ({
    ...p,
    whyTheyMightLike:
      p.whyTheyMightLike?.trim() || "No recommendation reason was generated.",
  }));

  const picksFromFriendWithWhy = picksFromFriendLibsForMe.map((p) => ({
    ...p,
    whyForMe: p.whyForMe?.trim() || "No recommendation reason was generated.",
  }));

  return {
    ...result,
    introduction: result.introduction?.trim() || "No comparison summary was generated.",
    friends,
    overlapCommentary: result.overlapCommentary.map((o) => ({
      ...o,
      sharedJoyComment:
        o.sharedJoyComment?.trim() || "You both rated this work highly.",
    })),
    watchTogetherNew: result.watchTogetherNew.map((w) => ({
      ...w,
      recommendationPitch:
        w.recommendationPitch?.trim() || "Worth watching together as a group.",
    })),
    picksFromFriendLibsForMe: picksFromFriendWithWhy,
    picksFromMyLibForFriends,
  };
}

export const compareRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/me/compare",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const body = compareBody.safeParse(request.body ?? {});
      if (!body.success) {
        return reply.status(400).send({ error: "Invalid body", details: body.error.flatten() });
      }

      const meId = request.user!.sub;
      const me = await prisma.user.findUniqueOrThrow({ where: { id: meId } });

      const rawCodes = [
        ...new Set(
          body.data.friendCodes.map((c) => c.trim().toUpperCase()).filter(Boolean)
        ),
      ].slice(0, 4);

      const friends: Array<{
        user: { id: string; nickname: string | null; friendCode: string };
        label: string;
      }> = [];

      for (const code of rawCodes) {
        const f = await prisma.user.findUnique({
          where: { friendCode: code },
        });
        if (!f) {
          return reply.status(404).send({ error: `친구 코드를 찾을 수 없음: ${code}` });
        }
        if (f.id === meId) {
          return reply.status(400).send({ error: "자기 자신과는 비교할 수 없습니다" });
        }
        if (!f.comparePublic) {
          return reply
            .status(403)
            .send({ error: `${code}: 상대가 친구 검색을 비공개로 설정했습니다` });
        }
        friends.push({ user: f, label: nick(f) });
      }

      const myProfile = await buildTasteProfile(meId);
      const myRated = await buildRatedWorksRefs(meId, 3);
      const myLabel = nick(me);

      const friendPayload = await Promise.all(
        friends.map(async (f) => {
          const profile = await buildTasteProfile(f.user.id);
          const rated = await buildRatedWorksRefs(f.user.id, 3);
          return { label: f.label, profile, rated };
        })
      );

      const overlapPairs: Array<{
        title: string;
        mediaType: string;
        friendLabel: string;
        myRating: number;
        theirRating: number;
      }> = [];

      for (let i = 0; i < friends.length; i++) {
        const f = friends[i];
        const ovs = await findOverlapWorks(meId, f.user.id, 4);
        for (const o of ovs) {
          overlapPairs.push({
            title: o.title,
            mediaType: o.mediaType,
            friendLabel: f.label,
            myRating: o.myRating,
            theirRating: o.theirRating,
          });
        }
      }

      const newCandidates = await gatherRecommendationCandidates(myProfile, {});

      let result;
      try {
        result = await compareTastesMulti({
          meLabel: myLabel,
          myProfile,
          myRated,
          friends: friendPayload.map((p) => ({
            label: p.label,
            profile: p.profile,
            rated: p.rated,
          })),
          overlapPairs,
          newCandidates,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Compare failed";
        return reply.status(502).send({ error: msg });
      }

      result = strictFilterComparePicks(result, myRated, friendPayload, newCandidates);
      result = patchMultiCompareResult(result, friendPayload);

      const [wt, pf, pm] = await Promise.all([
        enrichWorkRefs(result.watchTogetherNew, newCandidates),
        enrichWorkRefs(
          result.picksFromFriendLibsForMe.map((x) => ({
            friendNicknameLabel: x.friendNicknameLabel,
            provider: x.provider,
            externalId: x.externalId,
            mediaType: x.mediaType,
            whyForMe: x.whyForMe,
          })),
          []
        ),
        enrichWorkRefs(
          result.picksFromMyLibForFriends.map((x) => ({
            toFriendNicknameLabel: x.toFriendNicknameLabel,
            provider: x.provider,
            externalId: x.externalId,
            mediaType: x.mediaType,
            whyTheyMightLike: x.whyTheyMightLike,
          })),
          []
        ),
      ]);

      const response = {
        meLabel: myLabel,
        friends: friends.map((f) => ({
          nicknameLabel: f.label,
          friendCode: f.user.friendCode,
        })),
        result: {
          introduction: result.introduction,
          friends: result.friends,
          overlapCommentary: result.overlapCommentary,
          watchTogetherNew: wt,
          picksFromFriendLibsForMe: pf,
          picksFromMyLibForFriends: pm,
        },
      };

      if (body.data.save) {
        await prisma.savedSnapshot.create({
          data: {
            userId: meId,
            kind: "compare",
            label: `비교 ${new Date().toISOString().slice(0, 16)}`,
            payload: response as object,
          },
        });
      }

      return response;
    }
  );
};
