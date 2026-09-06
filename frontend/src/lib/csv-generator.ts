export function generateMpladsCsv(
  reportType: 'fund-utilization' | 'ai-insights' | 'compliance',
  data: any,
  house: string
) {
  let headers: string[] = [];
  let rows: string[][] = [];

  if (reportType === 'fund-utilization') {
    headers = ['State', 'Sanctioned (Rs)', 'Expenditure (Rs)', 'Utilization %'];
    rows = data?.state_data?.map((s: any) => [
      s.state || 'N/A',
      s.sanctioned?.toString() || '0',
      s.expenditure?.toString() || '0',
      `${Math.round((s.expenditure / (s.sanctioned || 1)) * 100)}%`
    ]) || [];
  } 
  else if (reportType === 'ai-insights') {
    headers = ['Work ID', 'House', 'Risk Score', 'Completeness', 'Top Factors'];
    rows = data?.top_works?.map((w: any) => [
      w.work_id,
      w.house || 'N/A',
      w.risk_score?.toString() || '0',
      `${Math.round((w.data_completeness || 0) * 100)}%`,
      `"${(w.top_factors || []).join(', ')}"` // quotes for CSV escaping
    ]) || [];
  } 
  else if (reportType === 'compliance') {
    headers = ['Work ID', 'Exception Type', 'Completeness', 'Status'];
    rows = data?.action_queue?.map((w: any) => [
      w.work_id,
      w.exception_type || 'N/A',
      `${Math.round((w.data_completeness || 0) * 100)}%`,
      w.investigation_status?.replace(/_/g, ' ') || 'N/A'
    ]) || [];
  }

  const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const csvBlobUrl = URL.createObjectURL(blob);
  const fileName = `MPLADS_${reportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`;

  return { csvBlobUrl, fileName, headers, rows };
}
