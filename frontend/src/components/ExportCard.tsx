import { forwardRef } from "react";

type Props = {
  title: string;
  subtitle?: string;
  body: string;
  footer?: string;
};

export const ExportCard = forwardRef<HTMLDivElement, Props>(
  function ExportCard({ title, subtitle, body, footer }, ref) {
    return (
      <div
        ref={ref}
        className="w-[420px] rounded-3xl border-[3px] border-black bg-white p-8 text-[var(--color-tape-ink)] shadow-[8px_8px_0_0_rgba(0,0,0,0.85)]"
        style={{ fontFamily: "Outfit, DM Sans, system-ui, sans-serif" }}
      >
        <p className="inline-block rounded-md bg-[var(--color-tape-lime)] px-2 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-black">
          TasteTape
        </p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight text-black">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold text-[var(--color-tape-muted)]">
            {subtitle}
          </p>
        )}
        <div className="mt-5 whitespace-pre-wrap text-sm font-medium leading-relaxed text-black">
          {body}
        </div>
        {footer && (
          <p className="mt-6 border-t-2 border-black/10 pt-4 text-xs font-semibold text-[var(--color-tape-muted)]">
            {footer}
          </p>
        )}
      </div>
    );
  }
);
