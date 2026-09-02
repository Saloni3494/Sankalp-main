import { createContext, useContext, useMemo, useState } from "react";
import { FINANCIAL_YEARS } from "./mplads-data";

export type Filters = {
  fy: string;
  state: string;
  district: string;
  constituency: string;
  mp: string;
  status: string;
};

const DEFAULT: Filters = {
  fy: FINANCIAL_YEARS[0] as string,
  state: "All States",
  district: "All Districts",
  constituency: "All Constituencies",
  mp: "All MPs",
  status: "All Statuses",
};

type Ctx = {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
  reset: () => void;
  activeCount: number;
};

const FilterContext = createContext<Ctx | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT);

  const value = useMemo<Ctx>(
    () => ({
      filters,
      setFilter: (key, v) => setFilters((f) => ({ ...f, [key]: v })),
      reset: () => setFilters(DEFAULT),
      activeCount: (Object.keys(DEFAULT) as (keyof Filters)[]).filter(
        (k) => k !== "fy" && filters[k] !== DEFAULT[k],
      ).length,
    }),
    [filters],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}

/** Scales a headline number by the active filters so screens react to changes. */
export function scaleByFilters(base: number, filters: Filters) {
  let n = base;
  if (filters.state !== DEFAULT.state) n *= 0.16;
  if (filters.district !== DEFAULT.district) n *= 0.34;
  if (filters.constituency !== DEFAULT.constituency) n *= 0.55;
  if (filters.mp !== DEFAULT.mp) n *= 0.72;
  if (filters.status !== DEFAULT.status) n *= 0.48;
  if (filters.fy === "2024–25") n *= 0.92;
  if (filters.fy === "2023–24") n *= 0.84;
  return Math.max(1, Math.round(n));
}

export const FILTER_DEFAULTS = DEFAULT;
