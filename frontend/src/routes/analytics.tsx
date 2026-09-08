import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";
import { IndiaMap } from "@/components/mplads/IndiaMap";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [{ title: "Analytics — MPLADS AI Monitor" }],
  }),
  component: AnalyticsPage,
});

import { useAnalyticsStates } from "@/lib/api";
import { Loader2 } from "lucide-react";

function AnalyticsPage() {
  const { data: states, isLoading } = useAnalyticsStates();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Advanced data visualizations and implementation metrics."
      />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <IndiaMap />
        </div>
        <div>
          <div className="card-surface p-6 h-full border border-border">
            <h3 className="font-semibold text-lg text-navy mb-4">State Risk Statistics</h3>
            <div className="mb-4 text-sm text-muted-foreground">
              Distribution of investigation risk across states. High-risk areas require immediate attention.
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-secondary/50 border-b border-border font-medium">
                    <tr>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">Risk Level</th>
                      <th className="px-4 py-3">High-Risk Works</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {states?.slice(0, 8).map((s: any) => (
                      <tr key={s.state} className="hover:bg-secondary/50 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-medium">{s.state}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${s.risk_level === 'High' ? 'text-danger' : s.risk_level === 'Medium' ? 'text-warning' : 'text-success'}`}>
                            {s.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-3">{s.high_risk_works}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
