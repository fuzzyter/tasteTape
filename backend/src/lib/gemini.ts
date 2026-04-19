import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { NormalizedWork } from "../types/normalized-work.js";
import type { TasteProfileJson } from "./profile.js";

function getKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}

const analysisSchema = z.object({
  tasteSummary: z.string(),
  keywords: z.array(z.string()),
  recommendationBlurb: z.string(),
});

const rankedItemSchema = z.object({
  title: z.string(),
  provider: z.string(),
  externalId: z.string(),
  mediaType: z.enum(["book", "movie", "tv"]),
  score: z.number(),
  reasons: z.array(z.string()),
  aiComment: z.string(),
});

const rankedSchema = z.object({
  ranked: z.array(rankedItemSchema),
});

const multiCompareSchema = z.object({
  introduction: z.string().optional(),
  friends: z.array(
    z.object({
      nicknameLabel: z.string().optional(),
      similarityScore: z.number().optional(),
      paragraph: z.string().optional(),
    })
  ),
  overlapCommentary: z.array(
    z.object({
      title: z.string(),
      sharedJoyComment: z.string().optional(),
    })
  ),
  watchTogetherNew: z.array(
    z.object({
      title: z.string(),
      provider: z.string(),
      externalId: z.string(),
      mediaType: z.enum(["book", "movie", "tv"]),
      recommendationPitch: z.string().optional(),
    })
  ),
  picksFromFriendLibsForMe: z.array(
    z.object({
      friendNicknameLabel: z.string().optional(),
      provider: z.string(),
      externalId: z.string(),
      mediaType: z.enum(["book", "movie", "tv"]),
      whyForMe: z.string().optional(),
    })
  ),
  picksFromMyLibForFriends: z.array(
    z.object({
      toFriendNicknameLabel: z.string().optional(),
      provider: z.string(),
      externalId: z.string(),
      mediaType: z.enum(["book", "movie", "tv"]),
      whyTheyMightLike: z.string().optional(),
    })
  ),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;
export type RankedRecommendations = z.infer<typeof rankedSchema>;
export type MultiCompareResult = z.infer<typeof multiCompareSchema>;

function model() {
  const genAI = new GoogleGenerativeAI(getKey());
  const name = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  return genAI.getGenerativeModel({ model: name });
}

async function generateJson<T>(prompt: string): Promise<T> {
  const m = model();
  const full = `${prompt}\n\nRespond with ONLY a single JSON object, no markdown fences.`;
  const res = await m.generateContent(full);
  const text = res.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Gemini response");
  return JSON.parse(jsonMatch[0]) as T;
}

function formatItemsForPrompt(profile: TasteProfileJson): string {
  return profile.items
    .map(
      (i) =>
        `- ${i.title} (${i.mediaType}) ★${i.rating}/5` +
        (i.preferenceNote ? ` | note: ${i.preferenceNote}` : "") +
        (i.reviewText ? ` | review: ${i.reviewText.slice(0, 200)}` : "") +
        ` | genres: ${i.genres.slice(0, 5).join(", ")}`
    )
    .join("\n");
}

export async function analyzeTaste(profile: TasteProfileJson): Promise<AnalysisResult> {
  const raw = await generateJson<unknown>(
    `You are a media taste analyst. Write ALL user-facing text in English (clear, natural English).

Each line below is a rated work. Infer taste from ratings, notes, reviews, and genres — do not reduce taste to genre alone.

Rated works:
${formatItemsForPrompt(profile)}

Summary stats: ${JSON.stringify(profile.summary)}

Rules:
- tasteSummary: 4–8 sentences; reference ratings, notes, genres, and era when possible.
- keywords: 5–12 short English phrases or words.
- recommendationBlurb: 2–4 sentences in English.
JSON shape: {"tasteSummary": string, "keywords": string[], "recommendationBlurb": string}`
  );
  return analysisSchema.parse(raw);
}

export async function rankCandidates(
  profile: TasteProfileJson,
  candidates: NormalizedWork[],
  excludeTitles: Set<string>
): Promise<RankedRecommendations> {
  const filtered = candidates.filter((c) => !excludeTitles.has(c.title.toLowerCase()));
  if (filtered.length === 0) {
    return { ranked: [] };
  }
  const raw = await generateJson<unknown>(
    `Rank candidate works for this user. Write reasons and aiComment in English only.

User's rated works (prioritize ratings and notes):
${formatItemsForPrompt(profile)}

Candidates — you MUST copy provider, externalId, mediaType exactly:
${JSON.stringify(
      filtered.map((c) => ({
        provider: c.externalRef.provider,
        externalId: c.externalRef.id,
        mediaType: c.mediaType,
        title: c.title,
        year: c.year,
        genres: c.genres,
        synopsis: c.synopsis?.slice(0, 400) ?? null,
      })),
      null,
      2
    )}
Pick up to 8 items. score 0-100. You MUST only include works whose provider, externalId, and mediaType appear EXACTLY in the Candidates list — never invent IDs.
reasons: 2–3 short English bullet points (metadata-based).
aiComment: one paragraph (3–5 sentences) in English explaining fit, referencing the user's notes and rating patterns.
JSON: {"ranked":[{"title","provider","externalId","mediaType","score","reasons":[],"aiComment":""}]}`
  );
  return rankedSchema.parse(raw);
}

export type RatedRef = {
  rating: number;
  preferenceNote: string | null;
  reviewText: string | null;
  work: {
    title: string;
    mediaType: string;
    provider: string;
    externalId: string;
    year: number | null;
    genres: string[];
    posterOrCoverUrl: string | null;
  };
};

export async function compareTastesMulti(input: {
  meLabel: string;
  myProfile: TasteProfileJson;
  myRated: RatedRef[];
  friends: Array<{
    label: string;
    profile: TasteProfileJson;
    rated: RatedRef[];
  }>;
  overlapPairs: Array<{
    title: string;
    mediaType: string;
    myRating: number;
    theirRating: number;
    friendLabel: string;
  }>;
  newCandidates: NormalizedWork[];
}): Promise<MultiCompareResult> {
  const friendLibs = input.friends.map((f) => ({
    nicknameLabel: f.label,
    ratedOptions: f.rated.map((r) => ({
      provider: r.work.provider,
      externalId: r.work.externalId,
      mediaType: r.work.mediaType,
      title: r.work.title,
      rating: r.rating,
      preferenceNote: r.preferenceNote,
    })),
  }));

  const myLib = input.myRated.map((r) => ({
    provider: r.work.provider,
    externalId: r.work.externalId,
    mediaType: r.work.mediaType,
    title: r.work.title,
    rating: r.rating,
    preferenceNote: r.preferenceNote,
  }));

  const raw = await generateJson<unknown>(
    `You compare ${input.meLabel}'s taste with ${input.friends.length} friends. Write ALL narrative text in English only (introduction, paragraphs, pitches, why-lines, overlap comments).

Address people using nicknameLabel strings as given (no emails).

My (${input.meLabel}) summary:
${JSON.stringify(input.myProfile.summary)}
My works with notes:
${formatItemsForPrompt(input.myProfile)}

Friends data:
${JSON.stringify(friendLibs, null, 2)}

Overlapping highly-rated same works (same title/ref) with scores:
${JSON.stringify(input.overlapPairs, null, 2)}

New discovery candidates (for watchTogetherNew only — copy provider/externalId/mediaType exactly from this list):
${JSON.stringify(
      input.newCandidates.slice(0, 45).map((c) => ({
        provider: c.externalRef.provider,
        externalId: c.externalRef.id,
        mediaType: c.mediaType,
        title: c.title,
        year: c.year,
      })),
      null,
      2
    )}

Rules:
- introduction: 6–12 sentences — overall group dynamic, no filler.
- friends: one entry per friend — similarityScore 0–100, paragraph at least 5 sentences comparing their notes/ratings vs mine.
- overlapCommentary: for notable overlaps from the overlap list, 1–2 sentences each.
- watchTogetherNew: 3–6 picks from newCandidates only; recommendationPitch explains why the group might enjoy together.
- picksFromFriendLibsForMe: 2–5 items per friend max total 12 — MUST copy provider/externalId/mediaType EXACTLY from that friend's ratedOptions only (no invented IDs). If unsure, omit the item. whyForMe ties their library to MY taste using my notes. EVERY item MUST include "friendNicknameLabel" exactly matching the friend who owns that work (same string as nicknameLabel in Friends data).
- picksFromMyLibForFriends: 2–5 items per target max total 12 — MUST copy provider/externalId/mediaType EXACTLY from myLib only (no invented IDs). If unsure, omit the item. whyTheyMightLike references their taste. EVERY item MUST include "toFriendNicknameLabel" (which friend you recommend this to — use exact nicknameLabel from Friends data).

JSON shape matches: introduction, friends[], overlapCommentary[], watchTogetherNew[], picksFromFriendLibsForMe[], picksFromMyLibForFriends[] with fields as in the schema above. Never omit friendNicknameLabel or toFriendNicknameLabel.`
  );
  return multiCompareSchema.parse(raw);
}
