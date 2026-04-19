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
    <div className="flex gap-3 rounded-xl border border-stone-100 bg-white/95 p-3">
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-200">
        {work.posterOrCoverUrl ? (
          <img
            src={work.posterOrCoverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] leading-tight text-stone-700">
            <TitleOneLine text={work.title} max={48} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold leading-snug">
          <TitleOneLine text={work.title} max={60} />
        </p>
        <p className="text-xs text-stone-500">
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
      setErr(e instanceof Error ? e.message : "분석 실패");
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
    ? `${data.analysis.tasteSummary}\n\n키워드: ${data.analysis.keywords.join(", ")}\n\n${data.analysis.recommendationBlurb}`
    : "";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">내 취향 분석</h1>
          <p className="mt-1 text-sm text-[var(--color-tape-muted)]">
            데이터 통계는 AI 없이 계산됩니다. 요약·추천은 Gemini를 사용합니다.
          </p>
        </div>

        <section className="rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-4">
          <h2 className="text-sm font-semibold text-stone-700">추천 후보 필터</h2>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="text-xs text-stone-600">
              최소 연도
              <input
                type="number"
                className="ml-2 w-24 rounded border border-stone-200 px-2 py-1 text-sm"
                placeholder="예: 2010"
                value={yearMin}
                onChange={(e) =>
                  setYearMin(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </label>
            <label className="text-xs text-stone-600">
              최대 연도
              <input
                type="number"
                className="ml-2 w-24 rounded border border-stone-200 px-2 py-1 text-sm"
                placeholder="예: 2024"
                value={yearMax}
                onChange={(e) =>
                  setYearMax(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={movie} onChange={(e) => setMovie(e.target.checked)} />
              영화
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} />
              TV
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={book} onChange={(e) => setBook(e.target.checked)} />
              책
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={saveSnap}
              onChange={(e) => setSaveSnap(e.target.checked)}
            />
            결과를 히스토리에 저장
          </label>
        </section>

        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-xl bg-[var(--color-tape-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {loading ? "분석 중…" : "분석 실행"}
        </button>
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}

        {snapshots.length > 0 && (
          <div className="rounded-xl border border-stone-200 bg-white/80 p-3 text-sm">
            <p className="font-medium text-stone-700">저장된 분석 불러오기</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {snapshots.filter((s) => s.kind === "analyze").map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="rounded-lg bg-stone-100 px-2 py-1 text-xs hover:bg-stone-200"
                    onClick={() => loadSnapshot(s.id)}
                  >
                    {s.label ?? s.id.slice(0, 8)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <section className="rounded-2xl border border-stone-200/80 bg-white/90 p-6">
              <h2 className="text-lg font-semibold">데이터 통계 (AI 없음)</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-stone-500">
                      <th className="py-1 pr-2">타입</th>
                      <th className="py-1 pr-2">개수</th>
                      <th className="py-1">평균 별점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stats.byMedia.map((r) => (
                      <tr key={r.mediaType} className="border-b border-stone-100">
                        <td className="py-1">{r.mediaType}</td>
                        <td className="py-1">{r.count}</td>
                        <td className="py-1">{r.avgRating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs font-medium text-stone-600">별점 분포</p>
              <div className="mt-1 flex gap-2 text-xs">
                {[5, 4, 3, 2, 1].map((s) => (
                  <span key={s}>
                    ★{s}: {data.stats.ratingHistogram[s] ?? 0}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs font-medium text-stone-600">
                장르 평균 (상위)
              </p>
              <ul className="mt-1 text-xs text-stone-700">
                {data.stats.topGenresByAvg.slice(0, 6).map((g) => (
                  <li key={g.genre}>
                    {g.genre}: {g.avgRating} ({g.count}작)
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-6">
                <h2 className="text-lg font-semibold">AI 요약</h2>
                <p className="text-sm leading-relaxed text-stone-800">
                  {data.analysis.tasteSummary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.analysis.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-stone-600">
                  {data.analysis.recommendationBlurb}
                </p>
                <h3 className="pt-2 text-sm font-semibold text-stone-700">
                  추천 (메타 + AI 코멘트)
                </h3>
                <ul className="space-y-4">
                  {data.recommendations.ranked.map((r, i) => (
                    <li key={`${r.provider}-${r.externalId}-${i}`}>
                      <MediaRow
                        work={r.work}
                        extra={
                          <>
                            <p className="mt-1 text-xs text-stone-500">
                              점수 {r.score}
                            </p>
                            <ul className="mt-1 list-inside list-disc text-xs text-stone-600">
                              {r.reasons.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                            <p className="mt-2 text-xs leading-relaxed text-stone-800">
                              {r.aiComment}
                            </p>
                          </>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-stone-500">
                  SNS용 이미지로 내보내기 (아래 카드가 캡처됩니다).
                </p>
                <div className="overflow-x-auto pb-4">
                  <ExportCard
                    ref={cardRef}
                    title="나의 취향 요약"
                    subtitle={`평균 ${data.profile.avgRating}점 · ${data.profile.totalRated}작`}
                    body={exportBody}
                    footer="tastetape — API & AI taste curation"
                  />
                </div>
                <button
                  type="button"
                  onClick={downloadPng}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50"
                >
                  PNG 다운로드
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
