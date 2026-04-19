import { fetchWorkDetail } from "../adapters/index.js";
import type { NormalizedWork } from "../types/normalized-work.js";

export type WorkCard = {
  title: string;
  year: number | null;
  posterOrCoverUrl: string | null;
  synopsis: string | null;
  mediaType: "book" | "movie" | "tv";
};

function key(provider: string, externalId: string, mediaType: string) {
  return `${provider}:${externalId}:${mediaType}`;
}

export async function enrichWorkRefs(
  items: Array<{
    provider: string;
    externalId: string;
    mediaType: "book" | "movie" | "tv";
    [k: string]: unknown;
  }>,
  pool: NormalizedWork[]
): Promise<Array<Record<string, unknown> & { work: WorkCard }>> {
  const pmap = new Map<string, NormalizedWork>();
  for (const c of pool) {
    pmap.set(
      key(c.externalRef.provider, c.externalRef.id, c.mediaType),
      c
    );
  }

  const out: Array<Record<string, unknown> & { work: WorkCard }> = [];
  for (const item of items) {
    const k = key(item.provider, item.externalId, item.mediaType);
    let w = pmap.get(k);
    if (!w) {
      try {
        w = await fetchWorkDetail(item.mediaType, item.provider, item.externalId);
        pmap.set(k, w);
      } catch {
        w = undefined;
      }
    }
    const { provider: _p, externalId: _e, mediaType: _m, ...rest } = item;
    const card: WorkCard = w
      ? {
          title: w.title,
          year: w.year,
          posterOrCoverUrl: w.posterOrCoverUrl,
          synopsis: w.synopsis ? w.synopsis.slice(0, 400) : null,
          mediaType: w.mediaType,
        }
      : {
          title: String((item as { title?: string }).title ?? "?"),
          year: null,
          posterOrCoverUrl: null,
          synopsis: null,
          mediaType: item.mediaType,
        };
    out.push({ ...rest, work: card });
  }
  return out;
}
