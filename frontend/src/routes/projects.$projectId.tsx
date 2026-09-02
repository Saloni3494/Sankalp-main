import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Building, Calendar, AlertTriangle } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/mplads/PageHeader";
import { RiskBadge, StatusBadge } from "@/components/mplads/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PROJECTS, formatL } from "@/lib/mplads-data";
import { RecommendedNextAction, AgenticOrchestrator, RiskGenome, AuditTimeMachine, RiskRelationshipGraph } from "@/components/mplads/InvestigationFeatures";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params: { projectId } }) => {
    const project = PROJECTS.find((p) => p.id === projectId);
    if (!project) throw notFound();
    return { project };
  },
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project } = Route.useLoaderData();

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
            <RiskBadge level={project.risk} />
            <StatusBadge status={project.status} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <RecommendedNextAction />
          
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

          <RiskGenome />
          <AgenticOrchestrator />
        </div>
        
        <div className="lg:col-span-2 grid gap-5 lg:grid-cols-2">
           <AuditTimeMachine />
           <RiskRelationshipGraph />
        </div>
      </div>
    </div>
  );
}
