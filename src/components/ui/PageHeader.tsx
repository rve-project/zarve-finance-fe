import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
