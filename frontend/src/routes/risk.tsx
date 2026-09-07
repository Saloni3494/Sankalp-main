import { createFileRoute } from "@tanstack/react-router";
import { Layers, Loader2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAnalyticsDashboard } from "@/lib/api";
import { useFilters } from "@/lib/filters";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [{ title: "Risk Analysis — MPLADS AI Monitor" }],
  }),
  component: RiskPage,
});

function RiskPage() {
  const { filters } = useFilters();
  const { data: dashboardData, isLoading } = useAnalyticsDashboard(filters.house);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading risk data...</span>
      </div>
    );
  }

  const categories = dashboardData?.risk_categories || [];
  const factors = dashboardData?.risk_factors || [];
  const distribution = dashboardData?.risk_distribution || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Risk Analysis"
        subtitle="Comprehensive breakdown of identified risk categories and anomalies across MPLADS implementation."
      />

      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <SectionCard title="Risk Categories">
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((c: any) => (
                <div key={c.key} className="rounded-xl border border-border bg-secondary/40 p-5">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-danger-soft text-danger">
                    <Layers className="size-[20px]" strokeWidth={1.8} />
                  </span>
                  <p className="mt-4 text-base font-semibold">{c.title}</p>
                  <p className="mt-1 text-2xl font-bold">{c.count} Cases</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          
          <SectionCard title="Common Risk Factors">
            <ul className="space-y-5">
              {factors.map((f: any) => (
                <li key={f.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground truncate mr-2" title={f.name}>{f.name}</span>
                    <span className="font-bold text-muted-foreground shrink-0">{f.value}% frequency</span>
                  </div>
                  <Progress value={f.value} className="h-2" />
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
        
        <div className="space-y-5">
          <SectionCard title="Overall Risk Distribution">
            <div className="flex flex-col items-center">
              <div className="relative h-[220px] w-[220px] shrink-0 mb-6 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {distribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => `${val}%`} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-3xl font-bold tracking-tighter text-foreground">
                    {distribution.find((d: any) => d.name === "High risk")?.value || 0}%
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    High Risk
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2.5">
                {distribution.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
