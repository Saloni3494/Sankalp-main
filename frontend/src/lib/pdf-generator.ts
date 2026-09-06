import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateMpladsReport = (
  reportType: 'fund-utilization' | 'ai-insights' | 'compliance',
  data: any,
  house: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // Colors
  const saffron = [255, 153, 51];
  const navy = [0, 0, 128];
  const indiaGreen = [19, 136, 8];

  // --- Page Border ---
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
  doc.setLineWidth(0.2);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('MEMBER OF PARLIAMENT LOCAL AREA DEVELOPMENT SCHEME', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('(MPLADS)', pageWidth / 2, 26, { align: 'center' });
  doc.text('GOVERNMENT OF INDIA', pageWidth / 2, 32, { align: 'center' });

  // Tricolor Rule
  doc.setDrawColor(saffron[0], saffron[1], saffron[2]);
  doc.setLineWidth(1);
  doc.line(margin, 38, margin + (pageWidth - margin * 2) / 3, 38);
  
  doc.setDrawColor(200, 200, 200); // White/Gray center
  doc.line(margin + (pageWidth - margin * 2) / 3, 38, margin + ((pageWidth - margin * 2) / 3) * 2, 38);
  
  doc.setDrawColor(indiaGreen[0], indiaGreen[1], indiaGreen[2]);
  doc.line(margin + ((pageWidth - margin * 2) / 3) * 2, 38, pageWidth - margin, 38);

  // --- Report Meta ---
  let title = 'OFFICIAL REPORT';
  if (reportType === 'fund-utilization') title = 'FUND UTILIZATION STATEMENT';
  else if (reportType === 'ai-insights') title = 'AI INVESTIGATION PRIORITY QUEUE';
  else if (reportType === 'compliance') title = 'COMPLIANCE AUDIT EXCEPTION REPORT';

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 48, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated On: ${new Date().toLocaleDateString()}`, margin, 58);
  doc.text(`Scope: ${house || 'All Houses'}`, pageWidth - margin, 58, { align: 'right' });

  // --- Content ---
  let startY = 65;

  if (reportType === 'fund-utilization') {
    autoTable(doc, {
      startY,
      head: [['State', 'Sanctioned (Rs)', 'Expenditure (Rs)', 'Utilization %']],
      body: data?.state_data?.map((s: any) => [
        s.state,
        `Rs. ${s.sanctioned.toLocaleString()}`,
        `Rs. ${s.expenditure.toLocaleString()}`,
        `${Math.round((s.expenditure / (s.sanctioned || 1)) * 100)}%`
      ]) || [],
      headStyles: { fillColor: saffron, textColor: 255 },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  } 
  
  else if (reportType === 'ai-insights') {
    // Summary
    autoTable(doc, {
      startY,
      head: [['Works Analyzed', 'High-Priority Works', 'Average Risk Score']],
      body: [[
        data?.total_works?.toLocaleString() || '0',
        data?.high_priority_count?.toLocaleString() || '0',
        data?.average_risk_score?.toString() || '0'
      ]],
      headStyles: { fillColor: navy, textColor: 255 },
      margin: { bottom: 10 }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Work ID', 'House', 'Risk Score', 'Completeness', 'Top Factors']],
      body: data?.top_works?.map((w: any) => [
        w.work_id,
        w.house,
        w.risk_score,
        `${Math.round((w.data_completeness || 0) * 100)}%`,
        (w.top_factors || []).join(', ')
      ]) || [],
      headStyles: { fillColor: [50, 50, 50], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 4: { cellWidth: 80 } }
    });
  }
  
  else if (reportType === 'compliance') {
     // KPIs
     autoTable(doc, {
      startY,
      head: [['Rule Exceptions', 'Missing Evidence', 'Works Requiring Review']],
      body: [[
        data?.kpis?.rule_exceptions?.toLocaleString() || '0',
        data?.kpis?.missing_evidence?.toLocaleString() || '0',
        data?.kpis?.requires_review?.toLocaleString() || '0'
      ]],
      headStyles: { fillColor: indiaGreen, textColor: 255 },
      margin: { bottom: 10 }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Work ID', 'Exception Type', 'Completeness', 'Status']],
      body: data?.action_queue?.map((w: any) => [
        w.work_id,
        w.exception_type || 'N/A',
        `${Math.round((w.data_completeness || 0) * 100)}%`,
        w.investigation_status.replace(/_/g, ' ')
      ]) || [],
      headStyles: { fillColor: [50, 50, 50], textColor: 255 },
      styles: { fontSize: 8 }
    });
  }

  // --- Footer ---
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `MPLADS AI Monitor - Official System Generated Report - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
  }

  const pdfBlobUrl = doc.output('bloburl');
  const fileName = `MPLADS_${reportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return { pdfBlobUrl, fileName, doc };
};
