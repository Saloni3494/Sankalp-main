import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [{ title: "Analytics — MPLADS AI Monitor" }],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Advanced data visualizations and implementation metrics."
      />
      <div className="mt-8">
        <h2 className="text-xl font-serif font-semibold text-navy mb-4">India Risk Heatmap</h2>
        <div className="card-surface p-6">
          <div className="mb-4 text-sm text-muted-foreground">
            Distribution of investigation risk across states. High-risk areas require immediate attention.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 border-b border-border font-medium">
                <tr>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">High-Risk Works</th>
                  <th className="px-4 py-3">Open Investigations</th>
                  <th className="px-4 py-3">Delayed Works</th>
                  <th className="px-4 py-3">Main Risk Reasons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-secondary/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium">Maharashtra</td>
                  <td className="px-4 py-3"><span className="text-danger font-bold">High</span></td>
                  <td className="px-4 py-3">45</td>
                  <td className="px-4 py-3">12</td>
                  <td className="px-4 py-3">18</td>
                  <td className="px-4 py-3">Payment anomalies, Peer deviation</td>
                </tr>
                <tr className="hover:bg-secondary/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium">Uttar Pradesh</td>
                  <td className="px-4 py-3"><span className="text-warning font-bold">Medium</span></td>
                  <td className="px-4 py-3">28</td>
                  <td className="px-4 py-3">5</td>
                  <td className="px-4 py-3">34</td>
                  <td className="px-4 py-3">Lifecycle delays, Compliance alerts</td>
                </tr>
                <tr className="hover:bg-secondary/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium">Karnataka</td>
                  <td className="px-4 py-3"><span className="text-danger font-bold">High</span></td>
                  <td className="px-4 py-3">39</td>
                  <td className="px-4 py-3">8</td>
                  <td className="px-4 py-3">12</td>
                  <td className="px-4 py-3">Potentially similar works, Payment anomalies</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
