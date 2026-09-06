import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { useAnalyticsFunds } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { IndianRupee, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatL } from "@/lib/mplads-data";
import { useMemo } from "react";

export const Route = createFileRoute("/fund-utilization")({
  head: () => ({
    meta: [{ title: "Fund Utilization — MPLADS AI Monitor" }],
  }),
  component: FundUtilizationPage,
});

function FundUtilizationPage() {
  const { filters } = useFilters();
  const { data, isLoading } = useAnalyticsFunds(filters.house);

  const formatCr = (amount: number) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  const chartData = useMemo(() => {
    if (!data?.state_data) return [];
    return data.state_data.slice(0, 15).map((d: any) => ({
      name: d.state,
      Sanctioned: Math.round(d.sanctioned / 10000000), // in Cr
      Expenditure: Math.round(d.expenditure / 10000000), // in Cr
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund Utilization"
        subtitle="Detailed analysis of funds sanctioned and expenditure across states."
      />
      
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Total Sanctioned</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-navy-soft text-navy">
                  <IndianRupee className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {formatCr(data?.totals?.sanctioned || 0)}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Total approved budget across selected house
              </p>
            </div>
            
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Total Expenditure</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-india-green-soft text-india-green">
                  <TrendingUp className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {formatCr(data?.totals?.expenditure || 0)}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Actual disbursed payments and expenditure
              </p>
            </div>
            
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Overall Utilization</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                  <PieChartIcon className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.totals?.utilization}%
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                National expenditure against sanctioned amount
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <SectionCard title="State-wise Expenditure vs Sanctioned (Top 15 States)" subtitle="Values in ₹ Crores">
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
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
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Sanctioned" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenditure" fill="var(--color-india-green)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="State Utilization Rankings" subtitle="By percentage of funds expended">
              <div className="mt-2 h-[400px] overflow-auto pr-2">
                <div className="space-y-4">
                  {data?.state_data?.map((state: any, i: number) => (
                    <div key={state.state} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{state.state}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Exp: {formatCr(state.expenditure)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${state.utilization >= 80 ? 'text-india-green' : state.utilization <= 50 ? 'text-danger' : 'text-warning'}`}>
                          {state.utilization}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Utilized</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
