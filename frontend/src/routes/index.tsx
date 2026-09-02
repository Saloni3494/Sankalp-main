import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  FolderKanban,
  IndianRupee,
  ShieldAlert,
  Clock,
  Layers,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { IndiaMap } from "@/components/mplads/IndiaMap";
import { RiskBadge, StatusBadge, riskColor } from "@/components/mplads/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ALERTS,
  PROJECTS,
  RISK_CATEGORIES,
  RISK_DISTRIBUTION,
  RISK_FACTORS,
  formatL,
  type StateInfo,
} from "@/lib/mplads-data";
import { scaleByFilters, useFilters } from "@/lib/filters";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MPLADS Overview — MPLADS AI Monitor" },
      {
        name: "description",
        content:
          "Real-time overview of MPLADS projects, fund utilisation, AI-detected risks and implementation progress across Indian states and districts.",
      },
      { property: "og:title", content: "MPLADS Overview — MPLADS AI Monitor" },
      {
        property: "og:description",
        content:
          "AI-powered monitoring, risk detection and decision support for the MPLADS scheme across India.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { filters } = useFilters();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<StateInfo | null>(null);

  const kpis = useMemo(() => {
    const projects = scaleByFilters(12486, filters);
    const funds = scaleByFilters(84267, filters);
    const highRisk = scaleByFilters(247, filters);
    const delayed = scaleByFilters(386, filters);
    return [
      {
        label: "Total Projects",
        value: projects.toLocaleString("en-IN"),
        sub: "+8.4% from previous year",
        icon: FolderKanban,
        tone: "navy",
        up: true,
      },
      {
        label: "Total Funds Utilized",
        value: `₹${(funds / 100).toFixed(2)} Cr`,
        sub: "78.4% utilization",
        icon: IndianRupee,
        tone: "green",
        up: true,
      },
      {
        label: "High-Risk Projects",
        value: highRisk.toLocaleString("en-IN"),
        sub: "18 new risks detected",
        icon: ShieldAlert,
        tone: "danger",
        up: true,
      },
      {
        label: "Projects Delayed",
        value: delayed.toLocaleString("en-IN"),
        sub: "3.1% of active projects",
        icon: Clock,
        tone: "warning",
        up: false,
      },
    ] as const;
  }, [filters]);

  const rows = useMemo(() => {
    let list = PROJECTS;
    if (filters.state !== "All States") list = list.filter((p) => p.state === filters.state);
    if (filters.status !== "All Statuses") list = list.filter((p) => p.status === filters.status);
    return list.slice(0, 6);
  }, [filters]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="MPLADS Overview"
        subtitle="Real-time overview of projects, fund utilization, risks and implementation progress"
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/reports">Export summary</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/alerts">
                Open Alert Center <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const tones: Record<string, string> = {
            navy: "bg-navy-soft text-navy",
            green: "bg-india-green-soft text-india-green",
            danger: "bg-danger-soft text-danger",
            warning: "bg-warning-soft text-warning",
          };
          return (
            <div key={k.label} className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                <span className={`flex size-9 items-center justify-center rounded-lg ${tones[k.tone]}`}>
                  <k.icon className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">{k.value}</p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                {k.up ? (
                  <ArrowUpRight className="size-3.5 text-india-green" />
                ) : (
                  <ArrowDownRight className="size-3.5 text-warning" />
                )}
                {k.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <SectionCard
          title="MPLADS Activity Across India"
          subtitle="Shading and circle size reflect sanctioned works, utilisation and risk level"
        >
          <IndiaMap onSelectState={setSelected} />
        </SectionCard>

        <div className="space-y-5">
          {selected ? (
            <SectionCard
              title={selected.name}
              subtitle="State-level summary for the selected financial year"
              actions={
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Clear
                </Button>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Projects" value={selected.projects.toLocaleString("en-IN")} />
                <Stat label="Funds Utilised" value={`₹${selected.fundsUtilisedCr} Cr`} />
                <Stat label="High Risk" value={String(selected.highRisk)} tone="danger" />
                <Stat label="Delayed" value={String(selected.delayed)} tone="warning" />
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fund utilisation</span>
                  <span className="font-medium">{selected.utilisation}%</span>
                </div>
                <Progress value={selected.utilisation} className="h-2" />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Overall risk level</span>
                <RiskBadge level={selected.risk} />
              </div>
              <Button className="mt-4 w-full" size="sm" asChild>
                <Link to="/projects">View projects in {selected.name}</Link>
              </Button>
            </SectionCard>
          ) : (
            <SectionCard title="Project Risk Score" subtitle="Distribution of works by AI-assessed risk level">
              <div className="flex flex-wrap items-center gap-6">
                <div className="relative h-[170px] w-[170px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={RISK_DISTRIBUTION}
                        dataKey="value"
                        innerRadius={56}
                        outerRadius={82}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {RISK_DISTRIBUTION.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">72%</span>
                    <span className="text-[11px] text-muted-foreground">Low risk</span>
                  </div>
                </div>
                <ul className="min-w-[130px] space-y-2 text-sm">
                  {RISK_DISTRIBUTION.map((d) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-semibold">{d.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 text-sm font-semibold">AI Risk Factors</p>
                <ul className="space-y-2.5">
                  {RISK_FACTORS.map((f) => (
                    <li key={f.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{f.name}</span>
                        <span className="font-medium">{f.value}%</span>
                      </div>
                      <Progress value={f.value} className="h-1.5" />
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <SectionCard
        title="AI Risk Detection"
        subtitle="Machine learning models continuously identify unusual project and financial patterns."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RISK_CATEGORIES.map((c) => (
            <div key={c.key} className="rounded-xl border border-border bg-secondary/40 p-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-danger-soft text-danger">
                <Layers className="size-[18px]" strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm font-semibold">{c.title}</p>
              <p className="mt-1 text-xl font-bold">{c.count} Projects</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.blurb}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to="/risk">View Cases</Link>
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <SectionCard
          title="Project Monitoring"
          subtitle="Recent works matching the current filters"
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/projects">View all projects</Link>
            </Button>
          }
          className="overflow-hidden"
        >
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-y border-border bg-secondary/50 text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Project ID</th>
                  <th className="px-3 py-2.5 font-medium">Project</th>
                  <th className="px-3 py-2.5 font-medium">District</th>
                  <th className="px-3 py-2.5 font-medium">Sanctioned</th>
                  <th className="px-3 py-2.5 font-medium">Progress</th>
                  <th className="px-3 py-2.5 font-medium">Risk</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } })}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-3 py-3 font-medium">{p.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {p.district}, {p.state}
                    </td>
                    <td className="px-3 py-3">{formatL(p.sanctionedL)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge level={p.risk} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No projects match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Alert Center"
          subtitle="Cases requiring attention"
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/alerts">All alerts</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {ALERTS.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <RiskBadge level={a.level} />
                  <span className="text-[11px] text-muted-foreground">AI confidence {a.confidence}%</span>
                </div>
                <p className="mt-2.5 text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.project}</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {a.facts.map((f) => (
                    <div key={f.label} className="rounded-lg bg-secondary px-2.5 py-1.5">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-semibold">{f.value}</p>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant={a.level === "High" ? "default" : "outline"}
                  className="mt-3 w-full"
                  asChild
                >
                  <Link to="/projects/$projectId" params={{ projectId: a.projectId }}>
                    {a.action}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warning" }) {
  const color = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export { riskColor };
