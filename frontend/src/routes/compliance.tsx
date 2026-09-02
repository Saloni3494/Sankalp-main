import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [{ title: "Compliance — MPLADS AI Monitor" }],
  }),
  component: CompliancePage,
});

function CompliancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        subtitle="Track documentation, financial, and timeline compliance across projects."
      />
      <div className="card-surface p-8 text-center text-muted-foreground">
        Compliance tracking and audit logs will appear here.
      </div>
    </div>
  );
}
