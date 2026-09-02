import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/mplads/PageHeader";
import { RiskBadge, StatusBadge } from "@/components/mplads/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECTS, formatL, type Project } from "@/lib/mplads-data";
import { useFilters } from "@/lib/filters";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Project Monitoring — MPLADS AI Monitor" },
      {
        name: "description",
        content:
          "Search, sort and filter sanctioned MPLADS works by state, district, sanctioned amount, progress, risk level and implementation status.",
      },
      { property: "og:title", content: "Project Monitoring — MPLADS AI Monitor" },
      {
        property: "og:description",
        content: "Track every sanctioned MPLADS work with progress, expenditure and AI risk flags.",
      },
    ],
  }),
  component: ProjectsPage,
});

type SortKey = "id" | "sanctionedL" | "spentL" | "progress" | "riskScore";
const PAGE_SIZE = 8;

function ProjectsPage() {
  const { filters } = useFilters();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("All Risk Levels");
  const [sort, setSort] = useState<SortKey>("id");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(0);

  const list = useMemo(() => {
    let l = [...PROJECTS];
    if (filters.state !== "All States") l = l.filter((p) => p.state === filters.state);
    if (filters.district !== "All Districts") l = l.filter((p) => p.district === filters.district);
    if (filters.constituency !== "All Constituencies") l = l.filter((p) => p.constituency === filters.constituency);
    if (filters.mp !== "All MPs") l = l.filter((p) => p.mp === filters.mp);
    if (filters.status !== "All Statuses") l = l.filter((p) => p.status === filters.status);
    if (risk !== "All Risk Levels") l = l.filter((p) => p.risk === risk);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.id.toLowerCase().includes(s) ||
          p.district.toLowerCase().includes(s) ||
          p.state.toLowerCase().includes(s),
      );
    }
    l.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      const r = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return asc ? r : -r;
    });
    return l;
  }, [filters, q, risk, sort, asc]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = list.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const th = (label: string, key?: SortKey, className = "") => (
    <th className={`px-3 py-3 font-medium ${className}`}>
      {key ? (
        <button
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={() => {
            if (sort === key) setAsc((a) => !a);
            else {
              setSort(key);
              setAsc(true);
            }
          }}
        >
          {label}
          <ArrowUpDown className={`size-3 ${sort === key ? "text-primary" : "opacity-50"}`} />
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Monitoring"
        subtitle="All sanctioned works under the current filters, with progress, expenditure and AI risk flags."
      />

      <div className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3.5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search by project, ID or district…"
              className="h-9 bg-secondary pl-9"
            />
          </div>
          <Select value={risk} onValueChange={(v) => setRisk(v)}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SlidersHorizontal className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All Risk Levels", "Low", "Medium", "High"].map((o) => (
                <SelectItem key={o} value={o} className="text-xs">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{list.length} works</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs text-muted-foreground">
                {th("Project ID", "id", "pl-5")}
                {th("Project")}
                {th("State")}
                {th("District")}
                {th("Sanctioned", "sanctionedL")}
                {th("Spent", "spentL")}
                {th("Progress", "progress")}
                {th("Risk", "riskScore")}
                {th("Status", undefined, "pr-5")}
              </tr>
            </thead>
            <tbody>
              {rows.map((p: Project) => (
                <tr
                  key={p.id}
                  onClick={() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } })}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-3 py-3 pl-5 font-mono text-xs">{p.id}</td>
                  <td className="px-3 py-3 font-medium">{p.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.state}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.district}</td>
                  <td className="px-3 py-3">{formatL(p.sanctionedL)}</td>
                  <td className="px-3 py-3">{formatL(p.spentL)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <RiskBadge level={p.risk} />
                  </td>
                  <td className="px-3 py-3 pr-5">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No projects match the current search and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Page {current + 1} of {pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
