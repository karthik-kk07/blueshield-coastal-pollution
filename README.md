# BlueShield — Human-Verified Coastal Pollution Response & Prevention Platform

> **Location Target**: Visakhapatnam, Andhra Pradesh, India (Bay of Bengal Littoral Coastline)  
> **Operational Domain**: Civic Technology, Marine Habitat Conservation & Environmental Intelligence  
> **Architecture Target**: 100% Free Local-First Static Web Application (Zero-Cloud / Zero-Paid Backend)

---

## 1. Project Overview

BlueShield is a production-grade, human-in-the-loop coastal pollution monitoring, dispatch, and root-cause prevention platform designed for the 32-kilometer urban and industrial coastline of Visakhapatnam.

The platform addresses acute marine debris accumulation, monofilament trawl net entanglement (ghost gear threatening Olive Ridley sea turtles), illegal nocturnal industrial dumping near Dolphin's Nose, and perennial storm-nala runoff into civic beaches like RK Beach and Rushikonda Blue Flag Beach.

**Core Mission:**  
> *"Protecting our coastline through people, data and action."*

---

## 2. The Problem

Coastal pollution management in rapidly expanding port cities faces critical structural bottlenecks:

1. **Unverified Citizen Influx**: Municipal command centers are flooded with vague or duplicate social media complaints without actionable GPS coordinates, tide details, or photographic ground truth.
2. **Jurisdictional Silos**: Shorelines are fragmented between the Municipal Corporation (GVMC), the Port Authority (VPA), the Indian Coast Guard (ICG), and the State Pollution Control Board (APPCB). Tickets get delayed across jurisdictional boundaries.
3. **No Verifiable Remediation Audit**: Tickets are frequently marked "closed" based on verbal assertions without verifiable before-and-after photographic evidence or measured waste dry tonnage.
4. **Failure to Address Root Causes**: Cleanup operations repeatedly target the same beach strandlines without identifying the upstream drainage nalas, canals, or illegal dumping access corridors feeding the marine debris.

---

## 3. The Solution

BlueShield introduces a closed-loop, verifiable operational protocol:

* **Geotagged Citizen Reporting**: Mobile-optimized field reporting with device GPS capture, manual location picker, and automated image compression.
* **Accredited Ground-Truth Verification**: Physical triage queue where coordinators and trained volunteers verify reports, eliminate false alarms, mark duplicates, and estimate debris volume.
* **Jurisdictional Routing**: Simulated dispatch routing to relevant coastal custodians (GVMC Coastal Directorate, Visakhapatnam Port Authority, Coast Guard DHQ-6, and NGO volunteer squads).
* **Evidentiary Remediation Closure**: Strict two-phase field sign-off requiring "after" photos and dry waste weight (kg) before a ticket can transition to verified closed status.
* **Upstream Inflow Tracking**: Comprehensive monitoring of outfalls, canals, stormwater pipes, and open drains to stop pollution before it reaches the surf.
* **Longitudinal Intelligence & Hotspot Clustering**: Rule-based 500m Haversine spatial clustering identifying chronic recurrence nodes and formulating data-informed prevention recommendations.

---

## 4. Design Thinking Workflow (DTPI Framework)

BlueShield was engineered following the 5-stage Design Thinking Process for Innovation (DTPI):

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  EMPATHY  │ ──► │  DEFINE   │ ──► │   IDEATE  │ ──► │ PROTOTYPE │ ──► │   TEST    │
└───────────┘     └───────────┘     └───────────┘     └───────────┘     └───────────┘
• Visakhapatnam   • Unverified      • Closed-loop     • React 19 SPA    • Multi-role
  artisanal         reports &         multi-stage       Local-first       evaluator
  fishermen         jurisdictional    accountability    interactive       simulation
• Beachgoers        triage delays     lifecycle         cartography       & audits
• Field sweepers  • Ephemeral       • Upstream nala   • In-browser      • Real-world
  & NGO squads      cleanups without  containment       compression       Visakhapatnam
                    source data       rules             engine            benchmarks
```

1. **Empathize**: Engaged coastal stakeholders along Visakhapatnam beaches (artisanal catamaran fishermen at Lawson's Bay, beach sanitation sweepers at RK Beach, and NGO volunteer cleanups at Rushikonda).
2. **Define**: Pinpointed that cleanup drives without verified evidence or upstream inflow monitoring result in recurring waste accumulation within 48 to 72 hours.
3. **Ideate**: Conceived a 7-stage accountability state machine where no report can close without photographic before/after evidence and measured waste metrics.
4. **Prototype**: Developed this responsive, high-performance web platform featuring interactive Leaflet GIS, Recharts data visualization, and schema-validating CSV/XLSX historical ingestion.
5. **Test**: Built a comprehensive role-switcher and demo scenario runner allowing evaluators to experience every step of the lifecycle instantaneously.

---

## 5. Technology Stack

BlueShield is built entirely on open-source and free technologies with zero external paid API subscriptions:

* **Frontend Framework**: React 19 (`react`, `react-dom`)
* **Language**: TypeScript 5.7 (Strict mode, fully typed domain models)
* **Build Tooling & Bundler**: Vite 6 (ESM static module bundler)
* **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
* **Cartography & Maps**: Leaflet 1.9.4 + OpenStreetMap Standard Tile Servers
* **Data Visualizations**: Recharts 3.10 (Responsive SVG charts)
* **File Ingestion**: PapaParse 5.7 (CSV parsing), SheetJS / XLSX 0.18.5 (Excel parsing)
* **Iconography**: Lucide React
* **Micro-Animations**: Motion 12
* **Storage Engine**: Browser `localStorage` with EventTarget reactive pub-sub

---

## 6. Architecture & Local-First Design

BlueShield operates as a **100% Free Local-First Static Web Application (SPA)**. It does not require Firebase, Google Cloud, Cloud Run, paid AI APIs, or external database servers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BlueShield Client Runtime                       │
│                                                                        │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │ Citizen Report Form  │  │ Coordinator Triage  │  │ Field Cleanup  │ │
│  │ (Camera/GPS/Map Pin) │  │ (/verify Queue)     │  │ (/field Task)  │ │
│  └──────────┬───────────┘  └──────────┬──────────┘  └────────┬───────┘ │
│             │                         │                      │         │
│             ▼                         ▼                      ▼         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    Centralized Data Service                       │ │
│  │                 (src/services/localDataService.ts)                │ │
│  │  • getReports()          • saveReports()      • addReport()       │ │
│  │  • updateReport()        • getOrganizations() • addCleanup()      │ │
│  │  • getActivityLogs()     • getEntryPoints()   • EventTarget PubSub│ │
│  └────────────────────────────────────┬──────────────────────────────┘ │
│                                       │                                │
│                                       ▼                                │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                   Browser Persistent Storage                      │ │
│  │  • localStorage (Reports, Organizations, Cleanups, Logs, Outfalls)│ │
│  │  • HTML5 Canvas Engine (Inline compressed JPEG DataURL photos)    │ │
│  │  • Bundled Public CSV (20 historical Vizag cleanup records)       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Why Local-First?
* **Zero Cost**: Hostable for free on GitHub Pages, Cloudflare Pages, Netlify, or Vercel.
* **Zero API Keys**: No Google Maps key, no Firebase billing account, no Gemini token required.
* **Zero Offline Failure**: The application runs completely in-browser even when network access is intermittent.
* **Instant Evaluation**: University evaluators can test role transitions, submit reports, and view analytics without creating cloud accounts.

---

## 7. The Complete 7-Stage Report Lifecycle

The platform enforces an auditable, deterministic operational workflow:

$$\text{REPORTED} \longrightarrow \text{VERIFIED} \longrightarrow \text{ASSIGNED} \longrightarrow \text{ACCEPTED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{CLEANED} \longrightarrow \text{VERIFIED\_CLOSED}$$

| State | Responsible Actor | Action Required | Evidence Captured |
| :--- | :--- | :--- | :--- |
| **1. REPORTED** | Citizen / Visitor | Submit geotagged hazard photo, coordinates, severity | Photo DataURL, Lat/Lng, Waste Category |
| **2. VERIFIED** | Coordinator / Volunteer | Inspect physical site, eliminate false alarms/duplicates | Verifier name, volume estimate (m³), notes |
| **3. ASSIGNED** | Municipal Coordinator | Route to responsible agency (GVMC, VPA, Coast Guard) | Assigned organization, priority tag |
| **4. ACCEPTED** | Cleanup Team Lead | Acknowledge receipt of dispatch ticket | Acknowledgment timestamp, squad lead |
| **5. IN_PROGRESS** | Field Crew | Mobilize to shoreline with containment gear | Deployment timestamp, active team status |
| **6. CLEANED** | Field Crew | Complete debris extraction and site clearance | **After Photo**, dry weight (kg), disposal yard |
| **7. VERIFIED_CLOSED** | Coordinator / Auditor | Final evidentiary review before marking ticket resolved | Verifier sign-off, immutable activity log |

---

## 8. Demonstration Mode & Evaluator Personas

BlueShield features an integrated **Demo Persona Switcher** in the top navigation and home page:

* **CITIZEN**: Can submit geotagged reports, test camera capture, and check status using tracking codes (`BS-2026-XXXX`).
* **VOLUNTEER**: Inspects public beach areas, conducts ground-truth checks, and suggests volume classifications.
* **COORDINATOR**: Accesses the `/verify` review queue, confirms/rejects reports, flags duplicates, and dispatches assignments.
* **CLEANUP_TEAM**: Accesses `/field` and `/assignments/:id`, accepts assigned tasks, starts work, uploads after-photos, and records kilograms collected.
* **RESEARCHER**: Accesses `/analytics` and `/historical-data` for statistical modeling and longitudinal trends.
* **ADMIN**: Accesses `/admin`, inspects system governance, and reviews immutable compliance logs.

### Demonstration Helper Tools
* **Reset Demo to Baseline**: Clears local changes and restores the pristine Visakhapatnam baseline dataset (available via the top navigation or mobile menu).
* **Load 7-Stage Demo Scenario**: Injects a fully completed demonstration incident with before/after photos and measured metrics to immediately demonstrate verified closure.

---

## 9. Simulated Organization Routing

> **Important Disclosure**: External municipal government APIs are **not** integrated in this standalone MVP demonstration.

Organizations in BlueShield represent simulated routing destinations:
1. **GVMC Coastal Directorate (Zone 3)**: Urban civic shorelines (RK Beach, Lawson's Bay).
2. **Visakhapatnam Port Authority (VPA) Marine Wing**: Commercial docks, trawler wharves, and shipping channels.
3. **Indian Coast Guard DHQ-6 Marine Ops**: Deep intertidal bluffs, Yarada cliffs, and maritime perimeter.
4. **AP Pollution Control Board (Regional Lab)**: Hazardous chemical effluent, oily sludge, and industrial creeks.
5. **Vizag Blue Volunteers & Beach Watch NGO**: Community weekend cleanup brigades and public awareness.

The architecture is prepared with clean REST domain models to facilitate future bidirectional API webhooks with real civic command centers.

---

## 10. Data Model & Storage Schema

All collections are managed through `src/services/localDataService.ts` and stored in browser `localStorage`:

| Key / Collection | Primary Fields | Description |
| :--- | :--- | :--- |
| `blueshield_local_reports_v3` | `id`, `reportNumber`, `latitude`, `longitude`, `pollutionType`, `severity`, `status`, `photoUrl`, `afterPhotoUrl`, `assignedOrganization`, `cleanedAt`, `closedAt`, `notes` | Core incident documents spanning the 7-stage lifecycle |
| `blueshield_local_organizations_v3` | `id`, `name`, `type`, `contactName`, `email`, `phone`, `coverageArea`, `active` | Coastal custodian response units |
| `blueshield_local_cleanup_records_v3` | `id`, `reportId`, `afterPhoto`, `dryWeightKg`, `areaCleaned`, `completedBy`, `completedAt`, `disposalMethod` | Post-remediation evidentiary records |
| `blueshield_local_activity_logs_v3` | `id`, `actorId`, `actorName`, `actorRole`, `action`, `entityType`, `entityId`, `timestamp`, `metadata` | Immutable audit trail for compliance verification |
| `blueshield_local_entry_points_v3` | `id`, `trackingCode`, `title`, `category`, `severity`, `status`, `locationName`, `coastalZone`, `latitude`, `longitude` | Upstream drainage nalas and outfalls |
| `blueshield_local_historical_cleanups_v3` | `id`, `cleanupId`, `date`, `beachName`, `zone`, `totalWasteKg`, `volunteerCount`, `durationHours`, `latitude`, `longitude` | Multi-year historical cleanup records (2022–2024) |
| `blueshield_local_active_user_v3` | `id`, `name`, `email`, `role`, `organization`, `badgeLevel` | Currently active evaluator persona session |

---

## 11. Historical Cleanup Dataset

BlueShield includes a verified historical dataset covering 20 beach cleanup operations conducted across Visakhapatnam between 2022 and 2024.

* **Bundled File**: `/public/historical_beach_cleanup_visakhapatnam.csv`
* **Coverage Locations**: Ramakrishna (RK) Beach, Rushikonda Eco-Beach, Fishing Harbour, Lawson's Bay, Tenneti Park, Sagar Nagar, Yarada, and Bheemili Gosthani Confluence.
* **Ingestion Portal** (`/admin/historical-data`):
  * Supports client-side CSV parsing (PapaParse) and Excel parsing (SheetJS / XLSX).
  * Column mapping with validation for dates, numeric weights, and geographic coordinates.
  * Duplicate detection against existing cleanup identifiers.
  * Zero server communication—all validation and parsing execute securely in the browser.

---

## 12. Recurring Hotspot & Prevention Engines

* **Recurring Hotspot Analysis** (`/hotspots`):
  * Computes rule-based spatial clustering using Haversine distance formulas within a 500m radius of 7 Visakhapatnam geographic coastal anchors.
  * Calculates recurrence density and risk tiers (`CRITICAL`, `HIGH`, `MODERATE`) based on combined historical drives and live incident counts.
* **Data-Informed Prevention Framework** (`/prevention`):
  * Generates rule-based mitigation recommendations linked to observed waste categories (e.g., fishing net entanglements $\rightarrow$ port winch recovery gear; single-use plastic $\rightarrow$ municipal recycling bins; storm nala effluent $\rightarrow$ floating trash booms).
  * Clearly labeled as **"Data-Informed Recommendations"** derived from empirical observation without unsubstantiated claims of causal certainty.

---

## 13. Running Locally

### Prerequisites
* Node.js v20.x or higher
* npm (bundled with Node.js)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/your-username/blueshield-coastal-pollution.git
cd blueshield-coastal-pollution

# 2. Install dependencies (Clean open-source packages only)
npm install

# 3. Start local development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

### Verification Commands
```bash
# Run TypeScript type check (zero emit)
npm run lint

# Run production build
npm run build

# Preview static production build
npm run preview
```

---

## 14. Deployment Guide

### Deploying to GitHub Pages (Automated via GitHub Actions)

1. Push your repository to GitHub.
2. In your repository on GitHub, navigate to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Source**, select **GitHub Actions**.
4. Push a commit to `main`. The included workflow (`.github/workflows/deploy.yml`) will automatically install, build, and deploy the application.
5. The application will be live at `https://<username>.github.io/<repo-name>/`.

### Deploying to Cloudflare Pages or Netlify
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Environment Variables**: None required!

---

## 15. Known Limitations

> **Important Evaluation Note:**  
> The current MVP is designed for academic demonstration and evaluation. Local-first mode utilizes browser `localStorage` and does not provide automatic cross-device synchronization between different physical machines. Production municipal deployment would require an authenticated shared backend database and official government integrations.

1. **Browser Geolocation in Sandboxed Iframes**:
   * If embedded in an iframe that restricts the `geolocation` permission policy, the GPS auto-detect button falls back to user-selectable beach presets.
2. **Storage Capacity**:
   * Browser `localStorage` typically permits 5 MB to 10 MB per origin. In-browser Canvas compression automatically resizes evidence photos to lightweight JPEGs (~60–90 KB) to fit comfortable local demonstration volumes.

---

## 16. Future AI Roadmap

BlueShield follows a disciplined **Human-First AI Roadmap**:

* **Phase 1: Human-Verified Core (Current MVP)**:  
  100% human ground truth verification. Zero AI hallucination risk. Complete operational lifecycle from citizen report to verified closure.
* **Phase 2: Historical Longitudinal Statistical Modeling (In Progress)**:  
  Statistical regression identifying monsoon surge correlations, drainage nala vector pathways, and municipal cleanup response velocity.
* **Phase 3: Client-Side Edge ML Waste Classification (Future)**:  
  Lightweight TensorFlow.js / ONNX edge models to assist reporters by pre-classifying polymer types (HDPE, PET, LDPE) directly on mobile devices without sending images to paid external APIs.
* **Phase 4: Oceanographic Drift Prediction (Future)**:  
  Interfacing with Indian National Centre for Ocean Information Services (INCOIS) public tidal models to predict coastal debris landfall 24 hours in advance.

---

*BlueShield Visakhapatnam Shoreline Protocol — Engineered for Marine Conservation & Civic Accountability.*
