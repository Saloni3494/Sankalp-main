import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const API_BASE = "http://localhost:8000";
const API_KEY = "sankalp-admin-key";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sankalp_auth_token");
}

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
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

export async function loginAPI(credentials: { username_or_email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    let err = "Authentication failed";
    try {
      const data = await res.json();
      if (data.detail) err = data.detail;
    } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function getMeAPI(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-API-Key": API_KEY,
    },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function getDemoUsersAPI() {
  const res = await fetch(`${API_BASE}/auth/demo-users`, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) throw new Error("Failed to load demo accounts");
  return res.json();
}

export async function logoutAPI(token?: string | null) {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-API-Key": API_KEY,
      },
    });
  } catch {}
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

export function useWorkInvestigation(workId: string) {
  return useQuery({
    queryKey: ["work", workId, "investigate"],
    queryFn: () => fetchAPI(`/works/${encodeURIComponent(workId)}/investigate`),
    enabled: !!workId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to avoid re-calling LLM
    retry: 1,
  });
}

export async function updateInvestigationStatusAPI(workId: string, status: string, outcome: string) {
  return fetchAPI(`/investigations/${encodeURIComponent(workId)}/review`, {
    method: "POST",
    body: JSON.stringify({ status, outcome }),
  });
}

export function useAnalyticsStates() {
  return useQuery({
    queryKey: ["analytics", "states"],
    queryFn: () => fetchAPI("/analytics/states"),
  });
}

export function useAnalyticsFunds(house?: string) {
  return useQuery({
    queryKey: ["analytics", "funds", house],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (house && house !== "All Houses") searchParams.set("house", house);
      return fetchAPI(`/analytics/funds?${searchParams.toString()}`);
    }
  });
}

export function useAnalyticsInsights(house?: string) {
  return useQuery({
    queryKey: ["analytics", "insights", house],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (house && house !== "All Houses") searchParams.set("house", house);
      return fetchAPI(`/analytics/insights?${searchParams.toString()}`);
    }
  });
}

export function useAnalyticsCompliance(house?: string) {
  return useQuery({
    queryKey: ["analytics", "compliance", house],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (house && house !== "All Houses") searchParams.set("house", house);
      return fetchAPI(`/analytics/compliance?${searchParams.toString()}`);
    }
  });
}

export function useAnalyticsDashboard(house?: string) {
  return useQuery({
    queryKey: ["analytics", "dashboard", house],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (house && house !== "All Houses") searchParams.set("house", house);
      return fetchAPI(`/analytics/dashboard?${searchParams.toString()}`);
    }
  });
}

export function useAnalyticsStateSummary(stateName: string, house?: string) {
  return useQuery({
    queryKey: ["analytics", "state_summary", stateName, house],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (house && house !== "All Houses") searchParams.set("house", house);
      return fetchAPI(`/analytics/states/${encodeURIComponent(stateName)}?${searchParams.toString()}`);
    },
    enabled: !!stateName
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

export interface CertificatePayload {
  certificate_id: string;
  block_number: number;
  certificate_hash: string;
  merkle_root: string;
  previous_block_hash: string;
  tamper_evident: boolean;
  project_details: {
    work_id: string;
    work_category: string;
    parliament_house: string;
    state: string;
    district: string;
    constituency: string;
    mp_name: string;
    work_description: string;
    scheme_title: string;
    issuing_authority: string;
  };
  financial_ledger: {
    sanction_amount: number;
    sanction_amount_formatted: string;
    amount_disbursed: number;
    amount_disbursed_formatted: string;
    unspent_balance: number;
    unspent_balance_formatted: string;
    utilization_rate: number;
    financial_status: string;
  };
  timeline: {
    recommended_date: string | null;
    sanction_date: string | null;
    execution_date: string | null;
    completion_date: string | null;
    lifecycle_coverage: string;
    stages: Array<{
      stage: string;
      date: string;
      status: string;
    }>;
  };
  implementing_agency: {
    agency_name: string;
    jurisdiction: string;
    primary_vendor: string;
    vendor_count: number;
    payment_count: number;
    vendors: Array<{
      vendor_name: string;
      total_disbursed: number;
      total_disbursed_formatted: string;
      verification_status: string;
    }>;
  };
  document_verification: {
    missing_photo: boolean;
    photo_status: string;
    ocr_status: string;
    data_completeness_pct: number;
    ocr_checks: Array<{
      check: string;
      status: string;
      confidence: string;
    }>;
  };
  ai_risk_audit: {
    risk_score: number;
    risk_tier: string;
    evidence_strength: string;
    evidence_count: number;
    anomalies: string[];
  };
  investigation_audit: {
    investigation_status: string;
    investigation_outcome: string;
    audit_conclusion: string;
    audit_seal: string;
  };
  officer_approval: {
    approved_by: string;
    officer_role: string;
    designation: string;
    jurisdiction: string;
    department: string;
    digital_thumbprint: string;
    signature_algorithm: string;
    approval_date: string;
    seal_type: string;
  };
  blockchain_proof: {
    certificate_id: string;
    block_number: number;
    certificate_hash: string;
    previous_block_hash: string;
    merkle_root: string;
    ledger_name: string;
    network_consensus: string;
    timestamp_iso: string;
    tamper_evident: boolean;
    verification_endpoint: string;
  };
}

export interface CertificateVerifyResult {
  valid: boolean;
  tamper_evident: boolean;
  computed_hash: string;
  submitted_hash: string;
  integrity_score: number;
  message: string;
  block_number: number;
  verified_at: string;
}

export function useWorkCertificate(workId?: string) {
  return useQuery<CertificatePayload>({
    queryKey: ["certificate", workId],
    queryFn: () => fetchAPI(`/certificate?work_id=${encodeURIComponent(workId || "")}`),
    enabled: !!workId,
  });
}

export async function verifyCertificateAPI(workId: string, certificateHash: string): Promise<CertificateVerifyResult> {
  return fetchAPI("/certificate/verify", {
    method: "POST",
    body: JSON.stringify({
      work_id: workId,
      certificate_hash: certificateHash,
    }),
  });
}

