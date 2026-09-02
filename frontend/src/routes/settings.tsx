import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — MPLADS AI Monitor" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your platform preferences and notification settings."
      />
      <div className="mb-6 rounded-lg border border-border bg-card p-6 border-t-4 border-t-[#C94F22] text-left">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-lg font-medium text-navy">Offline / Local Mode</h3>
                  <p className="text-sm text-muted-foreground">System Health: Platform is operating locally and can function without internet connectivity.</p>
              </div>
              <span className="px-3 py-1 bg-secondary text-foreground rounded font-mono text-sm border border-border">
                  OFFLINE_READY
              </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                  <div className="text-sm text-muted-foreground">Mode</div>
                  <div className="text-sm font-medium">Offline / Local</div>
              </div>
              <div>
                  <div className="text-sm text-muted-foreground">API Connection</div>
                  <div className="text-sm font-medium text-india-green flex items-center gap-1">● Connected</div>
              </div>
              <div>
                  <div className="text-sm text-muted-foreground">Database</div>
                  <div className="text-sm font-medium text-india-green flex items-center gap-1">● Connected</div>
              </div>
              <div>
                  <div className="text-sm text-muted-foreground">ML Engine</div>
                  <div className="text-sm font-medium text-india-green flex items-center gap-1">● Available</div>
              </div>
              <div>
                  <div className="text-sm text-muted-foreground">Last Data Sync</div>
                  <div className="text-sm font-medium text-navy">Today, 04:00 AM</div>
              </div>
          </div>
      </div>
      <div className="card-surface p-8 text-center text-muted-foreground">
        Other platform settings configuration options will appear here.
      </div>
    </div>
  );
}
