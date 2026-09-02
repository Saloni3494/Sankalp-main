import { useState } from "react";
import { CheckCircle2, ChevronRight, Activity, Zap, History, Network, User, AlertCircle, ArrowRight } from "lucide-react";
import { SectionCard } from "@/components/mplads/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { RiskBadge } from "./badges";

export function RecommendedNextAction() {
  return (
    <SectionCard title="Recommended Next Action" className="border-primary/20 bg-primary/5">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary p-2 text-primary-foreground">
          <Zap className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Verify completion documentation</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Reason: Financial utilisation is reported at 98%, but physical progress remains undocumented and delayed.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-danger uppercase px-2 py-0.5 bg-danger/10 rounded">High Priority</span>
            <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90">Request Verification</Button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Other possible actions:</p>
        <div className="flex flex-wrap gap-2">
          {["Review payment records", "Compare similar works", "Verify vendor information", "Escalate for investigation"].map((action) => (
            <button key={action} className="text-[11px] px-2 py-1 rounded border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              {action}
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function AgenticOrchestrator() {
  const steps = [
    { name: "Risk Analysis", status: "Completed" },
    { name: "Financial Check", status: "Completed" },
    { name: "Payment Check", status: "Completed" },
    { name: "Vendor Check", status: "Needs Evidence" },
    { name: "Duplicate Check", status: "Running" },
    { name: "Compliance Check", status: "Pending" },
    { name: "Investigation Brief", status: "Pending" },
  ];

  return (
    <SectionCard title="AI Investigation Assistant">
      <div className="text-xs text-muted-foreground mb-4">
        Autonomous agent analyzing pipeline datasets to build a preliminary investigation brief.
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
      
      <Button className="w-full mt-6 bg-navy text-primary-foreground hover:bg-navy/90" disabled>
        Generate Investigation Brief (Running...)
      </Button>
    </SectionCard>
  );
}

export function RiskGenome() {
  const dimensions = [
    { name: "Lifecycle", score: 91, color: "bg-danger" },
    { name: "Financial", score: 82, color: "bg-danger" },
    { name: "Duplicate", score: 84, color: "bg-danger" },
    { name: "Payment", score: 45, color: "bg-warning" },
    { name: "Vendor", score: 20, color: "bg-india-green" },
    { name: "Compliance", score: 15, color: "bg-india-green" },
  ];

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
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-semibold text-foreground">Primary Risk Dimensions:</p>
        <p className="text-xs text-muted-foreground mt-1">Lifecycle delays and Financial anomalies are heavily driving the risk score.</p>
      </div>
    </SectionCard>
  );
}

export function AuditTimeMachine() {
  const [year, setYear] = useState(2025);
  
  const historyData: any = {
    2023: { risk: 12, level: "Low", status: "Recommended", signal: "None" },
    2024: { risk: 38, level: "Medium", status: "Sanctioned", signal: "Slight cost overrun" },
    2025: { risk: 87, level: "Critical", status: "Delayed", signal: "Lifecycle delays, Documentation missing" },
  };
  
  const data = historyData[year];

  return (
    <SectionCard title="Audit Time Machine">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <History className="size-4" />
        Historical reconstruction of project state.
      </div>
      
      <div className="flex items-center justify-between mb-6">
        {[2023, 2024, 2025].map(y => (
          <div key={y} className="flex-1 flex flex-col items-center relative">
            <button 
              onClick={() => setYear(y)}
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10 relative",
                year === y ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-border"
              )}
            >
              {y}
            </button>
            {y !== 2025 && <div className="absolute top-4 left-1/2 w-full h-0.5 bg-border -z-0" />}
          </div>
        ))}
      </div>
      
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Risk Score</p>
            <p className="text-2xl font-serif font-bold text-foreground">{data.risk}</p>
          </div>
          <RiskBadge level={data.level} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Status</p>
          <p className="text-sm font-medium">{data.status}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Major Risk Signals</p>
          <p className="text-sm text-foreground">{data.signal}</p>
        </div>
      </div>
    </SectionCard>
  );
}

export function RiskRelationshipGraph() {
  return (
    <SectionCard title="Risk Relationship Graph">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Network className="size-4" />
        Potential relationships and associated entities.
      </div>
      
      {/* Simplified visually-mocked graph using flexbox */}
      <div className="relative p-6 border border-border rounded-lg bg-secondary/20 flex flex-col items-center gap-8">
        <div className="px-4 py-2 bg-navy text-primary-foreground rounded-lg text-sm font-semibold shadow z-10">
          This Work
        </div>
        
        {/* Connecting lines mocked with absolute divs */}
        <div className="absolute top-12 bottom-12 w-px bg-border -z-0" />
        <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-border -z-0" />
        
        <div className="w-full flex justify-between z-10">
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1.5 bg-card border border-border rounded text-xs font-medium hover:border-primary cursor-pointer transition-colors">
              Vendor A
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Related Entity</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1.5 bg-card border border-border rounded text-xs font-medium hover:border-primary cursor-pointer transition-colors">
              Similar Work 1
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Potential Relationship</span>
          </div>
        </div>
        
        <div className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium z-10 flex items-center gap-2 hover:border-primary cursor-pointer">
          <User className="size-4" />
          MP Profile
        </div>
      </div>
    </SectionCard>
  );
}
