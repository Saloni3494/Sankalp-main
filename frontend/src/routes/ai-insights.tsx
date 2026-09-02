import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";

export const Route = createFileRoute("/ai-insights")({
  head: () => ({
    meta: [{ title: "AI Insights — MPLADS AI Monitor" }],
  }),
  component: AiInsightsPage,
});

function AiInsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        subtitle="Machine learning driven insights for proactive decision making."
      />
      <div className="card-surface p-8 text-center text-muted-foreground">
        Detailed AI-generated insights and recommendations will appear here.
      </div>
    </div>
  );
}
