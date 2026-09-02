import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Filter } from "lucide-react";
import { PageHeader } from "@/components/mplads/PageHeader";
import { Button } from "@/components/ui/button";
import { REPORTS } from "@/lib/mplads-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [{ title: "Reports & Exports — MPLADS AI Monitor" }],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Exports"
        subtitle="Download official summary reports, financial utilisation statements, and compliance audits."
        actions={
          <Button variant="outline" size="sm">
            <Filter className="size-4 mr-2" /> Filter Reports
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <div key={report.key} className="card-surface p-5 flex flex-col h-full">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{report.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{report.blurb}</p>
              </div>
            </div>
            <div className="mt-auto pt-5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PDF, CSV Format</span>
              <Button size="sm" variant="secondary">
                <Download className="size-4 mr-1.5" /> Export
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
