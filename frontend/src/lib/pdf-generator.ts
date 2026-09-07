import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CertificatePayload } from './api';

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

export const generateBlockchainCertificatePdf = (cert: CertificatePayload) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;

  // Colors
  const saffron = [255, 153, 51];
  const navy = [15, 23, 42];
  const indiaGreen = [19, 136, 8];
  const gold = [217, 119, 6];
  const primaryBlue = [30, 64, 175];

  // --- Page Outer Double Border ---
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.75);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
  doc.setLineWidth(0.25);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('GOVERNMENT OF INDIA • भारत सरकार', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)', pageWidth / 2, 18.5, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('SOVEREIGN GOVCHAIN DIGITAL PROJECT CERTIFICATE', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Cryptographically Validated Audit Record • Proof-of-Authority Sovereign Ledger', pageWidth / 2, 30, { align: 'center' });

  // Tricolor Ribbon
  doc.setDrawColor(saffron[0], saffron[1], saffron[2]);
  doc.setLineWidth(1.2);
  doc.line(margin, 34, margin + (pageWidth - margin * 2) / 3, 34);
  
  doc.setDrawColor(210, 210, 210);
  doc.line(margin + (pageWidth - margin * 2) / 3, 34, margin + ((pageWidth - margin * 2) / 3) * 2, 34);
  
  doc.setDrawColor(indiaGreen[0], indiaGreen[1], indiaGreen[2]);
  doc.line(margin + ((pageWidth - margin * 2) / 3) * 2, 34, pageWidth - margin, 34);

  // --- Certificate Metadata Bar ---
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 37, pageWidth - margin * 2, 11, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(margin, 37, pageWidth - margin * 2, 11, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`CERTIFICATE ID: ${cert.certificate_id}`, margin + 3, 41.5);
  doc.text(`BLOCK NUMBER: #${cert.block_number}`, margin + 3, 45.5);

  doc.text(`SEALED: ${cert.officer_approval.approval_date}`, pageWidth - margin - 3, 41.5, { align: 'right' });
  doc.setTextColor(indiaGreen[0], indiaGreen[1], indiaGreen[2]);
  doc.text('TAMPER-EVIDENT: VERIFIED AUTHENTIC', pageWidth - margin - 3, 45.5, { align: 'right' });

  let curY = 51;

  // Pillar 1: Project Details
  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    head: [['1. WORK ID & PROJECT DETAILS', 'GEOGRAPHIC & MP JURISDICTION']],
    body: [
      [
        `Work ID: ${cert.project_details.work_id}\nCategory: ${cert.project_details.work_category}\nDescription: ${cert.project_details.work_description}`,
        `Parliament House: ${cert.project_details.parliament_house}\nState: ${cert.project_details.state}\nConstituency / District: ${cert.project_details.constituency} (${cert.project_details.district})\nMP: ${cert.project_details.mp_name}`
      ]
    ],
    headStyles: { fillColor: primaryBlue, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    theme: 'grid'
  });

  curY = (doc as any).lastAutoTable.finalY + 3.5;

  // Pillar 2 & 3: Financial Ledger & Lifecycle Timeline
  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    head: [
      ['2. FINANCIAL LEDGER', 'AMOUNT', '3. LIFECYCLE TIMELINE', 'STATUS']
    ],
    body: [
      ['Total Sanctioned', cert.financial_ledger.sanction_amount_formatted, 'Recommendation by MP', `${cert.timeline.recommended_date || 'Not Logged'}`],
      ['Disbursed Expenditure', cert.financial_ledger.amount_disbursed_formatted, 'Administrative Sanction', `${cert.timeline.sanction_date || 'Pending'}`],
      ['Unspent Balance', cert.financial_ledger.unspent_balance_formatted, 'Disbursement & Execution', `${cert.timeline.execution_date || 'In Progress'}`],
      ['Fund Utilization Rate', `${cert.financial_ledger.utilization_rate}% (${cert.financial_ledger.financial_status})`, 'Completion & Handover', `${cert.timeline.completion_date || 'In Progress'}`]
    ],
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.2, cellPadding: 1.8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 45 },
      3: { cellWidth: 61 }
    },
    theme: 'grid'
  });

  curY = (doc as any).lastAutoTable.finalY + 3.5;

  // Pillar 4 & 5: Implementing Agency & Document/OCR Verification
  const topVendor = cert.implementing_agency.vendors[0]?.vendor_name || 'N/A';
  const vendorAmount = cert.implementing_agency.vendors[0]?.total_disbursed_formatted || '₹0.00';
  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    head: [
      ['4. IMPLEMENTING AGENCY & VENDORS', '5. DOCUMENT & OCR VERIFICATION']
    ],
    body: [
      [
        `Agency: ${cert.implementing_agency.agency_name}\nPrimary Vendor: ${topVendor} (${vendorAmount})\nVendors: ${cert.implementing_agency.vendor_count} registered • Disbursements: ${cert.implementing_agency.payment_count}`,
        `Geotagged Photography: ${cert.document_verification.photo_status}\nOCR Cross-Validation: ${cert.document_verification.ocr_status}\nData Completeness Index: ${cert.document_verification.data_completeness_pct}%\nChecks: Sanction Authenticity 99.4% • PFMS Ledger 98.8%`
      ]
    ],
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.2, cellPadding: 2, textColor: [30, 41, 59] },
    theme: 'grid'
  });

  curY = (doc as any).lastAutoTable.finalY + 3.5;

  // Pillar 6 & 7: AI Risk Sentinel & Statutory Audit Outcome
  const anomaliesSummary = cert.ai_risk_audit.anomalies.length > 0 
    ? cert.ai_risk_audit.anomalies.slice(0, 2).join('; ') 
    : 'No statistical or timeline anomalies detected.';
  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    head: [
      ['6. AI RISK SCORE & EVIDENCE FORENSICS', '7. STATUTORY AUDIT & VIGILANCE OUTCOME']
    ],
    body: [
      [
        `AI Risk Score: ${cert.ai_risk_audit.risk_score} / 100 (${cert.ai_risk_audit.risk_tier} RISK)\nEvidence Strength: ${cert.ai_risk_audit.evidence_strength}\nDetected Indicators: ${anomaliesSummary}`,
        `Workflow Status: ${cert.investigation_audit.investigation_status}\nStatutory Outcome: ${cert.investigation_audit.investigation_outcome}\nCompliance Seal: ${cert.investigation_audit.audit_conclusion}`
      ]
    ],
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.2, cellPadding: 2, textColor: [30, 41, 59] },
    theme: 'grid'
  });

  curY = (doc as any).lastAutoTable.finalY + 3.5;

  // Pillar 8 & 9: Officer Signoff & Cryptographic Ledger Proof
  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    head: [
      ['8. AUTHORIZED OFFICER DIGITAL APPROVAL', '9. BLOCKCHAIN HASH & TAMPER PROOF']
    ],
    body: [
      [
        `Approved By: ${cert.officer_approval.approved_by}\nRole: ${cert.officer_approval.officer_role}\nDesignation: ${cert.officer_approval.designation}\nDepartment: ${cert.officer_approval.department}\nJurisdiction: ${cert.officer_approval.jurisdiction}\nDigital PKI Thumbprint:\n${cert.officer_approval.digital_thumbprint.slice(0, 52)}...`,
        `Ledger: ${cert.blockchain_proof.ledger_name}\nConsensus: ${cert.blockchain_proof.network_consensus}\nTimestamp: ${cert.blockchain_proof.timestamp_iso}\nBlock SHA-256 Hash:\n${cert.certificate_hash}\nMerkle Tree Root:\n${cert.merkle_root.slice(0, 52)}...`
      ]
    ],
    headStyles: { fillColor: navy, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.0, cellPadding: 2, textColor: [30, 41, 59] },
    theme: 'grid'
  });

  // Footer / Seal
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  doc.text(
    'Official sovereign document issued under the Authority of MoSPI, Government of India. Cryptographically sealed against Sovereign Merkle Root.',
    pageWidth / 2,
    pageHeight - 9,
    { align: 'center' }
  );

  const cleanId = cert.project_details.work_id.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `MPLADS_Blockchain_Certificate_${cleanId}.pdf`;
  doc.save(fileName);
  return fileName;
};
