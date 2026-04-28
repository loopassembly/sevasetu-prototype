# SevaSetu Prototype

SevaSetu is an AI-powered community need intelligence and volunteer orchestration platform designed for India-scale social impact operations. This prototype is built for the `Smart Resource Allocation` theme and demonstrates how NGOs and volunteer groups can move from scattered field signals to fair, explainable, route-aware missions.

## What the prototype shows

- `Command center`: a polished operations dashboard with a live NeedGraph, ward pressure grid, and route-aware mission queue.
- `Field capture`: transforms voice-note style reports and messy field updates into structured operational data.
- `Fairness lens`: visualizes resource allocation versus actual vulnerability so high-visibility wards do not crowd out underserved ones.
- `AI copilot`: generates deployment-ready mission briefs using `Gemini 2.5 Flash` when a Google AI key is configured, with an offline-safe fallback when it is not.

## Tech stack

- `Next.js 16` with App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Framer Motion`
- `Recharts`
- `Google AI SDK` with `Gemini 2.5 Flash`

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
cp .env.example .env.local
```

3. Set your Google AI key:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

4. Configure Firebase admin access for server routes:

```bash
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

5. Start the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

## Build verification

```bash
npm run lint
npm run build
```

## Google AI usage

This prototype uses:

- `Gemini 2.5 Flash` for field report extraction
- `Gemini 2.5 Flash` for mission briefing and summarization

If the API key is missing, the prototype still works with deterministic fallback responses so the UX remains demoable.

## Cloud Run deployment

The project is configured for Google Cloud Run via a standalone Next.js build.

### Build the container

```bash
docker build -t sevasetu-prototype .
```

### Run the container locally

```bash
docker run --rm -p 8080:8080 \
  -e GOOGLE_GENERATIVE_AI_API_KEY=YOUR_KEY \
  -e FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID \
  -e FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET \
  -e FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
  sevasetu-prototype
```

### Build in Google Cloud

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/sevasetu-prototype
```

### Deploy to Cloud Run

```bash
gcloud run deploy sevasetu-prototype \
  --image gcr.io/PROJECT_ID/sevasetu-prototype \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_GENERATIVE_AI_API_KEY=YOUR_KEY,FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET,FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### Recommended production setup

- Region: `asia-south1`
- Service: `Cloud Run`
- Data: `Firestore` and `Cloud Storage`
- Notifications: `Firebase Cloud Messaging`
- Analytics: `BigQuery` + `Looker Studio`

## Graphify outputs

Graphify was run on the `src` directory to produce architecture artifacts:

- `graphify-out/graph.html`
- `graphify-out/graph.svg`
- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`

These are useful for explaining the code structure, preparing architecture slides, and producing audit-friendly engineering documentation.
