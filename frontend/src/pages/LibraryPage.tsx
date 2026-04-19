import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { MediaType, NormalizedWork } from "../api";
import { api } from "../api";
import { useAuth } from "../auth";
import { Layout } from "../components/Layout";

export function LibraryPage() {
  const { token, user } = useAuth();
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedWork[]>([]);
  const [searching, setSearching] = useState(false);
  const [list, setList] = useState<Awaited<ReturnType<typeof api.myWorks>>["works"]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [addRating, setAddRating] = useState(4);

  const refresh = useCallback(async () => {
    if (!token) return;
    const data = await api.myWorks(token);
    setList(data.works);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoadingList(true);
    refresh()
      .catch((e) => setErr(e instanceof Error ? e.message : "목록 오류"))
      .finally(() => setLoadingList(false));
  }, [token, refresh]);

  async function runSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setErr(null);
    try {
      const { works } = await api.search(query.trim(), mediaType);
      setResults(works);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setSearching(false);
    }
  }

  async function addSelected(w: NormalizedWork) {
    if (!token) return;
    setErr(null);
    try {
      await api.addWork(token, {
        provider: w.externalRef.provider,
        externalId: w.externalRef.id,
        mediaType: w.mediaType,
        rating: addRating,
      });
      await refresh();
      setResults([]);
      setQuery("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "추가 실패");
    }
  }

  async function updateRating(id: string, rating: number) {
    if (!token) return;
    await api.patchWork(token, id, { rating });
    await refresh();
  }

  async function remove(id: string) {
    if (!token) return;
    if (!confirm("이 작품을 목록에서 제거할까요?")) return;
    await api.deleteWork(token, id);
    await refresh();
  }

  const count = list.length;
  const minMet = count >= 9;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">내 취향 테이프</h1>
          <p className="mt-1 text-sm text-[var(--color-tape-muted)]">
            최소 <strong>9개</strong> 이상 평가하면 분석이 안정적입니다. 현재{" "}
            <strong>{count}</strong>개 · 내 친구 코드:{" "}
            <code className="rounded bg-stone-200/80 px-1.5 py-0.5 text-xs font-semibold">
              {user?.friendCode}
            </code>
          </p>
          {!minMet && (
            <p className="mt-2 text-sm text-amber-800">
              아직 {9 - count}개 더 필요해요.
            </p>
          )}
        </div>

        <section className="rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            작품 검색 후 추가
          </h2>
          <form onSubmit={runSearch} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex gap-2">
              {(
                [
                  ["movie", "영화"],
                  ["tv", "TV"],
                  ["book", "책"],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold ${
                    mediaType === v
                      ? "bg-[var(--color-tape-accent)] text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="mt"
                    className="sr-only"
                    checked={mediaType === v}
                    onChange={() => setMediaType(v)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <input
              className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
              placeholder="제목 검색…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500">별점</label>
              <select
                className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm"
                value={addRating}
                onChange={(e) => setAddRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {searching ? "검색…" : "검색"}
            </button>
          </form>
          {err && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {err}
            </p>
          )}
          {results.length > 0 && (
            <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-stone-100 bg-white/80 p-2">
              {results.map((w) => (
                <li
                  key={`${w.externalRef.provider}-${w.externalRef.id}-${w.mediaType}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{w.title}</p>
                    <p className="text-xs text-stone-500">
                      {w.mediaType} · {w.year ?? "연도 미상"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addSelected(w)}
                    className="shrink-0 rounded-lg bg-[var(--color-tape-accent)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    추가
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">평가한 작품</h2>
            <Link
              to="/analyze"
              className="rounded-xl bg-[var(--color-tape-accent)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
            >
              취향 분석으로
            </Link>
          </div>
          {loadingList ? (
            <p className="text-sm text-stone-500">불러오는 중…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-stone-500">아직 없습니다. 위에서 추가해 보세요.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  {row.work.posterOrCoverUrl && (
                    <img
                      src={row.work.posterOrCoverUrl}
                      alt=""
                      className="h-24 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{row.work.title}</p>
                    <p className="text-xs text-stone-500">
                      {row.work.mediaType}
                      {row.work.year != null ? ` · ${row.work.year}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm"
                      value={row.rating}
                      onChange={(e) =>
                        updateRating(row.id, Number(e.target.value))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          ★ {n}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="text-xs text-stone-400 hover:text-red-600"
                      onClick={() => remove(row.id)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
