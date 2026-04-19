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

const rankedSchema = z.object({
  ranked: z.array(
    z.object({
      title: z.string(),
      provider: z.string(),
      externalId: z.string(),
      mediaType: z.enum(["book", "movie", "tv"]),
      score: z.number(),
      reasons: z.array(z.string()),
    })
  ),
});

const compareSchema = z.object({
  similarityScore: z.number().min(0).max(100),
  comparisonSummary: z.string(),
  watchTogether: z.array(z.string()),
  friendPickForYou: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;
export type RankedRecommendations = z.infer<typeof rankedSchema>;
export type CompareResult = z.infer<typeof compareSchema>;

function model() {
  const genAI = new GoogleGenerativeAI(getKey());
  // gemini-1.5-* 는 v1beta에서 종종 제거됨 → 최신 Flash 권장
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

export async function analyzeTaste(profile: TasteProfileJson): Promise<AnalysisResult> {
  const raw = await generateJson<unknown>(
    `You are a media taste analyst. Given the user's rated works (with genres, synopsis snippets, ratings), write a concise taste profile in Korean.
User profile JSON:\n${JSON.stringify(profile, null, 2)}
Rules: Be specific (not just "likes mystery"). Mention era, tone, pacing, themes if inferable. If data is sparse, say so briefly.
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
    `Rank these candidate works for the user. User taste JSON:\n${JSON.stringify(profile.summary, null, 2)}
High-rated items sample: ${profile.items
      .filter((i) => i.rating >= 4)
      .map((i) => `${i.title} (${i.mediaType})`)
      .slice(0, 20)
      .join("; ")}
Candidates (use provider + externalId + mediaType exactly as given):\n${JSON.stringify(
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
Pick up to 8 items. Score 0-100. Reasons in Korean (2-3 short bullets each). Prefer diversity.
JSON shape: {"ranked": [{"title","provider","externalId","mediaType":"book"|"movie"|"tv","score","reasons":[]}]}`, 
  );
  return rankedSchema.parse(raw);
}

export async function compareTastes(
  a: TasteProfileJson,
  b: TasteProfileJson,
  friendRatedTitles: string[]
): Promise<CompareResult> {
  const raw = await generateJson<unknown>(
    `Compare two users' media tastes. Output similarity 0-100, a short Korean comparison, 3-5 "watch together" title ideas (can be generic themes if needed), and 3-5 friend titles (${friendRatedTitles.join(
      ", "
    )}) that user A might like — in Korean.
User A:\n${JSON.stringify(a.summary, null, 2)}
User B:\n${JSON.stringify(b.summary, null, 2)}
JSON shape: {"similarityScore": number, "comparisonSummary": string, "watchTogether": string[], "friendPickForYou": string[]}`,
  );
  return compareSchema.parse(raw);
}
