import { useState } from "react";
import { STATES, type StateInfo } from "@/lib/mplads-data";
import { riskColor } from "./badges";
import { cn } from "@/lib/utils";

const INDIA_PATH =
  "M186 22c14 5 25 15 41 15 13 0 20-9 32-8 12 1 15 12 12 22-3 11-14 19-13 31 1 11 13 17 24 16 15-1 29-8 44-6 14 2 23 13 21 26-2 12-14 20-18 32-4 13 2 27-2 40-4 12-16 20-19 32-3 13 4 27 0 40-4 14-18 22-24 35-7 14-6 31-14 44-8 13-24 19-32 32-9 14-9 32-17 46-8 13-25 20-40 17-16-3-27-17-33-32-7-17-8-36-17-52-9-15-25-25-33-41-8-15-8-33-16-48-8-14-23-23-29-38-6-14-3-30-9-44-6-13-19-22-22-36-3-13 3-27 1-41-2-13-11-25-9-38 2-12 13-21 25-24 13-3 27 2 39-2 12-4 21-15 33-19 12-4 25-1 37-3 12-2 22-11 34-13 13-2 26 3 38 6z";

export function IndiaMap({
  metric = "activity",
  onSelectState,
}: {
  metric?: "activity" | "utilisation" | "risk";
  onSelectState?: (s: StateInfo) => void;
}) {
  const [hover, setHover] = useState<StateInfo | null>(null);

  const maxProjects = Math.max(...STATES.map((s) => s.projects));

  const fill = (s: StateInfo) => {
    if (metric === "risk") return riskColor(s.risk);
    if (metric === "utilisation") return "var(--india-green)";
    return "var(--saffron)";
  };
  const opacity = (s: StateInfo) => {
    if (metric === "utilisation") return 0.25 + (s.utilisation / 100) * 0.7;
    if (metric === "risk") return 0.85;
    return 0.3 + (s.projects / maxProjects) * 0.65;
  };

  return (
    <div className="relative">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px]">
        <svg viewBox="0 0 460 560" className="size-full">
          <path
            d={INDIA_PATH}
            fill="var(--muted)"
            stroke="var(--border)"
            strokeWidth="2"
            transform="translate(20 10) scale(0.95)"
          />
        </svg>

        {STATES.map((s) => {
          const size = 12 + (s.projects / maxProjects) * 22;
          return (
            <button
              key={s.id}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s)}
              onBlur={() => setHover(null)}
              onClick={() => onSelectState?.(s)}
              aria-label={`${s.name}: ${s.projects} projects`}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card transition-transform duration-150 hover:scale-125 focus-visible:scale-125 focus-visible:outline-none",
                hover?.id === s.id && "scale-125",
              )}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: size,
                height: size,
                backgroundColor: fill(s),
                opacity: opacity(s),
              }}
            />
          );
        })}

        {hover && (
          <div
            className="pointer-events-none absolute z-20 w-56 rounded-xl border border-border bg-popover p-3 shadow-panel"
            style={{
              left: `${Math.min(hover.x, 58)}%`,
              top: `${Math.min(hover.y + 4, 74)}%`,
            }}
          >
            <p className="text-sm font-semibold text-foreground">{hover.name}</p>
            <dl className="mt-2 space-y-1 text-xs">
              <Row label="Projects" value={hover.projects.toLocaleString("en-IN")} />
              <Row label="Funds Utilised" value={`₹${hover.fundsUtilisedCr} Cr`} />
              <Row label="High Risk" value={String(hover.highRisk)} />
              <Row label="Delayed" value={String(hover.delayed)} />
            </dl>
            <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
              Click to open state details
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <Legend color="var(--success)" label="Low Risk" />
        <Legend color="var(--warning)" label="Medium Risk" />
        <Legend color="var(--danger)" label="High Risk" />
        <span className="text-[11px]">Circle size = number of sanctioned works</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
