# BlueShield — Human-Verified Coastal Pollution Response & Prevention Platform

> **Location Target**: Visakhapatnam, Andhra Pradesh, India (Bay of Bengal Coastline)  
> **Operational Domain**: Civic Technology & Environmental Marine Protection Intelligence

BlueShield is a production-grade, human-in-the-loop coastal pollution monitoring, dispatch, and prevention platform. It addresses marine debris, industrial discharge, plastic aggregation, and maritime hazards along the 32 km urban and industrial shoreline of Visakhapatnam.

---

## 1. Project Overview

BlueShield bridges citizen reporting with municipal and volunteer cleanup action through an auditable, multi-stage verification pipeline:

1. **Citizen Field Reporting**: Geo-located reports with photographic evidence, coastal zone detection, and severity assessment.
2. **Human Coordinator Verification**: High-integrity triage queue preventing false dispatches, duplicates, or malicious reports.
3. **Dispatch & Assignment**: Targeted hand-off to local civic authorities (GVMC), port operators (VPA), Coast Guard, or NGO cleanup squads.
4. **Remediation & Closure Audit**: Field crews document before/after photos and waste weight (kg); coordinators review evidence before final verified closure.
5. **Hotspot & Trend Intelligence**: Automated spatial clustering (500m radius) identifying chronic accumulation nodes like RK Beach, Fishing Harbour, Rushikonda, and Gangavaram.
6. **Interoperability Ready**: Clean REST-compatible domain abstractions designed for future bi-directional API synchronizations with official civic command centres.

---

## 2. Technology Stack

* **Frontend Framework**: React 19 SPA with TypeScript 5.7
* **Build Tooling**: Vite 6 (ESM module bundler)
* **Styling & Typography**: Tailwind CSS v4, Plus Jakarta Sans, JetBrains Mono
* **Cartography & GIS**: Leaflet 1.9 + OpenStreetMap tiles with custom SVG coordinate markers
* **Database & Realtime Backend**: Google Cloud Firestore (multi-region with strict client security rules)
* **Authentication**: Firebase Authentication (Email/Password, Google OAuth, and session token state management)
* **Blob / Evidence Storage**: Firebase Storage with client-side fallback image compression (DataURL)
* **Icons & UI Primitives**: Lucide React
* **Data Processing**: PapaParse (CSV streaming), SheetJS / XLSX (Historical cleanup records)

---

## 3. Architecture

BlueShield utilizes a client-first reactive architecture backed by Firestore real-time snapshots (`onSnapshot`).

```
┌────────────────────────────────────────────────────────┐
│                   BlueShield Client                    │
│                                                        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────┐  │
│  │ Citizen Report │  │ Human Triage   │  │ Dispatch │  │
│  │ Mobile Form    │  │ Coordinator    │  │ Console  │  │
│  └───────┬────────┘  └───────┬────────┘  └────┬─────┘  │
│          │                   │                │        │
│          ▼                   ▼                ▼        │
│    ┌─────────────────────────────────────────────┐     │
│    │        Context Layer & Domain Services      │     │
│    │  (AuthContext, IncidentContext, Cleanup)    │     │
│    └──────────────────────┬──────────────────────┘     │
└───────────────────────────┼────────────────────────────┘
                            │ HTTPS / WSS
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Google Cloud Platform                  │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Cloud Firestore     │  │   Firebase Auth       │  │
│  │  (Reports, Hotspots,  │  │  (Role tokens &       │  │
│  │   Audit, Logs, Rules) │  │   Profiles)           │  │
│  └───────────────────────┘  └───────────────────────┘  │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Firebase Storage    │  │   Cloud Run           │  │
│  │  (Evidence Photos)    │  │  (Static SPA Serving) │  │
│  └───────────────────────┘  └───────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Architectural Support for Civic & Municipal Systems
*Note: External municipal government APIs are not directly integrated in this standalone deployment.*  
BlueShield's data schemas (standardized geo-coordinates, ISO timestamps, severity tiers, and immutable audit logs) are engineered to support future bidirectional webhooks and REST interoperability with official municipal dashboards (e.g., Greater Visakhapatnam Municipal Corporation - GVMC, APPCB, or Smart Cities Command Centers).

---

## 4. Firebase Setup

1. **Create Firebase Project**:
   Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. **Enable Firestore Database**:
   * Navigate to **Firestore Database** -> **Create Database**.
   * Choose standard multi-region or closest region (e.g., `asia-south1`).
3. **Enable Firebase Authentication**:
   * Navigate to **Authentication** -> **Sign-in method**.
   * Enable **Email/Password** and optionally **Google**.
4. **Enable Firebase Storage**:
   * Navigate to **Storage** -> **Get Started**.
5. **Security Rules Deployment**:
   Rules are defined in `firestore.rules`. Deploy using Firebase CLI or the project's provisioning tool:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 5. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
# Firebase Client Credentials
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
VITE_FIREBASE_DATABASE_ID="(default)"

# Server-Side Gemini API Key (when AI features are enabled)
GEMINI_API_KEY=""
```

> **Security Note**: Never commit `.env` or production service account credentials into version control.

---

## 6. Database Collections & Schema

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| `reports` | `id`, `reportNumber`, `latitude`, `longitude`, `pollutionType`, `severity`, `status`, `photoUrl`, `assignedOrgId`, `cleanupNotes`, `afterPhotoUrl`, `weightCollectedKg`, `createdAt`, `updatedAt` | Core pollution incident lifecycle document |
| `users` | `id`, `email`, `name`, `role`, `organization`, `badgeLevel`, `createdAt` | User accounts with RBAC roles |
| `activity_logs` | `id`, `reportId`, `action`, `actorId`, `actorName`, `actorRole`, `details`, `timestamp` | Immutable compliance and verification audit trail |
| `organizations` | `id`, `name`, `type`, `jurisdiction`, `contactEmail`, `contactPhone`, `activeTeamCount` | Assigned response units (GVMC, Coast Guard, etc.) |
| `hotspot_zones` | `id`, `name`, `latitude`, `longitude`, `radiusMeters`, `riskLevel`, `incidentCount`, `dominantPollutant` | Algorithmic clusters calculated along the shoreline |
| `historical_cleanups` | `id`, `source`, `locationName`, `latitude`, `longitude`, `date`, `wasteType`, `weightKg`, `volunteersCount` | Baseline datasets for multi-year trend tracking |

---

## 7. Authentication & Roles (RBAC)

BlueShield enforces strict Role-Based Access Control:

* **CITIZEN / GUEST**: Can submit reports, track report status by report number, view public maps, and inspect hotspot zones.
* **COORDINATOR**: Access to `/verify` human review queue, triage validation, duplicate marking, and task assignments.
* **CLEANUP_TEAM / FIELD**: Access to `/field` and `/assignments/:id`, can accept tasks, submit field "after" photos, and record kilograms removed.
* **ADMIN**: Access to `/admin`, platform configuration, user roles, system metrics, and audit log inspection.
* **RESEARCHER**: Access to `/analytics` and `/historical-import` for scientific analysis and longitudinal modeling.

---

## 8. Running Locally

### Prerequisites
* Node.js v20.x or higher
* npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/blueshield.git
cd blueshield

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Type-Checking & Linting
```bash
# Run TypeScript compilation checks
npm run lint

# Run Vite production build test
npm run build
```

---

## 9. Deployment

### Google Cloud Run / AI Studio Deployment
1. Verify `metadata.json` and `package.json` build scripts.
2. Build the production bundle:
   ```bash
   npm run build
   ```
3. The application is hosted as a containerized web service serving the Vite dist output.
4. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 10. Historical Data Import

BlueShield includes a historical data ingestion engine supporting CSV and Excel spreadsheets:

* **Path**: `/historical-import`
* **Features**:
  * Auto-mapping of columns (`Date`, `Location / Beach`, `Latitude`, `Longitude`, `Pollutant / Waste Type`, `Weight (kg)`, `Volunteers`).
  * Instant deduplication against existing cleanup identifiers.
  * In-memory validation with row-by-row error detection.
  * Seed dataset included: `/public/historical_beach_cleanup_visakhapatnam.csv` covering 20 historical coastal cleanup drives from 2022 to 2024.

---

## 11. Known Limitations

1. **Browser Geolocation in Iframe Sandboxes**:
   * If embedded in an iframe that restricts the `geolocation` permission policy, the GPS auto-detect button falls back to user-selectable beach presets.
2. **Storage Bucket Free-Tier Constraints**:
   * If Firebase Storage is not configured with public read CORS, images fall back to compressed base64 strings stored directly on the report document.
3. **Simulated Institutional Responses**:
   * Municipal dispatch operations are internally tracked; notification emails to agencies are simulated through client-side workflows without third-party email gateway dependencies.

---

## 12. Future AI Roadmap

Planned intelligence enhancements for future iterations:

1. **Computer Vision Waste Classification**:
   * Automated preliminary classification of plastic polymers, fishing net entanglements, and chemical slicks using lightweight client-side edge models.
2. **Tidal & Ocean Current Drift Modeling**:
   * Integration with INCOIS (Indian National Centre for Ocean Information Services) ocean current models to trace coastal debris origins.
3. **Automated De-duplication Scoring**:
   * Visual similarity cosine embeddings to flag multiple citizen submissions of the same incident within 50 meters and 4 hours.
4. **Predictive Hotspot Allocation**:
   * Weather and monsoon runoff forecasting to preposition municipal cleanup bins prior to peak beach tourist cycles.

---

*BlueShield Visakhapatnam Shoreline Protocol — Engineered for Marine Conservation.*
