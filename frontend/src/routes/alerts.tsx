import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/mplads/PageHeader";
import { RiskBadge } from "@/components/mplads/badges";
import { Button } from "@/components/ui/button";
import { ALERTS } from "@/lib/mplads-data";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [{ title: "Alert Center — MPLADS AI Monitor" }],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Center"
        subtitle="AI-detected anomalies and cases requiring immediate attention."
      />

      <div className="grid gap-4">
        {ALERTS.map((alert) => (
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
                {alert.facts.map((fact, idx) => (
                  <div key={idx} className="bg-secondary/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">{fact.label}</p>
                    <p className="text-sm font-semibold">{fact.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 md:mt-0 flex flex-col gap-2 min-w-[140px]">
              <Button asChild variant={alert.level === "High" ? "default" : "outline"} className="w-full">
                <Link to="/projects/$projectId" params={{ projectId: alert.projectId }}>
                  {alert.action}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
