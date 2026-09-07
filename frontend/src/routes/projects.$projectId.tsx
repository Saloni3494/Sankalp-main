import React, { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Building, Calendar, AlertTriangle, Award, Lock, ShieldCheck } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { RiskBadge, StatusBadge } from "@/components/mplads/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWorkDetails, useWorkInvestigation } from "@/lib/api";
import { RecommendedNextAction, AgenticOrchestrator, RiskGenome, AuditTimeMachine, RiskRelationshipGraph } from "@/components/mplads/InvestigationFeatures";
import { BlockchainCertificateModal } from "@/components/mplads/BlockchainCertificateModal";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params: { projectId } }) => {
    return { projectId };
  },
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useLoaderData();
  const { data, isLoading, error } = useWorkDetails(projectId);
  const { data: investigation, isLoading: invLoading } = useWorkInvestigation(projectId);
  const [certModalOpen, setCertModalOpen] = useState(false);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading details...</div>;
  if (error || !data) return <div className="p-8 text-center text-danger">Failed to load project details.</div>;

  const evidenceList: string[] = Array.isArray(data.evidence) ? data.evidence.map(String) : [];

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return "N/A"; }
  };

  // Calculate delay: if completion_date exists and sanction_date exists, compute difference
  let delayDays = 0;
  if (data.sanction_date && data.completion_date) {
    const sanction = new Date(data.sanction_date);
    const completion = new Date(data.completion_date);
    const diffMs = completion.getTime() - sanction.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    // If completion took more than 365 days from sanction, flag it as delayed
    if (diffDays > 365) delayDays = diffDays - 365;
  }

  const project = {
    id: data.work_id,
    name: data.work_description || "Untitled Work",
    category: data.work_category || "General",
    risk: data.risk_score >= 60 ? "High" : data.risk_score >= 30 ? "Medium" : data.risk_score > 0 ? "Low" : "Safe",
    status: data.investigation_status || "Ongoing",
    sanctionedL: (data.sanction_amount || 0) / 100000,
    releasedL: (data.amount_disbursed || 0) / 100000,
    spentL: (data.amount_disbursed || 0) / 100000,
    progress: data.sanction_amount ? Math.min(100, Math.round((data.amount_disbursed / data.sanction_amount) * 100)) : 0,
    plannedProgress: 100,
    delayDays,
    riskScore: data.risk_score || 0,
    riskReasons: evidenceList,
    district: data.constituency || data.ida,
    state: data.state,
    constituency: data.constituency,
    mp: data.mp_name,
    agency: data.ida,
    sanctionDate: formatDate(data.sanction_date),
    expectedCompletion: formatDate(data.completion_date),
  };

  const formatL = (val: number) => `₹${val.toFixed(2)}L`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/projects">
            <ArrowLeft className="size-4" /> Back to Projects
          </Link>
        </Button>
      </div>

      <PageHeader
        title={project.name}
        subtitle={`Project ID: ${project.id} • ${project.category}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-medium text-xs shadow-sm cursor-pointer"
              onClick={() => setCertModalOpen(true)}
            >
              <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
              🔗 Blockchain Certificate
            </Button>
            <RiskBadge level={project.risk as any} />
            <StatusBadge status={project.status as any} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <RecommendedNextAction data={investigation} isLoading={invLoading} workId={projectId} status={project.status} outcome={data?.investigation_outcome} />
          
          <SectionCard title="Financial Overview">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground">Sanctioned</p>
                <p className="mt-1 text-xl font-bold">{formatL(project.sanctionedL)}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="mt-1 text-xl font-bold">{formatL(project.releasedL)}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="mt-1 text-xl font-bold">{formatL(project.spentL)}</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Financial Utilisation (against released)</span>
                <span className="font-bold">{Math.round((project.spentL / (project.releasedL || 1)) * 100)}%</span>
              </div>
              <Progress value={(project.spentL / (project.releasedL || 1)) * 100} className="h-2" />
            </div>
          </SectionCard>

          <SectionCard title="Implementation Progress">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{project.progress}%</p>
                <p className="text-xs text-muted-foreground mt-1">Physical Progress</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{project.plannedProgress}%</p>
                <p className="text-xs text-muted-foreground mt-1">Planned Progress</p>
              </div>
            </div>
            <Progress value={project.progress} className="h-3" />
            
            {project.delayDays > 0 && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-warning/20 bg-warning-soft p-4">
                <Clock className="mt-0.5 size-4 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-warning">Project Delayed by {project.delayDays} days</p>
                  <p className="mt-1 text-xs text-muted-foreground">Physical progress is lagging behind the planned timeline.</p>
                </div>
              </div>
            )}
          </SectionCard>

          {project.riskReasons.length > 0 && (
            <SectionCard title="AI Risk Analysis" className="border-danger/20 bg-danger/5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="size-5 text-danger" />
                <h3 className="font-semibold text-danger">Risk Score: {project.riskScore}/100</h3>
              </div>
              <ul className="space-y-3">
                {project.riskReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger/70" />
                    {reason}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard title="Project Details">
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{project.district}, {project.state}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Constituency</p>
                  <p className="text-muted-foreground">{project.constituency}</p>
                  <p className="mt-1 text-xs text-muted-foreground">MP: {project.mp}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Implementing Agency</p>
                  <p className="text-muted-foreground">{project.agency}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Timeline</p>
                  <p className="text-muted-foreground">Sanctioned: {project.sanctionDate}</p>
                  <p className="text-muted-foreground">Expected: {project.expectedCompletion}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Blockchain Certificate"
            className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-primary/5 to-transparent shadow-sm"
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  GovChain Sovereign Ledger
                </span>
                <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  Tamper-Evident
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Official cryptographically-signed digital certificate with SHA-256 block hash, Merkle root proof, and 9 statutory audit pillars.
              </p>
              <Button
                size="sm"
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow cursor-pointer"
                onClick={() => setCertModalOpen(true)}
              >
                <Award className="size-4" />
                View &amp; Verify Certificate
              </Button>
            </div>
          </SectionCard>

          <RiskGenome data={investigation} isLoading={invLoading} />
          <AgenticOrchestrator data={investigation} isLoading={invLoading} />
        </div>
        
        <div className="lg:col-span-2 grid gap-5 lg:grid-cols-2">
           <AuditTimeMachine data={data} isLoading={isLoading} />
           <RiskRelationshipGraph data={investigation} isLoading={invLoading} />
        </div>
      </div>

      <BlockchainCertificateModal
        workId={project.id}
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
      />
    </div>
  );
}
