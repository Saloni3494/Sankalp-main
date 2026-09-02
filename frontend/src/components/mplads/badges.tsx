import { cn } from "@/lib/utils";
import type { ProjectStatus, RiskLevel } from "@/lib/mplads-data";

const riskStyles: Record<RiskLevel, string> = {
  Low: "bg-success-soft text-success border-success/25",
  Medium: "bg-warning-soft text-warning border-warning/30",
  High: "bg-danger-soft text-danger border-danger/25",
};

const statusStyles: Record<ProjectStatus, string> = {
  Ongoing: "bg-navy-soft text-navy border-navy/20",
  Completed: "bg-success-soft text-success border-success/25",
  Delayed: "bg-warning-soft text-warning border-warning/30",
  Cancelled: "bg-muted text-muted-foreground border-border",
};

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level, withDot = true }: { level: RiskLevel; withDot?: boolean }) {
  return (
    <Pill className={riskStyles[level]}>
      {withDot && <span className="size-1.5 rounded-full bg-current" />}
      {level}
    </Pill>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Pill className={statusStyles[status]}>{status}</Pill>;
}

export function ImpactBadge({ level }: { level: RiskLevel }) {
  return <Pill className={riskStyles[level]}>Potential impact: {level}</Pill>;
}

export function riskColor(level: RiskLevel) {
  return level === "High" ? "var(--danger)" : level === "Medium" ? "var(--warning)" : "var(--success)";
}
