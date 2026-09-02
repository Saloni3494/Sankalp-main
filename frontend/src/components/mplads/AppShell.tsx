import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { FilterProvider } from "@/lib/filters";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <FilterProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop / tablet sidebar */}
        <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        </div>

        {/* Mobile / small-tablet drawer */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "" : "pointer-events-none")}>
          <div
            className={cn(
              "absolute inset-0 bg-foreground/25 transition-opacity",
              mobileOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 h-full shadow-panel transition-transform duration-200",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 lg:px-6">
            <Outlet />
          </main>
          <footer className="border-t border-border bg-card px-4 py-4 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <p>MPLADS AI Monitor | Ministry / Government Monitoring Platform</p>
              <p>Financial data shown is indicative sample data for demonstration.</p>
            </div>
          </footer>
        </div>
      </div>
    </FilterProvider>
  );
}
