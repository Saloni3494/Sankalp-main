import { useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Check, Menu, Search, ChevronRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DISTRICTS,
  FINANCIAL_YEARS,
  NOTIFICATIONS,
  PROJECTS,
  STATES,
} from "@/lib/mplads-data";
import { useFilters } from "@/lib/filters";
import { riskColor } from "./badges";
import { cn } from "@/lib/utils";
import { VoiceAssistant } from "./VoiceAssistant";
import { GoogleTranslate } from "./GoogleTranslate";

const TITLES: Record<string, { title: string; crumb: string }> = {
  "/": { title: "Dashboard", crumb: "MPLADS Overview" },
  "/projects": { title: "Projects", crumb: "Project Monitoring" },
  "/fund-utilization": { title: "Fund Utilization", crumb: "Release & Expenditure" },
  "/risk": { title: "Risk & Anomalies", crumb: "AI Risk Detection" },
  "/ai-insights": { title: "AI Insights", crumb: "Generated Insights" },
  "/alerts": { title: "Alerts", crumb: "Alert Center" },
  "/compliance": { title: "Compliance", crumb: "Compliance Monitoring" },
  "/analytics": { title: "Analytics", crumb: "Trends & Comparison" },
  "/reports": { title: "Reports", crumb: "Reports & Export" },
  "/settings": { title: "Settings", crumb: "Preferences" },
  "/help": { title: "Help", crumb: "Guidance" },
  "/profile": { title: "User Profile", crumb: "Account" },
};

export function TopHeader({ onMenu }: { onMenu: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { filters, setFilter, reset, activeCount } = useFilters();
  const [query, setQuery] = useState("");
  const [read, setRead] = useState(false);

  const page = TITLES[pathname] ?? (pathname.startsWith("/projects/")
    ? { title: "Project Details", crumb: "Projects" }
    : { title: "MPLADS AI Monitor", crumb: "Overview" });

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return PROJECTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  const districts =
    filters.state !== "All States" ? (DISTRICTS[filters.state] ?? ["District 1", "District 2"]) : [];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-foreground">{page.title}</h2>
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="size-3" />
            <span>{page.crumb}</span>
          </nav>
        </div>

        <div className="relative order-last w-full sm:order-none sm:w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, districts…"
            className="h-9 bg-secondary pl-9"
            aria-label="Global search"
          />
          {results.length > 0 && (
            <div className="absolute top-11 left-0 z-40 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-panel">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setQuery("");
                    navigate({ to: "/projects/$projectId", params: { projectId: r.id } });
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {r.id} · {r.district}, {r.state}
                    </span>
                  </span>
                  <span className="text-[11px]" style={{ color: riskColor(r.risk) }}>
                    {r.risk}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <VoiceAssistant />
        <GoogleTranslate />

        <div className="hidden items-center gap-2 rounded-full border border-india-green/25 bg-india-green-soft px-3 py-1.5 md:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-india-green opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-india-green" />
          </span>
          <span className="text-xs font-medium text-india-green">AI Monitoring Active</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-[18px]" strokeWidth={1.8} />
              {!read && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-card" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              <button
                onClick={() => setRead(true)}
                className="inline-flex items-center gap-1 text-[11px] text-navy hover:underline"
              >
                <Check className="size-3" /> Mark all as read
              </button>
            </div>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link to="/alerts" className="flex cursor-pointer items-start gap-2.5 py-2">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: riskColor(n.level) }}
                  />
                  <span className="min-w-0">
                    <span className={cn("block text-sm", read ? "font-normal" : "font-medium")}>{n.text}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {n.detail} · {n.time}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/alerts" className="cursor-pointer justify-center text-sm text-navy">
                Open Alert Center
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex size-9 items-center justify-center rounded-full bg-navy-soft text-xs font-semibold text-navy">
              SR
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm">S. Ranganathan</span>
              <span className="block text-[11px] font-normal text-muted-foreground">
                Nodal Officer, MPLADS Division
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">User Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help">Help & Guidance</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-secondary/50 px-4 py-2.5 lg:px-6">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          <Activity className="size-3.5" /> Filters
        </span>

        <FilterSelect
          label="Financial Year"
          value={filters.fy}
          options={FINANCIAL_YEARS}
          onChange={(v) => setFilter("fy", v)}
          highlight
        />
        <FilterSelect
          label="State"
          value={filters.state}
          options={["All States", ...STATES.map((s) => s.name)]}
          onChange={(v) => {
            setFilter("state", v);
            setFilter("district", "All Districts");
          }}
        />
        <FilterSelect
          label="District"
          value={filters.district}
          options={["All Districts", ...districts]}
          onChange={(v) => setFilter("district", v)}
        />
        <FilterSelect
          label="Constituency"
          value={filters.constituency}
          options={["All Constituencies", ...new Set(PROJECTS.map((p) => p.constituency))]}
          onChange={(v) => setFilter("constituency", v)}
        />
        <FilterSelect
          label="MP"
          value={filters.mp}
          options={["All MPs", ...new Set(PROJECTS.map((p) => p.mp))]}
          onChange={(v) => setFilter("mp", v)}
        />
        <FilterSelect
          label="Project Status"
          value={filters.status}
          options={["All Statuses", "Ongoing", "Completed", "Delayed", "Cancelled"]}
          onChange={(v) => setFilter("status", v)}
        />

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-navy" onClick={reset}>
            Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
          </Button>
        )}
      </div>
      <div className="tricolour-rule h-[3px] w-full" />
    </header>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  highlight,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  highlight?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-8 w-auto min-w-[8.5rem] gap-1.5 border-border bg-card text-xs shadow-none",
          highlight && "border-primary/35 bg-primary-soft text-foreground",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-xs">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
