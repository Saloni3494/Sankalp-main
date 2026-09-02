import { createFileRoute } from "@tanstack/react-router";
import { Layers, Search } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { RISK_CATEGORIES, RISK_FACTORS, RISK_DISTRIBUTION } from "@/lib/mplads-data";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [{ title: "Risk Analysis — MPLADS AI Monitor" }],
  }),
  component: RiskPage,
});

function RiskPage() {
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
              {RISK_CATEGORIES.map((c) => (
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
              {RISK_FACTORS.map((f) => (
                <li key={f.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{f.name}</span>
                    <span className="font-bold text-muted-foreground">{f.value}% frequency</span>
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
                      data={RISK_DISTRIBUTION}
                      dataKey="value"
                      innerRadius={70}
                      outerRadius={105}
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
                  <span className="text-3xl font-bold">{RISK_DISTRIBUTION[0].value}%</span>
                  <span className="text-xs text-muted-foreground">Low risk</span>
                </div>
              </div>
              <div className="w-full">
                <ul className="space-y-3 text-sm">
                  {RISK_DISTRIBUTION.map((d) => (
                    <li key={d.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <span className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold">{d.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
