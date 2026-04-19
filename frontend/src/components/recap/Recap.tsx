import { forwardRef } from "react";
import type {
  AnalyzeResponse,
  RankedEnriched,
  TopRatedItem,
} from "../../api";

const SHEET_FONT = "Outfit, DM Sans, ui-sans-serif, system-ui, sans-serif";
const MONO_FONT =
  '"DM Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const sharedSheet =
  "rounded-3xl border-[3px] border-black bg-white p-7 text-black shadow-[10px_10px_0_0_rgba(0,0,0,0.85)]";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-[var(--color-tape-lime)] px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-black ring-2 ring-black">
      {children}
    </span>
  );
}

function PosterTile({
  title,
  posterOrCoverUrl,
  rating,
}: {
  title: string;
  posterOrCoverUrl: string | null;
  rating?: number;
}) {
  const displayTitle =
    title.length > 60 ? `${title.slice(0, 60)}…` : title;
  return (
    <div className="flex w-[140px] flex-col">
      <div className="relative h-[210px] w-[140px] overflow-hidden rounded-xl border-2 border-black bg-[var(--color-tape-bg)] shadow-[3px_3px_0_0_rgba(0,0,0,0.85)]">
        {posterOrCoverUrl ? (
          <img
            src={posterOrCoverUrl}
            alt=""
            crossOrigin="anonymous"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-tape-lime-soft)] p-2 text-center text-[12px] font-extrabold leading-tight text-black">
            {displayTitle}
          </div>
        )}
        {rating != null && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-black px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--color-tape-lime)] ring-1 ring-black">
            ★{rating}
          </span>
        )}
      </div>
      <p
        className="mt-2 line-clamp-2 break-words text-[12px] font-extrabold leading-tight text-black"
        title={title}
      >
        {displayTitle}
      </p>
    </div>
  );
}

type PostersGridProps = {
  title: string;
  subtitle?: string;
  items: Array<{
    title: string;
    posterOrCoverUrl: string | null;
    rating?: number;
  }>;
  footer?: string;
};

export const PostersRecap = forwardRef<HTMLDivElement, PostersGridProps>(
  function PostersRecap({ title, subtitle, items, footer }, ref) {
    const filled = items.slice(0, 9);
    while (filled.length < 9) {
      filled.push({ title: "—", posterOrCoverUrl: null });
    }
    return (
      <div
        ref={ref}
        className={`${sharedSheet} w-[520px]`}
        style={{ fontFamily: SHEET_FONT }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <Tag>TasteTape</Tag>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm font-bold text-[var(--color-tape-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          <div className="rotate-3">
            <span className="inline-block rounded-full bg-black px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-tape-lime)] ring-2 ring-black">
              ★ recap
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {filled.map((it, i) => (
            <PosterTile
              key={`${it.title}-${i}`}
              title={it.title}
              posterOrCoverUrl={it.posterOrCoverUrl}
              rating={it.rating}
            />
          ))}
        </div>

        <p className="mt-6 border-t-2 border-black/10 pt-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-tape-muted)]">
          {footer ?? "tastetape — taste recap"}
        </p>
      </div>
    );
  }
);

function StatBlock({
  big,
  label,
}: {
  big: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-black bg-[var(--color-tape-lime-soft)] p-3 shadow-[3px_3px_0_0_rgba(0,0,0,0.85)]">
      <p className="text-2xl font-extrabold leading-none text-black">{big}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-tape-muted)]">
        {label}
      </p>
    </div>
  );
}

type StatsRecapProps = {
  profile: AnalyzeResponse["profile"];
  stats: AnalyzeResponse["stats"];
};

export const StatsRecap = forwardRef<HTMLDivElement, StatsRecapProps>(
  function StatsRecap({ profile, stats }, ref) {
    const yearSpan =
      profile.yearRange.min != null && profile.yearRange.max != null
        ? profile.yearRange.max - profile.yearRange.min
        : 0;
    const histMax = Math.max(
      1,
      ...[5, 4, 3, 2, 1].map((s) => stats.ratingHistogram[s] ?? 0)
    );
    const topGenres = stats.topGenresByAvg.slice(0, 5);
    const topGenresMax = Math.max(1, ...topGenres.map((g) => g.avgRating));

    return (
      <div
        ref={ref}
        className={`${sharedSheet} w-[520px]`}
        style={{ fontFamily: SHEET_FONT }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <Tag>TasteTape</Tag>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Taste stats recap
            </h2>
            <p className="mt-1 text-sm font-bold text-[var(--color-tape-muted)]">
              Your numbers, all in one frame
            </p>
          </div>
          <div className="-rotate-2">
            <span className="inline-block rounded-md bg-black px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-tape-lime)] ring-2 ring-black">
              # stats
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatBlock
            big={String(profile.totalRated)}
            label="Titles rated"
          />
          <StatBlock
            big={`${profile.avgRating}★`}
            label="Average rating"
          />
          <StatBlock
            big={yearSpan ? `${yearSpan}yr` : "—"}
            label="Year span"
          />
        </div>

        <div className="mt-6 rounded-2xl border-2 border-black bg-white p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black">
            Star spread
          </p>
          <ul className="mt-3 space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const v = stats.ratingHistogram[s] ?? 0;
              const w = Math.round((v / histMax) * 100);
              return (
                <li key={s} className="flex items-center gap-2">
                  <span className="w-7 text-[11px] font-extrabold text-black">
                    ★{s}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full border border-black bg-[var(--color-tape-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-tape-lime)]"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] font-extrabold text-black">
                    {v}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 border-black bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black">
              By media
            </p>
            <ul className="mt-3 space-y-1 text-[12px] font-bold text-black">
              {stats.byMedia.map((r) => (
                <li
                  key={r.mediaType}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="uppercase tracking-wide">
                    {r.mediaType}
                  </span>
                  <span className="font-extrabold">
                    {r.count} · {r.avgRating}★
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-black bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black">
              Top genres (avg)
            </p>
            <ul className="mt-3 space-y-1.5">
              {topGenres.map((g) => {
                const w = Math.round((g.avgRating / topGenresMax) * 100);
                return (
                  <li key={g.genre}>
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-black">
                      <span className="truncate" title={g.genre}>
                        {g.genre.length > 18
                          ? `${g.genre.slice(0, 18)}…`
                          : g.genre}
                      </span>
                      <span>{g.avgRating}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full border border-black/60 bg-[var(--color-tape-bg)]">
                      <div
                        className="h-full bg-[var(--color-tape-lime)]"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="mt-6 border-t-2 border-black/10 pt-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-tape-muted)]">
          tastetape — your numbers
        </p>
      </div>
    );
  }
);

function ReceiptDivider() {
  return (
    <p
      aria-hidden="true"
      className="select-none text-center text-[12px] tracking-[0.4em] text-black/60"
    >
      - - - - - - - - - - - - - - - -
    </p>
  );
}

type ReceiptRecapProps = {
  profile: AnalyzeResponse["profile"];
  analysis: AnalyzeResponse["analysis"];
  basis: TopRatedItem[];
  generatedAt: Date;
};

export const ReceiptRecap = forwardRef<HTMLDivElement, ReceiptRecapProps>(
  function ReceiptRecap({ profile, analysis, basis, generatedAt }, ref) {
    const orderId = generatedAt.getTime().toString(36).slice(-6).toUpperCase();
    const dateStr = generatedAt.toISOString().slice(0, 10);
    const timeStr = generatedAt.toISOString().slice(11, 16);
    const top3 = basis.slice(0, 3);
    while (top3.length < 3) {
      top3.push({
        title: "—",
        mediaType: "movie",
        rating: 0,
        posterOrCoverUrl: null,
      });
    }

    return (
      <div
        ref={ref}
        className="relative w-[400px] bg-[#fdfbf2] p-7 text-black shadow-[10px_10px_0_0_rgba(0,0,0,0.85)]"
        style={{
          fontFamily: MONO_FONT,
          clipPath:
            "polygon(0 0, 100% 0, 100% calc(100% - 14px), 95% 100%, 90% calc(100% - 14px), 85% 100%, 80% calc(100% - 14px), 75% 100%, 70% calc(100% - 14px), 65% 100%, 60% calc(100% - 14px), 55% 100%, 50% calc(100% - 14px), 45% 100%, 40% calc(100% - 14px), 35% 100%, 30% calc(100% - 14px), 25% 100%, 20% calc(100% - 14px), 15% 100%, 10% calc(100% - 14px), 5% 100%, 0 calc(100% - 14px))",
        }}
      >
        <h2 className="text-center text-[28px] font-extrabold tracking-[0.4em] text-black">
          TASTETAPE
        </h2>
        <p className="mt-1 text-center text-[10px] font-extrabold tracking-[0.3em] text-black/60">
          ★ ★ ★  taste receipt  ★ ★ ★
        </p>

        <div className="mt-4 flex justify-between text-[11px] font-bold text-black/80">
          <span>{dateStr} {timeStr}</span>
          <span>NO. {orderId}</span>
        </div>

        <ReceiptDivider />

        <div className="text-[11px] font-bold leading-relaxed text-black">
          <div className="flex justify-between font-extrabold">
            <span>ITEM</span>
            <span>QTY</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Titles rated</span>
            <span>x{profile.totalRated}</span>
          </div>
          <div className="flex justify-between">
            <span>Average rating</span>
            <span>{profile.avgRating}★</span>
          </div>
          <div className="flex justify-between">
            <span>Top genre</span>
            <span className="ml-2 truncate">
              {profile.topGenres[0]?.genre ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Year range</span>
            <span>
              {profile.yearRange.min ?? "?"}–{profile.yearRange.max ?? "?"}
            </span>
          </div>
        </div>

        <ReceiptDivider />

        <p className="text-[11px] font-extrabold tracking-[0.2em] text-black">
          TASTE SUMMARY
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[11.5px] font-medium leading-relaxed text-black">
          {analysis.tasteSummary}
        </p>

        <p className="mt-4 text-[11px] font-extrabold tracking-[0.2em] text-black">
          KEYWORDS
        </p>
        <p className="mt-1 text-[11.5px] font-bold leading-relaxed text-black">
          {analysis.keywords.join(" · ")}
        </p>

        <p className="mt-4 text-[11px] font-extrabold tracking-[0.2em] text-black">
          BLURB
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[11.5px] font-medium leading-relaxed text-black">
          {analysis.recommendationBlurb}
        </p>

        <ReceiptDivider />

        <p className="text-[11px] font-extrabold tracking-[0.2em] text-black">
          BASED ON
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {top3.map((it, i) => (
            <div key={`${it.title}-${i}`} className="flex flex-col">
              <div className="h-[140px] w-full overflow-hidden border-2 border-black bg-[var(--color-tape-bg)]">
                {it.posterOrCoverUrl ? (
                  <img
                    src={it.posterOrCoverUrl}
                    alt=""
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] font-extrabold leading-tight text-black">
                    {it.title.length > 36
                      ? `${it.title.slice(0, 36)}…`
                      : it.title}
                  </div>
                )}
              </div>
              <p
                className="mt-1 line-clamp-2 text-[10px] font-extrabold leading-tight text-black"
                title={it.title}
              >
                {it.title.length > 28 ? `${it.title.slice(0, 28)}…` : it.title}
              </p>
              {it.rating > 0 && (
                <p className="text-[10px] font-bold text-black/70">
                  ★{it.rating}
                </p>
              )}
            </div>
          ))}
        </div>

        <ReceiptDivider />

        <p className="mt-2 text-center text-[11px] font-extrabold tracking-[0.3em] text-black">
          THANK YOU FOR LISTENING
        </p>
        <p className="mt-1 text-center text-[10px] font-bold tracking-[0.25em] text-black/60">
          tastetape · v1
        </p>
        <div className="h-3" />
      </div>
    );
  }
);

type SinglePickProps = {
  pick: RankedEnriched;
  rank?: number;
};

export const SinglePickCard = forwardRef<HTMLDivElement, SinglePickProps>(
  function SinglePickCard({ pick, rank }, ref) {
    return (
      <div
        ref={ref}
        className={`${sharedSheet} w-[440px]`}
        style={{ fontFamily: SHEET_FONT }}
      >
        <div className="flex items-center justify-between">
          <Tag>TasteTape pick</Tag>
          {rank != null && (
            <span className="rounded-md bg-black px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-tape-lime)] ring-2 ring-black">
              #{rank}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-4">
          <div className="h-[210px] w-[140px] shrink-0 overflow-hidden rounded-xl border-2 border-black bg-[var(--color-tape-bg)] shadow-[3px_3px_0_0_rgba(0,0,0,0.85)]">
            {pick.work.posterOrCoverUrl ? (
              <img
                src={pick.work.posterOrCoverUrl}
                alt=""
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--color-tape-lime-soft)] p-2 text-center text-[12px] font-extrabold leading-tight text-black">
                {pick.work.title.length > 60
                  ? `${pick.work.title.slice(0, 60)}…`
                  : pick.work.title}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-tape-muted)]">
              {pick.work.mediaType}
              {pick.work.year != null ? ` · ${pick.work.year}` : ""}
            </p>
            <h2 className="mt-1 break-words text-xl font-extrabold leading-tight text-black">
              {pick.work.title}
            </h2>
            <p className="mt-2 inline-block rounded-md bg-[var(--color-tape-lime)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-black ring-2 ring-black">
              Score {pick.score}
            </p>
            <ul className="mt-3 list-inside list-disc space-y-0.5 text-[12px] font-bold text-black">
              {pick.reasons.slice(0, 3).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap rounded-xl border-2 border-black bg-[var(--color-tape-lime-soft)] p-3 text-[12.5px] font-medium leading-relaxed text-black">
          {pick.aiComment}
        </p>

        <p className="mt-4 border-t-2 border-black/10 pt-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-tape-muted)]">
          tastetape — ai pick
        </p>
      </div>
    );
  }
);
