import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";

export const Route = createFileRoute("/fund-utilization")({
  head: () => ({
    meta: [{ title: "Fund Utilization — MPLADS AI Monitor" }],
  }),
  component: FundUtilizationPage,
});

function FundUtilizationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund Utilization"
        subtitle="Detailed analysis of funds sanctioned, released, and spent across constituencies."
      />
      <div className="card-surface p-8 text-center text-muted-foreground">
        Fund Utilization data visualizations and details will appear here.
      </div>
    </div>
  );
}
