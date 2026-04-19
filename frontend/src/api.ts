const base = import.meta.env.VITE_API_URL ?? "/api";

export type MediaType = "book" | "movie" | "tv";

export type NormalizedWork = {
  mediaType: MediaType;
  title: string;
  year: number | null;
  genres: string[];
  synopsis: string | null;
  originCountry: string | null;
  language: string | null;
  ageRating: string | null;
  externalRef: { provider: string; id: string };
  posterOrCoverUrl: string | null;
};

export type User = {
  id: string;
  email: string;
  friendCode: string;
  nickname: string | null;
  comparePublic: boolean;
};

export type WorkCard = {
  title: string;
  year: number | null;
  posterOrCoverUrl: string | null;
  synopsis: string | null;
  mediaType: MediaType;
};

async function request<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const { token: _t, ...rest } = opts;
  if (rest.body != null && rest.body !== "") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${base}${path}`, { ...rest, headers });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.error ?? res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  search: (q: string, mediaType: MediaType) =>
    request<{ works: NormalizedWork[] }>(
      `/search?q=${encodeURIComponent(q)}&mediaType=${mediaType}`
    ),
  me: (token: string) => request<User>("/me", { token }),
  patchMe: (
    token: string,
    body: { nickname?: string | null; comparePublic?: boolean }
  ) =>
    request<User>("/me", { method: "PATCH", token, body: JSON.stringify(body) }),
  myWorks: (token: string) =>
    request<{ works: RatedWork[] }>("/me/works", { token }),
  myStats: (token: string) =>
    request<{ stats: TasteStats }>("/me/stats", { token }),
  snapshots: (token: string) =>
    request<{ snapshots: SnapshotMeta[] }>("/me/snapshots", { token }),
  snapshot: (token: string, id: string) =>
    request<{ id: string; kind: string; label: string | null; payload: unknown; createdAt: string }>(
      `/me/snapshots/${id}`,
      { token }
    ),
  addWork: (
    token: string,
    body: {
      provider: string;
      externalId: string;
      mediaType: MediaType;
      rating: number;
      reviewText?: string;
      preferenceNote?: string | null;
    }
  ) =>
    request<{ id: string; workCacheId: string }>("/me/works", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  patchWork: (
    token: string,
    ratingId: string,
    body: {
      rating?: number;
      reviewText?: string | null;
      preferenceNote?: string | null;
    }
  ) =>
    request(`/me/works/${ratingId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(body),
    }),
  deleteWork: (token: string, ratingId: string) =>
    request<void>(`/me/works/${ratingId}`, { method: "DELETE", token }),
  analyze: (
    token: string,
    body?: {
      yearMin?: number;
      yearMax?: number;
      mediaTypes?: MediaType[];
      save?: boolean;
    }
  ) =>
    request<AnalyzeResponse>("/me/analyze", {
      method: "POST",
      token,
      body: JSON.stringify(body ?? {}),
    }),
  compare: (
    token: string,
    body: { friendCodes: string[]; save?: boolean }
  ) =>
    request<CompareResponse>("/me/compare", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
};

export type SnapshotMeta = {
  id: string;
  kind: string;
  label: string | null;
  createdAt: string;
};

export type TasteStats = {
  byMedia: Array<{
    mediaType: MediaType;
    count: number;
    avgRating: number;
  }>;
  genreStars: Array<{
    genre: string;
    totalStars: number;
    count: number;
    avgRating: number;
  }>;
  topGenresByAvg: Array<{ genre: string; avgRating: number; count: number }>;
  bottomGenresByAvg: Array<{ genre: string; avgRating: number; count: number }>;
  ratingHistogram: Record<number, number>;
  yearHistogram: Array<{ year: number; count: number; avgRating: number }>;
};

export type RatedWork = {
  id: string;
  rating: number;
  reviewText: string | null;
  preferenceNote: string | null;
  tags: string[];
  work: {
    id: string;
    provider: string;
    externalId: string;
    mediaType: MediaType;
    title: string;
    year: number | null;
    genres: string[];
    synopsis: string | null;
    posterOrCoverUrl: string | null;
  };
};

export type RankedEnriched = {
  title: string;
  provider: string;
  externalId: string;
  mediaType: MediaType;
  score: number;
  reasons: string[];
  aiComment: string;
  work: WorkCard;
};

export type AnalyzeResponse = {
  profile: {
    totalRated: number;
    avgRating: number;
    byMedia: Record<string, number>;
    topGenres: Array<{ genre: string; weight: number }>;
    yearRange: { min: number | null; max: number | null };
    sampleTitles: string[];
  };
  stats: TasteStats;
  analysis: {
    tasteSummary: string;
    keywords: string[];
    recommendationBlurb: string;
  };
  recommendations: {
    ranked: RankedEnriched[];
  };
};

export type EnrichedPick = {
  work: WorkCard;
  recommendationPitch?: string;
  [key: string]: unknown;
};

export type CompareResponse = {
  meLabel: string;
  friends: Array<{ nicknameLabel: string; friendCode: string }>;
  result: {
    introduction: string;
    friends: Array<{
      nicknameLabel: string;
      similarityScore: number;
      paragraph: string;
    }>;
    overlapCommentary: Array<{ title: string; sharedJoyComment: string }>;
    watchTogetherNew: EnrichedPick[];
    picksFromFriendLibsForMe: Array<
      EnrichedPick & {
        friendNicknameLabel: string;
        whyForMe: string;
      }
    >;
    picksFromMyLibForFriends: Array<
      EnrichedPick & {
        toFriendNicknameLabel: string;
        whyTheyMightLike: string;
      }
    >;
  };
};
