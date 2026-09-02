import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  ShieldAlert,
  Sparkles,
  Bell,
  ClipboardCheck,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoWordmark } from "./Logo";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/fund-utilization", label: "Fund Utilization", icon: Wallet },
  { to: "/risk", label: "Risk & Anomalies", icon: ShieldAlert },
  { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/compliance", label: "Compliance", icon: ClipboardCheck },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
] as const;

const FOOTER_NAV = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
] as const;

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const item = (to: string, label: string, Icon: typeof LayoutDashboard) => {
    const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
    return (
      <Link
        key={to}
        to={to}
        title={collapsed ? label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        {active && (
          <span className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} strokeWidth={1.8} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[254px]",
      )}
    >
      <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-2")}>
        <Link to="/" className="min-w-0">
          <LogoWordmark collapsed={collapsed} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {!collapsed && (
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Monitoring
          </p>
        )}
        {NAV.map((n) => item(n.to, n.label, n.icon))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border px-3 py-3">
        {FOOTER_NAV.map((n) => item(n.to, n.label, n.icon))}
        <Link
          to="/profile"
          className={cn(
            "mt-1 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-soft text-xs font-semibold text-navy">
            SR
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium text-foreground">S. Ranganathan</span>
              <span className="block truncate text-[11px] text-muted-foreground">Nodal Officer, MPLADS</span>
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" strokeWidth={1.8} />
          ) : (
            <>
              <PanelLeftClose className="size-[18px]" strokeWidth={1.8} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export const NAV_ITEMS = NAV;
