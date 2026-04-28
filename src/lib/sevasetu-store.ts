import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";

import { getBucket, getDb } from "@/lib/firebase-admin";
import { generateReportExtraction } from "@/lib/sevasetu-ai";
import {
  defaultExtraction,
  fairnessData,
  impactStats,
  missions,
  needGraphEdges,
  needGraphNodes,
  responseTrend,
  seedProofs,
  seedReports,
  type DashboardPayload,
  type Mission,
  type MissionStatus,
  type ProofRecord,
  type ReportRecord,
  type VolunteerRecord,
  volunteers,
  wardGrid,
} from "@/lib/sevasetu-data";

const COLLECTIONS = {
  reports: "reports",
  missions: "missions",
  volunteers: "volunteers",
  proofs: "proofs",
  meta: "_meta",
} as const;

type LocalStore = {
  seededAt: string;
  missions: Mission[];
  reports: ReportRecord[];
  proofs: ProofRecord[];
  volunteers: VolunteerRecord[];
};

function localStorePath() {
  return path.join(process.cwd(), ".sevasetu-dev-store.json");
}

function localUploadDirectory(folder: "reports" | "proofs") {
  return path.join(process.cwd(), "public", "dev-uploads", folder);
}

function buildLocalSeed(): LocalStore {
  return {
    seededAt: new Date().toISOString(),
    missions: missions.map((mission) => ({
      ...mission,
      reportIds: mission.reportIds ? [...mission.reportIds] : [],
      assignedVolunteerIds: mission.assignedVolunteerIds ? [...mission.assignedVolunteerIds] : [],
      proofCount: mission.proofCount || seedProofs.filter((proof) => proof.missionId === mission.id).length,
      createdAt: mission.createdAt || new Date().toISOString(),
      updatedAt: mission.updatedAt || new Date().toISOString(),
    })),
    reports: seedReports.map((report) => ({
      ...report,
      recommendedSkills: [...report.recommendedSkills],
      actionSignals: [...report.actionSignals],
    })),
    proofs: seedProofs.map((proof) => ({ ...proof })),
    volunteers: volunteers.map((volunteer) => ({
      ...volunteer,
      skills: [...volunteer.skills],
      languages: [...volunteer.languages],
    })),
  };
}

function readLocalStore() {
  const storePath = localStorePath();

  if (!existsSync(storePath)) {
    const seeded = buildLocalSeed();
    writeFileSync(storePath, JSON.stringify(seeded, null, 2));
    return seeded;
  }

  return JSON.parse(readFileSync(storePath, "utf8")) as LocalStore;
}

function writeLocalStore(store: LocalStore) {
  writeFileSync(localStorePath(), JSON.stringify(store, null, 2));
}

function isCloudUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("PERMISSION_DENIED") ||
    error.message.includes("NOT_FOUND") ||
    error.message.includes("firestore.googleapis.com") ||
    error.message.includes("storage.googleapis.com") ||
    error.message.includes("Could not load the default credentials") ||
    error.message.includes("No such object") ||
    error.message.includes("bucket")
  );
}

function toIso(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function asMission(record: Record<string, unknown>): Mission {
  return {
    id: String(record.id),
    title: String(record.title),
    ward: String(record.ward),
    eta: String(record.eta),
    status: (record.status as MissionStatus) || "needs-review",
    households: Number(record.households || 0),
    beneficiaries: String(record.beneficiaries || ""),
    language: String(record.language || "Hindi"),
    skills: Array.isArray(record.skills) ? record.skills.map(String) : [],
    volunteers: Number(record.volunteers || 0),
    note: String(record.note || ""),
    focusNodeId: String(record.focusNodeId || "safe-water"),
    reportIds: Array.isArray(record.reportIds) ? record.reportIds.map(String) : [],
    assignedVolunteerIds: Array.isArray(record.assignedVolunteerIds)
      ? record.assignedVolunteerIds.map(String)
      : [],
    proofCount: Number(record.proofCount || 0),
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

function asReport(record: Record<string, unknown>): ReportRecord {
  return {
    id: String(record.id),
    sourceType: (record.sourceType as ReportRecord["sourceType"]) || "text",
    rawText: String(record.rawText || ""),
    ward: String(record.ward || defaultExtraction.ward),
    category: String(record.category || defaultExtraction.category),
    urgency: (record.urgency as ReportRecord["urgency"]) || defaultExtraction.urgency,
    recommendedSkills: Array.isArray(record.recommendedSkills)
      ? record.recommendedSkills.map(String)
      : [...defaultExtraction.recommendedSkills],
    actionSignals: Array.isArray(record.actionSignals)
      ? record.actionSignals.map(String)
      : [...defaultExtraction.actionSignals],
    beneficiaries: String(record.beneficiaries || defaultExtraction.beneficiaries),
    confidence: String(record.confidence || defaultExtraction.confidence),
    summary: String(record.summary || defaultExtraction.summary),
    status: (record.status as ReportRecord["status"]) || "new",
    source: String(record.source || "SevaSetu"),
    imagePath: record.imagePath ? String(record.imagePath) : undefined,
    imageUrl: record.imageUrl ? String(record.imageUrl) : undefined,
    missionId: record.missionId ? String(record.missionId) : undefined,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

function asProof(record: Record<string, unknown>): ProofRecord {
  return {
    id: String(record.id),
    missionId: String(record.missionId),
    note: String(record.note || ""),
    volunteerName: String(record.volunteerName || "Volunteer"),
    verified: Boolean(record.verified),
    imagePath: record.imagePath ? String(record.imagePath) : undefined,
    imageUrl: record.imageUrl ? String(record.imageUrl) : undefined,
    createdAt: toIso(record.createdAt),
  };
}

function asVolunteer(record: Record<string, unknown>): VolunteerRecord {
  return {
    id: String(record.id),
    name: String(record.name),
    role: String(record.role),
    skills: Array.isArray(record.skills) ? record.skills.map(String) : [],
    languages: Array.isArray(record.languages) ? record.languages.map(String) : [],
    zone: String(record.zone),
    availability: Number(record.availability || 0),
    squad: String(record.squad || "Volunteer squad"),
  };
}

function pickFocusNodeId(category: string) {
  const lowered = category.toLowerCase();

  if (lowered.includes("water")) return "safe-water";
  if (lowered.includes("maternal") || lowered.includes("health")) return "maternal-meds";
  if (lowered.includes("elder")) return "elder-care";
  if (lowered.includes("food") || lowered.includes("nutrition")) return "community-kitchen";
  if (lowered.includes("ration")) return "ration-gap";

  return "heat-relief";
}

function inferLanguage(skills: string[], ward: string) {
  if (ward === "Ward 11") return "Hindi + Bhojpuri";
  if (ward === "Ward 05") return "Hindi + Maithili";
  if (skills.some((skill) => skill.toLowerCase().includes("translation"))) {
    return "Hindi + Bangla";
  }

  return "Hindi";
}

function buildMissionFromReport(report: ReportRecord) {
  const id = `mission-${randomUUID().slice(0, 8)}`;
  const volunteerCount = Math.min(9, Math.max(4, report.recommendedSkills.length + 3));

  return {
    id,
    title: `${report.ward} ${report.category} response mission`,
    ward: report.ward,
    eta:
      report.urgency === "critical"
        ? "18 min"
        : report.urgency === "high"
          ? "26 min"
          : "38 min",
    status: report.urgency === "critical" ? "ready" : "needs-review",
    households: extractHouseholdCount(report.beneficiaries),
    beneficiaries: report.beneficiaries,
    language: inferLanguage(report.recommendedSkills, report.ward),
    skills: report.recommendedSkills,
    volunteers: volunteerCount,
    note: report.summary,
    focusNodeId: pickFocusNodeId(report.category),
    reportIds: [report.id],
    assignedVolunteerIds: [],
    proofCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } satisfies Mission;
}

function extractHouseholdCount(beneficiaries: string) {
  const match = beneficiaries.match(/(\d{1,4})/);
  return match ? Number(match[1]) : 0;
}

async function getImageUrl(filePath: string) {
  try {
    const [url] = await getBucket().file(filePath).getSignedUrl({
      action: "read",
      expires: "2030-01-01",
    });

    return url;
  } catch {
    return undefined;
  }
}

async function uploadBuffer({
  folder,
  buffer,
  fileName,
  mimeType,
}: {
  folder: "reports" | "proofs";
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${folder}/${randomUUID()}/${safeName || `upload${path.extname(fileName) || ".bin"}`}`;

  try {
    const file = getBucket().file(storagePath);

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: mimeType,
        cacheControl: "public, max-age=3600",
      },
    });

    return {
      path: storagePath,
      url: await getImageUrl(storagePath),
    };
  } catch (error) {
    if (!isCloudUnavailable(error)) {
      throw error;
    }

    const uploadDir = localUploadDirectory(folder);
    mkdirSync(uploadDir, { recursive: true });
    const localFileName = `${randomUUID()}-${safeName || "upload.bin"}`;
    const absolutePath = path.join(uploadDir, localFileName);
    writeFileSync(absolutePath, buffer);

    return {
      path: `local:${folder}/${localFileName}`,
      url: `/dev-uploads/${folder}/${localFileName}`,
    };
  }
}

export async function ensureSeeded() {
  const db = getDb();
  const metaRef = db.collection(COLLECTIONS.meta).doc("seed");
  const metaSnap = await metaRef.get();

  if (metaSnap.exists) {
    return;
  }

  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const volunteer of volunteers) {
    batch.set(db.collection(COLLECTIONS.volunteers).doc(volunteer.id), volunteer);
  }

  for (const mission of missions) {
    batch.set(db.collection(COLLECTIONS.missions).doc(mission.id), {
      ...mission,
      createdAt: mission.createdAt || seededAt,
      updatedAt: mission.updatedAt || seededAt,
      proofCount: mission.proofCount || 0,
    });
  }

  for (const report of seedReports) {
    batch.set(db.collection(COLLECTIONS.reports).doc(report.id), report);
  }

  for (const proof of seedProofs) {
    batch.set(db.collection(COLLECTIONS.proofs).doc(proof.id), proof);
  }

  batch.set(metaRef, {
    seededAt,
    version: 1,
  });

  await batch.commit();
}

export async function getDashboardData(): Promise<DashboardPayload> {
  try {
    await ensureSeeded();
    const db = getDb();

    const [missionSnap, reportSnap, proofSnap, volunteerSnap] = await Promise.all([
      db.collection(COLLECTIONS.missions).get(),
      db.collection(COLLECTIONS.reports).get(),
      db.collection(COLLECTIONS.proofs).get(),
      db.collection(COLLECTIONS.volunteers).get(),
    ]);

    const missionsData = missionSnap.docs
      .map((doc: QueryDocumentSnapshot<DocumentData>) => asMission({ id: doc.id, ...doc.data() }))
      .sort(
        (a: Mission, b: Mission) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );

    const reportsData = await Promise.all(
      reportSnap.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = asReport({ id: doc.id, ...doc.data() });
        return data.imagePath && !data.imageUrl
          ? { ...data, imageUrl: await getImageUrl(data.imagePath) }
          : data;
      }),
    );

    reportsData.sort(
      (a: ReportRecord, b: ReportRecord) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const proofsData = await Promise.all(
      proofSnap.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = asProof({ id: doc.id, ...doc.data() });
        return data.imagePath && !data.imageUrl
          ? { ...data, imageUrl: await getImageUrl(data.imagePath) }
          : data;
      }),
    );

    proofsData.sort(
      (a: ProofRecord, b: ProofRecord) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const volunteerData = volunteerSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) =>
      asVolunteer({ id: doc.id, ...doc.data() }),
    );

    return buildDashboardPayload({
      missions: missionsData,
      reports: reportsData,
      proofs: proofsData,
      volunteers: volunteerData,
    });
  } catch (error) {
    if (!isCloudUnavailable(error)) {
      throw error;
    }

    const localStore = readLocalStore();
    return buildDashboardPayload(localStore);
  }
}

export async function createTextReport({
  rawText,
}: {
  rawText: string;
}) {
  const reportId = `report-${randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();

  const extraction = await generateReportExtraction({ report: rawText });

  const draftReport: ReportRecord = {
    id: reportId,
    sourceType: "text",
    rawText,
    ward: extraction.ward,
    category: extraction.category,
    urgency: extraction.urgency,
    recommendedSkills: extraction.recommendedSkills,
    actionSignals: extraction.actionSignals,
    beneficiaries: extraction.beneficiaries,
    confidence: extraction.confidence,
    summary: extraction.summary,
    status: "triaged",
    source: extraction.source,
    createdAt,
    updatedAt: createdAt,
  };

  const mission = buildMissionFromReport(draftReport);
  const report = {
    ...draftReport,
    missionId: mission.id,
    status: "mission-created" as const,
    updatedAt: new Date().toISOString(),
  };

  try {
    await ensureSeeded();
    const db = getDb();
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.reports).doc(report.id), report);
    batch.set(db.collection(COLLECTIONS.missions).doc(mission.id), mission);
    await batch.commit();
  } catch (error) {
    if (!isCloudUnavailable(error)) {
      throw error;
    }

    const localStore = readLocalStore();
    localStore.reports.unshift(report);
    localStore.missions.unshift(mission);
    writeLocalStore(localStore);
  }

  return {
    report,
    mission,
    extraction,
  };
}

export async function createImageReport({
  rawText,
  fileBuffer,
  fileName,
  mimeType,
}: {
  rawText: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
}) {
  const reportId = `report-${randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  const upload = await uploadBuffer({
    folder: "reports",
    buffer: fileBuffer,
    fileName,
    mimeType,
  });

  const extraction = await generateReportExtraction({
    report: rawText || "Image-only field intake submitted for extraction.",
    image: {
      base64Data: fileBuffer.toString("base64"),
      mimeType,
    },
  });

  const draftReport: ReportRecord = {
    id: reportId,
    sourceType: "image",
    rawText: rawText || "Image-only field intake submitted for extraction.",
    ward: extraction.ward,
    category: extraction.category,
    urgency: extraction.urgency,
    recommendedSkills: extraction.recommendedSkills,
    actionSignals: extraction.actionSignals,
    beneficiaries: extraction.beneficiaries,
    confidence: extraction.confidence,
    summary: extraction.summary,
    status: "triaged",
    source: extraction.source,
    imagePath: upload.path,
    imageUrl: upload.url,
    createdAt,
    updatedAt: createdAt,
  };

  const mission = buildMissionFromReport(draftReport);
  const report = {
    ...draftReport,
    missionId: mission.id,
    status: "mission-created" as const,
    updatedAt: new Date().toISOString(),
  };

  try {
    await ensureSeeded();
    const db = getDb();
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.reports).doc(report.id), report);
    batch.set(db.collection(COLLECTIONS.missions).doc(mission.id), mission);
    await batch.commit();
  } catch (error) {
    if (!isCloudUnavailable(error)) {
      throw error;
    }

    const localStore = readLocalStore();
    localStore.reports.unshift(report);
    localStore.missions.unshift(mission);
    writeLocalStore(localStore);
  }

  return {
    report,
    mission,
    extraction,
  };
}

export async function updateMissionStatus({
  missionId,
  status,
}: {
  missionId: string;
  status: MissionStatus;
}) {
  try {
    await ensureSeeded();
    const db = getDb();
    const missionRef = db.collection(COLLECTIONS.missions).doc(missionId);

    await missionRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });

    const snap = await missionRef.get();

    if (!snap.exists) {
      throw new Error("Mission not found after update.");
    }

    return asMission({ id: snap.id, ...snap.data() });
  } catch (error) {
    if (!isCloudUnavailable(error)) {
      throw error;
    }

    const localStore = readLocalStore();
    const mission = localStore.missions.find((item) => item.id === missionId);

    if (!mission) {
      throw new Error("Mission not found.");
    }

    mission.status = status;
    mission.updatedAt = new Date().toISOString();
    writeLocalStore(localStore);
    return mission;
  }
}

export async function createProof({
  missionId,
  note,
  volunteerName,
  fileBuffer,
  fileName,
  mimeType,
}: {
  missionId: string;
  note: string;
  volunteerName: string;
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
}) {
  const proofId = `proof-${randomUUID().slice(0, 8)}`;
  let upload: { path: string; url?: string } | undefined;

  if (fileBuffer && fileName && mimeType) {
    upload = await uploadBuffer({
      folder: "proofs",
      buffer: fileBuffer,
      fileName,
      mimeType,
    });
  }

  const proof: ProofRecord = {
    id: proofId,
    missionId,
    note,
    volunteerName,
    verified: true,
    imagePath: upload?.path,
    imageUrl: upload?.url,
    createdAt: new Date().toISOString(),
  };

  try {
    await ensureSeeded();
    const db = getDb();
    const missionRef = db.collection(COLLECTIONS.missions).doc(missionId);
    const missionSnap = await missionRef.get();

    if (!missionSnap.exists) {
      throw new Error("Mission not found.");
    }

    const mission = asMission({ id: missionSnap.id, ...missionSnap.data() });
    const nextProofCount = (mission.proofCount || 0) + 1;

    await Promise.all([
      db.collection(COLLECTIONS.proofs).doc(proof.id).set(proof),
      missionRef.update({
        status: "completed",
        proofCount: nextProofCount,
        updatedAt: new Date().toISOString(),
      }),
    ]);

    const updatedMissionSnap = await missionRef.get();

    return {
      proof,
      mission: asMission({ id: updatedMissionSnap.id, ...updatedMissionSnap.data() }),
    };
  } catch (error) {
    if (!isCloudUnavailable(error)) {
      throw error;
    }

    const localStore = readLocalStore();
    const mission = localStore.missions.find((item) => item.id === missionId);

    if (!mission) {
      throw new Error("Mission not found.");
    }

    mission.status = "completed";
    mission.proofCount = (mission.proofCount || 0) + 1;
    mission.updatedAt = new Date().toISOString();
    localStore.proofs.unshift(proof);
    writeLocalStore(localStore);

    return {
      proof,
      mission,
    };
  }
}

function buildDashboardPayload({
  missions,
  reports,
  proofs,
  volunteers,
}: {
  missions: Mission[];
  reports: ReportRecord[];
  proofs: ProofRecord[];
  volunteers: VolunteerRecord[];
}): DashboardPayload {
  const completedCount = missions.filter((mission: Mission) => mission.status === "completed").length;
  const dispatchingCount = missions.filter(
    (mission: Mission) => mission.status === "dispatching",
  ).length;

  return {
    impactStats: [
      {
        ...impactStats[0],
        value: String(reports.length),
      },
      {
        ...impactStats[1],
        value: `${Math.max(5, 18 - completedCount - dispatchingCount)} min`,
      },
      {
        ...impactStats[2],
        value: `+${28 + completedCount * 3}%`,
      },
    ],
    responseTrend,
    fairnessData,
    wardGrid,
    needGraphNodes,
    needGraphEdges,
    missions,
    reports,
    proofs,
    volunteers,
  };
}
