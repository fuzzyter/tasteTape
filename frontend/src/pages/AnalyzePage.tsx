import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import {
  api,
  type AnalyzeResponse,
  type MediaType,
  type SnapshotMeta,
  type WorkCard,
} from "../api";
import { useAuth } from "../auth";
import { ExportCard } from "../components/ExportCard";
import { Layout } from "../components/Layout";

function TitleOneLine({ text, max = 36 }: { text: string; max?: number }) {
  const t = text.length > max ? `${text.slice(0, max)}…` : text;
  return <span title={text}>{t}</span>;
}

function MediaRow({
  work,
  extra,
}: {
  work: WorkCard;
  extra: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border-2 border-black/10 bg-white p-3 shadow-sm">
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-200 ring-1 ring-black/10">
        {work.posterOrCoverUrl ? (
          <img
            src={work.posterOrCoverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] font-bold leading-tight text-black">
            <TitleOneLine text={work.title} max={48} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-extrabold leading-snug text-black">
          <TitleOneLine text={work.title} max={60} />
        </p>
        <p className="text-xs font-semibold text-[var(--color-tape-muted)]">
          {work.mediaType.toUpperCase()}
          {work.year != null ? ` · ${work.year}` : ""}
        </p>
        {extra}
      </div>
    </div>
  );
}

export function AnalyzePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [yearMin, setYearMin] = useState<number | "">("");
  const [yearMax, setYearMax] = useState<number | "">("");
  const [movie, setMovie] = useState(true);
  const [tv, setTv] = useState(true);
  const [book, setBook] = useState(true);
  const [saveSnap, setSaveSnap] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);

  useEffect(() => {
    if (!token) return;
    api.snapshots(token).then((r) => setSnapshots(r.snapshots)).catch(() => {});
  }, [token]);

  async function run() {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const mediaTypes: MediaType[] = [];
      if (movie) mediaTypes.push("movie");
      if (tv) mediaTypes.push("tv");
      if (book) mediaTypes.push("book");
      const res = await api.analyze(token, {
        yearMin: yearMin === "" ? undefined : yearMin,
        yearMax: yearMax === "" ? undefined : yearMax,
        mediaTypes: mediaTypes.length ? mediaTypes : undefined,
        save: saveSnap,
      });
      setData(res);
      const sn = await api.snapshots(token);
      setSnapshots(sn.snapshots);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadSnapshot(id: string) {
    if (!token) return;
    const row = await api.snapshot(token, id);
    if (row.kind === "analyze") {
      setData(row.payload as AnalyzeResponse);
    }
  }

  async function removeSnapshot(id: string) {
    if (!token) return;
    if (!confirm("Delete this saved analysis?")) return;
    try {
      await api.deleteSnapshot(token, id);
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete snapshot");
    }
  }

  async function downloadPng() {
    if (!cardRef.current) return;
    const dataUrl = await htmlToImage.toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "tastetape-analysis.png";
    a.click();
  }

  const exportBody = data
    ? `${data.analysis.tasteSummary}\n\nKeywords: ${data.analysis.keywords.join(", ")}\n\n${data.analysis.recommendationBlurb}`
    : "";

  return (
    <Layout>
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-black">Taste analysis</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--color-tape-muted)]">
            Create your own RECAP and discover your TASTE!
          </p>
        </div>

        <section className="rounded-2xl border-2 border-black/10 bg-[var(--color-tape-card)] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]">
          <h2 className="text-sm font-extrabold text-black">Recommendation filters</h2>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="text-xs font-bold text-[var(--color-tape-muted)]">
              Min year
              <input
                type="number"
                className="ml-2 w-24 rounded-lg border-2 border-black/15 px-2 py-1 text-sm font-semibold text-black"
                placeholder="e.g. 2010"
                value={yearMin}
                onChange={(e) =>
                  setYearMin(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </label>
            <label className="text-xs font-bold text-[var(--color-tape-muted)]">
              Max year
              <input
                type="number"
                className="ml-2 w-24 rounded-lg border-2 border-black/15 px-2 py-1 text-sm font-semibold text-black"
                placeholder="e.g. 2024"
                value={yearMax}
                onChange={(e) =>
                  setYearMax(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-black">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={movie} onChange={(e) => setMovie(e.target.checked)} />
              Film
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} />
              TV
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={book} onChange={(e) => setBook(e.target.checked)} />
              Book
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-bold text-[var(--color-tape-muted)]">
            <input
              type="checkbox"
              checked={saveSnap}
              onChange={(e) => setSaveSnap(e.target.checked)}
            />
            Save result to history
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="rounded-xl bg-[var(--color-tape-lime)] px-5 py-2.5 text-sm font-extrabold text-black shadow-[4px_4px_0_0_#000] hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Analyzing…" : "Run analysis"}
          </button>
          {loading && (
            <span
              className="inline-flex h-6 items-end gap-1 pb-0.5"
              role="status"
              aria-label="Loading"
            >
              <span className="analyze-bounce-dot" />
              <span className="analyze-bounce-dot" />
              <span className="analyze-bounce-dot" />
            </span>
          )}
        </div>
        {err && (
          <p className="text-sm font-semibold text-red-600" role="alert">
            {err}
          </p>
        )}

        {snapshots.filter((s) => s.kind === "analyze").length > 0 && (
          <div className="rounded-xl border-2 border-black/10 bg-white p-3 text-sm shadow-sm">
            <p className="font-extrabold text-black">Saved analyses</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {snapshots
                .filter((s) => s.kind === "analyze")
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-stretch overflow-hidden rounded-lg bg-[var(--color-tape-lime-soft)] ring-1 ring-black/10"
                  >
                    <button
                      type="button"
                      className="px-2 py-1 text-xs font-extrabold text-black hover:brightness-95"
                      onClick={() => loadSnapshot(s.id)}
                    >
                      {s.label ?? s.id.slice(0, 8)}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${s.label ?? s.id.slice(0, 8)}`}
                      title="Delete"
                      className="border-l border-black/15 px-2 text-xs font-extrabold text-[var(--color-tape-muted)] hover:bg-red-500/90 hover:text-white"
                      onClick={() => removeSnapshot(s.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <section className="rounded-2xl border-2 border-black/10 bg-white p-6 shadow-[3px_3px_0_0_rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-extrabold text-black">Stats (no AI)</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-black/10 font-bold text-[var(--color-tape-muted)]">
                      <th className="py-1 pr-2">Type</th>
                      <th className="py-1 pr-2">Count</th>
                      <th className="py-1">Avg rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stats.byMedia.map((r) => (
                      <tr key={r.mediaType} className="border-b border-black/5 font-semibold">
                        <td className="py-1 text-black">{r.mediaType}</td>
                        <td className="py-1">{r.count}</td>
                        <td className="py-1">{r.avgRating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs font-extrabold text-black">Star spread</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-[var(--color-tape-muted)]">
                {[5, 4, 3, 2, 1].map((s) => (
                  <span key={s}>
                    ★{s}: {data.stats.ratingHistogram[s] ?? 0}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs font-extrabold text-black">Top genres (by avg)</p>
              <ul className="mt-1 text-xs font-semibold text-[var(--color-tape-muted)]">
                {data.stats.topGenresByAvg.slice(0, 6).map((g) => (
                  <li key={g.genre}>
                    {g.genre}: {g.avgRating} ({g.count} titles)
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="min-w-0 space-y-4 rounded-2xl border-2 border-black/10 bg-[var(--color-tape-card)] p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]">
                <h2 className="text-lg font-extrabold text-black">AI summary</h2>
                <p className="text-sm font-medium leading-relaxed text-black">
                  {data.analysis.tasteSummary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.analysis.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-[var(--color-tape-lime-soft)] px-2.5 py-0.5 text-xs font-extrabold text-black ring-1 ring-black/10"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-semibold text-[var(--color-tape-muted)]">
                  {data.analysis.recommendationBlurb}
                </p>
                <h3 className="pt-2 text-sm font-extrabold text-black">
                  Picks (metadata + AI notes)
                </h3>
                <ul className="space-y-4">
                  {data.recommendations.ranked.map((r, i) => (
                    <li key={`${r.provider}-${r.externalId}-${i}`}>
                      <MediaRow
                        work={r.work}
                        extra={
                          <>
                            <p className="mt-1 text-xs font-bold text-[var(--color-tape-muted)]">
                              Score {r.score}
                            </p>
                            <ul className="mt-1 list-inside list-disc text-xs font-medium text-[var(--color-tape-muted)]">
                              {r.reasons.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                            <p className="mt-2 text-xs font-medium leading-relaxed text-black">
                              {r.aiComment}
                            </p>
                          </>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0 space-y-4">
                <p className="text-sm font-semibold text-[var(--color-tape-muted)]">
                  Export a share image (captures the card below).
                </p>
                <div className="max-w-full overflow-x-auto pb-4">
                  <ExportCard
                    ref={cardRef}
                    title="My taste snapshot"
                    subtitle={`Avg ${data.profile.avgRating} · ${data.profile.totalRated} titles`}
                    body={exportBody}
                    footer="tastetape — API & AI taste curation"
                  />
                </div>
                <button
                  type="button"
                  onClick={downloadPng}
                  className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0_0_var(--color-tape-lime)] hover:bg-[var(--color-tape-lime-soft)]"
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
