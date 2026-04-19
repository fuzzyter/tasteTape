import type { NormalizedWork } from "../types/normalized-work.js";

const SEARCH = "https://openlibrary.org/search.json";

export async function openLibrarySearch(query: string): Promise<NormalizedWork[]> {
  const url = new URL(SEARCH);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "15");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OpenLibrary search: ${res.status}`);
  const data = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      first_publish_year?: number;
      subject?: string[];
      author_name?: string[];
      isbn?: string[];
      cover_i?: number;
    }>;
  };
  const docs = data.docs ?? [];
  return docs
    .filter((d) => d.key && d.title)
    .map((d) => {
      const id = d.key!.replace("/works/", "");
      const cover =
        typeof d.cover_i === "number"
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : null;
      const synopsis = d.subject?.length
        ? `Subjects: ${d.subject.slice(0, 8).join(", ")}`
        : null;
      return {
        mediaType: "book" as const,
        title: d.title!,
        year: d.first_publish_year ?? null,
        genres: (d.subject ?? []).slice(0, 10),
        synopsis,
        originCountry: null,
        language: null,
        ageRating: null,
        externalRef: { provider: "openlibrary", id },
        posterOrCoverUrl: cover,
      } satisfies NormalizedWork;
    });
}

export async function openLibraryWorkDetail(workId: string): Promise<NormalizedWork> {
  const url = `https://openlibrary.org/works/${workId}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenLibrary work ${workId}: ${res.status}`);
  const w = (await res.json()) as {
    title?: string;
    description?: string | { value?: string };
    subjects?: string[];
    first_publish_date?: string;
    covers?: number[];
  };
  const desc =
    typeof w.description === "string"
      ? w.description
      : w.description?.value ?? null;
  const year = w.first_publish_date
    ? parseInt(w.first_publish_date.slice(0, 4), 10)
    : null;
  const cover =
    w.covers?.[0] != null
      ? `https://covers.openlibrary.org/b/id/${w.covers[0]}-M.jpg`
      : null;
  return {
    mediaType: "book",
    title: w.title ?? workId,
    year: Number.isFinite(year) ? year : null,
    genres: (w.subjects ?? []).slice(0, 15).map(String),
    synopsis: desc?.slice(0, 2000) ?? null,
    originCountry: null,
    language: null,
    ageRating: null,
    externalRef: { provider: "openlibrary", id: workId },
    posterOrCoverUrl: cover,
  };
}
