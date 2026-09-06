import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Filter, Loader2, Eye, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/mplads/PageHeader";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useFilters } from "@/lib/filters";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateMpladsCsv } from "@/lib/csv-generator";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [{ title: "Reports & Exports — MPLADS AI Monitor" }],
  }),
  component: ReportsPage,
});

type PreviewData = {
  id: string;
  pdfUrl: string;
  pdfFileName: string;
  pdfDoc: any;
  csvUrl: string;
  csvFileName: string;
  csvHeaders: string[];
  csvRows: string[][];
};

function ReportsPage() {
  const { filters } = useFilters();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const handleExport = async (reportType: 'fund-utilization' | 'ai-insights' | 'compliance') => {
    setDownloading(reportType);
    try {
      const searchParams = new URLSearchParams();
      if (filters.house && filters.house !== "All Houses") {
        searchParams.set("house", filters.house);
      }
      
      let endpoint = '';
      if (reportType === 'fund-utilization') endpoint = '/analytics/funds';
      else if (reportType === 'ai-insights') endpoint = '/analytics/insights';
      else if (reportType === 'compliance') endpoint = '/analytics/compliance';

      const data = await fetchAPI(`${endpoint}?${searchParams.toString()}`);
      
      // Generate PDF
      const { generateMpladsReport } = await import("@/lib/pdf-generator");
      const pdf = generateMpladsReport(reportType, data, filters.house || 'All Houses');
      
      // Generate CSV
      const csv = generateMpladsCsv(reportType, data, filters.house || 'All Houses');
      
      setPreview({
        id: reportType,
        pdfUrl: pdf.pdfBlobUrl,
        pdfFileName: pdf.fileName,
        pdfDoc: pdf.doc,
        csvUrl: csv.csvBlobUrl,
        csvFileName: csv.fileName,
        csvHeaders: csv.headers,
        csvRows: csv.rows
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = () => {
    if (preview?.pdfDoc) {
      preview.pdfDoc.save(preview.pdfFileName);
      toast.success("PDF Downloaded");
    }
  };

  const reportsList = [
    {
      id: 'fund-utilization',
      title: 'Fund Utilisation Statement',
      blurb: 'Official state-wise financial breakdown of sanctioned amounts vs actual expenditure.'
    },
    {
      id: 'compliance',
      title: 'Compliance Audit Exception Report',
      blurb: 'Detailed audit log of hard rule exceptions, missing evidence, and pipeline bypasses.'
    },
    {
      id: 'ai-insights',
      title: 'AI Investigation Priority Queue',
      blurb: 'Ranked list of the highest-risk projects flagged by the ML anomaly detector.'
    }
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Exports"
        subtitle="Preview and download official summary reports, financial statements, and compliance audits."
        actions={
          <Button variant="outline" size="sm">
            <Filter className="size-4 mr-2" /> Filter Reports
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportsList.map((report) => (
          <div key={report.id} className="card-surface p-5 flex flex-col h-full">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{report.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{report.blurb}</p>
              </div>
            </div>
            <div className="mt-auto pt-5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PDF / CSV Format</span>
              <Button 
                size="sm" 
                variant="secondary"
                disabled={downloading === report.id}
                onClick={() => handleExport(report.id)}
              >
                {downloading === report.id ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Eye className="size-4 mr-1.5" />
                )}
                {downloading === report.id ? 'Generating...' : 'Preview'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
          </DialogHeader>
          
          {preview && (
            <Tabs defaultValue="pdf" className="flex-1 flex flex-col min-h-0 mt-2">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger 
                  value="pdf"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <FileText className="size-4 mr-2" />
                  PDF Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="csv"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <FileSpreadsheet className="size-4 mr-2" />
                  CSV Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pdf" className="flex-1 min-h-0 mt-4 border rounded-md overflow-hidden bg-muted/30">
                <iframe src={preview.pdfUrl} className="w-full h-full border-0" title="PDF Preview" />
              </TabsContent>

              <TabsContent value="csv" className="flex-1 min-h-0 mt-4 border rounded-md overflow-auto bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      {preview.csvHeaders.map((h, i) => (
                        <th key={i} className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.csvRows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-secondary/20">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-2 whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabsContent>

              <DialogFooter className="mt-4 pt-4 border-t flex items-center justify-between sm:justify-between">
                <p className="text-sm text-muted-foreground">Select a format to download to your device.</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <a href={preview.csvUrl} download={preview.csvFileName}>
                      <Download className="size-4 mr-2" /> Download CSV
                    </a>
                  </Button>
                  <Button onClick={handleDownloadPdf}>
                    <Download className="size-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </DialogFooter>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
