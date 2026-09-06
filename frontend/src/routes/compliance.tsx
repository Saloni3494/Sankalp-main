import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { useAnalyticsCompliance } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { ShieldAlert, ImageOff, Database, ClipboardList, ArrowRight, Activity, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [{ title: "Compliance — MPLADS AI Monitor" }],
  }),
  component: CompliancePage,
});

const PIE_COLORS = ['var(--color-primary)', 'var(--color-warning)', 'var(--color-india-green)', 'var(--color-chart-3)', 'var(--color-danger)'];

function CompliancePage() {
  const { filters } = useFilters();
  const { data, isLoading } = useAnalyticsCompliance(filters.house);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Audit"
        subtitle="Track documentation, financial, and timeline compliance across projects."
      />
      
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Auditing compliance rules...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Rule Exceptions</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-danger-soft text-danger">
                  <ShieldAlert className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.kpis?.rule_exceptions?.toLocaleString() || 0}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Total hard rule violations
              </p>
            </div>
            
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Missing Evidence</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                  <ImageOff className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.kpis?.missing_evidence?.toLocaleString() || 0}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Photo availability missing
              </p>
            </div>
            
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Avg Completeness</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-navy-soft text-navy">
                  <Database className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.kpis?.average_completeness || 0}%
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Data quality average
              </p>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">Requires Review</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <ClipboardList className="size-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-3 text-[26px] leading-none font-bold tracking-tight text-foreground">
                {data?.kpis?.requires_review?.toLocaleString() || 0}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Unreviewed high-risk works
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {/* Lifecycle Coverage */}
            <SectionCard title="Lifecycle Coverage" subtitle="Project coverage status across standard pipeline">
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.lifecycle_coverage || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                    >
                      {data?.lifecycle_coverage?.map((entry: any, index: number) => (
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
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {data?.lifecycle_coverage?.map((entry: any, index: number) => (
                   <div key={index} className="flex items-center justify-between border-b border-border pb-1 last:border-0">
                     <div className="flex items-center gap-2">
                       <span className="size-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                       <span className="text-xs text-muted-foreground truncate" title={entry.name}>{entry.name.replace(/_/g, ' ')}</span>
                     </div>
                     <span className="font-medium text-xs">{entry.count.toLocaleString()}</span>
                   </div>
                ))}
              </div>
            </SectionCard>

            {/* Investigation Workflow */}
            <SectionCard title="Investigation Workflow" subtitle="Audit status across the entire database">
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.investigation_workflow || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} 
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
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
             {/* Financial */}
             <SectionCard title="Financial Compliance">
                <div className="space-y-4 mt-2">
                   {data?.financial_compliance?.length ? data.financial_compliance.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 p-3">
                         <span className="text-sm font-medium text-danger">{item.name}</span>
                         <span className="text-sm font-bold">{item.count.toLocaleString()}</span>
                      </div>
                   )) : (
                      <p className="text-sm text-muted-foreground">No financial exceptions detected.</p>
                   )}
                </div>
             </SectionCard>

             {/* Timeline */}
             <SectionCard title="Timeline Compliance">
                <div className="space-y-4 mt-2">
                   {data?.timeline_compliance?.length ? data.timeline_compliance.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3">
                         <span className="text-sm font-medium text-warning">{item.name}</span>
                         <span className="text-sm font-bold">{item.count.toLocaleString()}</span>
                      </div>
                   )) : (
                      <p className="text-sm text-muted-foreground">No timeline exceptions detected.</p>
                   )}
                </div>
             </SectionCard>

             {/* Data Quality */}
             <SectionCard title="Data Quality">
                <div className="space-y-4 mt-2">
                   {data?.data_quality?.length ? data.data_quality.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                         <span className="text-sm font-medium text-foreground">{item.name}</span>
                         <span className="text-sm font-bold">{item.count.toLocaleString()}</span>
                      </div>
                   )) : (
                      <p className="text-sm text-muted-foreground">Data quality is excellent.</p>
                   )}
                </div>
             </SectionCard>
          </div>

          {/* Action Queue */}
          <SectionCard title="Compliance Action Queue" subtitle="Projects requiring review due to rule exceptions or data quality issues">
            <div className="mt-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Work ID</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Exception Type</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Data Completeness</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-right text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.action_queue?.map((work: any) => (
                    <tr key={work.work_id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{work.work_id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                           {work.has_rule_exception && <AlertTriangle className="size-3.5 text-danger" />}
                           <span className={work.has_rule_exception ? "text-danger font-medium" : "text-muted-foreground"}>
                             {work.exception_type}
                           </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={work.data_completeness > 0.8 ? "secondary" : "warning"}>
                          {Math.round((work.data_completeness || 0) * 100)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {work.investigation_status.replace(/_/g, ' ')}
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
                  {(!data?.action_queue || data.action_queue.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No works require compliance review at this time.
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
