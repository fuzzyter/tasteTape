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
          <TitleOneLine text={work.title} max={56} />
        </p>
        <p className="text-xs font-semibold text-[var(--color-tape-muted)]">
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
    ].slice(0, 3);
  }

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const friendCodes = parseCodes(codesRaw);
    if (friendCodes.length === 0) {
      setErr("Enter at least one friend code.");
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
      setErr(e instanceof Error ? e.message : "Compare failed");
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

  async function removeSnapshot(id: string) {
    if (!token) return;
    if (!confirm("Delete this saved compare?")) return;
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
          <h1 className="text-2xl font-extrabold text-black">Compare with friends</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--color-tape-muted)]">
            Enter up to <strong className="text-black">3</strong> friend codes (comma,
            space, or newline). Emails are never shown.
          </p>
        </div>

        <form
          onSubmit={run}
          className="space-y-3 rounded-2xl border-2 border-black/10 bg-[var(--color-tape-card)] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]"
        >
          <textarea
            className="min-h-[88px] w-full rounded-xl border-2 border-black/15 bg-white px-3 py-2 font-mono text-sm font-bold uppercase text-black"
            placeholder={"e.g. ABCD1234EFGH5678\nWXYZ9876KLMN5432"}
            value={codesRaw}
            onChange={(e) => setCodesRaw(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-tape-muted)]">
            <input
              type="checkbox"
              checked={saveSnap}
              onChange={(e) => setSaveSnap(e.target.checked)}
            />
            Save result to history
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-extrabold text-[var(--color-tape-lime)] shadow-[4px_4px_0_0_var(--color-tape-lime)] disabled:opacity-60"
          >
            {loading ? "Comparing…" : "Compare"}
          </button>
        </form>
        {err && (
          <p className="text-sm font-semibold text-red-600" role="alert">
            {err}
          </p>
        )}

        {snapshots.filter((s) => s.kind === "compare").length > 0 && (
          <div className="rounded-xl border-2 border-black/10 bg-white p-3 text-sm shadow-sm">
            <p className="font-extrabold text-black">Saved compares</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {snapshots
                .filter((s) => s.kind === "compare")
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
              <p className="text-xs font-bold text-[var(--color-tape-muted)]">You</p>
              <p className="font-extrabold text-black">{data.meLabel}</p>
              <p className="mt-2 text-xs font-bold text-[var(--color-tape-muted)]">
                Friends in this compare
              </p>
              <ul className="mt-1 text-sm font-semibold">
                {data.friends.map((f) => (
                  <li key={f.friendCode}>
                    {f.nicknameLabel}{" "}
                    <code className="text-xs font-mono text-[var(--color-tape-muted)]">
                      ({f.friendCode})
                    </code>
                  </li>
                ))}
              </ul>
              <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-black">
                {data.result.introduction}
              </p>
            </section>

            {data.result.friends.map((f) => (
              <section
                key={f.nicknameLabel}
                className="rounded-2xl border-2 border-black/10 bg-[var(--color-tape-card)] p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]"
              >
                <p className="text-2xl font-extrabold text-black">
                  Match{" "}
                  <span className="rounded-md bg-[var(--color-tape-lime)] px-2 py-0.5 text-black ring-2 ring-black/20">
                    {f.similarityScore}
                  </span>
                  <span className="text-lg font-bold text-[var(--color-tape-muted)]">/100</span>{" "}
                  <span className="text-base font-extrabold">{f.nicknameLabel}</span>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-black">
                  {f.paragraph}
                </p>
              </section>
            ))}

            {data.result.overlapCommentary.length > 0 && (
              <section>
                <h2 className="text-lg font-extrabold text-black">Overlap you both loved</h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {data.result.overlapCommentary.map((o) => (
                    <li key={o.title} className="rounded-lg border border-black/10 bg-white p-3">
                      <span className="font-extrabold text-black">{o.title}</span>
                      <p className="mt-1 font-medium text-[var(--color-tape-muted)]">
                        {o.sharedJoyComment}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="text-lg font-extrabold text-black">Watch together — new finds</h2>
              <ul className="mt-3 space-y-4">
                {data.result.watchTogetherNew.map((item, i) => (
                  <li key={i}>
                    <MediaRow
                      work={item.work as WorkCard}
                      footer={
                        <p className="mt-2 text-xs font-medium text-black">
                          {item.recommendationPitch}
                        </p>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-extrabold text-black">
                From friends&apos; libraries — for you
              </h2>
              <ul className="mt-3 space-y-4">
                {data.result.picksFromFriendLibsForMe.map((item, i) => (
                  <li key={i}>
                    <MediaRow
                      work={item.work}
                      footer={
                        <>
                          <p className="mt-1 text-xs font-extrabold text-black">
                            {item.friendNicknameLabel}
                          </p>
                          <p className="mt-2 text-xs font-medium leading-relaxed text-black">
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
              <h2 className="text-lg font-extrabold text-black">
                From your list — for friends
              </h2>
              <ul className="mt-3 space-y-4">
                {data.result.picksFromMyLibForFriends.map((item, i) => (
                  <li key={i}>
                    <MediaRow
                      work={item.work}
                      footer={
                        <>
                          <p className="mt-1 text-xs font-extrabold text-black">
                            For: {item.toFriendNicknameLabel}
                          </p>
                          <p className="mt-2 text-xs font-medium leading-relaxed text-black">
                            {item.whyTheyMightLike}
                          </p>
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>

            <div className="max-w-full overflow-x-auto pb-4">
              <ExportCard
                ref={cardRef}
                title="Taste compare"
                subtitle={data.friends.map((f) => f.nicknameLabel).join(" · ")}
                body={exportBody}
                footer="tastetape — compare"
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
        )}
      </div>
    </Layout>
  );
}
