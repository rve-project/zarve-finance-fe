"use client";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/**
 * Single horizontal stacked bar for a part-to-whole breakdown (per the dataviz
 * guidance: part-to-whole -> stacked bar, never a pie/donut). Built in plain HTML
 * rather than a chart library -- a single row of proportional segments doesn't need
 * axes/scales, and this keeps the 2px surface gap + rounded end-caps exact.
 */
export function SegmentedBar({ segments, title }: { segments: Segment[]; title?: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div>
      {title && <p className="mb-2 text-sm font-semibold text-zinc-700">{title}</p>}
      <div className="flex h-8 w-full gap-0.5 overflow-hidden rounded-lg bg-zinc-100">
        {visible.map((s, i) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <div
              key={s.label}
              title={`${s.label}: ${s.value.toLocaleString("id-ID")} (${pct.toFixed(1)}%)`}
              className="flex items-center justify-center overflow-hidden text-[11px] font-medium text-white transition-opacity hover:opacity-90"
              style={{
                width: `${pct}%`,
                backgroundColor: s.color,
                borderRadius: i === 0 ? "6px 0 0 6px" : i === visible.length - 1 ? "0 6px 6px 0" : 0,
              }}
            >
              {pct > 8 ? `${pct.toFixed(0)}%` : ""}
            </div>
          );
        })}
        {total === 0 && <div className="flex w-full items-center justify-center text-xs text-zinc-400">Tidak ada data</div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label} <span className="font-semibold text-zinc-900">{s.value.toLocaleString("id-ID")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
