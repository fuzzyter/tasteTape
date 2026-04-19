import { useEffect, useRef, useState, type FormEvent } from "react";
import * as htmlToImage from "html-to-image";
import { api, type CompareResponse, type SnapshotMeta, type WorkCard } from "../api";
import { useAuth } from "../auth";
import { ExportCard } from "../components/ExportCard";
import { Layout } from "../components/Layout";

function TitleOneLine({ text, max = 36 }: { text: string; max?: number }) {
  const t = text.length > max ? `${text.slice(0, max)}…` : text;
  return <span title={text}>{t}</span>;
}

function MediaRow({
  work,
  footer,
}: {
  work: WorkCard;
  footer: React.ReactNode;
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
          <TitleOneLine text={work.title} max={56} />
        </p>
        <p className="text-xs text-stone-500">
          {work.mediaType.toUpperCase()}
          {work.year != null ? ` · ${work.year}` : ""}
        </p>
        {footer}
      </div>
    </div>
  );
}

export function ComparePage() {
  const { token } = useAuth();
  const [codesRaw, setCodesRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [saveSnap, setSaveSnap] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);

  useEffect(() => {
    if (!token) return;
    api.snapshots(token).then((r) => setSnapshots(r.snapshots)).catch(() => {});
  }, [token]);

  function parseCodes(s: string): string[] {
    return [
      ...new Set(
        s
          .split(/[\s,;]+/)
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
      ),
    ].slice(0, 4);
  }

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const friendCodes = parseCodes(codesRaw);
    if (friendCodes.length === 0) {
      setErr("친구 코드를 1개 이상 입력하세요.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await api.compare(token, { friendCodes, save: saveSnap });
      setData(res);
      const sn = await api.snapshots(token);
      setSnapshots(sn.snapshots);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "비교 실패");
    } finally {
      setLoading(false);
    }
  }

  async function loadSnapshot(id: string) {
    if (!token) return;
    const row = await api.snapshot(token, id);
    if (row.kind === "compare") {
      setData(row.payload as CompareResponse);
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
    ? `${data.result.introduction}\n\n${data.friends.map((f) => f.nicknameLabel).join(", ")}`
    : "";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">친구와 취향 비교</h1>
          <p className="mt-1 text-sm text-[var(--color-tape-muted)]">
            친구 코드를 최대 4개까지 입력하세요 (쉼표·줄바꿈·공백으로 구분). 이메일은
            표시되지 않습니다.
          </p>
        </div>

        <form
          onSubmit={run}
          className="space-y-3 rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-4"
        >
          <textarea
            className="min-h-[88px] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm uppercase"
            placeholder={"예: ABCD1234EFGH5678\nWXYZ9876KLMN5432"}
            value={codesRaw}
            onChange={(e) => setCodesRaw(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={saveSnap}
              onChange={(e) => setSaveSnap(e.target.checked)}
            />
            결과를 히스토리에 저장
          </label>
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

        {snapshots.filter((s) => s.kind === "compare").length > 0 && (
          <div className="rounded-xl border border-stone-200 bg-white/80 p-3 text-sm">
            <p className="font-medium text-stone-700">저장된 비교 불러오기</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {snapshots
                .filter((s) => s.kind === "compare")
                .map((s) => (
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
            <section className="rounded-2xl border border-stone-200/80 bg-white/95 p-6">
              <p className="text-xs text-stone-500">나</p>
              <p className="font-medium">{data.meLabel}</p>
              <p className="mt-2 text-xs text-stone-500">함께 비교한 친구</p>
              <ul className="mt-1 text-sm">
                {data.friends.map((f) => (
                  <li key={f.friendCode}>
                    {f.nicknameLabel}{" "}
                    <code className="text-xs text-stone-400">({f.friendCode})</code>
                  </li>
                ))}
              </ul>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {data.result.introduction}
              </p>
            </section>

            {data.result.friends.map((f) => (
              <section
                key={f.nicknameLabel}
                className="rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-6"
              >
                <p className="text-2xl font-bold text-[var(--color-tape-accent)]">
                  유사도 {f.similarityScore}
                  <span className="text-lg font-normal text-stone-500">/100</span>{" "}
                  <span className="text-base font-semibold text-stone-800">
                    {f.nicknameLabel}
                  </span>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {f.paragraph}
                </p>
              </section>
            ))}

            {data.result.overlapCommentary.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold">같이 좋아한 작품 코멘트</h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {data.result.overlapCommentary.map((o) => (
                    <li key={o.title} className="rounded-lg bg-white/90 p-3">
                      <span className="font-medium">{o.title}</span>
                      <p className="mt-1 text-stone-700">{o.sharedJoyComment}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold">함께 볼 만한 신작·발견</h2>
              <ul className="mt-3 space-y-4">
                {data.result.watchTogetherNew.map((item, i) => (
                  <li key={i}>
                    <MediaRow
                      work={item.work as WorkCard}
                      footer={
                        <p className="mt-2 text-xs text-stone-700">
                          {item.recommendationPitch}
                        </p>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                친구 목록에서 — 내 취향으로 추천
              </h2>
              <ul className="mt-3 space-y-4">
                {data.result.picksFromFriendLibsForMe.map((item, i) => (
                  <li key={i}>
                    <MediaRow
                      work={item.work}
                      footer={
                        <>
                          <p className="mt-1 text-xs text-amber-800">
                            {item.friendNicknameLabel}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-stone-800">
                            {item.whyForMe}
                          </p>
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                내 목록에서 — 친구에게 추천
              </h2>
              <ul className="mt-3 space-y-4">
                {data.result.picksFromMyLibForFriends.map((item, i) => (
                  <li key={i}>
                    <MediaRow
                      work={item.work}
                      footer={
                        <>
                          <p className="mt-1 text-xs text-amber-800">
                            대상: {item.toFriendNicknameLabel}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-stone-800">
                            {item.whyTheyMightLike}
                          </p>
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>

            <div className="overflow-x-auto pb-4">
              <ExportCard
                ref={cardRef}
                title="취향 비교"
                subtitle={data.friends.map((f) => f.nicknameLabel).join(" · ")}
                body={exportBody}
                footer="tastetape — compare"
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
        )}
      </div>
    </Layout>
  );
}
