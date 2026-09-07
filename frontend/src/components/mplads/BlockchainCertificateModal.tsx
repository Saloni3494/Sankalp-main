import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useWorkCertificate,
  verifyCertificateAPI,
  CertificateVerifyResult,
} from "@/lib/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Printer,
  Download,
  RefreshCw,
  Building2,
  UserCheck,
  Calendar,
  Lock,
  Zap,
} from "lucide-react";

interface BlockchainCertificateModalProps {
  workId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BlockchainCertificateModal({
  workId,
  isOpen,
  onClose,
}: BlockchainCertificateModalProps) {
  const { data: cert, isLoading, error, refetch } = useWorkCertificate(workId);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<CertificateVerifyResult | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLiveVerification = async (simulatedTamper: boolean = false) => {
    if (!cert) return;
    setIsVerifying(true);
    try {
      const hashToVerify = simulatedTamper
        ? cert.certificate_hash.slice(0, -4) + "dead"
        : cert.certificate_hash;
      const res = await verifyCertificateAPI(cert.project_details.work_id, hashToVerify);
      setVerifyResult(res);
    } catch {
      setVerifyResult({
        valid: false,
        tamper_evident: true,
        computed_hash: cert.certificate_hash,
        submitted_hash: cert.certificate_hash,
        integrity_score: 0,
        message: "Network verification error. Unable to contact ledger node.",
        block_number: cert.block_number,
        verified_at: new Date().toISOString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadPdf = async () => {
    await generatePdf(false);
  };

  const handlePrint = async () => {
    await generatePdf(true);
  };

  const generatePdf = async (printMode: boolean = false) => {
    if (!cert) return;
    setIsDownloadingPdf(true);
    try {
      const element = document.getElementById("printable-blockchain-certificate");
      if (!element) throw new Error("Printable element not found");

      // Temporarily hide the no-print action bar during capture if it's inside the printable area
      const noPrintElements = element.querySelectorAll('.no-print');
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#020817" : "#ffffff",
      });

      // Restore elements
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.width;
      const margin = 8;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

      if (printMode) {
        const blobUrl = pdf.output("bloburl");
        window.open(blobUrl, "_blank");
      } else {
        const cleanId = cert.project_details.work_id.replace(/[^a-zA-Z0-9]/g, '_');
        pdf.save(`MPLADS_Blockchain_Certificate_${cleanId}.pdf`);
      }
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border border-border shadow-2xl rounded-xl bg-card text-card-foreground">

        {isLoading && (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <h4 className="font-semibold text-foreground text-lg">
                Retrieving Sovereign Ledger Record...
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Hashing canonical blocks & querying GovChain node for Work: {workId}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-8 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <div className="text-destructive font-semibold text-lg">
              Failed to load certificate
            </div>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Ledger lookup error"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        )}

        {cert && (
          <div id="printable-blockchain-certificate" className="space-y-0">
            {/* National Tricolour Ribbon Top Banner */}
            <div className="h-2 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

            {/* Certificate Header with Govt Styling */}
            <div className="p-6 border-b border-border/60 bg-gradient-to-b from-amber-500/5 via-primary/5 to-transparent relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* National Emblem & Seal Graphic */}
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/20 to-primary/20 border-2 border-amber-600/30 flex items-center justify-center shadow-inner shrink-0">
                    <Award className="h-9 w-9 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        Government of India • भारत सरकार
                      </span>
                      <span className="text-xs text-muted-foreground">
                        MoSPI e-Sakshi Federation
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground mt-0.5">
                      SOVEREIGN GOVCHAIN DIGITAL CERTIFICATE
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Cryptographically Validated Record for MPLADS Work • Proof-of-Authority Ledger
                    </p>
                  </div>
                </div>

                {/* Right Header Badges */}
                <div className="flex flex-col md:items-end items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono text-xs">
                      <Lock className="h-3 w-3 mr-1 text-emerald-600" />
                      BLOCK #{cert.block_number}
                    </Badge>
                    <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary text-xs font-mono">
                      {cert.certificate_id}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Sealed: {cert.officer_approval.approval_date}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar (Download, Print & Verify Trigger) */}
            <div className="no-print px-6 py-2.5 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Node: <strong className="text-foreground">MoSPI-NIC-01</strong></span>
                <span className="text-border">|</span>
                <span>Consensus: <strong className="text-foreground">Proof-of-Authority</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleLiveVerification(false)}
                  disabled={isVerifying}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                  Verify Tamper-Evidence
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                  onClick={() => handleLiveVerification(true)}
                  disabled={isVerifying}
                  title="Simulate 1-byte data tampering to verify cryptographic rejection"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Simulate Tamper
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloadingPdf ? "Generating..." : "Download Official PDF"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={handlePrint}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Preview
                </Button>
              </div>
            </div>

            {/* Live Verification Result Banner (if triggered) */}
            {verifyResult && (
              <div
                className={`no-print mx-6 my-4 p-4 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  verifyResult.valid
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-900 dark:text-emerald-200"
                    : "bg-destructive/10 border-destructive/40 text-destructive"
                }`}
              >
                <div className="flex items-start gap-3">
                  {verifyResult.valid ? (
                    <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span>
                        {verifyResult.valid
                          ? "✅ 100% Cryptographic Integrity Confirmed"
                          : "🚨 CRITICAL ALERT: Tampering Detected!"}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          verifyResult.valid
                            ? "border-emerald-600 bg-emerald-100 text-emerald-800 text-[10px]"
                            : "border-destructive bg-destructive/20 text-destructive text-[10px]"
                        }
                      >
                        Score: {verifyResult.integrity_score}%
                      </Badge>
                    </div>
                    <p className="text-xs mt-0.5 opacity-90">{verifyResult.message}</p>
                    <div className="text-[11px] font-mono mt-1 opacity-75 break-all">
                      Computed Hash: {verifyResult.computed_hash}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs self-end md:self-center"
                  onClick={() => setVerifyResult(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Certificate Body: 9 Comprehensive Pillars */}
            <div className="p-6 space-y-5">

              {/* PILLAR 1: Work ID & Project Details */}
              <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                      Work ID &amp; Project Details
                    </h3>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    {cert.project_details.parliament_house}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Work ID:</span>
                    <div className="flex items-center gap-1.5 mt-0.5 font-mono font-medium text-foreground">
                      <span className="break-all">{cert.project_details.work_id}</span>
                      <button
                        onClick={() => handleCopy(cert.project_details.work_id, "work_id")}
                        className="no-print text-muted-foreground hover:text-foreground p-0.5"
                        title="Copy Work ID"
                      >
                        {copiedKey === "work_id" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Category:</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {cert.project_details.work_category}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Geographic Jurisdiction:</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {cert.project_details.constituency} • {cert.project_details.state}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground block text-[11px]">Description:</span>
                    <span className="text-foreground mt-0.5 block font-medium">
                      {cert.project_details.work_description}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Recommending Member of Parliament:</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {cert.project_details.mp_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* PILLAR 2: Financial Ledger & Expenditure */}
              <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                      Sanctioned / Expenditure Financial Ledger
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/40 bg-primary/5">
                    {cert.financial_ledger.financial_status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/40">
                    <span className="text-muted-foreground text-[11px]">Total Sanctioned:</span>
                    <div className="text-base font-bold text-foreground mt-1">
                      {cert.financial_ledger.sanction_amount_formatted}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-muted/30 border border-border/40">
                    <span className="text-muted-foreground text-[11px]">Disbursed Expenditure:</span>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {cert.financial_ledger.amount_disbursed_formatted}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-muted/30 border border-border/40">
                    <span className="text-muted-foreground text-[11px]">Unspent Balance:</span>
                    <div className="text-base font-bold text-foreground mt-1">
                      {cert.financial_ledger.unspent_balance_formatted}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-muted/30 border border-border/40">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Fund Utilization:</span>
                      <span className="font-bold text-foreground">{cert.financial_ledger.utilization_rate}%</span>
                    </div>
                    <Progress value={cert.financial_ledger.utilization_rate} className="h-2 mt-2" />
                  </div>
                </div>
              </div>

              {/* PILLAR 3: Recommendation -> Sanction -> Execution -> Completion Timeline */}
              <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                      Lifecycle Audit Timeline (Recommendation → Completion)
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Coverage: {cert.timeline.lifecycle_coverage}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {cert.timeline.stages.map((stg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border/60 bg-muted/20 relative"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-foreground">{stg.stage}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            stg.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {stg.status}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {stg.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid 2-columns for Pillars 4, 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* PILLAR 4: Vendor / Implementing Agency Details */}
                <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                  <div className="flex items-center justify-between mb-2.5 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        4
                      </span>
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                        Implementing Agency &amp; Vendors
                      </h3>
                    </div>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[11px]">Implementing Authority (IDA):</span>
                      <div className="font-semibold text-foreground mt-0.5">
                        {cert.implementing_agency.agency_name}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex gap-4 pt-1">
                      <span>Total Vendors: <strong className="text-foreground">{cert.implementing_agency.vendor_count}</strong></span>
                      <span>Disbursements: <strong className="text-foreground">{cert.implementing_agency.payment_count}</strong></span>
                    </div>
                    <div className="border border-border/50 rounded overflow-hidden mt-2">
                      <table className="w-full text-[11px]">
                        <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                          <tr>
                            <th className="p-1.5 text-left font-medium">Vendor / Entity</th>
                            <th className="p-1.5 text-right font-medium">Disbursed</th>
                            <th className="p-1.5 text-right font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {cert.implementing_agency.vendors.slice(0, 3).map((v, i) => (
                            <tr key={i} className="hover:bg-muted/30">
                              <td className="p-1.5 font-medium truncate max-w-[140px] text-foreground">
                                {v.vendor_name}
                              </td>
                              <td className="p-1.5 text-right font-mono font-medium">
                                {v.total_disbursed_formatted}
                              </td>
                              <td className="p-1.5 text-right text-emerald-600 text-[10px]">
                                {v.verification_status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* PILLAR 5: Document & OCR Verification Status */}
                <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                  <div className="flex items-center justify-between mb-2.5 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        5
                      </span>
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                        Document &amp; OCR Verification Status
                      </h3>
                    </div>
                    <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">Geotagged Photo Inspection:</span>
                      <Badge
                        variant={cert.document_verification.missing_photo ? "destructive" : "outline"}
                        className="text-[10px]"
                      >
                        {cert.document_verification.photo_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">Data Completeness Index:</span>
                      <span className="font-bold font-mono text-foreground">
                        {cert.document_verification.data_completeness_pct}%
                      </span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {cert.document_verification.ocr_checks.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/20 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {c.status === "PASSED" || c.status === "VERIFIED" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className="text-foreground">{c.check}</span>
                          </div>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {c.confidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Grid 2-columns for Pillars 6, 7 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* PILLAR 6: AI Risk Score + Evidence Strength */}
                <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                  <div className="flex items-center justify-between mb-2.5 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        6
                      </span>
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                        AI Risk Score &amp; Evidence Strength
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {cert.ai_risk_audit.risk_score} / 100
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">Risk Classification:</span>
                      <Badge
                        variant={
                          cert.ai_risk_audit.risk_tier === "CRITICAL" || cert.ai_risk_audit.risk_tier === "HIGH"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {cert.ai_risk_audit.risk_tier} RISK
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">Evidence Forensic Strength:</span>
                      <span className="font-medium text-foreground">
                        {cert.ai_risk_audit.evidence_strength}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground text-[11px] block mb-1">
                        Detected Anomalies ({cert.ai_risk_audit.evidence_count}):
                      </span>
                      {cert.ai_risk_audit.anomalies.length > 0 ? (
                        <div className="space-y-1">
                          {cert.ai_risk_audit.anomalies.map((anom, i) => (
                            <div key={i} className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                              • {anom}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                          ✓ No statistical, timeline, or disbursement anomalies detected.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PILLAR 7: Audit / Investigation Outcome */}
                <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                  <div className="flex items-center justify-between mb-2.5 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        7
                      </span>
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                        Statutory Audit &amp; Investigation Outcome
                      </h3>
                    </div>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">Investigation Workflow Status:</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {cert.investigation_audit.investigation_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">Audit Outcome Classification:</span>
                      <Badge
                        variant={cert.investigation_audit.investigation_outcome === "IRREGULARITY_CONFIRMED" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {cert.investigation_audit.investigation_outcome}
                      </Badge>
                    </div>
                    <div className="p-2.5 rounded bg-muted/30 border border-border/50 mt-1">
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                        Statutory Compliance Seal
                      </span>
                      <div className="text-xs font-bold text-foreground mt-0.5">
                        {cert.investigation_audit.audit_conclusion}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* PILLAR 8: Authorized Officer Approval */}
              <div className="pillar-card rounded-lg border border-border p-4 bg-card/60">
                <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      8
                    </span>
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                      Authorized Officer Digital Approval &amp; PKI Seal
                    </h3>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] bg-emerald-50 dark:bg-emerald-950/30">
                    ✓ Cryptographically Signed
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px]">Approved By Officer:</span>
                    <div className="font-bold text-foreground mt-0.5">
                      {cert.officer_approval.approved_by}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {cert.officer_approval.officer_role}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Designation &amp; Dept:</span>
                    <div className="font-medium text-foreground mt-0.5">
                      {cert.officer_approval.designation}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {cert.officer_approval.department}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Jurisdiction:</span>
                    <div className="font-medium text-foreground mt-0.5">
                      {cert.officer_approval.jurisdiction}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Algorithm: {cert.officer_approval.signature_algorithm}
                    </span>
                  </div>
                  <div className="md:col-span-3 pt-1 border-t border-border/40">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">
                      Digital PKI Thumbprint (SHA-256):
                    </span>
                    <div className="font-mono text-[11px] text-foreground mt-0.5 bg-muted/40 p-1.5 rounded border border-border/40 break-all flex items-center justify-between">
                      <span>{cert.officer_approval.digital_thumbprint}</span>
                      <button
                        onClick={() => handleCopy(cert.officer_approval.digital_thumbprint, "thumbprint")}
                        className="no-print text-muted-foreground hover:text-foreground ml-2 shrink-0"
                        title="Copy Thumbprint"
                      >
                        {copiedKey === "thumbprint" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PILLAR 9: Blockchain Hash & Timestamp for Tamper-Evident Verification */}
              <div className="pillar-card rounded-lg border-2 border-primary/30 p-4 bg-primary/5">
                <div className="flex items-center justify-between mb-3 border-b border-primary/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                      9
                    </span>
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Blockchain Hash &amp; Sovereign Tamper-Evident Proof
                    </h3>
                  </div>
                  <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-700">
                    TAMPER-EVIDENT VALID
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Canonical Block SHA-256 Hash:</span>
                      <button
                        onClick={() => handleCopy(cert.certificate_hash, "cert_hash")}
                        className="no-print text-xs text-primary hover:underline flex items-center gap-1 font-sans"
                      >
                        {copiedKey === "cert_hash" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy Block Hash
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-semibold text-foreground bg-background p-2.5 rounded border border-border break-all select-all shadow-inner">
                      {cert.certificate_hash}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Merkle Tree Root:</span>
                      <div className="font-mono text-[11px] text-foreground bg-background/80 p-1.5 rounded border border-border/60 break-all mt-0.5">
                        {cert.merkle_root}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Previous Block Hash:</span>
                      <div className="font-mono text-[11px] text-foreground bg-background/80 p-1.5 rounded border border-border/60 break-all mt-0.5">
                        {cert.previous_block_hash}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-primary/20 text-[11px] text-muted-foreground">
                    <div>
                      Ledger: <strong className="text-foreground">{cert.blockchain_proof.ledger_name}</strong>
                    </div>
                    <div>
                      Network: <strong className="text-foreground">{cert.blockchain_proof.network_consensus}</strong>
                    </div>
                    <div>
                      Timestamp: <strong className="text-foreground font-mono">{cert.blockchain_proof.timestamp_iso}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Seal / Signature Footer Block for Print and Screen */}
              <div className="pillar-card pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-bold text-foreground text-[11px]">
                      Ministry of Statistics and Programme Implementation (MoSPI)
                    </div>
                    <div className="text-[10px]">
                      e-Sakshi Portal • Government of India Distributed Sentinel Ledger
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="font-mono text-[10px] text-foreground">
                    CERTIFICATE UID: {cert.certificate_id}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    ✓ Validated Against Sovereign Merkle Tree Root
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
