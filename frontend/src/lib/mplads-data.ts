export type RiskLevel = "Low" | "Medium" | "High";
export type ProjectStatus = "Ongoing" | "Completed" | "Delayed" | "Cancelled";

export const FINANCIAL_YEARS = ["2025–26", "2024–25", "2023–24"];

export type StateInfo = {
  id: string;
  name: string;
  x: number; // % position on the stylised map
  y: number;
  projects: number;
  fundsUtilisedCr: number;
  utilisation: number;
  highRisk: number;
  delayed: number;
  risk: RiskLevel;
};

export const STATES: StateInfo[] = [
  { id: "MH", name: "Maharashtra", x: 30, y: 60, projects: 1248, fundsUtilisedCr: 842, utilisation: 81, highRisk: 27, delayed: 41, risk: "Medium" },
  { id: "UP", name: "Uttar Pradesh", x: 45, y: 33, projects: 1642, fundsUtilisedCr: 1104, utilisation: 76, highRisk: 38, delayed: 62, risk: "High" },
  { id: "BR", name: "Bihar", x: 58, y: 38, projects: 986, fundsUtilisedCr: 611, utilisation: 68, highRisk: 31, delayed: 54, risk: "High" },
  { id: "WB", name: "West Bengal", x: 67, y: 44, projects: 742, fundsUtilisedCr: 498, utilisation: 74, highRisk: 18, delayed: 29, risk: "Medium" },
  { id: "TN", name: "Tamil Nadu", x: 38, y: 84, projects: 864, fundsUtilisedCr: 623, utilisation: 88, highRisk: 9, delayed: 14, risk: "Low" },
  { id: "KA", name: "Karnataka", x: 32, y: 74, projects: 796, fundsUtilisedCr: 571, utilisation: 85, highRisk: 11, delayed: 17, risk: "Low" },
  { id: "GJ", name: "Gujarat", x: 19, y: 47, projects: 684, fundsUtilisedCr: 512, utilisation: 87, highRisk: 8, delayed: 12, risk: "Low" },
  { id: "RJ", name: "Rajasthan", x: 26, y: 34, projects: 712, fundsUtilisedCr: 448, utilisation: 71, highRisk: 21, delayed: 33, risk: "Medium" },
  { id: "MP", name: "Madhya Pradesh", x: 37, y: 46, projects: 806, fundsUtilisedCr: 534, utilisation: 73, highRisk: 24, delayed: 36, risk: "Medium" },
  { id: "AP", name: "Andhra Pradesh", x: 43, y: 74, projects: 598, fundsUtilisedCr: 421, utilisation: 82, highRisk: 12, delayed: 19, risk: "Low" },
  { id: "TS", name: "Telangana", x: 40, y: 66, projects: 486, fundsUtilisedCr: 352, utilisation: 84, highRisk: 10, delayed: 15, risk: "Low" },
  { id: "OD", name: "Odisha", x: 59, y: 52, projects: 512, fundsUtilisedCr: 318, utilisation: 69, highRisk: 17, delayed: 26, risk: "Medium" },
  { id: "KL", name: "Kerala", x: 32, y: 88, projects: 402, fundsUtilisedCr: 301, utilisation: 89, highRisk: 6, delayed: 8, risk: "Low" },
  { id: "PB", name: "Punjab", x: 29, y: 20, projects: 316, fundsUtilisedCr: 212, utilisation: 77, highRisk: 9, delayed: 13, risk: "Medium" },
  { id: "AS", name: "Assam", x: 76, y: 36, projects: 348, fundsUtilisedCr: 198, utilisation: 66, highRisk: 14, delayed: 22, risk: "High" },
  { id: "JH", name: "Jharkhand", x: 58, y: 45, projects: 344, fundsUtilisedCr: 201, utilisation: 67, highRisk: 15, delayed: 24, risk: "High" },
  { id: "CG", name: "Chhattisgarh", x: 47, y: 52, projects: 298, fundsUtilisedCr: 186, utilisation: 72, highRisk: 11, delayed: 16, risk: "Medium" },
  { id: "HR", name: "Haryana", x: 32, y: 26, projects: 286, fundsUtilisedCr: 214, utilisation: 83, highRisk: 7, delayed: 10, risk: "Low" },
];

export const DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Kanpur", "Gorakhpur"],
  "Tamil Nadu": ["Coimbatore", "Madurai", "Salem"],
  Karnataka: ["Belagavi", "Mysuru", "Dharwad"],
  Gujarat: ["Surat", "Rajkot", "Vadodara"],
  Assam: ["Kamrup", "Jorhat", "Dibrugarh"],
};

export type Project = {
  id: string;
  name: string;
  state: string;
  district: string;
  constituency: string;
  mp: string;
  agency: string;
  sanctionedL: number;
  spentL: number;
  releasedL: number;
  progress: number;
  risk: RiskLevel;
  riskScore: number;
  status: ProjectStatus;
  sanctionDate: string;
  expectedCompletion: string;
  delayDays: number;
  plannedProgress: number;
  category: string;
  riskReasons: string[];
};

export const PROJECTS: Project[] = [
  {
    id: "MP-2025-001", name: "Community Health Centre", state: "Maharashtra", district: "Pune",
    constituency: "Pune", mp: "Smt. A. Deshmukh", agency: "Pune Zilla Parishad",
    sanctionedL: 45, spentL: 31, releasedL: 36, progress: 72, risk: "Low", riskScore: 24,
    status: "Ongoing", sanctionDate: "12 Apr 2025", expectedCompletion: "28 Feb 2026",
    delayDays: 0, plannedProgress: 74, category: "Health",
    riskReasons: ["Expenditure aligned with physical progress", "No payment irregularity detected"],
  },
  {
    id: "MP-2025-024", name: "Rural Road Development", state: "Bihar", district: "Patna",
    constituency: "Patliputra", mp: "Shri R. K. Singh", agency: "Rural Works Department, Patna",
    sanctionedL: 62, spentL: 58, releasedL: 60, progress: 43, risk: "High", riskScore: 82,
    status: "Delayed", sanctionDate: "03 May 2025", expectedCompletion: "31 Jan 2026",
    delayDays: 74, plannedProgress: 78, category: "Roads",
    riskReasons: [
      "32% cost deviation against sanctioned estimate",
      "Payment spike detected in a single billing cycle",
      "Project delayed by 74 days against schedule",
      "Physical progress far lower than expenditure pattern",
    ],
  },
  {
    id: "MP-2025-047", name: "Community Hall", state: "Maharashtra", district: "Pune",
    constituency: "Baramati", mp: "Smt. A. Deshmukh", agency: "Pune Municipal Corporation",
    sanctionedL: 52, spentL: 38, releasedL: 44, progress: 42, risk: "Medium", riskScore: 61,
    status: "Ongoing", sanctionDate: "22 May 2025", expectedCompletion: "15 Mar 2026",
    delayDays: 18, plannedProgress: 58, category: "Civic Infrastructure",
    riskReasons: ["Progress–expenditure mismatch of 31 percentage points", "Two milestone delays recorded"],
  },
  {
    id: "MP-2025-063", name: "Primary School Additional Block", state: "Uttar Pradesh", district: "Varanasi",
    constituency: "Varanasi", mp: "Shri M. Pandey", agency: "UP Education Works Cell",
    sanctionedL: 38, spentL: 34, releasedL: 34, progress: 91, risk: "Low", riskScore: 19,
    status: "Ongoing", sanctionDate: "09 Apr 2025", expectedCompletion: "10 Dec 2025",
    delayDays: 0, plannedProgress: 88, category: "Education",
    riskReasons: ["Ahead of planned progress", "Documentation complete"],
  },
  {
    id: "MP-2025-088", name: "Drinking Water Pipeline", state: "Bihar", district: "Gaya",
    constituency: "Gaya", mp: "Shri D. Kumar", agency: "PHED Gaya Division",
    sanctionedL: 74, spentL: 69, releasedL: 70, progress: 55, risk: "High", riskScore: 77,
    status: "Delayed", sanctionDate: "17 Apr 2025", expectedCompletion: "20 Feb 2026",
    delayDays: 61, plannedProgress: 80, category: "Water Supply",
    riskReasons: ["Unusual payment clustering near quarter end", "Delay of 61 days", "Cost deviation of 21%"],
  },
  {
    id: "MP-2025-102", name: "Solar Street Lighting", state: "Gujarat", district: "Surat",
    constituency: "Surat", mp: "Smt. P. Patel", agency: "Surat Municipal Corporation",
    sanctionedL: 29, spentL: 26, releasedL: 27, progress: 96, risk: "Low", riskScore: 15,
    status: "Completed", sanctionDate: "05 Apr 2025", expectedCompletion: "30 Sep 2025",
    delayDays: 0, plannedProgress: 96, category: "Energy",
    riskReasons: ["Completed within sanctioned cost"],
  },
  {
    id: "MP-2025-119", name: "Anganwadi Centre Construction", state: "Assam", district: "Kamrup",
    constituency: "Guwahati", mp: "Shri B. Barua", agency: "Kamrup District Council",
    sanctionedL: 24, spentL: 21, releasedL: 22, progress: 48, risk: "Medium", riskScore: 58,
    status: "Delayed", sanctionDate: "28 Apr 2025", expectedCompletion: "18 Jan 2026",
    delayDays: 39, plannedProgress: 70, category: "Women & Child",
    riskReasons: ["Delay of 39 days", "Utilisation running ahead of progress"],
  },
  {
    id: "MP-2025-134", name: "Public Library Modernisation", state: "Tamil Nadu", district: "Madurai",
    constituency: "Madurai", mp: "Shri S. Raman", agency: "Madurai Corporation",
    sanctionedL: 33, spentL: 24, releasedL: 26, progress: 74, risk: "Low", riskScore: 21,
    status: "Ongoing", sanctionDate: "14 Apr 2025", expectedCompletion: "05 Feb 2026",
    delayDays: 0, plannedProgress: 72, category: "Education",
    riskReasons: ["No anomaly detected"],
  },
  {
    id: "MP-2025-156", name: "Check Dam & Water Harvesting", state: "Rajasthan", district: "Jaipur",
    constituency: "Jaipur Rural", mp: "Shri V. Meena", agency: "Water Resources Dept.",
    sanctionedL: 58, spentL: 49, releasedL: 52, progress: 51, risk: "High", riskScore: 74,
    status: "Delayed", sanctionDate: "19 Apr 2025", expectedCompletion: "12 Feb 2026",
    delayDays: 52, plannedProgress: 76, category: "Water Supply",
    riskReasons: ["Similar work sanctioned 4 km away (possible duplication)", "Delay of 52 days"],
  },
  {
    id: "MP-2025-171", name: "Sports Ground Development", state: "Karnataka", district: "Mysuru",
    constituency: "Mysuru", mp: "Smt. K. Rao", agency: "Mysuru City Corporation",
    sanctionedL: 41, spentL: 30, releasedL: 33, progress: 69, risk: "Low", riskScore: 26,
    status: "Ongoing", sanctionDate: "26 Apr 2025", expectedCompletion: "22 Mar 2026",
    delayDays: 0, plannedProgress: 68, category: "Sports",
    riskReasons: ["Within tolerance on all indicators"],
  },
  {
    id: "MP-2025-188", name: "Bus Shelter Cluster", state: "West Bengal", district: "Howrah",
    constituency: "Howrah", mp: "Shri T. Ghosh", agency: "Howrah Municipal Corporation",
    sanctionedL: 18, spentL: 17, releasedL: 18, progress: 35, risk: "High", riskScore: 79,
    status: "Delayed", sanctionDate: "11 Apr 2025", expectedCompletion: "15 Dec 2025",
    delayDays: 88, plannedProgress: 82, category: "Civic Infrastructure",
    riskReasons: ["94% funds spent against 35% progress", "Delay of 88 days", "Duplicate description found in 2 works"],
  },
  {
    id: "MP-2025-203", name: "Primary Health Sub-Centre", state: "Odisha", district: "Cuttack",
    constituency: "Cuttack", mp: "Shri N. Mohapatra", agency: "Odisha Health Works Unit",
    sanctionedL: 36, spentL: 22, releasedL: 26, progress: 61, risk: "Medium", riskScore: 47,
    status: "Ongoing", sanctionDate: "02 May 2025", expectedCompletion: "28 Feb 2026",
    delayDays: 12, plannedProgress: 66, category: "Health",
    riskReasons: ["Minor schedule slippage"],
  },
  {
    id: "MP-2025-218", name: "Village Drainage Network", state: "Madhya Pradesh", district: "Indore",
    constituency: "Indore", mp: "Smt. R. Verma", agency: "Indore Rural Works",
    sanctionedL: 47, spentL: 12, releasedL: 20, progress: 22, risk: "Medium", riskScore: 55,
    status: "Ongoing", sanctionDate: "30 Jun 2025", expectedCompletion: "30 Apr 2026",
    delayDays: 21, plannedProgress: 40, category: "Sanitation",
    riskReasons: ["Slow fund utilisation", "Delay of 21 days"],
  },
  {
    id: "MP-2025-235", name: "Skill Training Centre", state: "Punjab", district: "Ludhiana",
    constituency: "Ludhiana", mp: "Shri H. Gill", agency: "Punjab Skill Mission",
    sanctionedL: 55, spentL: 41, releasedL: 45, progress: 78, risk: "Low", riskScore: 28,
    status: "Ongoing", sanctionDate: "21 Apr 2025", expectedCompletion: "18 Mar 2026",
    delayDays: 0, plannedProgress: 76, category: "Skill Development",
    riskReasons: ["No anomaly detected"],
  },
  {
    id: "MP-2025-249", name: "Crematorium Upgradation", state: "Jharkhand", district: "Ranchi",
    constituency: "Ranchi", mp: "Shri A. Oraon", agency: "Ranchi Municipal Corporation",
    sanctionedL: 21, spentL: 20, releasedL: 21, progress: 40, risk: "High", riskScore: 71,
    status: "Delayed", sanctionDate: "08 Apr 2025", expectedCompletion: "10 Jan 2026",
    delayDays: 66, plannedProgress: 79, category: "Civic Infrastructure",
    riskReasons: ["Expenditure at 95% with 40% progress", "Delay of 66 days"],
  },
  {
    id: "MP-2025-262", name: "Cattle Shed & Fodder Unit", state: "Haryana", district: "Hisar",
    constituency: "Hisar", mp: "Shri J. Sheoran", agency: "Animal Husbandry Dept.",
    sanctionedL: 16, spentL: 15, releasedL: 16, progress: 100, risk: "Low", riskScore: 12,
    status: "Completed", sanctionDate: "07 Apr 2025", expectedCompletion: "15 Aug 2025",
    delayDays: 0, plannedProgress: 100, category: "Agriculture",
    riskReasons: ["Completed and certified"],
  },
  {
    id: "MP-2025-277", name: "Riverfront Walkway", state: "Telangana", district: "Hyderabad",
    constituency: "Secunderabad", mp: "Smt. L. Reddy", agency: "GHMC",
    sanctionedL: 68, spentL: 39, releasedL: 46, progress: 57, risk: "Medium", riskScore: 52,
    status: "Ongoing", sanctionDate: "15 May 2025", expectedCompletion: "30 Apr 2026",
    delayDays: 9, plannedProgress: 62, category: "Civic Infrastructure",
    riskReasons: ["Slight schedule slippage"],
  },
  {
    id: "MP-2025-291", name: "Cyclone Shelter Repair", state: "Andhra Pradesh", district: "Kakinada",
    constituency: "Kakinada", mp: "Shri C. Naidu", agency: "AP Disaster Management Cell",
    sanctionedL: 27, spentL: 0, releasedL: 0, progress: 0, risk: "Medium", riskScore: 44,
    status: "Cancelled", sanctionDate: "18 Apr 2025", expectedCompletion: "—",
    delayDays: 0, plannedProgress: 0, category: "Disaster Management",
    riskReasons: ["Work cancelled — site handed to state scheme"],
  },
];

export const KPIS = [
  { key: "projects", label: "Total Projects", value: "12,486", sub: "+8.4% from previous year", trend: "up" as const, tone: "navy" as const },
  { key: "funds", label: "Total Funds Utilized", value: "₹8,42,67,00,000", sub: "78.4% utilization", trend: "up" as const, tone: "green" as const },
  { key: "risk", label: "High-Risk Projects", value: "247", sub: "18 new risks detected", trend: "up" as const, tone: "danger" as const },
  { key: "delayed", label: "Projects Delayed", value: "386", sub: "3.1% of active projects", trend: "down" as const, tone: "warning" as const },
];

export const RISK_CATEGORIES = [
  { key: "cost-overrun", title: "Cost Overrun", count: 84, blurb: "Potential excess expenditure detected against sanctioned estimates." },
  { key: "duplicate-works", title: "Duplicate Works", count: 23, blurb: "Potential duplicate or overlapping works detected in nearby locations." },
  { key: "unusual-payments", title: "Unusual Payments", count: 41, blurb: "Unusual payment patterns detected in billing cycles." },
  { key: "delayed-projects", title: "Delayed Projects", count: 386, blurb: "Projects showing significant implementation delays." },
];

export const RISK_DISTRIBUTION = [
  { name: "Low Risk", value: 72, color: "var(--success)" },
  { name: "Medium Risk", value: 21, color: "var(--warning)" },
  { name: "High Risk", value: 7, color: "var(--danger)" },
];

export const RISK_FACTORS = [
  { name: "Cost deviation", value: 76 },
  { name: "Payment irregularity", value: 64 },
  { name: "Project delay", value: 58 },
  { name: "Duplicate project similarity", value: 41 },
  { name: "Fund utilisation anomaly", value: 52 },
  { name: "Progress vs expenditure mismatch", value: 69 },
];

export type Alert = {
  id: string;
  level: RiskLevel;
  title: string;
  projectId: string;
  project: string;
  facts: { label: string; value: string }[];
  confidence: number;
  action: "Investigate" | "View Details";
};

export const ALERTS: Alert[] = [
  {
    id: "AL-4412", level: "High", title: "Cost Overrun Detected", projectId: "MP-2025-024",
    project: "Rural Road Development – Patna",
    facts: [{ label: "Sanctioned", value: "₹62 L" }, { label: "Estimated Final Cost", value: "₹91 L" }],
    confidence: 94, action: "Investigate",
  },
  {
    id: "AL-4409", level: "Medium", title: "Progress–Expenditure Mismatch", projectId: "MP-2025-047",
    project: "Community Hall – Pune",
    facts: [{ label: "Spent", value: "₹38 L" }, { label: "Physical Progress", value: "42%" }],
    confidence: 87, action: "View Details",
  },
  {
    id: "AL-4401", level: "High", title: "Unusual Payment Pattern", projectId: "MP-2025-088",
    project: "Drinking Water Pipeline – Gaya",
    facts: [{ label: "Released", value: "₹70 L" }, { label: "Single-cycle payment", value: "₹41 L" }],
    confidence: 91, action: "Investigate",
  },
  {
    id: "AL-4396", level: "Medium", title: "Possible Duplicate Work", projectId: "MP-2025-156",
    project: "Check Dam & Water Harvesting – Jaipur",
    facts: [{ label: "Similarity", value: "88%" }, { label: "Distance", value: "4 km" }],
    confidence: 82, action: "View Details",
  },
  {
    id: "AL-4390", level: "High", title: "Expenditure Far Ahead of Progress", projectId: "MP-2025-188",
    project: "Bus Shelter Cluster – Howrah",
    facts: [{ label: "Funds used", value: "94%" }, { label: "Progress", value: "35%" }],
    confidence: 96, action: "Investigate",
  },
  {
    id: "AL-4385", level: "Low", title: "Documentation Pending", projectId: "MP-2025-203",
    project: "Primary Health Sub-Centre – Cuttack",
    facts: [{ label: "Missing", value: "Work order copy" }, { label: "Pending since", value: "23 days" }],
    confidence: 78, action: "View Details",
  },
];

export const AI_INSIGHTS = [
  {
    no: "01", title: "Unusual spending pattern detected",
    body: "3 projects in Gaya district show unusually high expenditure during the final implementation stage, without a matching increase in physical progress.",
    why: "Generated because month-end expenditure was 2.4× the project's own average, while progress moved by less than 5%.",
    impact: "Medium" as const, cta: "View Projects",
  },
  {
    no: "02", title: "Possible duplicate works",
    body: "7 projects were identified with highly similar location, description and cost characteristics across two constituencies.",
    why: "Generated because work descriptions matched above 85% similarity and sanctioned sites were within 5 km of each other.",
    impact: "High" as const, cta: "Investigate",
  },
  {
    no: "03", title: "Increasing project delays",
    body: "Projects in 4 districts show increasing completion delays compared with the previous two financial years.",
    why: "Generated because average delay rose from 28 to 61 days for comparable work categories.",
    impact: "Medium" as const, cta: "View Trend",
  },
  {
    no: "04", title: "Low fund utilisation cluster",
    body: "11 sanctioned works in Assam and Jharkhand have released funds but utilisation below 30% after six months.",
    why: "Generated because released-to-spent ratio stayed under 0.3 for more than 180 days after sanction.",
    impact: "High" as const, cta: "View Projects",
  },
  {
    no: "05", title: "Strong performers worth replicating",
    body: "Kerala and Tamil Nadu completed 89% of sanctioned works within cost, driven by faster agency-level approvals.",
    why: "Generated because completion-within-cost rate exceeded the national average by more than 12 points.",
    impact: "Low" as const, cta: "View Trend",
  },
];

export const COMPLIANCE = {
  overall: 91,
  breakdown: [
    { name: "Documentation Compliance", value: 96 },
    { name: "Financial Compliance", value: 89 },
    { name: "Project Timeline Compliance", value: 84 },
    { name: "Completion Compliance", value: 93 },
  ],
  issues: [
    { project: "Rural Road Development – Patna", issue: "Utilisation certificate not uploaded", severity: "High" as RiskLevel, due: "18 Sep 2026" },
    { project: "Community Hall – Pune", issue: "Third-party inspection report pending", severity: "Medium" as RiskLevel, due: "26 Sep 2026" },
    { project: "Bus Shelter Cluster – Howrah", issue: "Physical progress photographs missing", severity: "High" as RiskLevel, due: "14 Sep 2026" },
    { project: "Village Drainage Network – Indore", issue: "Revised timeline approval awaited", severity: "Medium" as RiskLevel, due: "02 Oct 2026" },
    { project: "Primary Health Sub-Centre – Cuttack", issue: "Work order copy not on record", severity: "Low" as RiskLevel, due: "09 Oct 2026" },
  ],
};

export const UTILISATION_TREND = [
  { month: "Apr", "2025–26": 4.2, "2024–25": 3.6, "2023–24": 3.1 },
  { month: "May", "2025–26": 8.1, "2024–25": 7.2, "2023–24": 6.4 },
  { month: "Jun", "2025–26": 13.4, "2024–25": 11.8, "2023–24": 10.2 },
  { month: "Jul", "2025–26": 21.6, "2024–25": 18.4, "2023–24": 16.1 },
  { month: "Aug", "2025–26": 30.2, "2024–25": 26.1, "2023–24": 23.4 },
  { month: "Sep", "2025–26": 38.8, "2024–25": 34.2, "2023–24": 30.6 },
  { month: "Oct", "2025–26": 47.1, "2024–25": 42.3, "2023–24": 38.2 },
  { month: "Nov", "2025–26": 55.6, "2024–25": 50.1, "2023–24": 45.8 },
  { month: "Dec", "2025–26": 63.2, "2024–25": 57.6, "2023–24": 52.4 },
  { month: "Jan", "2025–26": 70.4, "2024–25": 64.2, "2023–24": 58.9 },
  { month: "Feb", "2025–26": 75.1, "2024–25": 70.4, "2023–24": 65.1 },
  { month: "Mar", "2025–26": 78.4, "2024–25": 74.8, "2023–24": 70.2 },
];

export const STATUS_SPLIT = [
  { name: "Completed", value: 7412, color: "var(--success)" },
  { name: "Ongoing", value: 4302, color: "var(--saffron)" },
  { name: "Delayed", value: 386, color: "var(--warning)" },
  { name: "Cancelled", value: 386, color: "var(--danger)" },
];

export const EXPENDITURE_TIMELINE = [
  { month: "Apr", spent: 4 },
  { month: "May", spent: 9 },
  { month: "Jun", spent: 15 },
  { month: "Jul", spent: 24 },
  { month: "Aug", spent: 41 },
  { month: "Sep", spent: 58 },
];

export const REPORTS = [
  { key: "performance", title: "Project Performance Report", blurb: "Sanctioned vs completed works, progress and agency performance." },
  { key: "financial", title: "Financial Utilization Report", blurb: "Release, expenditure and utilisation across constituencies." },
  { key: "risk", title: "Risk & Anomaly Report", blurb: "All AI-flagged cases with confidence and recommended action." },
  { key: "compliance", title: "Compliance Report", blurb: "Documentation, financial and timeline compliance status." },
  { key: "state", title: "State-wise Performance Report", blurb: "Comparative state and district level performance summary." },
];

export const NOTIFICATIONS = [
  { id: "n1", level: "High" as RiskLevel, text: "High-risk project detected", detail: "Bus Shelter Cluster – Howrah", time: "12 min ago" },
  { id: "n2", level: "Medium" as RiskLevel, text: "12 projects approaching deadline", detail: "Across 5 states", time: "1 hr ago" },
  { id: "n3", level: "Medium" as RiskLevel, text: "Unusual payment pattern detected", detail: "Drinking Water Pipeline – Gaya", time: "3 hrs ago" },
  { id: "n4", level: "Low" as RiskLevel, text: "Monthly compliance report generated", detail: "August 2026", time: "Yesterday" },
];

export const formatL = (l: number) => `₹${l} L`;

export const AI_SUGGESTIONS = [
  "Show high-risk projects in Maharashtra.",
  "Which districts have the highest delays?",
  "Show projects with cost overruns above 20%.",
  "Which states have low fund utilisation?",
];

export function answerMpladsQuestion(q: string): { text: string; rows?: { label: string; value: string }[] } {
  const s = q.toLowerCase();
  if (s.includes("maharashtra") || s.includes("high-risk") || s.includes("high risk")) {
    const rows = PROJECTS.filter((p) => p.risk === "High").slice(0, 4).map((p) => ({
      label: `${p.name} — ${p.district}`,
      value: `Risk ${p.riskScore}/100`,
    }));
    return { text: "These works are currently flagged as high risk. Each was flagged for cost deviation, delay or a progress–expenditure mismatch.", rows };
  }
  if (s.includes("delay")) {
    return {
      text: "Districts with the highest average delay this financial year:",
      rows: [
        { label: "Howrah, West Bengal", value: "88 days" },
        { label: "Patna, Bihar", value: "74 days" },
        { label: "Ranchi, Jharkhand", value: "66 days" },
        { label: "Gaya, Bihar", value: "61 days" },
      ],
    };
  }
  if (s.includes("overrun") || s.includes("cost")) {
    return {
      text: "84 works show cost overrun above 20%. The largest deviations are:",
      rows: [
        { label: "Rural Road Development – Patna", value: "+32%" },
        { label: "Drinking Water Pipeline – Gaya", value: "+21%" },
        { label: "Check Dam – Jaipur", value: "+20%" },
      ],
    };
  }
  if (s.includes("utilis") || s.includes("utiliz") || s.includes("fund")) {
    const rows = [...STATES].sort((a, b) => a.utilisation - b.utilisation).slice(0, 4)
      .map((st) => ({ label: st.name, value: `${st.utilisation}% utilised` }));
    return { text: "States with the lowest fund utilisation this financial year:", rows };
  }
  if (s.includes("why")) {
    return {
      text: "A work is marked high risk when two or more indicators cross their thresholds — for example cost deviation above 20%, delay beyond 45 days, or spending far ahead of measured progress.",
      rows: [
        { label: "Cost deviation", value: "32% (threshold 20%)" },
        { label: "Delay", value: "74 days (threshold 45)" },
        { label: "Progress vs expenditure", value: "43% vs 94%" },
      ],
    };
  }
  return {
    text: "I can help with project risk, fund utilisation, delays, duplicate works and compliance. Try asking about a state, district or risk type.",
  };
}
