interface TooltipPayloadItem {
  dataKey: string | number;
  value: number;
  name?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  formatter?: (value: number) => string;
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-semibold text-zinc-700">{label}</p>}
      {payload.map((p, i) => (
        <p key={`${p.dataKey}-${i}`} className="flex items-center gap-1.5 text-zinc-600">
          {p.color && <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />}
          {p.name && <span className="text-zinc-500">{p.name}:</span>}
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}
