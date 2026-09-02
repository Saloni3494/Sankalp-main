import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [{ title: "Help & Support — MPLADS AI Monitor" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        subtitle="Find documentation, FAQs, and contact support."
      />
      <div className="card-surface p-8 text-center text-muted-foreground">
        Support documentation and contact forms will appear here.
      </div>
    </div>
  );
}
