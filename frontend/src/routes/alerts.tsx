import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/mplads/PageHeader";
import { RiskBadge } from "@/components/mplads/badges";
import { Button } from "@/components/ui/button";
import { useAnalyticsDashboard } from "@/lib/api";
import { useFilters } from "@/lib/filters";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [{ title: "Alert Center — MPLADS AI Monitor" }],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { filters } = useFilters();
  const { data: dashboardData, isLoading } = useAnalyticsDashboard(filters.house);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading alerts...</span>
      </div>
    );
  }

  const alerts = dashboardData?.alerts || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Center"
        subtitle="AI-detected anomalies and cases requiring immediate attention."
      />

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <div className="card-surface p-8 text-center text-muted-foreground">
            No high-priority alerts found for the current selection.
          </div>
        ) : (
          alerts.map((alert: any) => (
            <div key={alert.id} className="card-surface p-5 md:flex md:items-start md:justify-between md:gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <RiskBadge level={alert.level} />
                  <span className="text-sm font-mono text-muted-foreground">{alert.id}</span>
                  <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-md">
                    AI Confidence: {alert.confidence}%
                  </span>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className={`size-5 ${alert.level === 'High' ? 'text-danger' : alert.level === 'Medium' ? 'text-warning' : 'text-primary'}`} />
                    {alert.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{alert.project}</p>
                </div>

                <div className="flex flex-wrap gap-4 mt-2">
                  {alert.facts.map((fact: any, idx: number) => (
                    <div key={idx} className="bg-secondary/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">{fact.label}</p>
                      <p className="text-sm font-semibold">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 md:mt-0 md:shrink-0 flex items-center">
                <Button variant="default" asChild>
                  <Link to={`/projects/${encodeURIComponent(alert.projectId)}`}>
                    {alert.action}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
