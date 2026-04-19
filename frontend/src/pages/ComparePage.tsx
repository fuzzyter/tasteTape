import { useRef, useState, type FormEvent } from "react";
import * as htmlToImage from "html-to-image";
import { api, type CompareResponse } from "../api";
import { useAuth } from "../auth";
import { ExportCard } from "../components/ExportCard";
import { Layout } from "../components/Layout";

export function ComparePage() {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!token || !code.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await api.compare(token, code.trim().toUpperCase());
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "비교 실패");
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
    a.download = "tastetape-compare.png";
    a.click();
  }

  const exportBody = data
    ? `${data.result.comparisonSummary}\n\n유사도: ${data.result.similarityScore}/100\n\n함께 볼 만한 것:\n${data.result.watchTogether.map((x) => `· ${x}`).join("\n")}\n\n친구 작품 중 추천:\n${data.result.friendPickForYou.map((x) => `· ${x}`).join("\n")}`
    : "";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">친구와 취향 비교</h1>
          <p className="mt-1 text-sm text-[var(--color-tape-muted)]">
            친구의 친구 코드를 입력하면 두 프로필을 비교합니다.
          </p>
        </div>

        <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase text-stone-500">
              친구 코드
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예: SEEDBOBO"
              maxLength={16}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "비교 중…" : "비교하기"}
          </button>
        </form>
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}

        {data && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-6">
              <p className="text-xs text-stone-500">상대 (마스킹됨)</p>
              <p className="font-medium">{data.friend.email}</p>
              <p className="text-3xl font-bold text-[var(--color-tape-accent)]">
                유사도 {data.result.similarityScore}
                <span className="text-lg font-normal text-stone-500">/100</span>
              </p>
              <p className="text-sm leading-relaxed">{data.result.comparisonSummary}</p>
              <div>
                <h3 className="text-sm font-semibold">함께 볼 만한 것</h3>
                <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
                  {data.result.watchTogether.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">친구 목록에서 나올 만한 것</h3>
                <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
                  {data.result.friendPickForYou.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto pb-4">
                <ExportCard
                  ref={cardRef}
                  title="취향 비교 결과"
                  subtitle={`유사도 ${data.result.similarityScore}/100`}
                  body={exportBody}
                  footer="tastetape — compare with a friend"
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
