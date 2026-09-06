import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "http://localhost:8000";
const API_KEY = "sankalp-admin-key";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let err = "Network response was not ok";
    try {
      const data = await res.json();
      if (data.detail) err = data.detail;
    } catch (e) {}
    throw new Error(err);
  }
  return res.json();
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: () => fetchAPI("/summary"),
  });
}

export interface UseWorksParams {
  limit?: number;
  offset?: number;
  min_risk?: number;
  house?: string;
  state?: string;
  flagged_only?: boolean;
  sort_by?: string;
  asc?: boolean;
}

export function useWorks(params: UseWorksParams = {}) {
  return useQuery({
    queryKey: ["works", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.offset) searchParams.set("offset", params.offset.toString());
      if (params.min_risk !== undefined) searchParams.set("min_risk", params.min_risk.toString());
      if (params.house && params.house !== "All Houses") searchParams.set("house", params.house);
      if (params.state && params.state !== "All States") searchParams.set("state", params.state);
      if (params.flagged_only) searchParams.set("flagged_only", "true");
      if (params.sort_by) searchParams.set("sort_by", params.sort_by);
      if (params.asc !== undefined) searchParams.set("asc", params.asc.toString());
      return fetchAPI(`/works?${searchParams.toString()}`);
    },
  });
}

export function useWorkDetails(workId: string) {
  return useQuery({
    queryKey: ["work", workId],
    queryFn: () => fetchAPI(`/works/${encodeURIComponent(workId)}`),
    enabled: !!workId,
  });
}

export function useWorkLifecycle(workId: string) {
  return useQuery({
    queryKey: ["work", workId, "lifecycle"],
    queryFn: () => fetchAPI(`/works/${encodeURIComponent(workId)}/lifecycle`),
    enabled: !!workId,
  });
}

export function useWorkPayments(workId: string) {
  return useQuery({
    queryKey: ["work", workId, "payments"],
    queryFn: () => fetchAPI(`/works/${encodeURIComponent(workId)}/payments`),
    enabled: !!workId,
  });
}

export function useWorkVendors(workId: string) {
  return useQuery({
    queryKey: ["work", workId, "vendors"],
    queryFn: () => fetchAPI(`/works/${encodeURIComponent(workId)}/vendors`),
    enabled: !!workId,
  });
}

export function useWorkEvidence(workId: string) {
  return useQuery({
    queryKey: ["work", workId, "evidence"],
    queryFn: () => fetchAPI(`/works/${encodeURIComponent(workId)}/evidence`),
    enabled: !!workId,
  });
}

export function useAnalyticsStates() {
  return useQuery({
    queryKey: ["analytics", "states"],
    queryFn: () => fetchAPI("/analytics/states"),
  });
}

export function useReviewWork(workId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; outcome?: string }) =>
      fetchAPI(`/investigations/${workId}/review`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work", workId] });
      queryClient.invalidateQueries({ queryKey: ["works"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useRunPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchAPI("/pipeline/run", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["works"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
}
