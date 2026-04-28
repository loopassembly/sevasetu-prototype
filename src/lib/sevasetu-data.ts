export type NeedNode = {
  id: string;
  label: string;
  ward: string;
  severity: "critical" | "high" | "moderate";
  households: number;
  x: number;
  y: number;
  cluster: "water" | "medical" | "food" | "protection";
};

export type MissionStatus = "needs-review" | "ready" | "dispatching" | "completed";
export type Role = "coordinator" | "field-worker" | "volunteer";
export type ReportStatus = "new" | "triaged" | "mission-created";
export type ReportSourceType = "text" | "image";

export type Mission = {
  id: string;
  title: string;
  ward: string;
  eta: string;
  status: MissionStatus;
  households: number;
  beneficiaries: string;
  language: string;
  skills: string[];
  volunteers: number;
  note: string;
  focusNodeId: string;
  reportIds?: string[];
  assignedVolunteerIds?: string[];
  proofCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type VolunteerRecord = {
  id: string;
  name: string;
  role: string;
  skills: string[];
  languages: string[];
  zone: string;
  availability: number;
  squad: string;
};

export type ReportRecord = {
  id: string;
  sourceType: ReportSourceType;
  rawText: string;
  ward: string;
  category: string;
  urgency: "critical" | "high" | "moderate";
  recommendedSkills: string[];
  actionSignals: string[];
  beneficiaries: string;
  confidence: string;
  summary: string;
  status: ReportStatus;
  source: string;
  imagePath?: string;
  imageUrl?: string;
  missionId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProofRecord = {
  id: string;
  missionId: string;
  note: string;
  volunteerName: string;
  verified: boolean;
  imagePath?: string;
  imageUrl?: string;
  createdAt: string;
};

export type ExtractionResult = {
  summary: string;
  urgency: "critical" | "high" | "moderate";
  ward: string;
  category: string;
  recommendedSkills: string[];
  actionSignals: string[];
  beneficiaries: string;
  confidence: string;
  source: string;
};

export type BriefResult = {
  title: string;
  summary: string;
  deploymentPlan: string[];
  watchouts: string[];
  beneficiaryNotes: string[];
  source: string;
};

export type DashboardPayload = {
  impactStats: typeof impactStats;
  responseTrend: typeof responseTrend;
  fairnessData: typeof fairnessData;
  wardGrid: typeof wardGrid;
  needGraphNodes: NeedNode[];
  needGraphEdges: typeof needGraphEdges;
  missions: Mission[];
  reports: ReportRecord[];
  proofs: ProofRecord[];
  volunteers: VolunteerRecord[];
};

export const impactStats = [
  {
    label: "Hidden needs surfaced",
    value: "184",
    caption: "Signals converted from photos, voice notes, and field reports.",
  },
  {
    label: "Median assignment time",
    value: "6 min",
    caption: "Down from 2.8 hours with manual volunteer coordination.",
  },
  {
    label: "Fairness coverage delta",
    value: "+31%",
    caption: "Underserved wards now receive proportional mission allocation.",
  },
];

export const responseTrend = [
  { day: "Mon", responseTime: 44, verified: 18 },
  { day: "Tue", responseTime: 32, verified: 24 },
  { day: "Wed", responseTime: 27, verified: 31 },
  { day: "Thu", responseTime: 21, verified: 36 },
  { day: "Fri", responseTime: 16, verified: 42 },
  { day: "Sat", responseTime: 13, verified: 50 },
];

export const fairnessData = [
  { ward: "Ward 11", vulnerability: 92, allocation: 88 },
  { ward: "Ward 14", vulnerability: 78, allocation: 74 },
  { ward: "Ward 05", vulnerability: 70, allocation: 68 },
  { ward: "Ward 02", vulnerability: 55, allocation: 58 },
  { ward: "Ward 09", vulnerability: 41, allocation: 47 },
];

export const wardGrid = [
  { ward: "W-01", pressure: 38, served: 74 },
  { ward: "W-02", pressure: 54, served: 69 },
  { ward: "W-03", pressure: 62, served: 63 },
  { ward: "W-04", pressure: 47, served: 81 },
  { ward: "W-05", pressure: 82, served: 52 },
  { ward: "W-06", pressure: 66, served: 59 },
  { ward: "W-07", pressure: 49, served: 76 },
  { ward: "W-08", pressure: 71, served: 58 },
  { ward: "W-09", pressure: 58, served: 70 },
  { ward: "W-10", pressure: 43, served: 83 },
  { ward: "W-11", pressure: 95, served: 64 },
  { ward: "W-12", pressure: 88, served: 56 },
];

export const needGraphNodes: NeedNode[] = [
  {
    id: "safe-water",
    label: "Safe Water",
    ward: "Ward 11",
    severity: "critical",
    households: 160,
    x: 18,
    y: 28,
    cluster: "water",
  },
  {
    id: "heat-relief",
    label: "Heat Relief",
    ward: "Ward 14",
    severity: "high",
    households: 94,
    x: 34,
    y: 18,
    cluster: "protection",
  },
  {
    id: "elder-care",
    label: "Elder Checks",
    ward: "Ward 05",
    severity: "high",
    households: 74,
    x: 52,
    y: 30,
    cluster: "medical",
  },
  {
    id: "maternal-meds",
    label: "Maternal Meds",
    ward: "Ward 11",
    severity: "critical",
    households: 28,
    x: 66,
    y: 24,
    cluster: "medical",
  },
  {
    id: "ration-gap",
    label: "Ration Gap",
    ward: "Ward 08",
    severity: "high",
    households: 122,
    x: 78,
    y: 40,
    cluster: "food",
  },
  {
    id: "school-kit",
    label: "School Kits",
    ward: "Ward 09",
    severity: "moderate",
    households: 64,
    x: 62,
    y: 62,
    cluster: "protection",
  },
  {
    id: "medicine-drop",
    label: "Medicine Drop",
    ward: "Ward 03",
    severity: "high",
    households: 46,
    x: 38,
    y: 64,
    cluster: "medical",
  },
  {
    id: "community-kitchen",
    label: "Kitchen Support",
    ward: "Ward 12",
    severity: "critical",
    households: 138,
    x: 20,
    y: 70,
    cluster: "food",
  },
];

export const needGraphEdges = [
  ["safe-water", "heat-relief"],
  ["safe-water", "community-kitchen"],
  ["heat-relief", "elder-care"],
  ["elder-care", "maternal-meds"],
  ["maternal-meds", "ration-gap"],
  ["ration-gap", "school-kit"],
  ["school-kit", "medicine-drop"],
  ["medicine-drop", "community-kitchen"],
  ["safe-water", "maternal-meds"],
] as const;

export const missions: Mission[] = [
  {
    id: "mission-ward-11",
    title: "Ward 11 Water + Maternal Priority Loop",
    ward: "Ward 11",
    eta: "22 min",
    status: "ready",
    households: 188,
    beneficiaries: "160 water-risk households + 6 high-risk pregnancies",
    language: "Hindi + Bhojpuri",
    skills: ["Nurse support", "Water logistics", "Women volunteers"],
    volunteers: 8,
    note:
      "Combine tanker follow-up, ORS distribution, and pregnancy medicine delivery in a single mission.",
    focusNodeId: "maternal-meds",
    reportIds: ["report-ward-11"],
    assignedVolunteerIds: ["vol-ritu", "vol-zoya", "vol-imran", "vol-arjun"],
  },
  {
    id: "mission-ward-12",
    title: "Ward 12 Kitchen Restock and Child Nutrition Check",
    ward: "Ward 12",
    eta: "34 min",
    status: "dispatching",
    households: 138,
    beneficiaries: "Community kitchen + 47 children under 10",
    language: "Hindi",
    skills: ["Food packaging", "Nutrition screening"],
    volunteers: 6,
    note:
      "Restock staple kits and verify high-risk child nutrition referrals before the evening rush.",
    focusNodeId: "community-kitchen",
    reportIds: ["report-ward-12"],
    assignedVolunteerIds: ["vol-neha", "vol-kabir"],
  },
  {
    id: "mission-ward-05",
    title: "Ward 05 Elder Care Cooling Route",
    ward: "Ward 05",
    eta: "18 min",
    status: "ready",
    households: 74,
    beneficiaries: "74 senior citizens living alone",
    language: "Hindi + Maithili",
    skills: ["Health screening", "Cooling access", "Escort support"],
    volunteers: 5,
    note:
      "Door-to-door checks prioritized by heat vulnerability and missed medicine pickups.",
    focusNodeId: "elder-care",
    reportIds: ["report-ward-05"],
    assignedVolunteerIds: ["vol-sana", "vol-dev", "vol-meena"],
  },
  {
    id: "mission-ward-08",
    title: "Ward 08 Ration Gap Resolution Sprint",
    ward: "Ward 08",
    eta: "41 min",
    status: "needs-review",
    households: 122,
    beneficiaries: "Single-parent and migrant households",
    language: "Hindi + Bangla",
    skills: ["Verification", "Inventory sync", "Translation support"],
    volunteers: 7,
    note:
      "Low-confidence beneficiary records require coordinator approval before dispatch.",
    focusNodeId: "ration-gap",
    reportIds: ["report-ward-08"],
    assignedVolunteerIds: ["vol-priya", "vol-rahul"],
  },
];

export const volunteerSquads = [
  {
    name: "Rapid Relief Cell",
    composition: "2 coordinators · 4 field volunteers · 2 nurses",
    availability: 92,
    coverage: "Water, health, women-first missions",
  },
  {
    name: "Heatwave Response Unit",
    composition: "1 medic · 5 youth volunteers · 1 transport lead",
    availability: 81,
    coverage: "Cooling stations, elder care, hydration loops",
  },
  {
    name: "Community Kitchen Ops",
    composition: "1 chef lead · 4 packers · 1 child welfare volunteer",
    availability: 74,
    coverage: "Dry ration, cooked meals, nutrition screening",
  },
];

export const volunteers: VolunteerRecord[] = [
  {
    id: "vol-ritu",
    name: "Ritu Kumari",
    role: "Field coordinator",
    skills: ["Water logistics", "Women-first outreach", "Verification"],
    languages: ["Hindi", "Bhojpuri"],
    zone: "Ward 11",
    availability: 94,
    squad: "Rapid Relief Cell",
  },
  {
    id: "vol-zoya",
    name: "Zoya Khan",
    role: "Nurse volunteer",
    skills: ["Nurse support", "Maternal health", "ORS distribution"],
    languages: ["Hindi", "Urdu"],
    zone: "Ward 11",
    availability: 88,
    squad: "Rapid Relief Cell",
  },
  {
    id: "vol-imran",
    name: "Imran Alam",
    role: "Mobility lead",
    skills: ["Bike routing", "Last-mile delivery", "Inventory sync"],
    languages: ["Hindi", "Bhojpuri"],
    zone: "Ward 11",
    availability: 91,
    squad: "Rapid Relief Cell",
  },
  {
    id: "vol-arjun",
    name: "Arjun Yadav",
    role: "Community volunteer",
    skills: ["Heat relief", "Cooling station setup", "Crowd support"],
    languages: ["Hindi", "Maithili"],
    zone: "Ward 05",
    availability: 84,
    squad: "Heatwave Response Unit",
  },
  {
    id: "vol-neha",
    name: "Neha Das",
    role: "Nutrition volunteer",
    skills: ["Nutrition screening", "Food packaging", "Child welfare"],
    languages: ["Hindi", "Bangla"],
    zone: "Ward 12",
    availability: 82,
    squad: "Community Kitchen Ops",
  },
  {
    id: "vol-kabir",
    name: "Kabir Singh",
    role: "Operations lead",
    skills: ["Dispatch", "Inventory sync", "Beneficiary confirmation"],
    languages: ["Hindi", "English"],
    zone: "Ward 12",
    availability: 86,
    squad: "Community Kitchen Ops",
  },
  {
    id: "vol-sana",
    name: "Sana Parveen",
    role: "Medical volunteer",
    skills: ["Health screening", "Elder care", "Escort support"],
    languages: ["Hindi", "Maithili"],
    zone: "Ward 05",
    availability: 79,
    squad: "Heatwave Response Unit",
  },
  {
    id: "vol-dev",
    name: "Dev Raj",
    role: "Field volunteer",
    skills: ["Cooling access", "Route support", "Verification"],
    languages: ["Hindi"],
    zone: "Ward 05",
    availability: 75,
    squad: "Heatwave Response Unit",
  },
  {
    id: "vol-meena",
    name: "Meena Rai",
    role: "Community mobilizer",
    skills: ["Women-first outreach", "Verification", "Low-literacy support"],
    languages: ["Hindi", "Maithili"],
    zone: "Ward 05",
    availability: 77,
    squad: "Heatwave Response Unit",
  },
  {
    id: "vol-priya",
    name: "Priya Mondal",
    role: "Translator volunteer",
    skills: ["Translation support", "Inventory sync", "Verification"],
    languages: ["Hindi", "Bangla"],
    zone: "Ward 08",
    availability: 83,
    squad: "Community Kitchen Ops",
  },
  {
    id: "vol-rahul",
    name: "Rahul Saha",
    role: "Stock runner",
    skills: ["Inventory sync", "Last-mile delivery", "Ration packing"],
    languages: ["Hindi", "Bangla"],
    zone: "Ward 08",
    availability: 80,
    squad: "Community Kitchen Ops",
  },
];

export const signalChannels = [
  {
    label: "Paper survey scans",
    caption: "Ward volunteers upload existing paper forms with zero re-entry.",
  },
  {
    label: "Voice notes in local languages",
    caption: "Gemini translates, extracts urgency, and preserves original phrasing.",
  },
  {
    label: "WhatsApp-style field updates",
    caption: "Semi-structured notes become verifiable need cards and duplicate clusters.",
  },
  {
    label: "Beneficiary confirmation loop",
    caption: "QR slips, missed-call flows, or field-worker verification close the mission loop.",
  },
];

export const architectureLayers = [
  {
    title: "Experience layer",
    stack: "Next.js · React 19 · shadcn/ui · Framer Motion",
    detail:
      "A responsive command center for NGOs and a field-friendly mission workflow for volunteers.",
  },
  {
    title: "Coordination layer",
    stack: "Firebase Auth-ready · Firestore · Cloud Storage · Cloud Run",
    detail:
      "Stores reports, missions, and proof packages with public judge access and role-switched demo flows.",
  },
  {
    title: "Intelligence layer",
    stack: "Gemini 2.5 Flash via Google AI SDK",
    detail:
      "Transforms raw field reports into structured needs, concise summaries, and mission-ready briefs.",
  },
  {
    title: "Analytics layer",
    stack: "NeedGraph scoring · fairness guardrails · Maps-ready routing services",
    detail:
      "Tracks fairness, coverage, latency, and route performance for pilot evidence and judge demos.",
  },
];

export const allocationPrinciples = [
  "Do not let high-visibility neighborhoods consume all volunteer attention.",
  "Protect women-led, elderly, migrant, and low-connectivity households from being deprioritized.",
  "Keep every AI recommendation human-approvable and explanation-ready.",
];

export const sampleRawReport = `Voice note from field volunteer Ritu, 4:30 PM.
Ward 11 near Railway JJ cluster still has no tanker refill since yesterday afternoon.
Six pregnant women have not received iron and BP medicine, and one elderly diabetic man fainted due to heat.
Most households are asking for water first, but the anganwadi worker says medicine delivery and ORS should go together.
Lanes are narrow, so bikes and hand-carts are better than one large vehicle.`;

export const defaultExtraction: ExtractionResult = {
  summary:
    "Ward 11 is facing a combined water shortage and maternal-health risk. The note suggests a joint mission with hydration, ORS, and medicine delivery rather than separate volunteer trips.",
  urgency: "critical",
  ward: "Ward 11",
  category: "Water + maternal health",
  recommendedSkills: ["Water logistics", "Nurse support", "Women-first outreach"],
  actionSignals: [
    "No tanker refill since yesterday afternoon",
    "Six pregnant beneficiaries need medication",
    "Narrow lanes favor bikes and hand-carts",
  ],
  beneficiaries: "160 water-risk households + 6 pregnancies + 1 diabetic elder",
  confidence: "92%",
  source: "Prototype fallback",
};

export const defaultBrief: BriefResult = {
  title: "Gemini deployment brief for Ward 11",
  summary:
    "Run one combined route instead of separate deliveries. Lead with safe water and ORS, then prioritize pregnancy medication and diabetic follow-up while the heat index remains high.",
  deploymentPlan: [
    "Dispatch one women-led health squad and one micro-logistics bike pair in parallel.",
    "Stage ORS, iron tablets, and BP medicine at the anganwadi point for hand-off validation.",
    "Use hand-carts in the final 300 meters to avoid tanker delay in narrow lanes.",
  ],
  watchouts: [
    "Do not treat this as water-only; health dependency is explicit in the field note.",
    "Keep at least one volunteer fluent in Bhojpuri for beneficiary verification.",
    "Reconfirm the diabetic elder’s condition before route closure.",
  ],
  beneficiaryNotes: [
    "Pregnant beneficiaries should be contacted before 6 PM due to heat fatigue.",
    "Bundle water, ORS, and medicines to reduce repeat household visits.",
  ],
  source: "Prototype fallback",
};

export const seedReports: ReportRecord[] = [
  {
    id: "report-ward-11",
    sourceType: "text",
    rawText: sampleRawReport,
    ward: "Ward 11",
    category: "Water + maternal health",
    urgency: "critical",
    recommendedSkills: ["Water logistics", "Nurse support", "Women-first outreach"],
    actionSignals: [
      "No tanker refill since yesterday afternoon",
      "Six pregnant beneficiaries need medication",
      "Narrow lanes favor bikes and hand-carts",
    ],
    beneficiaries: "160 water-risk households + 6 pregnancies + 1 diabetic elder",
    confidence: "92%",
    summary:
      "A combined water and maternal-health response is needed in Ward 11, with micro-mobility constraints in narrow lanes.",
    status: "mission-created",
    source: "Seeded pilot data",
    missionId: "mission-ward-11",
    createdAt: "2026-04-28T10:10:00.000Z",
    updatedAt: "2026-04-28T10:10:00.000Z",
  },
  {
    id: "report-ward-12",
    sourceType: "text",
    rawText:
      "Community kitchen stock in Ward 12 will last only four more hours. Child nutrition checks are overdue in 47 households after two missed visits.",
    ward: "Ward 12",
    category: "Food + child nutrition",
    urgency: "high",
    recommendedSkills: ["Food packaging", "Nutrition screening"],
    actionSignals: [
      "Kitchen stock low before evening meal cycle",
      "47 children need nutrition verification",
    ],
    beneficiaries: "Community kitchen + 47 children under 10",
    confidence: "89%",
    summary:
      "Kitchen replenishment and child nutrition verification should be handled in the same Ward 12 route.",
    status: "mission-created",
    source: "Seeded pilot data",
    missionId: "mission-ward-12",
    createdAt: "2026-04-28T09:30:00.000Z",
    updatedAt: "2026-04-28T09:30:00.000Z",
  },
  {
    id: "report-ward-08",
    sourceType: "text",
    rawText:
      "Multiple migrant families in Ward 08 were left out of dry ration distribution because of mismatched beneficiary records and translation issues.",
    ward: "Ward 08",
    category: "Ration verification",
    urgency: "high",
    recommendedSkills: ["Verification", "Translation support", "Inventory sync"],
    actionSignals: [
      "Ration misses linked to data mismatch",
      "Translation support needed for beneficiary confirmation",
    ],
    beneficiaries: "Single-parent and migrant households",
    confidence: "81%",
    summary:
      "Ward 08 needs a ration verification sprint before dispatch can safely scale.",
    status: "triaged",
    source: "Seeded pilot data",
    missionId: "mission-ward-08",
    createdAt: "2026-04-28T08:55:00.000Z",
    updatedAt: "2026-04-28T08:55:00.000Z",
  },
];

export const seedProofs: ProofRecord[] = [
  {
    id: "proof-ward-12",
    missionId: "mission-ward-12",
    note: "Dry ration kits delivered and child nutrition referrals captured at the anganwadi.",
    volunteerName: "Neha Das",
    verified: true,
    createdAt: "2026-04-28T11:15:00.000Z",
  },
];
