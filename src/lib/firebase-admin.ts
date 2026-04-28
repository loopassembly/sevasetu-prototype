import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type ServiceAccountShape = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedServiceAccount: ServiceAccountShape | null | undefined;

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}

function resolveServiceAccountPath() {
  const explicitPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (explicitPath) {
    return explicitPath;
  }

  const candidates = [
    path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "SevaSetu Firebase Admin SDK.json",
    ),
    path.join(/* turbopackIgnore: true */ process.cwd(), "SevaSetu IAM Admin.json"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function readServiceAccount() {
  if (cachedServiceAccount !== undefined) {
    return cachedServiceAccount;
  }

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (inlineJson) {
    const parsed = JSON.parse(inlineJson) as ServiceAccountShape;
    cachedServiceAccount = {
      ...parsed,
      private_key: normalizePrivateKey(parsed.private_key),
    };
    return cachedServiceAccount;
  }

  const credentialPath = resolveServiceAccountPath();

  if (!existsSync(credentialPath)) {
    cachedServiceAccount = null;
    return cachedServiceAccount;
  }

  const parsed = JSON.parse(readFileSync(credentialPath, "utf8")) as ServiceAccountShape;
  cachedServiceAccount = {
    ...parsed,
    private_key: normalizePrivateKey(parsed.private_key),
  };
  return cachedServiceAccount;
}

export function readFirebaseProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    readServiceAccount()?.project_id ||
    "sevasetu-494711"
  );
}

export function readFirebaseStorageBucket() {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${readFirebaseProjectId()}.firebasestorage.app`
  );
}

export function getFirebaseAdminApp() {
  const existing = getApps()[0];

  if (existing) {
    return existing;
  }

  const serviceAccount = readServiceAccount();

  return initializeApp({
    credential: serviceAccount
      ? cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        })
      : applicationDefault(),
    projectId: readFirebaseProjectId(),
    storageBucket: readFirebaseStorageBucket(),
  });
}

export function getDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getBucket() {
  return getStorage(getFirebaseAdminApp()).bucket(readFirebaseStorageBucket());
}

export function getServiceAccountForGoogleAuth() {
  const serviceAccount = readServiceAccount();

  if (!serviceAccount) {
    return null;
  }

  return {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  };
}
