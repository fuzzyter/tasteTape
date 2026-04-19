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
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load list"))
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
      setErr(e instanceof Error ? e.message : "Search failed");
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
      setErr(e instanceof Error ? e.message : "Could not add");
    }
  }

  async function updateRating(id: string, rating: number) {
    if (!token) return;
    await api.patchWork(token, id, { rating });
    await refresh();
  }

  async function savePreferenceNote(id: string, text: string) {
    if (!token) return;
    const trimmed = text.trim().slice(0, 300);
    await api.patchWork(token, id, {
      preferenceNote: trimmed.length ? trimmed : null,
    });
    await refresh();
  }

  async function remove(id: string) {
    if (!token) return;
    if (!confirm("Remove this title from your list?")) return;
    await api.deleteWork(token, id);
    await refresh();
  }

  const count = list.length;
  const minMet = count >= 9;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-black">My taste tape</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--color-tape-muted)]">
            Rate at least <strong className="text-black">9</strong> titles for stable analysis.
            You have <strong className="text-black">{count}</strong> · friend code:{" "}
            <code className="rounded-md bg-[var(--color-tape-lime-soft)] px-1.5 py-0.5 text-xs font-bold text-black">
              {user?.friendCode}
            </code>
          </p>
          {!minMet && (
            <p className="mt-2 text-sm font-bold text-black">
              Add {9 - count} more to unlock solid recommendations.
            </p>
          )}
        </div>

        <section className="rounded-2xl border-2 border-black/10 bg-[var(--color-tape-card)] p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-black">
            Search & add
          </h2>
          <form onSubmit={runSearch} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex gap-2">
              {(
                [
                  ["movie", "Film"],
                  ["tv", "TV"],
                  ["book", "Book"],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-extrabold ${
                    mediaType === v
                      ? "bg-[var(--color-tape-lime)] text-black shadow-[2px_2px_0_0_#000]"
                      : "bg-white text-[var(--color-tape-muted)] ring-2 ring-black/10"
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
              className="min-w-0 flex-1 rounded-xl border-2 border-black/15 bg-white px-3 py-2 text-sm font-semibold text-black"
              placeholder="Search by title…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[var(--color-tape-muted)]">
                Stars
              </label>
              <select
                className="rounded-lg border-2 border-black/15 bg-white px-2 py-1.5 text-sm font-bold text-black"
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
              className="rounded-xl bg-black px-4 py-2 text-sm font-extrabold text-[var(--color-tape-lime)] shadow-[3px_3px_0_0_var(--color-tape-lime)] disabled:opacity-60"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
          {err && (
            <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
              {err}
            </p>
          )}
          {results.length > 0 && (
            <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-xl border-2 border-black/10 bg-white p-2">
              {results.map((w) => (
                <li
                  key={`${w.externalRef.provider}-${w.externalRef.id}-${w.mediaType}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-[var(--color-tape-lime-soft)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-black">{w.title}</p>
                    <p className="text-xs font-semibold text-[var(--color-tape-muted)]">
                      {w.mediaType} · {w.year ?? "Year unknown"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addSelected(w)}
                    className="shrink-0 rounded-lg bg-[var(--color-tape-lime)] px-3 py-1.5 text-xs font-extrabold text-black shadow-[2px_2px_0_0_#000]"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-black">Rated titles</h2>
            <Link
              to="/analyze"
              className="rounded-xl bg-[var(--color-tape-lime)] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0_0_#000] hover:brightness-95"
            >
              Taste analysis
            </Link>
          </div>
          {loadingList ? (
            <p className="text-sm font-semibold text-[var(--color-tape-muted)]">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-sm font-semibold text-[var(--color-tape-muted)]">
              Nothing here yet — add titles above.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-2xl border-2 border-black/10 bg-white p-4 shadow-[3px_3px_0_0_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {row.work.posterOrCoverUrl && (
                      <img
                        src={row.work.posterOrCoverUrl}
                        alt=""
                        className="h-24 w-16 shrink-0 rounded-lg object-cover ring-2 ring-black/10"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-black">{row.work.title}</p>
                      <p className="text-xs font-semibold text-[var(--color-tape-muted)]">
                        {row.work.mediaType}
                        {row.work.year != null ? ` · ${row.work.year}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        className="rounded-lg border-2 border-black/15 bg-white px-2 py-1.5 text-sm font-bold text-black"
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
                        className="text-xs font-bold text-[var(--color-tape-muted)] hover:text-red-600"
                        onClick={() => remove(row.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <label className="w-full text-xs font-bold text-[var(--color-tape-muted)]">
                    Note (optional, max 300 chars)
                    <textarea
                      className="mt-1 w-full rounded-lg border-2 border-black/15 bg-white px-2 py-1.5 text-sm font-medium text-black"
                      rows={2}
                      maxLength={300}
                      defaultValue={row.preferenceNote ?? ""}
                      placeholder="Why this rating? Short note."
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        const prev = (row.preferenceNote ?? "").trim();
                        if (v === prev) return;
                        void savePreferenceNote(row.id, e.target.value);
                      }}
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
