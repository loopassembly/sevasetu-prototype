import { GoogleGenAI } from "@google/genai";

import {
  defaultBrief,
  defaultExtraction,
  type BriefResult,
  type ExtractionResult,
  type Mission,
} from "@/lib/sevasetu-data";
import {
  getServiceAccountForGoogleAuth,
  readFirebaseProjectId,
} from "@/lib/firebase-admin";

type ImageInput = {
  base64Data: string;
  mimeType: string;
};

function readApiKey() {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY
  );
}

function stripCodeFences(raw: string) {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function getClient() {
  const apiKey = readApiKey();

  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  const credentials = getServiceAccountForGoogleAuth();
  const project = readFirebaseProjectId();

  if (!project) {
    return null;
  }

  return new GoogleGenAI({
    vertexai: true,
    project,
    location: process.env.GOOGLE_CLOUD_LOCATION || "global",
    googleAuthOptions: credentials ? { credentials } : undefined,
  });
}

function keywordFallback(report: string): ExtractionResult {
  const lowered = report.toLowerCase();
  const urgency = lowered.includes("pregnant") || lowered.includes("fainted") ? "critical" : "high";
  const skills = ["Water logistics", "Local language outreach"];

  if (lowered.includes("medicine") || lowered.includes("nurse")) {
    skills.unshift("Nurse support");
  }

  if (lowered.includes("women")) {
    skills.push("Women-first outreach");
  }

  return {
    ...defaultExtraction,
    urgency,
    recommendedSkills: skills,
    summary:
      "Fallback intelligence used because Gemini credentials are not fully configured yet. The report still indicates a combined water and health response with route constraints.",
    source: "Fallback intelligence engine",
  };
}

function briefFallback(mission: Mission): BriefResult {
  return {
    ...defaultBrief,
    title: `Fallback mission brief for ${mission.ward}`,
    summary: `${mission.title} should be treated as a single combined mission. Prioritize the most vulnerable households first, keep the assigned squad language-matched, and close with beneficiary confirmation.`,
    deploymentPlan: [
      `Dispatch ${mission.volunteers} volunteers with ${mission.skills.join(", ")} capability.`,
      `Use ${mission.eta} as the route target and keep one coordinator free for beneficiary verification.`,
      "Bundle supplies and proof-of-service capture into one mission to avoid repeat household visits.",
    ],
    watchouts: [
      "Keep a human coordinator in approval for any low-confidence beneficiary record.",
      `Respect the language preference: ${mission.language}.`,
      "If one dependency fails, re-plan the route instead of splitting the mission into separate silos.",
    ],
    beneficiaryNotes: [
      mission.beneficiaries,
      "Use a confirmation flow suited for low-connectivity households before closure.",
    ],
    source: "Fallback intelligence engine",
  };
}

async function generateJson(prompt: string, image?: ImageInput) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const contents = image
    ? [
        { text: prompt },
        {
          inlineData: {
            data: image.base64Data,
            mimeType: image.mimeType,
          },
        },
      ]
    : prompt;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });

  return stripCodeFences(response.text ?? "");
}

export async function generateReportExtraction({
  report,
  image,
}: {
  report: string;
  image?: ImageInput;
}) {
  const prompt = `You are SevaSetu's need extraction engine for NGO field operations in India.
Convert the field input below into strict JSON with this exact shape:
{
  "summary": string,
  "urgency": "critical" | "high" | "moderate",
  "ward": string,
  "category": string,
  "recommendedSkills": string[],
  "actionSignals": string[],
  "beneficiaries": string,
  "confidence": string,
  "source": string
}

Rules:
- Keep it short, operational, and human-readable.
- Infer the best mission category and best-fit volunteer skills.
- Confidence must be a percentage string like "91%".
- Set "source" to "Gemini 2.5 Flash".
- If the image is noisy or partial, still infer the most likely relief need and mention uncertainty in actionSignals.

Field note:
${report}`;

  try {
    const raw = await generateJson(prompt, image);

    if (!raw) {
      return keywordFallback(report);
    }

    const parsed = JSON.parse(raw) as ExtractionResult;

    return {
      ...defaultExtraction,
      ...parsed,
      source: parsed.source || "Gemini 2.5 Flash",
    };
  } catch {
    return keywordFallback(report);
  }
}

export async function generateMissionBrief(mission: Mission) {
  const prompt = `You are SevaSetu's Gemini mission copilot for NGO volunteer coordination in India.
Create an operational brief for the mission below.
Return strict JSON with this exact shape:
{
  "title": string,
  "summary": string,
  "deploymentPlan": string[],
  "watchouts": string[],
  "beneficiaryNotes": string[],
  "source": string
}

Rules:
- Make the brief practical, concise, and route-aware.
- Reference the mission's specific constraints and skills.
- Set "source" to "Gemini 2.5 Flash".

Mission:
${JSON.stringify(mission, null, 2)}`;

  try {
    const raw = await generateJson(prompt);

    if (!raw) {
      return briefFallback(mission);
    }

    const parsed = JSON.parse(raw) as BriefResult;

    return {
      ...defaultBrief,
      ...parsed,
      source: parsed.source || "Gemini 2.5 Flash",
    };
  } catch {
    return briefFallback(mission);
  }
}
