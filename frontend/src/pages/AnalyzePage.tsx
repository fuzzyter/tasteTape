import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { api, type AnalyzeResponse } from "../api";
import { useAuth } from "../auth";
import { ExportCard } from "../components/ExportCard";
import { Layout } from "../components/Layout";

export function AnalyzePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  async function run() {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await api.analyze(token);
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "분석 실패");
    } finally {
      setLoading(false);
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
            평가한 작품과 외부 메타데이터를 바탕으로 요약·추천을 생성합니다 (Gemini).
          </p>
        </div>

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

        {data && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-6">
              <h2 className="text-lg font-semibold">요약</h2>
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
                추천 (모델 랭킹)
              </h3>
              <ul className="space-y-3">
                {data.recommendations.ranked.map((r, i) => (
                  <li
                    key={`${r.provider}-${r.externalId}-${i}`}
                    className="rounded-xl border border-stone-100 bg-white/90 p-3"
                  >
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-stone-500">
                      {r.mediaType.toUpperCase()} · 점수 {r.score}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs text-stone-600">
                      {r.reasons.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
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
        )}
      </div>
    </Layout>
  );
}
