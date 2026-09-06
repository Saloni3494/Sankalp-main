import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { useAnalyticsInsights } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { FileSearch, ShieldAlert, Activity, FileCheck, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ai-insights")({
  head: () => ({
    meta: [{ title: "AI Insights — MPLADS AI Monitor" }],
  }),
  component: AiInsightsPage,
});

const PIE_COLORS = ['var(--color-primary)', 'var(--color-warning)', 'var(--color-india-green)', 'var(--color-chart-3)', 'var(--color-danger)'];

function AiInsightsPage() {
  const { filters } = useFilters();
  const { data, isLoading } = useAnalyticsInsights(filters.house);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights & Investigation Queue"
        subtitle="Machine learning driven anomaly detection and risk signal analysis."
      />
      
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Analyzing evidence signals...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Works Analyzed</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-navy-soft text-navy">
                  <FileCheck className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.total_works?.toLocaleString() || 0}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Total projects scanned
              </p>
            </div>
            
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">High-Priority Works</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-danger-soft text-danger">
                  <ShieldAlert className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.high_priority_count?.toLocaleString() || 0}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Risk score ≥ 50
              </p>
            </div>
            
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Avg Risk Score</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                  <Activity className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.average_risk_score || 0}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Across selected house
              </p>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Strong-Evidence Works</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-india-green-soft text-india-green">
                  <FileSearch className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.strong_evidence_works?.toLocaleString() || 0}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                2+ anomaly signals detected
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            {/* Evidence Signals */}
            <SectionCard title="Evidence Signals Breakdown" subtitle="Most common risk factors contributing to investigation priority">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.evidence_signals || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data?.evidence_signals?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }}
                      itemStyle={{ color: 'var(--color-foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Risk Distribution */}
            <SectionCard title="Risk Score Distribution" subtitle="Project investigation priority bands">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.risk_bands || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} 
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} 
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-secondary)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }}
                      itemStyle={{ color: 'var(--color-foreground)' }}
                    />
                    <Bar dataKey="count" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Investigation Queue */}
          <SectionCard title="Critical Investigation Queue" subtitle="Top ranked projects requiring manual review">
            <div className="mt-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Work ID</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Risk Score</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Completeness</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground w-1/3">Top Risk Factors</th>
                    <th className="px-4 py-3 font-medium text-right text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.top_works?.map((work: any) => (
                    <tr key={work.work_id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{work.work_id}</td>
                      <td className="px-4 py-3">
                        <Badge variant={work.risk_score >= 75 ? "destructive" : work.risk_score >= 50 ? "warning" : "secondary"}>
                          {work.risk_score} Score
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {Math.round(work.data_completeness * 100)}%
                      </td>
                      <td className="px-4 py-3">
                        <ul className="list-disc pl-4 space-y-1">
                          {work.top_factors?.map((f: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground">{f}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/projects/${encodeURIComponent(work.work_id)}`}>
                            Review <ArrowRight className="ml-2 size-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!data?.top_works || data.top_works.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No critical works require investigation at this time.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
