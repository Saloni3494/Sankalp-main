import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Building2,
  Mail,
  MapPin,
  Key,
  Shield,
  Clock,
  LogOut,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  UserCheck,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/mplads/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth-context";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Official Profile & Credentials — MPLADS AI Monitor" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, logout, quickDemoLogin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const roleColor =
    user?.role === "mospi_auditor"
      ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
      : user?.role === "state_nodal_authority"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
      : user?.role === "mp_representative"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Profile & Credentials"
        subtitle="Verified Government of India identity and role access clearances for MPLADS Sentinel."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Officer Government ID Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-panel lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-widest text-primary uppercase">
                  भारत सरकार • Government of India
                </p>
                <p className="text-xs text-muted-foreground">Ministry of Statistics & Programme Implementation</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleColor}`}>
                <ShieldCheck className="size-3.5" />
                <span>{user?.role_title || "District Authority"}</span>
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                → {user?.assigned_scope || "Assigned District"}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-navy-soft to-primary/10 border-2 border-primary/30 text-2xl font-black text-primary shadow-inner">
              {user?.avatar_initials || "GOI"}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">{user?.name || "Official User"}</h3>
                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  ID: GOI-MPLADS-2026-0{user?.id || 1}
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{user?.designation || "Nodal Officer"}</p>
              <p className="text-xs text-muted-foreground/80">{user?.department || "MoSPI Monitoring Division"}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-3 text-xs">
              <Mail className="size-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-muted-foreground">Official Email</span>
                <span className="block font-mono font-medium text-foreground truncate">{user?.email || "officer@mplads.gov.in"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-3 text-xs">
              <MapPin className="size-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-muted-foreground">Jurisdiction / Constituency</span>
                <span className="block font-medium text-foreground truncate">{user?.jurisdiction || "All India"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-3 text-xs">
              <Key className="size-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-muted-foreground">Session Token</span>
                <span className="block font-mono text-[11px] text-muted-foreground truncate">
                  {token ? `${token.substring(0, 16)}...` : "Active Local Session"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-3 text-xs">
              <Clock className="size-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-muted-foreground">Gateway Protocol</span>
                <span className="block font-medium text-foreground">TLS 1.3 • NIC Net Authorized</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5 text-emerald-500" />
              <span>Security Clearance Level 2 (Confidential)</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs"
            >
              <LogOut className="size-3.5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>

        {/* Access Rights & Clearances */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-panel">
            <h4 className="text-sm font-bold text-foreground">Clearances & Audit Rights</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Security permissions granted for role: <span className="font-semibold">{user?.role_title || user?.role}</span>
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/20 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Work Recommendation Review</span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Granted</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/20 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Expenditure & Anomaly Sentinel</span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Full Access</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/20 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Audit Time Machine & Vendor Network</span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Unlocked</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/20 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Automated MoSPI Compliance Reports</span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Certified</span>
              </div>
            </div>
          </div>

          {/* Quick Switch Persona */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-panel">
            <h4 className="text-sm font-bold text-foreground">Switch Evaluation Role</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Instantly toggle account persona to review different privilege levels:
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={async () => {
                    await quickDemoLogin(acc);
                  }}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left text-xs transition-all ${
                    user?.username === acc.username
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-secondary"
                  }`}
                >
                  <span className="font-semibold text-foreground truncate w-full">{acc.role_title}</span>
                  <span className="text-[10px] font-semibold text-primary/90 truncate w-full">→ {acc.assigned_scope}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
