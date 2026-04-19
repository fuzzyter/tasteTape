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
        className="w-[420px] rounded-3xl border-2 border-stone-900 bg-[#fffdf8] p-8 text-stone-900 shadow-2xl"
        style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c45c3e]">
          TasteTape
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
        )}
        <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
          {body}
        </div>
        {footer && (
          <p className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-500">
            {footer}
          </p>
        )}
      </div>
    );
  }
);
