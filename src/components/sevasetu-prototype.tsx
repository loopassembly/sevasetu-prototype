"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Activity,
  ArrowRight,
  BellDot,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Clapperboard,
  Command,
  FileUp,
  LayoutDashboard,
  MapPinned,
  Radio,
  RefreshCcw,
  Route,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  Users,
  Waypoints,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";
import {
  allocationPrinciples,
  architectureLayers,
  defaultBrief,
  defaultExtraction,
  fairnessData,
  impactStats,
  missions,
  needGraphEdges,
  needGraphNodes,
  responseTrend,
  sampleRawReport,
  signalChannels,
  volunteerSquads,
  volunteers,
  wardGrid,
  type BriefResult,
  type DashboardPayload,
  type ExtractionResult,
  type Mission,
  type MissionStatus,
  type NeedNode,
  type ProofRecord,
  type ReportRecord,
  type Role,
} from "@/lib/sevasetu-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const chartConfig = {
  responseTime: {
    label: "Minutes to assign",
    color: "#68d5bf",
  },
  verified: {
    label: "Verified missions",
    color: "#7ca7ff",
  },
  vulnerability: {
    label: "Vulnerability score",
    color: "#ffbe6d",
  },
  allocation: {
    label: "Allocation share",
    color: "#8ab4ff",
  },
} satisfies ChartConfig;

const clusterTone = {
  water: {
    glow: "rgba(89,160,255,0.34)",
    fill: "#74a2ff",
    label: "from-sky-500/18 to-sky-300/5",
  },
  medical: {
    glow: "rgba(255,113,145,0.28)",
    fill: "#ff6f96",
    label: "from-rose-500/18 to-rose-300/5",
  },
  food: {
    glow: "rgba(255,188,110,0.28)",
    fill: "#ffb86a",
    label: "from-amber-400/18 to-orange-300/5",
  },
  protection: {
    glow: "rgba(102,217,195,0.28)",
    fill: "#66d9c3",
    label: "from-teal-400/18 to-emerald-300/5",
  },
} as const;

const severityTone = {
  critical: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  high: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  moderate: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
} as const;

const statusTone: Record<MissionStatus, string> = {
  "needs-review": "border-amber-400/35 bg-amber-500/12 text-amber-100",
  ready: "border-emerald-400/35 bg-emerald-500/12 text-emerald-100",
  dispatching: "border-sky-400/35 bg-sky-500/12 text-sky-100",
  completed: "border-teal-400/35 bg-teal-500/12 text-teal-100",
};

const roleSummary: Record<Role, string> = {
  coordinator: "Approve missions, balance fairness, and dispatch the best-fit squad.",
  "field-worker": "Convert photos, messy survey notes, and voice updates into action-ready need signals.",
  volunteer: "See a clear mission, route context, and proof workflow without coordinator overhead.",
};

const roleAccent: Record<Role, string> = {
  coordinator: "from-[#5f86ff] to-[#7ca7ff]",
  "field-worker": "from-[#ffb86a] to-[#ffd9a6]",
  volunteer: "from-[#66d9c3] to-[#9ff2e3]",
};

const roleIndicator: Record<Role, string> = {
  coordinator: "Ops mode",
  "field-worker": "Field mode",
  volunteer: "Volunteer mode",
};

const emptyReports: ReportRecord[] = [];
const emptyProofs: ProofRecord[] = [];

const stagger: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const missionCardPalette = [
  "from-[#dce4ff] to-[#d9f2ff]",
  "from-[#ffe2cf] to-[#fff3df]",
  "from-[#ded8ff] to-[#f1ecff]",
  "from-[#d7f4eb] to-[#edfef7]",
] as const;

type ReportMutationResponse = {
  report: ReportRecord;
  mission: Mission;
  extraction: ExtractionResult;
};

type DemoStep = {
  id: string;
  eyebrow: string;
  label: string;
  title: string;
  narration: string;
  cue: string;
  role: Role;
  tab: string;
  actionLabel: string;
};

const demoSteps: DemoStep[] = [
  {
    id: "overview",
    eyebrow: "Step 01",
    label: "Command context",
    title: "Open with the command center and frame the problem fast.",
    narration:
      "Introduce SevaSetu as a live volunteer orchestration layer for NGOs handling messy field signals across wards.",
    cue: "Point to the command shell, activity metrics, and mission cards before touching anything else.",
    role: "coordinator",
    tab: "command",
    actionLabel: "Prep command view",
  },
  {
    id: "capture",
    eyebrow: "Step 02",
    label: "Field intake",
    title: "Switch to field capture and show how raw signals enter the system.",
    narration:
      "Move into the field-worker perspective and explain that paper notes, photos, and voice updates are normalized into one intake flow.",
    cue: "Use the sample note so the recording stays clean and repeatable every time.",
    role: "field-worker",
    tab: "capture",
    actionLabel: "Load sample intake",
  },
  {
    id: "mission",
    eyebrow: "Step 03",
    label: "Mission creation",
    title: "Convert that intake into a live report and mission.",
    narration:
      "Show the moment where unstructured field evidence becomes an actionable mission inside the queue.",
    cue: "Click the demo action once and then pause on the new extraction output and mission state.",
    role: "field-worker",
    tab: "capture",
    actionLabel: "Create sample report",
  },
  {
    id: "briefing",
    eyebrow: "Step 04",
    label: "AI coordination",
    title: "Generate the AI briefing that tells volunteers exactly what to do.",
    narration:
      "Switch back to coordinator mode and let the copilot produce the mission brief, risks, and dispatch guidance.",
    cue: "Stay on the generated brief long enough to show the plan is specific, not generic.",
    role: "coordinator",
    tab: "copilot",
    actionLabel: "Generate AI brief",
  },
  {
    id: "fairness",
    eyebrow: "Step 05",
    label: "Allocation fairness",
    title: "Show that SevaSetu does not only optimize speed, it protects equity.",
    narration:
      "Use the fairness lens to explain how underserved wards are surfaced before louder, better-connected neighborhoods dominate volunteer supply.",
    cue: "Talk over the coverage deltas and ward pressure comparisons while this tab is open.",
    role: "coordinator",
    tab: "fairness",
    actionLabel: "Open fairness lens",
  },
  {
    id: "proof",
    eyebrow: "Step 06",
    label: "Closure proof",
    title: "Close the loop with the volunteer proof package.",
    narration:
      "Switch to the volunteer perspective and demonstrate that each mission ends with a verifiable proof trail, not a vague status update.",
    cue: "The proof dialog will open with a ready note so you can show closure in one take.",
    role: "volunteer",
    tab: "command",
    actionLabel: "Open proof flow",
  },
  {
    id: "architecture",
    eyebrow: "Step 07",
    label: "Judge close",
    title: "End on the architecture and cloud credibility story.",
    narration:
      "Close the video by showing the system architecture, Google Cloud positioning, and why the stack is deployable beyond a mockup.",
    cue: "Finish here so the judges leave with trust in the implementation, not just the visuals.",
    role: "coordinator",
    tab: "architecture",
    actionLabel: "Open architecture",
  },
] as const;

const workspaceItems = [
  {
    id: "command",
    label: "Command center",
    description: "dispatch and live queue",
    icon: LayoutDashboard,
  },
  {
    id: "capture",
    label: "Field capture",
    description: "reports and intake",
    icon: ScanSearch,
  },
  {
    id: "fairness",
    label: "Fairness lens",
    description: "allocation guardrails",
    icon: ShieldCheck,
  },
  {
    id: "copilot",
    label: "AI copilot",
    description: "briefing engine",
    icon: Bot,
  },
  {
    id: "architecture",
    label: "Architecture",
    description: "systems and deployment",
    icon: Activity,
  },
] as const;

async function getDashboard() {
  const response = await fetch("/api/dashboard", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Unable to load the SevaSetu dashboard.");
  }

  return (await response.json()) as DashboardPayload;
}

async function postIntelligence<T>(payload: Record<string, unknown>) {
  const response = await fetch("/api/intelligence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to reach the intelligence service.");
  }

  return (await response.json()) as T;
}

async function createTextReport(rawText: string) {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawText }),
  });

  if (!response.ok) {
    throw new Error("Unable to create the field report.");
  }

  return (await response.json()) as ReportMutationResponse;
}

async function createImageReport(note: string, file: File) {
  const formData = new FormData();
  formData.append("note", note);
  formData.append("file", file);

  const response = await fetch("/api/reports/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Unable to upload the field image.");
  }

  return (await response.json()) as ReportMutationResponse;
}

async function patchMissionStatus(missionId: string, status: MissionStatus) {
  const response = await fetch(`/api/missions/${missionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Unable to update mission status.");
  }
}

async function submitProof(payload: {
  missionId: string;
  note: string;
  volunteerName: string;
  file?: File | null;
}) {
  const formData = new FormData();
  formData.append("missionId", payload.missionId);
  formData.append("note", payload.note);
  formData.append("volunteerName", payload.volunteerName);

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const response = await fetch("/api/proofs", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Unable to submit proof.");
  }
}

export function SevaSetuPrototype() {
  const [activeTab, setActiveTab] = useState("command");
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [role, setRole] = useState<Role>(() => {
    if (typeof window === "undefined") {
      return "coordinator";
    }

    const savedRole = window.localStorage.getItem("sevasetu-role");
    return savedRole === "coordinator" || savedRole === "field-worker" || savedRole === "volunteer"
      ? savedRole
      : "coordinator";
  });
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [missionSearch, setMissionSearch] = useState("");
  const [selectedMissionId, setSelectedMissionId] = useState(missions[0].id);
  const [rawReport, setRawReport] = useState(sampleRawReport);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult>(defaultExtraction);
  const [brief, setBrief] = useState<BriefResult>(defaultBrief);
  const [proofNote, setProofNote] = useState("");
  const [proofVolunteerName, setProofVolunteerName] = useState("Ritu Kumari");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [isRunningDemoAction, setIsRunningDemoAction] = useState(false);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isExtracting, startExtractionTransition] = useTransition();
  const [isBriefing, startBriefTransition] = useTransition();
  const [isUpdatingMission, startMissionTransition] = useTransition();
  const [isSubmittingProof, startProofTransition] = useTransition();
  const deferredMissionSearch = useDeferredValue(missionSearch);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const missionQueueRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem("sevasetu-role", role);
  }, [role]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const payload = await getDashboard();

        if (cancelled) {
          return;
        }

        startRefreshTransition(() => {
          setDashboard(payload);
          setSelectedMissionId(payload.missions[0]?.id ?? missions[0].id);
        });
      } catch (error) {
        if (!cancelled) {
          setOperationMessage(error instanceof Error ? error.message : "Dashboard refresh failed.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const liveImpactStats = dashboard?.impactStats ?? impactStats;
  const liveResponseTrend = dashboard?.responseTrend ?? responseTrend;
  const liveFairnessData = dashboard?.fairnessData ?? fairnessData;
  const liveWardGrid = dashboard?.wardGrid ?? wardGrid;
  const liveNodes = dashboard?.needGraphNodes ?? needGraphNodes;
  const liveEdges = dashboard?.needGraphEdges ?? needGraphEdges;
  const missionList = dashboard?.missions?.length ? dashboard.missions : missions;
  const reportList = dashboard?.reports ?? emptyReports;
  const proofList = dashboard?.proofs ?? emptyProofs;
  const volunteerList = dashboard?.volunteers?.length ? dashboard.volunteers : volunteers;

  const filteredMissions = useMemo(() => {
    const query = deferredMissionSearch.trim().toLowerCase();

    if (!query) {
      return missionList;
    }

    return missionList.filter((mission) =>
      [mission.title, mission.ward, mission.language, mission.status, mission.note]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredMissionSearch, missionList]);

  const selectedMission = useMemo(
    () => missionList.find((mission) => mission.id === selectedMissionId) ?? missionList[0],
    [missionList, selectedMissionId],
  );
  const firstActionableMission = useMemo(
    () => missionList.find((mission) => mission.status !== "completed") ?? missionList[0],
    [missionList],
  );
  const activeDemoStep = demoSteps[demoStepIndex] ?? demoSteps[0];

  const selectedMissionProofs = selectedMission
    ? proofList.filter((proof) => proof.missionId === selectedMission.id)
    : emptyProofs;

  const activeMissions = missionList.slice(0, 3);
  const urgentReports = reportList.slice(0, 4);
  const highlightedVolunteers = volunteerList.slice(0, 5);
  const latestProofs = proofList.slice(0, 3);
  const aiLive = !extraction.source.toLowerCase().includes("fallback");
  const constrainedWard =
    liveNodes.reduce(
      (best, node) => (node.households > best.households ? node : best),
      liveNodes[0] ?? needGraphNodes[0],
    )?.ward ?? "Ward 11";

  function focusWorkspace(
    nextTab: string,
    target: "section" | "mission-queue" = "section",
    behavior: ScrollBehavior = "smooth",
  ) {
    setActiveTab(nextTab);

    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      const focusTarget =
        target === "mission-queue" ? missionQueueRef.current : sectionRefs.current[nextTab];

      focusTarget?.scrollIntoView({
        behavior,
        block: "start",
      });
    }, 70);
  }

  function focusDemoStep(nextIndex: number) {
    const clampedIndex = Math.max(0, Math.min(nextIndex, demoSteps.length - 1));
    const step = demoSteps[clampedIndex];
    const focusMission =
      step.id === "briefing" || step.id === "fairness" || step.id === "proof"
        ? firstActionableMission
        : missionList[0] ?? missions[0];

    setDemoStepIndex(clampedIndex);
    setRole(step.role);
    focusWorkspace(step.tab);
    setIsProofDialogOpen(false);

    if (focusMission?.id) {
      setSelectedMissionId(focusMission.id);
    }

    if (step.id === "capture" || step.id === "mission") {
      setRawReport((current) => current.trim() || sampleRawReport);
      setUploadFile(null);
    }
  }

  function advanceDemoStep(direction: -1 | 1) {
    focusDemoStep(demoStepIndex + direction);
  }

  async function handleResetDemoFlow() {
    const fallbackMissionId = firstActionableMission?.id ?? missions[0].id;

    setMissionSearch("");
    setRawReport(sampleRawReport);
    setUploadFile(null);
    setExtraction(defaultExtraction);
    setBrief(defaultBrief);
    setProofNote("");
    setProofVolunteerName("Ritu Kumari");
    setProofFile(null);
    setOperationMessage(
      "Demo flow reset. Start from the command center, then walk step by step using the storyboard.",
    );
    focusDemoStep(0);
    setSelectedMissionId(fallbackMissionId);

    await refreshDashboard(fallbackMissionId);
  }

  async function handleRunDemoAction() {
    const step = activeDemoStep;
    setIsRunningDemoAction(true);

    try {
      switch (step.id) {
        case "overview":
          setOperationMessage(
            "Lead with the command center, explain the live queue, then move to field capture.",
          );
          break;
        case "capture":
          setRawReport(sampleRawReport);
          setUploadFile(null);
          setOperationMessage(
            "Sample intake loaded. Talk through the field channels, then create the live report.",
          );
          break;
        case "mission":
          if (!rawReport.trim()) {
            setRawReport(sampleRawReport);
          }
          await handleAnalyzeReport();
          break;
        case "briefing":
          await handleGenerateBrief();
          break;
        case "fairness":
          setOperationMessage(
            "Fairness lens is in focus. Use this moment to explain protected allocation and coverage gaps.",
          );
          break;
        case "proof":
          setProofVolunteerName("Ritu Kumari");
          setProofNote(
            "Delivered 24 ORS kits, verified pregnancy medicine handoff, and logged beneficiary acknowledgement for 11 households.",
          );
          setProofFile(null);
          setIsProofDialogOpen(true);
          setOperationMessage(
            "Proof flow is ready. Submit the package to show verified mission closure in the recording.",
          );
          break;
        case "architecture":
          setOperationMessage(
            "Finish here with the architecture story, Firestore persistence, Gemini intelligence, and cloud deployment.",
          );
          break;
        default:
          break;
      }
    } finally {
      setIsRunningDemoAction(false);
    }
  }

  async function refreshDashboard(nextMissionId?: string) {
    try {
      const payload = await getDashboard();
      startRefreshTransition(() => {
        setDashboard(payload);
        const fallbackMissionId = payload.missions[0]?.id ?? missions[0].id;
        const resolvedMissionId =
          nextMissionId && payload.missions.some((mission) => mission.id === nextMissionId)
            ? nextMissionId
            : payload.missions.some((mission) => mission.id === selectedMissionId)
              ? selectedMissionId
              : fallbackMissionId;

        setSelectedMissionId(resolvedMissionId);
      });
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "Dashboard refresh failed.");
    }
  }

  async function handleAnalyzeReport() {
    const trimmedReport = rawReport.trim();

    if (!trimmedReport && !uploadFile) {
      setOperationMessage("Add a field note or upload an image before analysis.");
      return;
    }

    try {
      const result = uploadFile
        ? await createImageReport(trimmedReport, uploadFile)
        : await createTextReport(trimmedReport);

      startExtractionTransition(() => {
        setExtraction(result.extraction);
        setSelectedMissionId(result.mission.id);
        setActiveTab("capture");
        setOperationMessage(
          `Mission created for ${result.mission.ward}. The intake is now flowing into the live operations queue.`,
        );
      });

      setUploadFile(null);
      await refreshDashboard(result.mission.id);
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "Field report analysis failed.");
    }
  }

  async function handleGenerateBrief(targetMission?: Mission) {
    const missionForBrief = targetMission ?? selectedMission;

    if (!missionForBrief) {
      setOperationMessage("Choose a mission before generating the brief.");
      return;
    }

    try {
      const result = await postIntelligence<BriefResult>({
        mode: "brief",
        mission: missionForBrief,
      });

      startBriefTransition(() => {
        setBrief(result);
        setSelectedMissionId(missionForBrief.id);
      });
      focusWorkspace("copilot");
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "Mission briefing failed.");
    }
  }

  async function handleMissionStatusChange(status: MissionStatus) {
    if (!selectedMission) {
      return;
    }

    try {
      await patchMissionStatus(selectedMission.id, status);
      startMissionTransition(() => {
        setOperationMessage(`Mission updated to ${status.replace("-", " ")}.`);
      });
      await refreshDashboard(selectedMission.id);
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "Mission status update failed.");
    }
  }

  async function handleProofSubmit() {
    if (!selectedMission) {
      return;
    }

    if (!proofNote.trim()) {
      setOperationMessage("Add a proof note before closing the mission.");
      return;
    }

    try {
      await submitProof({
        missionId: selectedMission.id,
        note: proofNote.trim(),
        volunteerName: proofVolunteerName.trim() || "Volunteer",
        file: proofFile,
      });

      startProofTransition(() => {
        setProofNote("");
        setProofFile(null);
        setIsProofDialogOpen(false);
        setOperationMessage("Proof package uploaded and mission marked completed.");
      });

      await refreshDashboard(selectedMission.id);
    } catch (error) {
      setOperationMessage(error instanceof Error ? error.message : "Proof submission failed.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(98,127,255,0.18),transparent_18%),radial-gradient(circle_at_78%_22%,rgba(102,217,195,0.14),transparent_16%),radial-gradient(circle_at_62%_82%,rgba(255,184,106,0.12),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:120px_120px]" />

      <main className="relative mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <motion.aside
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[#0b1020]/88 p-5 shadow-[0_24px_120px_-40px_rgba(0,0,0,0.72)] backdrop-blur-xl"
          >
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
            <motion.div variants={rise} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5f86ff] to-[#66d9c3] text-[#08101d] shadow-[0_12px_32px_-18px_rgba(124,167,255,0.95)]">
                  <Waypoints className="size-5" />
                </div>
                <div>
                  <p className="font-heading text-xl tracking-tight text-white">SevaSetu</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Mission control
                  </p>
                </div>
              </div>
              <Badge className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-slate-200">
                Beta
              </Badge>
            </motion.div>

            <motion.div variants={rise} className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-3">
              <div className="relative">
                <Command className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={missionSearch}
                  onChange={(event) => {
                    setMissionSearch(event.target.value);

                    if (activeTab !== "command") {
                      focusWorkspace("command", "mission-queue");
                    }
                  }}
                  onFocus={() => {
                    if (activeTab !== "command") {
                      focusWorkspace("command", "mission-queue");
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      focusWorkspace("command", "mission-queue");
                    }
                  }}
                  placeholder="Search mission, ward, or volunteer"
                  className="h-14 rounded-2xl border-white/8 bg-[#111829] pl-11 pr-28 text-white placeholder:text-slate-500"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 sm:inline">
                  filters queue
                </span>
              </div>
            </motion.div>

            <motion.div variants={rise} className="mt-6">
              <p className="mb-1 text-xs uppercase tracking-[0.24em] text-slate-500">Workspace</p>
              <p className="mb-3 text-sm text-slate-400">Jump directly into each live surface.</p>
              <div className="space-y-2.5">
                {workspaceItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => focusWorkspace(item.id)}
                    aria-current={activeTab === item.id ? "page" : undefined}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition-all",
                      activeTab === item.id
                        ? "border-[#5f86ff]/35 bg-gradient-to-r from-[#5f86ff]/18 to-[#66d9c3]/10 text-white"
                        : "border-white/6 bg-white/[0.02] text-slate-300 hover:border-white/12 hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-2xl transition-all",
                          activeTab === item.id
                            ? "bg-[#5f86ff] text-[#06101d]"
                            : "bg-white/[0.04] text-slate-400 group-hover:text-white",
                        )}
                      >
                        <item.icon className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
                        {activeTab === item.id ? "Live" : "Open"}
                      </span>
                      <ArrowRight className="size-4 text-slate-500" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={rise} className="mt-8 rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Active role</p>
                  <p className="mt-2 font-heading text-2xl text-white">{roleIndicator[role]}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    aiLive
                      ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                      : "border-amber-400/25 bg-amber-500/12 text-amber-100",
                  )}
                >
                  {aiLive ? "Live model" : "Demo model"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{roleSummary[role]}</p>
              <div
                className={cn(
                  "mt-5 rounded-[22px] border border-white/10 bg-gradient-to-r p-4",
                  roleAccent[role],
                )}
              >
                <div className="flex items-center justify-between text-[#07101b]">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.24em] opacity-70">
                      Route priority
                    </p>
                    <p className="mt-1 font-heading text-2xl">
                      {selectedMission?.ward ?? constrainedWard}
                    </p>
                  </div>
                  <UserRoundCheck className="size-5" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={rise} className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Dispatch-ready people
                </p>
                <span className="text-xs text-slate-500">{highlightedVolunteers.length} online</span>
              </div>
              <div className="space-y-2.5">
                {highlightedVolunteers.map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className="flex items-center justify-between rounded-[20px] border border-white/6 bg-white/[0.02] px-3.5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border border-white/10">
                        <AvatarFallback className="bg-white/[0.06] text-slate-100">
                          {initials(volunteer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{volunteer.name}</p>
                        <p className="text-xs text-slate-500">
                          {volunteer.zone} · {volunteer.languages.join(" / ")}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{volunteer.availability}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={rise} className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Latest proofs</p>
                <span className="text-xs text-slate-500">{proofList.length} total</span>
              </div>
              <div className="space-y-2.5">
                {latestProofs.length ? (
                  latestProofs.map((proof) => (
                    <div
                      key={proof.id}
                      className="rounded-[20px] border border-white/6 bg-white/[0.02] px-3.5 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">{proof.volunteerName}</p>
                        <Badge className="rounded-full border border-emerald-400/30 bg-emerald-500/12 text-emerald-100">
                          verified
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-slate-400">{proof.note}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500">
                    Proof packages will appear here once the first mission closes.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.aside>

          <section className="space-y-6">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="overflow-hidden rounded-[34px] border border-white/8 bg-[#0c1324]/88 shadow-[0_28px_120px_-44px_rgba(0,0,0,0.76)] backdrop-blur-xl"
            >
              <div className="border-b border-white/6 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <motion.div variants={rise} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#7ca7ff]" />
                        <span className="text-slate-300">Smart resource allocation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#66d9c3]" />
                        <span className="text-slate-300">Firestore-backed live operations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#ffbe6d]" />
                        <span>Coordinator workspace</span>
                      </div>
                    </div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      SevaSetu Command Layer
                    </p>
                  </motion.div>

                  <motion.div variants={rise} className="flex flex-wrap items-center gap-3">
                    <Select
                      value={role}
                      onValueChange={(value) => {
                        if (value) {
                          setRole(value as Role);
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 min-w-[12rem] rounded-full border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Choose role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coordinator">NGO coordinator</SelectItem>
                        <SelectItem value="field-worker">Field worker</SelectItem>
                        <SelectItem value="volunteer">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                      onClick={() => void refreshDashboard()}
                    >
                      {isRefreshing ? "Refreshing..." : "Refresh live data"}
                      <RefreshCcw className="ml-2 size-4" />
                    </Button>
                    <Button
                      className="rounded-full bg-[#5f86ff] text-white shadow-[0_12px_34px_-18px_rgba(95,134,255,0.92)] hover:bg-[#7092ff]"
                      onClick={() => void handleGenerateBrief()}
                    >
                      Generate AI brief
                      <Sparkles className="ml-2 size-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              <div className="border-b border-white/6 px-5 py-5 sm:px-6">
                <motion.div
                  variants={rise}
                  className="rounded-[30px] border border-[#7ca7ff]/16 bg-[linear-gradient(135deg,rgba(18,27,52,0.92),rgba(10,17,32,0.94))] p-5 shadow-[0_20px_70px_-40px_rgba(95,134,255,0.75)]"
                >
                  <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border border-[#7ca7ff]/25 bg-[#7ca7ff]/12 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-[#dce6ff]">
                          <Clapperboard className="mr-1.5 size-3.5" />
                          presentation flow
                        </Badge>
                        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          Step {demoStepIndex + 1} / {demoSteps.length}
                        </span>
                      </div>
                      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                        {activeDemoStep.eyebrow} · {activeDemoStep.label}
                      </p>
                      <h2 className="mt-2 max-w-3xl font-heading text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                        {activeDemoStep.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                        {activeDemoStep.narration}
                      </p>
                      <p className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#dce6ff]">
                        {activeDemoStep.cue}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                          onClick={() => advanceDemoStep(-1)}
                          disabled={demoStepIndex === 0}
                        >
                          <ChevronLeft className="mr-2 size-4" />
                          Previous step
                        </Button>
                        <Button
                          className="rounded-full bg-[#5f86ff] text-white hover:bg-[#7092ff]"
                          onClick={() => void handleRunDemoAction()}
                          disabled={isRunningDemoAction}
                        >
                          {isRunningDemoAction ? "Preparing..." : activeDemoStep.actionLabel}
                          <CirclePlay className="ml-2 size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                          onClick={() => advanceDemoStep(1)}
                          disabled={demoStepIndex === demoSteps.length - 1}
                        >
                          Next step
                          <ChevronRight className="ml-2 size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                          onClick={() => void handleResetDemoFlow()}
                        >
                          Reset demo
                          <RefreshCcw className="ml-2 size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      <div className="rounded-[24px] border border-white/8 bg-[#0b1020] px-4 py-4">
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                          role for this step
                        </p>
                        <p className="mt-3 font-heading text-xl text-white">
                          {roleIndicator[activeDemoStep.role]}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">{activeDemoStep.role}</p>
                      </div>
                      <div className="rounded-[24px] border border-white/8 bg-[#0b1020] px-4 py-4">
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                          screen in focus
                        </p>
                        <p className="mt-3 font-heading text-xl text-white">
                          {activeDemoStep.tab === "command" && "Command center"}
                          {activeDemoStep.tab === "capture" && "Field capture"}
                          {activeDemoStep.tab === "fairness" && "Fairness lens"}
                          {activeDemoStep.tab === "copilot" && "AI copilot"}
                          {activeDemoStep.tab === "architecture" && "Architecture"}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          Keep this view open while narrating the step.
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-white/8 bg-[#0b1020] px-4 py-4">
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                          key interaction
                        </p>
                        <p className="mt-3 font-heading text-xl text-white">
                          {activeDemoStep.actionLabel}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          Use this as the click moment for the recording.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {demoSteps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => focusDemoStep(index)}
                        className={cn(
                          "rounded-full border px-3 py-2 text-left text-sm transition-all",
                          index === demoStepIndex
                            ? "border-[#7ca7ff]/30 bg-[#7ca7ff]/14 text-white"
                            : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/14 hover:bg-white/[0.05]",
                        )}
                      >
                        <span className="mr-2 text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {step.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
                <motion.div variants={rise} className="space-y-4">
                  <div className="max-w-3xl space-y-4">
                    <h1 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      A fair, map-first command center for real-world volunteer relief.
                    </h1>
                    <p className="max-w-2xl text-base leading-8 text-slate-300">
                      SevaSetu combines live field intake, fair allocation logic, and operational
                      coordination in one command surface built for real-world volunteer relief.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="rounded-full bg-white text-[#09101b] hover:bg-slate-100"
                      onClick={() => focusWorkspace("command")}
                    >
                      Open command center
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                      onClick={() => focusWorkspace("capture")}
                    >
                      Create live report
                      <FileUp className="ml-2 size-4" />
                    </Button>
                    <Sheet>
                      <SheetTrigger className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]">
                        Volunteer roster
                        <Users className="ml-2 size-4" />
                      </SheetTrigger>
                      <SheetContent className="border-l-white/10 bg-[#0d1426] text-white sm:max-w-xl">
                        <SheetHeader>
                          <SheetTitle className="font-heading text-2xl text-white">
                            Dispatch-ready squads
                          </SheetTitle>
                          <SheetDescription className="text-slate-400">
                            Language-matched rosters, live availability, and mission fit.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                          {volunteerSquads.map((squad, index) => (
                            <div
                              key={squad.name}
                              className={cn(
                                "rounded-[24px] border p-4",
                                index % 3 === 0 && "border-[#7ca7ff]/25 bg-[#7ca7ff]/10",
                                index % 3 === 1 && "border-[#ffbe6d]/25 bg-[#ffbe6d]/10",
                                index % 3 === 2 && "border-[#66d9c3]/25 bg-[#66d9c3]/10",
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-heading text-lg text-white">{squad.name}</p>
                                  <p className="text-sm text-slate-300">{squad.composition}</p>
                                </div>
                                <Badge className="rounded-full border border-white/10 bg-white/10 text-slate-100">
                                  {squad.availability}%
                                </Badge>
                              </div>
                              <Progress value={squad.availability} className="mt-4 h-2 bg-white/10" />
                              <p className="mt-3 text-sm leading-6 text-slate-300">{squad.coverage}</p>
                            </div>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {operationMessage ? (
                    <div className="rounded-[24px] border border-[#7ca7ff]/18 bg-[#111a31] px-4 py-3 text-sm leading-7 text-slate-200">
                      {operationMessage}
                    </div>
                  ) : null}
                </motion.div>

                <motion.div variants={rise} className="rounded-[30px] border border-white/8 bg-[#09101d] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Activity this week
                      </p>
                      <p className="mt-2 font-heading text-2xl text-white">Operational cadence</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                      <BellDot className="size-3.5" />
                      2 fresh alerts
                    </div>
                  </div>
                  <div className="mt-6 flex items-end gap-3">
                    {liveResponseTrend.map((point, index) => (
                      <div key={point.day} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-28 w-full items-end rounded-full bg-white/[0.03] p-1.5">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(point.verified * 1.35, 22)}px` }}
                            transition={{ duration: 0.6, delay: index * 0.06 }}
                            className={cn(
                              "w-full rounded-full",
                              index === liveResponseTrend.length - 2
                                ? "bg-gradient-to-t from-[#66d9c3] to-[#7ca7ff]"
                                : "bg-gradient-to-t from-white/15 to-white/30",
                            )}
                          />
                        </div>
                        <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          {point.day}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {liveImpactStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                      >
                        <p className="text-[0.72rem] uppercase tracking-[0.22em] text-slate-500">
                          {stat.label}
                        </p>
                        <p className="mt-3 font-heading text-3xl text-white">{stat.value}</p>
                        <p className="mt-2 text-xs leading-6 text-slate-400">{stat.caption}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="grid gap-4 border-t border-white/6 px-5 py-5 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3"
                >
                  {activeMissions.map((mission, index) => (
                    <motion.div key={mission.id} variants={rise}>
                      <MissionPreviewCard mission={mission} index={index} />
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={rise} className="rounded-[28px] border border-white/8 bg-[#09101d] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ops glance</p>
                      <p className="mt-2 font-heading text-xl text-white">Command health</p>
                    </div>
                    <Badge className="rounded-full border border-[#66d9c3]/30 bg-[#66d9c3]/10 text-[#d7fff7]">
                      {constrainedWard}
                    </Badge>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MetricPill label="Reports live" value={`${reportList.length}`} />
                    <MetricPill label="Proof packages" value={`${proofList.length}`} />
                    <MetricPill label="Queue size" value={`${missionList.length}`} />
                    <MetricPill label="AI mode" value={aiLive ? "Live" : "Demo"} />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
              <TabsList className="h-auto flex-wrap rounded-full border border-white/8 bg-[#0d1426]/88 p-1.5 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.8)]">
                <TabsTrigger value="command" className="rounded-full px-4 py-2 data-[selected]:bg-[#5f86ff] data-[selected]:text-white">
                  Command center
                </TabsTrigger>
                <TabsTrigger value="capture" className="rounded-full px-4 py-2 data-[selected]:bg-[#5f86ff] data-[selected]:text-white">
                  Field capture
                </TabsTrigger>
                <TabsTrigger value="fairness" className="rounded-full px-4 py-2 data-[selected]:bg-[#5f86ff] data-[selected]:text-white">
                  Fairness lens
                </TabsTrigger>
                <TabsTrigger value="copilot" className="rounded-full px-4 py-2 data-[selected]:bg-[#5f86ff] data-[selected]:text-white">
                  AI copilot
                </TabsTrigger>
                <TabsTrigger value="architecture" className="rounded-full px-4 py-2 data-[selected]:bg-[#5f86ff] data-[selected]:text-white">
                  Architecture
                </TabsTrigger>
              </TabsList>

              <TabsContent value="command" className="space-y-6">
                <div
                  ref={(node) => {
                    sectionRefs.current.command = node;
                  }}
                />
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                  <GlassSection
                    eyebrow="NeedGraph live map"
                    title="Clustered constraints instead of noisy alerts"
                    description="The central graph borrows from logistics control towers but keeps a softer, civic-service tone."
                  >
                    <NeedGraphPanel
                      activeNodeId={selectedMission?.focusNodeId || needGraphNodes[0].id}
                      nodes={liveNodes}
                      edges={liveEdges}
                    />
                  </GlassSection>

                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
                    <GlassSection
                      eyebrow="Mission command"
                      title={selectedMission?.title || "No mission selected"}
                      description="Approve, dispatch, and close a mission from one panel."
                    >
                      {selectedMission ? (
                        <div className="space-y-5">
                          <div className="flex flex-wrap gap-2">
                            {selectedMission.skills.map((skill) => (
                              <Badge
                                key={skill}
                                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-slate-100"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <div className="grid gap-3 rounded-[24px] border border-white/8 bg-[#0b1020] p-4">
                            <InfoLine label="Ward" value={selectedMission.ward} dark />
                            <InfoLine label="Beneficiaries" value={selectedMission.beneficiaries} dark />
                            <InfoLine label="Language fit" value={selectedMission.language} dark />
                            <InfoLine label="ETA" value={selectedMission.eta} dark />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Button
                              variant="outline"
                              className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                              onClick={() => void handleMissionStatusChange("ready")}
                              disabled={isUpdatingMission}
                            >
                              Approve mission
                            </Button>
                            <Button
                              className="rounded-full bg-[#5f86ff] text-white hover:bg-[#7092ff]"
                              onClick={() => void handleMissionStatusChange("dispatching")}
                              disabled={isUpdatingMission}
                            >
                              Start dispatch
                            </Button>
                          </div>

                          <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
                            <DialogTrigger className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#66d9c3]/20 bg-[#66d9c3]/12 px-4 text-sm font-medium text-[#dcfff8] transition-colors hover:bg-[#66d9c3]/18">
                              Submit proof and close mission
                              <CheckCircle2 className="ml-2 size-4" />
                            </DialogTrigger>
                            <DialogContent className="border-white/8 bg-[#0d1426] text-white">
                              <DialogHeader>
                                <DialogTitle className="font-heading text-2xl text-white">
                                  Proof and closure
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                  Keep proof submission fast for volunteers while preserving a clean audit trail.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  value={proofVolunteerName}
                                  onChange={(event) => setProofVolunteerName(event.target.value)}
                                  placeholder="Volunteer name"
                                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                                />
                                <Textarea
                                  value={proofNote}
                                  onChange={(event) => setProofNote(event.target.value)}
                                  placeholder="Summarize what was delivered, how the beneficiary was verified, and whether any follow-up remains."
                                  className="min-h-[8rem] rounded-[24px] border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                                />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white file:text-slate-300"
                                />
                                <Button
                                  onClick={() => void handleProofSubmit()}
                                  className="w-full rounded-full bg-[#66d9c3] text-[#07111c] hover:bg-[#79e6d2]"
                                  disabled={isSubmittingProof}
                                >
                                  {isSubmittingProof ? "Uploading..." : "Upload proof package"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : null}
                    </GlassSection>

                    <motion.div variants={rise}>
                      <GlassSection
                        eyebrow="Proof feed"
                        title="Recent closures"
                        description="A human-readable evidence trail supports both field operations and stakeholder review."
                      >
                        <div className="space-y-3">
                          {selectedMissionProofs.length ? (
                            selectedMissionProofs.map((proof) => (
                              <div
                                key={proof.id}
                                className="rounded-[22px] border border-white/8 bg-[#0b1020] px-4 py-4"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-medium text-white">{proof.volunteerName}</p>
                                  <span className="text-xs text-slate-500">{formatTime(proof.createdAt)}</span>
                                </div>
                                <p className="mt-2 text-sm leading-7 text-slate-300">
                                  {presentOperationalText(proof.note)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-8 text-sm text-slate-500">
                              This mission does not have proof packages yet.
                            </div>
                          )}
                        </div>
                      </GlassSection>
                    </motion.div>
                  </motion.div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                  <GlassSection
                    eyebrow="District pulse"
                    title="Pressure matrix by ward"
                    description="The panel mixes the route-management crispness of logistics UIs with a softer color climate."
                  >
                    <WardPressureGrid cells={liveWardGrid} />
                  </GlassSection>

                  <GlassSection
                    eyebrow="Mission queue"
                    title="Pastel cards for the most important work"
                    description="The lighter treatment creates contrast against the dark shell and makes triage feel faster."
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Input
                        value={missionSearch}
                        onChange={(event) => setMissionSearch(event.target.value)}
                        placeholder="Search by ward, language, or status"
                        className="h-11 rounded-full border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                      />
                      <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                        <span className="size-1.5 rounded-full bg-[#7ca7ff]" />
                        <span>{filteredMissions.length} mission cards in focus</span>
                      </div>
                    </div>
                    <div
                      ref={missionQueueRef}
                      className="max-h-[min(30rem,68vh)] overflow-y-auto pr-2 [scrollbar-color:rgba(124,167,255,0.45)_transparent] [scrollbar-width:thin]"
                    >
                      <div className="space-y-3 pb-2">
                        {filteredMissions.map((mission, index) => (
                          <div
                            key={mission.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedMissionId(mission.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedMissionId(mission.id);
                              }
                            }}
                            className={cn(
                              "w-full rounded-[26px] border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ca7ff]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09101d]",
                              mission.id === selectedMission?.id
                                ? "border-[#5f86ff]/35 bg-[#101a33]"
                                : "border-white/6 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]",
                            )}
                          >
                            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                              <div>
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <Badge
                                    className={cn(
                                      "rounded-full border px-2.5 py-1 capitalize",
                                      statusTone[mission.status],
                                    )}
                                  >
                                    {mission.status.replace("-", " ")}
                                  </Badge>
                                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {mission.ward}
                                  </span>
                                </div>
                                <p className="font-heading text-xl text-white">{mission.title}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-300">
                                  {presentOperationalText(mission.note)}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {mission.skills.slice(0, 3).map((skill) => (
                                    <span
                                      key={skill}
                                      className={cn(
                                        "rounded-full px-3 py-1 text-xs font-medium",
                                        pastelTag(index),
                                      )}
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-3 md:min-w-[10rem]">
                                <MetricStack label="ETA" value={mission.eta} />
                                <MetricStack label="Volunteers" value={`${mission.volunteers}`} />
                                <Button
                                  size="sm"
                                  className="w-full rounded-full bg-[#5f86ff] text-white hover:bg-[#7092ff]"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedMissionId(mission.id);
                                    void handleGenerateBrief(mission);
                                  }}
                                >
                                  AI brief
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassSection>
                </div>
              </TabsContent>

              <TabsContent value="capture" className="space-y-6">
                <div
                  ref={(node) => {
                    sectionRefs.current.capture = node;
                  }}
                />
                <div className="grid gap-6 xl:grid-cols-[0.82fr_1.08fr_0.92fr]">
                  <GlassSection
                    eyebrow="Signal channels"
                    title="Input methods designed for messy field reality"
                    description="These cards borrow the clarity of mobile health apps without looking childish."
                  >
                    <div className="space-y-3">
                      {signalChannels.map((channel, index) => (
                        <div
                          key={channel.label}
                          className={cn(
                            "rounded-[24px] border p-4",
                            index === 0 && "border-[#7ca7ff]/20 bg-[#7ca7ff]/10",
                            index === 1 && "border-[#ded8ff]/20 bg-[#ded8ff]/10",
                            index === 2 && "border-[#ffdfc9]/20 bg-[#ffdfc9]/10",
                            index === 3 && "border-[#d7f4eb]/20 bg-[#d7f4eb]/10",
                          )}
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#09111d] text-white">
                              {index === 0 && <ScanSearch className="size-4" />}
                              {index === 1 && <Radio className="size-4" />}
                              {index === 2 && <MapPinned className="size-4" />}
                              {index === 3 && <ShieldCheck className="size-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-white">{channel.label}</p>
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                                ingest
                              </p>
                            </div>
                          </div>
                          <p className="text-sm leading-7 text-slate-300">{channel.caption}</p>
                        </div>
                      ))}
                    </div>
                  </GlassSection>

                  <GlassSection
                    eyebrow="Live intake studio"
                    title="Create a real field report"
                    description="This interaction is built to look polished on stage while still remaining practical for actual NGO operators."
                  >
                    <div className="space-y-4">
                      <Textarea
                        value={rawReport}
                        onChange={(event) => setRawReport(event.target.value)}
                        className="min-h-[16rem] resize-none rounded-[28px] border-white/10 bg-[#0b1020] p-5 text-sm leading-8 text-white placeholder:text-slate-500"
                      />

                      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#5f86ff] text-white">
                            <FileUp className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Attach survey scan or photo</p>
                            <p className="text-sm text-slate-500">
                              Cloud Storage upload when configured, local preview during stage demos.
                            </p>
                          </div>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                          className="mt-4 h-11 rounded-2xl border-white/10 bg-[#0b1020] text-white file:text-slate-300"
                        />
                        {uploadFile ? (
                          <p className="mt-3 text-xs text-slate-400">{uploadFile.name}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => void handleAnalyzeReport()}
                          className="rounded-full bg-[#5f86ff] text-white hover:bg-[#7092ff]"
                          disabled={isExtracting}
                        >
                          {isExtracting ? "Creating..." : "Create report + mission"}
                          <BrainCircuit className="ml-2 size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                          onClick={() => setRawReport(sampleRawReport)}
                        >
                          Load sample note
                        </Button>
                      </div>
                    </div>
                  </GlassSection>

                  <div className="space-y-6">
                    <GlassSection
                      eyebrow="Structured extraction"
                      title="A richer output card"
                      description="The extraction panel takes cues from the mobile references: soft contrast, large numerics, and clear affordances."
                    >
                      <div className="space-y-4">
                        <div className="rounded-[26px] border border-white/8 bg-[#0b1020] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                source
                              </p>
                              <p className="mt-2 font-medium text-white">
                                {presentIntelligenceSource(extraction.source)}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                "rounded-full border px-3 py-1 capitalize",
                                severityTone[extraction.urgency],
                              )}
                            >
                              {extraction.urgency}
                            </Badge>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-300">
                            {presentOperationalText(extraction.summary)}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <PastelInfoCard tone="blue" label="Ward" value={extraction.ward} />
                          <PastelInfoCard tone="rose" label="Confidence" value={extraction.confidence} />
                          <PastelInfoCard tone="amber" label="Category" value={extraction.category} />
                          <PastelInfoCard tone="mint" label="People" value={compactLabel(extraction.beneficiaries)} />
                        </div>

                        <div className="rounded-[24px] border border-white/8 bg-[#0b1020] p-4">
                          <p className="text-sm font-medium text-white">Recommended skills</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {extraction.recommendedSkills.map((skill) => (
                              <Badge
                                key={skill}
                                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-slate-100"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </GlassSection>

                    <GlassSection
                      eyebrow="Field mobile language"
                      title="Handset preview"
                      description="A warmer, mobile-first complexion for field teams and volunteers."
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldPreviewCard
                          tone="from-[#f4c9cf] to-[#ffdcdc]"
                          title="Capture"
                          body="Scan forms, attach a photo, and send the note in one motion."
                          stat={`${reportList.length} live reports`}
                        />
                        <FieldPreviewCard
                          tone="from-[#dcd6ff] to-[#efeaff]"
                          title="Verify"
                          body="See summary, confidence, and next action without ops jargon."
                          stat={selectedMission?.eta ?? "22 min ETA"}
                        />
                      </div>
                    </GlassSection>
                  </div>
                </div>

                <GlassSection
                  eyebrow="Recent field activity"
                  title="Incoming reports with visible momentum"
                  description="The report feed keeps the interface feeling alive during demos."
                >
                  <div className="grid gap-4 lg:grid-cols-3">
                    {urgentReports.map((report, index) => (
                      <div
                        key={report.id}
                        className={cn(
                          "rounded-[28px] border p-5",
                          index % 4 === 0 && "border-[#7ca7ff]/24 bg-[#7ca7ff]/10",
                          index % 4 === 1 && "border-[#ffd7bd]/24 bg-[#ffd7bd]/10",
                          index % 4 === 2 && "border-[#ded8ff]/24 bg-[#ded8ff]/10",
                          index % 4 === 3 && "border-[#d7f4eb]/24 bg-[#d7f4eb]/10",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            className={cn(
                              "rounded-full border px-2.5 py-1 capitalize",
                              severityTone[report.urgency],
                            )}
                          >
                            {report.urgency}
                          </Badge>
                          <span className="text-xs text-slate-500">{formatTime(report.createdAt)}</span>
                        </div>
                        <p className="mt-4 font-heading text-xl text-white">{report.category}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                          {presentOperationalText(report.summary)}
                        </p>
                      </div>
                    ))}
                  </div>
                </GlassSection>
              </TabsContent>

              <TabsContent value="fairness" className="space-y-6">
                <div
                  ref={(node) => {
                    sectionRefs.current.fairness = node;
                  }}
                />
                <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
                  <GlassSection
                    eyebrow="Allocation fairness"
                    title="Compare vulnerability against actual attention"
                    description="A crisp analytics surface, but tuned to social-impact storytelling rather than enterprise jargon."
                  >
                    <ChartContainer config={chartConfig} className="h-[24rem] w-full">
                      <BarChart data={liveFairnessData} margin={{ left: -8, right: 8, top: 10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="ward" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="vulnerability" fill="var(--color-vulnerability)" radius={10} />
                        <Bar dataKey="allocation" fill="var(--color-allocation)" radius={10} />
                      </BarChart>
                    </ChartContainer>
                  </GlassSection>

                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
                    <GlassSection
                      eyebrow="Guardrails"
                      title="Bias controls that stay visible"
                      description="The best references kept secondary intelligence close to the main action. We do the same here."
                    >
                      <div className="space-y-3">
                        {allocationPrinciples.map((principle, index) => (
                          <motion.div
                            key={principle}
                            variants={rise}
                            className={cn(
                              "rounded-[24px] border p-4 text-sm leading-7 text-slate-200",
                              index === 0 && "border-[#7ca7ff]/20 bg-[#7ca7ff]/10",
                              index === 1 && "border-[#ffd7bd]/20 bg-[#ffd7bd]/10",
                              index === 2 && "border-[#d7f4eb]/20 bg-[#d7f4eb]/10",
                            )}
                          >
                            {principle}
                          </motion.div>
                        ))}
                      </div>
                    </GlassSection>

                    <GlassSection
                      eyebrow="Operational trend"
                      title="Lower latency, stronger closure"
                      description="This chart keeps a cinematic dark treatment so the color accents feel more intentional."
                    >
                      <ChartContainer config={chartConfig} className="h-[18rem] w-full">
                        <LineChart data={liveResponseTrend} margin={{ left: -12, right: 8, top: 10 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="responseTime"
                            stroke="var(--color-responseTime)"
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="verified"
                            stroke="var(--color-verified)"
                            strokeWidth={3}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    </GlassSection>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="copilot" className="space-y-6">
                <div
                  ref={(node) => {
                    sectionRefs.current.copilot = node;
                  }}
                />
                <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
                  <GlassSection
                    eyebrow="Mission copilot"
                    title="Generate a command brief with one click"
                    description="The layout borrows from premium dashboard details screens: clean controls on the left, rich response canvas on the right."
                  >
                    <div className="space-y-4">
                      <Select
                        value={selectedMission?.id}
                        onValueChange={(value) => {
                          if (value) {
                            setSelectedMissionId(value);
                          }
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white">
                          <SelectValue placeholder="Choose a mission" />
                        </SelectTrigger>
                        <SelectContent>
                          {missionList.map((mission) => (
                            <SelectItem key={mission.id} value={mission.id}>
                              {mission.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedMission ? (
                        <div className="rounded-[28px] border border-white/8 bg-[#0b1020] p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                {selectedMission.ward}
                              </p>
                              <p className="mt-2 font-heading text-2xl text-white">
                                {selectedMission.title}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                "rounded-full border px-3 py-1 capitalize",
                                statusTone[selectedMission.status],
                              )}
                            >
                              {selectedMission.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-300">
                            {presentOperationalText(selectedMission.note)}
                          </p>
                          <div className="mt-5 grid gap-3">
                            <InfoLine label="Beneficiaries" value={selectedMission.beneficiaries} dark />
                            <InfoLine label="Language" value={selectedMission.language} dark />
                            <InfoLine label="ETA" value={selectedMission.eta} dark />
                          </div>
                        </div>
                      ) : null}

                      <Button
                        onClick={() => void handleGenerateBrief()}
                        className="w-full rounded-full bg-[#5f86ff] text-white hover:bg-[#7092ff]"
                        disabled={isBriefing}
                      >
                        {isBriefing ? "Generating..." : "Generate mission brief"}
                        <Bot className="ml-2 size-4" />
                      </Button>
                    </div>
                  </GlassSection>

                  <GlassSection
                    eyebrow="AI output"
                    title={brief.title}
                    description="We preserved the live Gemini endpoint while presenting the brief in a more premium, editorial layout."
                  >
                    <div className="space-y-5">
                      <div className="rounded-[28px] border border-white/8 bg-[#0b1020] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white">Mission narrative</p>
                          <Badge className="rounded-full border border-white/10 bg-white/[0.05] text-slate-100">
                            {presentIntelligenceSource(brief.source)}
                          </Badge>
                        </div>
                        <p className="mt-4 text-sm leading-8 text-slate-300">{brief.summary}</p>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <BriefColumn
                          icon={Route}
                          title="Deployment plan"
                          items={brief.deploymentPlan}
                          tone="border-[#7ca7ff]/20 bg-[#7ca7ff]/10"
                        />
                        <BriefColumn
                          icon={ShieldCheck}
                          title="Watchouts"
                          items={brief.watchouts}
                          tone="border-[#ffd7bd]/20 bg-[#ffd7bd]/10"
                        />
                      </div>

                      <BriefColumn
                        icon={Target}
                        title="Beneficiary notes"
                        items={brief.beneficiaryNotes}
                        tone="border-[#d7f4eb]/20 bg-[#d7f4eb]/10"
                      />
                    </div>
                  </GlassSection>
                </div>
              </TabsContent>

              <TabsContent value="architecture" className="space-y-6">
                <div
                  ref={(node) => {
                    sectionRefs.current.architecture = node;
                  }}
                />
                <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
                  <GlassSection
                    eyebrow="Platform stack"
                    title="Technical architecture and deployment path"
                    description="The final view stays crisp and presentable while still proving that the system is deployable."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      {architectureLayers.map((layer, index) => (
                        <div
                          key={layer.title}
                          className={cn(
                            "rounded-[26px] border p-5",
                            index === 0 && "border-[#7ca7ff]/20 bg-[#7ca7ff]/10",
                            index === 1 && "border-[#d7f4eb]/20 bg-[#d7f4eb]/10",
                            index === 2 && "border-[#ffd7bd]/20 bg-[#ffd7bd]/10",
                            index === 3 && "border-[#ded8ff]/20 bg-[#ded8ff]/10",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-heading text-xl text-white">{layer.title}</p>
                              <p className="mt-2 text-sm text-slate-400">{layer.stack}</p>
                            </div>
                            <Sparkles className="mt-1 size-4 text-slate-400" />
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-300">{layer.detail}</p>
                        </div>
                      ))}
                    </div>
                  </GlassSection>

                  <GlassSection
                    eyebrow="Why this feels stronger"
                    title="Visual language aligned to the product"
                    description="The redesign uses multiple reference moods without losing coherence."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <JudgeProofCard
                        icon={LayoutDashboard}
                        title="Dark control shell"
                        detail="The black-and-cobalt frame makes SevaSetu feel like an operations product, not a classroom presentation."
                      />
                      <JudgeProofCard
                        icon={Sparkles}
                        title="Pastel decision cards"
                        detail="Soft cards on key workflows create urgency without the harshness of red-heavy enterprise dashboards."
                      />
                      <JudgeProofCard
                        icon={MapPinned}
                        title="Map-first hierarchy"
                        detail="Need graph, route thinking, and district pressure now feel central instead of secondary."
                      />
                      <JudgeProofCard
                        icon={Users}
                        title="Human-centered field layer"
                        detail="The mobile-inspired capture styling keeps the product empathetic for field workers and volunteers."
                      />
                    </div>
                  </GlassSection>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
    </div>
  );
}

function GlassSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={rise}
      initial="hidden"
      animate="show"
      className="rounded-[32px] border border-white/8 bg-[#0d1426]/88 p-5 shadow-[0_20px_90px_-50px_rgba(0,0,0,0.86)] backdrop-blur-xl sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">{eyebrow}</p>
          <h2 className="font-heading text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-400">{description}</p>
      </div>
      {children}
    </motion.section>
  );
}

function MissionPreviewCard({ mission, index }: { mission: Mission; index: number }) {
  const progressMap: Record<MissionStatus, number> = {
    "needs-review": 34,
    ready: 72,
    dispatching: 86,
    completed: 100,
  };

  return (
    <div
      className={cn(
        "rounded-[30px] border border-white/10 bg-gradient-to-br p-5 text-[#0b1020] shadow-[0_24px_60px_-38px_rgba(255,255,255,0.55)]",
        missionCardPalette[index % missionCardPalette.length],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-slate-600">{mission.ward}</p>
          <p className="mt-2 font-heading text-xl font-semibold leading-tight">{mission.title}</p>
        </div>
        <Badge className="rounded-full border border-black/8 bg-black/6 px-2.5 py-1 capitalize text-[#142033]">
          {mission.status.replace("-", " ")}
        </Badge>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{presentOperationalText(mission.note)}</p>
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>Mission readiness</span>
          <span className="font-medium">{progressMap[mission.status]}%</span>
        </div>
        <Progress value={progressMap[mission.status]} className="h-2.5 bg-black/8" />
      </div>
    </div>
  );
}

function NeedGraphPanel({
  activeNodeId,
  nodes,
  edges,
}: {
  activeNodeId: string;
  nodes: NeedNode[];
  edges: readonly (readonly [string, string])[];
}) {
  return (
    <div className="relative h-[31rem] overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_16%_20%,rgba(95,134,255,0.14),transparent_22%),radial-gradient(circle_at_78%_18%,rgba(255,111,150,0.1),transparent_20%),radial-gradient(circle_at_25%_82%,rgba(255,184,106,0.1),transparent_24%),linear-gradient(180deg,#09101d_0%,#0f1628_100%)] px-4 py-5 sm:px-6">
      <div className="absolute inset-4 rounded-[2rem] border border-dashed border-white/8" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:52px_52px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([sourceId, targetId]) => {
          const source = nodes.find((node) => node.id === sourceId);
          const target = nodes.find((node) => node.id === targetId);

          if (!source || !target) {
            return null;
          }

          const emphasized = source.id === activeNodeId || target.id === activeNodeId;

          return (
            <line
              key={`${sourceId}-${targetId}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={emphasized ? "#ffffff" : "#4a5b7b"}
              strokeOpacity={emphasized ? 0.85 : 0.42}
              strokeWidth={emphasized ? 0.48 : 0.28}
              strokeDasharray={emphasized ? undefined : "1.2 1.1"}
            />
          );
        })}
      </svg>

      {nodes.map((node, index) => (
        <NeedNodeMarker key={node.id} node={node} active={node.id === activeNodeId} index={index} />
      ))}

      <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/8 bg-black/20 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">
              The graph clusters constraints, not just visible incidents.
            </p>
            <p className="text-sm text-slate-400">
              Water, health, and protection dependencies stay connected so the queue does not fragment.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LegendBadge label="Water" tone="water" />
            <LegendBadge label="Medical" tone="medical" />
            <LegendBadge label="Food" tone="food" />
            <LegendBadge label="Protection" tone="protection" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NeedNodeMarker({
  node,
  active,
  index,
}: {
  node: NeedNode;
  active: boolean;
  index: number;
}) {
  const tone = clusterTone[node.cluster];

  return (
    <Tooltip>
      <TooltipTrigger className="contents">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: index * 0.06 }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
          }}
        >
          <div
            className={cn(
              "min-w-[9.2rem] rounded-[1.5rem] border border-white/10 bg-[#0d1527]/92 px-3.5 py-3 shadow-[0_18px_42px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all",
              active && "scale-[1.03] border-white/24",
            )}
            style={{
              boxShadow: active
                ? `0 22px 48px -26px ${tone.glow}`
                : `0 14px 36px -30px ${tone.glow}`,
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="size-3 rounded-full" style={{ backgroundColor: tone.fill }} />
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{node.ward}</p>
            </div>
            <p className="font-medium text-white">{node.label}</p>
            <p className="mt-1 text-xs text-slate-400">{node.households} households</p>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs rounded-2xl border-white/10 bg-[#0d1426] text-white">
        <p className="font-medium">{node.label}</p>
        <p className="text-xs text-slate-400">
          {node.households} households · {node.severity} severity
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function WardPressureGrid({
  cells,
}: {
  cells: {
    ward: string;
    pressure: number;
    served: number;
  }[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
        {cells.map((cell) => (
          <div
            key={cell.ward}
            className="rounded-[24px] border border-white/8 bg-[#0b1020] p-4 shadow-[0_14px_40px_-34px_rgba(124,167,255,0.55)]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{cell.ward}</p>
            <p className="mt-3 font-heading text-3xl text-white">{cell.pressure}</p>
            <p className="text-xs text-slate-500">pressure score</p>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Served</span>
                <span>{cell.served}%</span>
              </div>
              <Progress value={cell.served} className="h-2.5 bg-white/8" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
          Darker intensity surfaces wards where hidden pressure is building faster than the public queue.
        </div>
        <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
          Coverage bars help coordinators see whether the system is correcting for bias or reinforcing it.
        </div>
      </div>
    </div>
  );
}

function BriefColumn({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className={cn("rounded-[28px] border p-5", tone)}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#09111d] text-white">
          <Icon className="size-4" />
        </div>
        <p className="font-heading text-xl text-white">{title}</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-[20px] border border-white/8 bg-black/15 px-4 py-3 text-sm leading-7 text-slate-200"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function PastelInfoCard({
  tone,
  label,
  value,
}: {
  tone: "blue" | "rose" | "amber" | "mint";
  label: string;
  value: string;
}) {
  const toneClass = {
    blue: "border-[#7ca7ff]/22 bg-[#7ca7ff]/10",
    rose: "border-[#ff9fb5]/22 bg-[#ff9fb5]/10",
    amber: "border-[#ffbe6d]/22 bg-[#ffbe6d]/10",
    mint: "border-[#66d9c3]/22 bg-[#66d9c3]/10",
  }[tone];

  return (
    <div className={cn("rounded-[24px] border p-4", toneClass)}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 font-heading text-xl text-white">{value}</p>
    </div>
  );
}

function FieldPreviewCard({
  tone,
  title,
  body,
  stat,
}: {
  tone: string;
  title: string;
  body: string;
  stat: string;
}) {
  return (
    <div className={cn("rounded-[26px] border border-white/8 bg-gradient-to-br p-5 text-[#0a1020]", tone)}>
      <div className="flex items-center justify-between">
        <p className="font-heading text-xl">{title}</p>
        <div className="rounded-full bg-black/8 px-3 py-1 text-xs font-medium">{stat}</div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-700">{body}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-800">
        Check workflow
        <ArrowRight className="size-4" />
      </div>
    </div>
  );
}

function JudgeProofCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-[#0b1020] p-5">
      <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-[#5f86ff] text-white shadow-[0_16px_32px_-20px_rgba(95,134,255,0.92)]">
        <Icon className="size-5" />
      </div>
      <p className="font-heading text-xl text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{detail}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-xl text-white">{value}</p>
    </div>
  );
}

function MetricStack({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/18 px-4 py-3">
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-lg text-white">{value}</p>
    </div>
  );
}

function InfoLine({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className={dark ? "text-slate-500" : "text-slate-600"}>{label}</span>
      <span
        className={cn(
          "max-w-[65%] text-right font-medium leading-6",
          dark ? "text-white" : "text-slate-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function LegendBadge({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof clusterTone;
}) {
  return (
    <Badge
      className={cn(
        "rounded-full border border-white/10 px-3 py-1 text-slate-100",
        `bg-gradient-to-r ${clusterTone[tone].label}`,
      )}
    >
      {label}
    </Badge>
  );
}

function compactLabel(value: string) {
  if (value.length <= 28) {
    return value;
  }

  return `${value.slice(0, 25)}...`;
}

function presentOperationalText(value: string) {
  return value
    .replace("Fallback intelligence used because Gemini credentials are not fully configured yet. ", "")
    .replace("The report still indicates", "The report indicates")
    .replace("Prototype fallback", "Demo intelligence layer")
    .trim();
}

function presentIntelligenceSource(value: string) {
  return value.toLowerCase().includes("fallback") ? "Demo intelligence layer" : value;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function pastelTag(index: number) {
  return [
    "bg-[#dce4ff] text-[#162544]",
    "bg-[#ffe4d2] text-[#3d2412]",
    "bg-[#ded8ff] text-[#2d2552]",
    "bg-[#d7f4eb] text-[#123930]",
  ][index % 4];
}
