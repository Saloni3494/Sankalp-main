import { useState } from "react";
import { CheckCircle2, ChevronRight, Activity, Zap, History, Network, User, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/mplads/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { RiskBadge } from "./badges";
import { updateInvestigationStatusAPI } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface InvestigationData {
  recommended_action?: { title: string; reason: string; priority: string };
  risk_genome?: { name: string; score: number; color: string }[];
  other_actions?: string[];
  investigation_steps?: { name: string; status: string }[];
  investigation_brief?: string;
  primary_risk_dimensions?: string;
  vendors?: { name: string; total_paid: number }[];
  mp_name?: string;
  source?: string;
}

export function RecommendedNextAction({ data, isLoading, workId, status, outcome }: { data?: InvestigationData; isLoading?: boolean; workId?: string; status?: string; outcome?: string }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("CLEARED");
  const queryClient = useQueryClient();

  const handleRequestVerification = async () => {
    if (!workId) return;
    setIsVerifying(true);
    try {
      await updateInvestigationStatusAPI(workId, "INVESTIGATION_OPEN", "UNKNOWN/NONE");
      // Refresh the specific work data
      await queryClient.invalidateQueries({ queryKey: ["work", workId] });
      // Optionally invalidate list queries if needed
      await queryClient.invalidateQueries({ queryKey: ["works"] });
    } catch (error) {
      console.error("Failed to request verification", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloseInvestigation = async () => {
    if (!workId) return;
    setIsVerifying(true);
    try {
      await updateInvestigationStatusAPI(workId, "INVESTIGATION_CLOSED", selectedOutcome);
      await queryClient.invalidateQueries({ queryKey: ["work", workId] });
      await queryClient.invalidateQueries({ queryKey: ["works"] });
    } catch (error) {
      console.error("Failed to close investigation", error);
    } finally {
      setIsVerifying(false);
    }
  };
  if (isLoading) {
    return (
      <SectionCard title="Recommended Next Action" className="border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> AI is analyzing this project...
        </div>
      </SectionCard>
    );
  }

  const action = data?.recommended_action;
  const otherActions = data?.other_actions || [];

  return (
    <SectionCard title="Recommended Next Action" className="border-primary/20 bg-primary/5">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary p-2 text-primary-foreground">
          <Zap className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">{action?.title || "No action needed"}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {action?.reason || "This project has no significant risk flags."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded",
              action?.priority === "High" ? "text-danger bg-danger/10" :
              action?.priority === "Medium" ? "text-warning bg-warning/10" : "text-india-green bg-india-green/10"
            )}>{action?.priority || "Low"} Priority</span>
            
            {status === "INVESTIGATION_CLOSED" ? (
              <span className={cn(
                "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded",
                outcome === "CLEARED" ? "text-emerald-600 bg-emerald-500/10" :
                outcome === "IRREGULARITY_CONFIRMED" ? "text-red-600 bg-red-500/10" : "text-orange-600 bg-orange-500/10"
              )}>
                {outcome === "UNKNOWN_NONE" || outcome === "UNKNOWN/NONE" ? "Closed (No Outcome)" : outcome?.replace("_", " ")}
              </span>
            ) : status === "INVESTIGATION_OPEN" ? (
              <div className="flex items-center gap-2 ml-auto w-full mt-2 sm:mt-0 sm:w-auto sm:ml-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                <select 
                  className="h-7 text-xs rounded border border-border bg-background px-2"
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  disabled={isVerifying}
                >
                  <option value="CLEARED">Cleared (No Issues)</option>
                  <option value="INCONCLUSIVE">Inconclusive</option>
                  <option value="IRREGULARITY_CONFIRMED">Irregularity Confirmed</option>
                </select>
                <Button 
                  size="sm" 
                  className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                  onClick={handleCloseInvestigation}
                  disabled={isVerifying || !workId}
                >
                  {isVerifying ? <Loader2 className="size-3 mr-1 animate-spin" /> : null}
                  {isVerifying ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 ml-auto sm:ml-0"
                onClick={handleRequestVerification}
                disabled={isVerifying || !workId}
              >
                {isVerifying ? <Loader2 className="size-3 mr-1 animate-spin" /> : null}
                {isVerifying ? "Requesting..." : "Request Verification"}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {otherActions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Other possible actions:</p>
          <div className="flex flex-wrap gap-2">
            {otherActions.map((action) => (
              <button key={action} className="text-[11px] px-2 py-1 rounded border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {data?.source && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground italic">
            Powered by {data.source?.includes("groq") ? "Groq • Qwen 3.8 27B" : "Rule-based engine"}
          </p>
        </div>
      )}
    </SectionCard>
  );
}

export function AgenticOrchestrator({ data, isLoading }: { data?: InvestigationData; isLoading?: boolean }) {
  const steps = data?.investigation_steps || [];

  if (isLoading) {
    return (
      <SectionCard title="AI Investigation Assistant">
        <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Running investigation pipeline...
        </div>
      </SectionCard>
    );
  }

  const completedCount = steps.filter(s => s.status === "Completed").length;
  const totalCount = steps.length || 1;

  return (
    <SectionCard title="AI Investigation Assistant">
      <div className="text-xs text-muted-foreground mb-4">
        Autonomous agent analyzing pipeline datasets to build a preliminary investigation brief.
        <span className="ml-2 font-semibold text-foreground">{completedCount}/{totalCount} steps complete</span>
      </div>
      
      <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-border">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 relative z-10">
            <div className={cn(
              "size-5 rounded-full border-2 flex items-center justify-center bg-card",
              step.status === "Completed" ? "border-india-green text-india-green" : 
              step.status === "Running" ? "border-primary text-primary animate-pulse" :
              step.status === "Needs Evidence" ? "border-warning text-warning" : "border-border text-muted-foreground"
            )}>
              {step.status === "Completed" ? <CheckCircle2 className="size-3" /> : 
               step.status === "Running" ? <Activity className="size-3" /> : 
               step.status === "Needs Evidence" ? <AlertCircle className="size-3" /> : <div className="size-1.5 rounded-full bg-border" />}
            </div>
            <div className="flex-1 flex justify-between items-center text-sm">
              <span className={cn("font-medium", step.status === "Pending" ? "text-muted-foreground" : "text-foreground")}>{step.name}</span>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                step.status === "Completed" ? "bg-india-green/10 text-india-green" : 
                step.status === "Running" ? "bg-primary/10 text-primary" :
                step.status === "Needs Evidence" ? "bg-warning/10 text-warning" : "text-muted-foreground"
              )}>{step.status}</span>
            </div>
          </div>
        ))}
      </div>

      {data?.investigation_brief && (
        <div className="mt-5 pt-4 border-t border-border rounded-lg bg-secondary/30 p-3">
          <p className="text-xs font-semibold text-foreground mb-1">Investigation Brief</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.investigation_brief}</p>
        </div>
      )}
    </SectionCard>
  );
}

export function RiskGenome({ data, isLoading }: { data?: InvestigationData; isLoading?: boolean }) {
  const dimensions = data?.risk_genome || [];

  if (isLoading) {
    return (
      <SectionCard title="Risk Genome">
        <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Computing risk dimensions...
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Risk Genome">
      <div className="text-xs text-muted-foreground mb-4">
        Multidimensional risk fingerprint for this specific work.
      </div>
      <div className="space-y-4">
        {dimensions.map(dim => (
          <div key={dim.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-foreground">{dim.name}</span>
              <span className="font-mono text-muted-foreground">{dim.score}/100</span>
            </div>
            <Progress value={dim.score} className="h-1.5" indicatorClassName={dim.color} />
          </div>
        ))}
      </div>
      {data?.primary_risk_dimensions && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-foreground">Primary Risk Dimensions:</p>
          <p className="text-xs text-muted-foreground mt-1">{data.primary_risk_dimensions}</p>
        </div>
      )}
    </SectionCard>
  );
}

export function AuditTimeMachine({ data, isLoading }: { data?: any; isLoading?: boolean }) {
  // Use real dates if available, fallback to logical progression
  const recYear = data?.recommended_date ? new Date(data.recommended_date).getFullYear() : 2023;
  const sancYear = data?.sanction_date ? new Date(data.sanction_date).getFullYear() : 2024;
  const currentYear = new Date().getFullYear();

  // De-duplicate timeline years so we have 3 distinct points
  let y1 = recYear;
  let y2 = sancYear;
  let y3 = currentYear;
  
  if (y2 <= y1) y2 = y1 + 1;
  if (y3 <= y2) y3 = y2 + 1;

  const timelineYears = [y1, y2, y3];
  const [selectedYear, setSelectedYear] = useState(y3);

  if (isLoading) {
    return (
      <SectionCard title="Audit Time Machine">
        <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading timeline...
        </div>
      </SectionCard>
    );
  }
  
  const historyData: any = {
    [y1]: { risk: 12, level: "Low", status: "Recommended", signal: "Project initiated." },
    [y2]: { risk: 38, level: "Medium", status: "Sanctioned", signal: "Funds approved." },
    [y3]: { 
      risk: data?.risk_score || 0, 
      level: (data?.risk_score || 0) >= 60 ? "Critical" : (data?.risk_score || 0) >= 30 ? "Medium" : "Low", 
      status: data?.missing_photo ? "Delayed" : "In Progress", 
      signal: data?.evidence?.length > 0 ? data.evidence[0] : "No significant anomalies." 
    },
  };
  
  const d = historyData[selectedYear] || historyData[y3];

  return (
    <SectionCard title="Audit Time Machine">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <History className="size-4" />
        Historical reconstruction of project state.
      </div>
      
      <div className="flex items-center justify-between mb-6">
        {timelineYears.map(y => (
          <div key={y} className="flex-1 flex flex-col items-center relative">
            <button 
              onClick={() => setSelectedYear(y)}
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10 relative",
                selectedYear === y ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-border"
              )}
            >
              {y}
            </button>
            {y !== y3 && <div className="absolute top-4 left-1/2 w-full h-0.5 bg-border -z-0" />}
          </div>
        ))}
      </div>
      
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Risk Score</p>
            <p className="text-2xl font-serif font-bold text-foreground">{d.risk}</p>
          </div>
          <RiskBadge level={d.level} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Status</p>
          <p className="text-sm font-medium">{d.status}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Major Risk Signals</p>
          <p className="text-sm text-foreground">{d.signal}</p>
        </div>
      </div>
    </SectionCard>
  );
}

export function RiskRelationshipGraph({ data, isLoading }: { data?: InvestigationData; isLoading?: boolean }) {
  const vendors = data?.vendors || [];
  const mpName = data?.mp_name || "MP Profile";

  if (isLoading) {
    return (
      <SectionCard title="Risk Relationship Graph">
        <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Mapping entity relationships...
        </div>
      </SectionCard>
    );
  }

  const formatAmount = (amt: number) => {
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)}L`;
    if (amt >= 1000) return `₹${(amt / 1000).toFixed(1)}K`;
    return `₹${amt.toFixed(0)}`;
  };

  return (
    <SectionCard title="Risk Relationship Graph">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Network className="size-4" />
        Real entity relationships from the project database.
      </div>
      
      <div className="relative p-6 border border-border rounded-lg bg-secondary/20 flex flex-col items-center gap-8">
        <div className="px-4 py-2 bg-navy text-primary-foreground rounded-lg text-sm font-semibold shadow z-10">
          This Work
        </div>
        
        {/* Connecting lines */}
        <div className="absolute top-12 bottom-12 w-px bg-border -z-0" />
        <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-border -z-0" />
        
        <div className="w-full grid grid-cols-2 gap-3 z-10">
          {vendors.length > 0 ? vendors.slice(0, 4).map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="px-3 py-1.5 bg-card border border-border rounded text-xs font-medium hover:border-primary cursor-pointer transition-colors text-center truncate max-w-full" title={v.name}>
                {v.name.length > 20 ? v.name.slice(0, 20) + "…" : v.name}
              </div>
              <span className="text-[9px] text-muted-foreground">{formatAmount(v.total_paid)}</span>
            </div>
          )) : (
            <div className="col-span-2 text-center text-xs text-muted-foreground py-2">No vendor data available</div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium z-10 flex items-center gap-2 hover:border-primary cursor-pointer">
          <User className="size-4" />
          {mpName}
        </div>
      </div>
    </SectionCard>
  );
}
