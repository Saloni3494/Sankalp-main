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
  formatL
} from "@/lib/mplads-data";
import { scaleByFilters, useFilters } from "@/lib/filters";
import { useDashboardSummary, useWorks, useAnalyticsDashboard, useAnalyticsStateSummary } from "@/lib/api";
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
  const { filters, setFilter } = useFilters();
  const navigate = useNavigate();
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null);

  const { data: summaryData } = useDashboardSummary();
  const { data: dashboardData } = useAnalyticsDashboard(filters.house);
  const { data: stateSummary } = useAnalyticsStateSummary(selectedStateName || "", filters.house);

  const { data: worksData } = useWorks({
    limit: 6,
    house: filters.house,
    state: filters.state,
  });

  const kpis = useMemo(() => {
    // Fallback to static mock numbers if data isn't loaded yet
    const projects = summaryData ? summaryData.total_works : scaleByFilters(12486, filters);
    const funds = summaryData ? summaryData.total_amount_at_risk || 0 : scaleByFilters(84267, filters);
    const highRisk = summaryData ? summaryData.high_risk_works : scaleByFilters(247, filters);
    const missingPhoto = summaryData ? summaryData.missing_photo_count : scaleByFilters(386, filters);
    
    return [
      {
        label: "Total Projects",
        value: projects.toLocaleString("en-IN"),
        sub: "Tracked in Sentinel",
        icon: FolderKanban,
        tone: "navy",
        up: true,
      },
      {
        label: "Amount at Risk",
        value: `₹${(funds / 10000000).toFixed(2)} Cr`,
        sub: "Total flagged disbursements",
        icon: IndianRupee,
        tone: "danger",
        up: true,
      },
      {
        label: "High-Risk Projects",
        value: highRisk.toLocaleString("en-IN"),
        sub: "Requiring investigation",
        icon: ShieldAlert,
        tone: "danger",
        up: true,
      },
      {
        label: "Missing Evidence",
        value: missingPhoto.toLocaleString("en-IN"),
        sub: "Works missing photos",
        icon: Clock,
        tone: "warning",
        up: false,
      },
    ] as const;
  }, [summaryData, filters]);

  const rows = useMemo(() => {
    if (worksData?.results) {
      return worksData.results.map((w: any) => {
        const rawDistrict = w.constituency || w.ida || "Unknown";
        const cleanDistrict = rawDistrict.split("(")[0].trim();
        const districtTitle = cleanDistrict.charAt(0).toUpperCase() + cleanDistrict.slice(1).toLowerCase();

        return {
          id: w.work_id,
          name: w.work_description || "Untitled Work",
          state: w.state,
          district: districtTitle,
          sanctionedL: (w.sanction_amount || 0) / 100000,
          spentL: (w.amount_disbursed || 0) / 100000,
          progress: w.sanction_amount ? Math.min(100, Math.round((w.amount_disbursed / w.sanction_amount) * 100)) : 0,
          riskScore: w.risk_score,
          risk: w.risk_score >= 60 ? "High" : w.risk_score >= 30 ? "Medium" : "Low",
          status: w.investigation_status || "Ongoing"
        };
      });
    }
    return [];
  }, [worksData, filters]);

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
          <IndiaMap onSelectState={setSelectedStateName} />
        </SectionCard>

        <div className="space-y-5">
          {selectedStateName && stateSummary ? (
            <SectionCard
              title={stateSummary.name}
              subtitle={`Avg Risk: ${stateSummary.avgRisk ?? "—"} · ${stateSummary.projects} projects · ₹${stateSummary.sanctionedCr ?? stateSummary.fundsUtilisedCr} Cr sanctioned`}
              actions={
                <Button variant="ghost" size="sm" onClick={() => setSelectedStateName(null)}>
                  ✕ Close
                </Button>
              }
            >
              {/* KPI Row */}
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Projects" value={stateSummary.projects.toLocaleString("en-IN")} />
                <Stat label="Funds Utilised" value={`₹${stateSummary.fundsUtilisedCr} Cr`} />
                <Stat label="High Risk" value={String(stateSummary.highRisk)} tone="danger" />
                <Stat label="Delayed" value={String(stateSummary.delayed)} tone="warning" />
              </div>

              {/* Fund Utilisation Bar */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fund utilisation</span>
                  <span className="font-medium">{stateSummary.utilisation}%</span>
                </div>
                <Progress value={Math.min(stateSummary.utilisation, 100)} className="h-2" />
              </div>

              {/* Overall Risk Badge */}
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Overall risk level</span>
                <RiskBadge level={stateSummary.risk} />
              </div>

              {/* ===== AI RISK REASONS — The key differentiator ===== */}
              {stateSummary.reasons && stateSummary.reasons.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-xs font-bold tracking-wider uppercase text-primary mb-3">
                    🧠 Why is {stateSummary.name} at risk?
                  </p>
                  <div className="space-y-2">
                    {stateSummary.reasons.map((r: any, i: number) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs ${
                          r.severity === "high"
                            ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
                            : r.severity === "medium"
                            ? "border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20"
                            : "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20"
                        }`}
                      >
                        <span className="text-base leading-none mt-0.5 shrink-0">{r.icon}</span>
                        <span className="text-foreground leading-relaxed">{r.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Dimensions Mini-Bars */}
              {stateSummary.risk_dimensions && Object.keys(stateSummary.risk_dimensions).length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
                    Risk Dimensions
                  </p>
                  <div className="space-y-2.5">
                    {Object.entries(stateSummary.risk_dimensions).map(([key, dim]: [string, any]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-muted-foreground">{dim.label}</span>
                          <span className={`font-bold ${dim.score >= 60 ? "text-red-500" : dim.score >= 30 ? "text-orange-500" : "text-emerald-500"}`}>
                            {dim.score}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              dim.score >= 60 ? "bg-red-500" : dim.score >= 30 ? "bg-orange-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Risky Projects */}
              {stateSummary.top_risky_projects && stateSummary.top_risky_projects.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
                    Top Risky Projects
                  </p>
                  <div className="space-y-2">
                    {stateSummary.top_risky_projects.slice(0, 3).map((p: any) => (
                      <Link
                        key={p.work_id}
                        to={`/projects/${encodeURIComponent(p.work_id)}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {p.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {p.mp_name || "—"} · ₹{((p.amount || 0) / 100000).toFixed(1)}L
                          </p>
                        </div>
                        <span className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.risk_score >= 60 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          p.risk_score >= 30 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {p.risk_score}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Projects Button */}
              <Button 
                className="mt-4 w-full" 
                size="sm" 
                asChild
                onClick={() => setFilter("state", stateSummary.name)}
              >
                <Link to="/projects">View all projects in {stateSummary.name}</Link>
              </Button>
            </SectionCard>
          ) : (
            <SectionCard title="Project Risk Score" subtitle="Distribution of works by AI-assessed risk level">
              {dashboardData?.risk_distribution ? (
                <div className="flex flex-wrap items-center gap-6">
                  <div className="relative h-[170px] w-[170px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.risk_distribution}
                          dataKey="value"
                          innerRadius={56}
                          outerRadius={82}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {dashboardData.risk_distribution.map((d: any) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{dashboardData.risk_distribution.find((d: any) => d.name === "Safe")?.value || 0}%</span>
                      <span className="text-[11px] text-muted-foreground">Safe</span>
                    </div>
                  </div>
                  <ul className="min-w-[130px] space-y-2 text-sm">
                    {dashboardData.risk_distribution.map((d: any) => (
                      <li key={d.name} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="ml-auto font-semibold">{d.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              
              {dashboardData?.risk_factors && dashboardData.risk_factors.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-3 text-sm font-semibold">AI Risk Factors</p>
                  <ul className="space-y-2.5">
                    {dashboardData.risk_factors.map((f: any) => (
                      <li key={f.name}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[200px]" title={f.name}>{f.name}</span>
                          <span className="font-medium">{f.value}%</span>
                        </div>
                        <Progress value={f.value} className="h-1.5" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </SectionCard>
          )}
        </div>
      </div>

      <SectionCard
        title="AI Risk Detection"
        subtitle="Machine learning models continuously identify unusual project and financial patterns."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardData?.risk_categories?.map((c: any) => (
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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                {rows.map((p: any) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } })}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-3 py-3 font-medium">
                      <div className="line-clamp-2 max-w-[280px]" title={p.name}>
                        {p.name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {p.district}, {p.state}
                    </td>
                    <td className="px-3 py-3">{p.sanctionedL > 0 ? formatL(p.sanctionedL) : "N/A"}</td>
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
            {dashboardData?.alerts?.length ? dashboardData.alerts.slice(0, 3).map((a: any) => (
              <div key={a.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <RiskBadge level={a.level} />
                  <span className="text-[11px] text-muted-foreground">AI confidence {a.confidence}%</span>
                </div>
                <p className="mt-2.5 text-sm font-semibold truncate" title={a.title}>{a.title}</p>
                <p className="text-xs text-muted-foreground truncate" title={a.project}>{a.project}</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {a.facts?.map((f: any) => (
                    <div key={f.label} className="rounded-lg bg-secondary px-2.5 py-1.5 overflow-hidden">
                      <p className="text-[11px] text-muted-foreground truncate">{f.label}</p>
                      <p className="text-sm font-semibold truncate" title={f.value}>{f.value}</p>
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
            )) : (
              <p className="text-sm text-muted-foreground">No recent alerts found.</p>
            )}
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
