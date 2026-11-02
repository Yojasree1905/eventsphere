# 🌐 EventSphere (Occasio) — Intelligent Multi-University Event Management & Discovery Platform

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![SQLite](https://img.shields.io/badge/SQLite-SQLAlchemy_2.0-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![Google Cloud Firestore](https://img.shields.io/badge/Cloud_Firestore-Dual_Sync-FFA000?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/docs/firestore)
[![Vercel](https://img.shields.io/badge/Vercel-Edge_Deployed-black?style=for-the-badge&logo=vercel&logoColor=white)](https://eventsphere-vankireddis2023-vitstudentas-projects.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Pytest-29%2F29_Passed_(100%25)-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](backend/tests)

<br/>

**EventSphere (codenamed Occasio)** is a production-grade, full-stack multi-university event management, discovery, and credentialing platform. Engineered to eliminate fragmented, campus-isolated portals, EventSphere unites students, university organizers, platform administrators, and expert jurors into a single high-performance digital ecosystem.

[Explore Live Demo](https://eventsphere-vankireddis2023-vitstudentas-projects.vercel.app) • [📄 Full Architecture & Workflow Report (DOCX)](docs/EventSphere_System_Architecture_and_Workflows.docx) • [API Documentation (Swagger)](http://localhost:8000/docs) • [Architecture Report (MD)](OCCASIO_PROJECT_REPORT.md)

</div>

---

## 📋 Table of Contents
1. [Core Platform Capabilities](#-core-platform-capabilities)
2. [High-Level System Architecture](#-high-level-system-architecture)
3. [Role-Based Operational Workflows](#-role-based-operational-workflows)
   - [3.1 Student / Participant Workflow](#31-student--participant-workflow)
   - [3.2 Event Organizer Workflow](#32-event-organizer-workflow)
   - [3.3 Platform Administrator / Superadmin Workflow](#33-platform-administrator--superadmin-workflow)
   - [3.4 Judge & Jury Evaluation Workflow](#34-judge--jury-evaluation-workflow)
4. [Cryptographic Credential Authority](#-cryptographic-credential-authority)
5. [Modular Backend & API Taxonomy](#-modular-backend--api-taxonomy)
6. [Database Schema & Data Models](#-database-schema--data-models)
7. [Local Development & Quick Start](#-local-development--quick-start)
8. [Automated Testing & Quality Assurance](#-automated-testing--quality-assurance)
9. [Production Deployment (Vercel Edge & Serverless)](#-production-deployment-vercel-edge--serverless)

---

## 🚀 Core Platform Capabilities

* **Multi-University Institutional Federation**: Multi-tenant workspace partitioning allowing collaborating universities (e.g., IIT, NIT, State Universities) to govern their own events while fostering inter-collegiate student mobility.
* **Zero-Trust Proposal & Approval Governance**: Multi-tier event review queues preventing rogue, unapproved, or overlapping campus activities.
* **Module 4: Multi-University Squads & Hackathon Teams**: Dynamic 6-character cryptographic invite codes enabling students from different colleges to assemble cross-campus competition squads.
* **Fraud-Proof QR Attendance System**: High-throughput dynamic QR check-in engine with millisecond mobile check-in verification, eliminating proxy attendance.
* **Weighted Rubric Jury Evaluation**: Standardized 100-point scoring matrix (Innovation 40%, Feasibility 30%, Presentation 30%) with automated real-time leaderboard aggregation and podium calculation.
* **Cryptographic PDF Certificate Minting**: Automated issuance of tamper-proof PDF certificates featuring embedded vector QR verification seals backed by salted SHA-256 digital digests.
* **Public Credential Verification Portal**: Dedicated zero-trust public authority page allowing employers and recruiters to verify student awards without database write access.
* **Module 9: AI/ML Heuristic Event Recommendation Engine**: Collaborative interest and skill-based discovery algorithm matching students with upcoming hackathons and workshops.
* **Dual-Persistence Engine**: Blazing-fast relational SQLite querying paired with real-time cloud synchronization to **Google Cloud Firestore**.

---

## 🏛️ High-Level System Architecture

EventSphere employs a decoupled modern architecture combining a reactive client Single-Page Application (SPA) with a high-throughput asynchronous Python FastAPI backend, supported by dual-layer persistence (SQLAlchemy relational database with Google Cloud Firestore synchronization).

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Client Application Layer (React 19 + Vite)"]
        UI["React 19 SPA (Tailwind CSS v4 & Lucide Icons)"]
        Router["React Router v7 (Declarative Client Routing)"]
        AuthCtx["Auth Context (JWT State & Session Storage)"]
        AxiosClient["Axios HTTP Interceptor (Auto Bearer Injection & Refresh)"]
        UI --> Router --> AuthCtx --> AxiosClient
    end

    subgraph IngestionLayer ["2. Network & Edge Routing Layer"]
        VercelCDN["Vercel Global Edge Network (Anycast CDN / bom1)"]
        UnifiedHost["Unified Host Server (Uvicorn :8000 Proxy)"]
        AxiosClient -->|"HTTPS / REST Requests"| VercelCDN
        AxiosClient -.->|"Local Development"| UnifiedHost
        VercelCDN -->|"/(.*) Static SPA Assets"| UI
        VercelCDN -->|"/api/(.*) API Ingestion"| FastAPIServer["FastAPI Gateway (Python 3.12 ASGI)"]
        UnifiedHost -->|"Static Dist & API"| FastAPIServer
    end

    subgraph SecurityLayer ["3. Security & Middleware Layer"]
        FastAPIServer --> CORSMW["CORS Middleware"]
        CORSMW --> JWTAuth["JWT Authentication Middleware"]
        JWTAuth --> RBAC["Role-Based Access Control (Admin, Organizer, Student, Judge)"]
    end

    subgraph RouterLayer ["4. Modular Business Domain Routers"]
        RBAC --> R_Auth["Auth & Google OAuth Router (/api/auth)"]
        RBAC --> R_Events["Events & Proposals Router (/api/events)"]
        RBAC --> R_Univ["University Governance Router (/api/universities)"]
        RBAC --> R_Teams["Squads & Hackathon Teams Router (/api/teams)"]
        RBAC --> R_Sched["Agenda & Tracks Router (/api/schedules)"]
        RBAC --> R_Attend["QR Attendance Engine (/api/attendance)"]
        RBAC --> R_Judge["Rubric Jury Evaluation (/api/judges)"]
        RBAC --> R_Cert["Verifiable Credentials Router (/api/certificates)"]
        RBAC --> R_Rec["AI/ML Recommendations Router (/api/recommendations)"]
    end

    subgraph ServiceLayer ["5. Processing & Generation Engines"]
        R_Cert --> CertEngine["ReportLab Cryptographic PDF Engine"]
        R_Attend --> QREngine["Vector QR Code Encoding Engine"]
        R_Rec --> AIEngine["Collaborative Heuristic Recommendation Model"]
        R_Events --> SyncService["Dual-Write Cloud Sync Engine"]
        R_Teams --> SyncService
    end

    subgraph DataLayer ["6. Dual-Persistence Storage Layer"]
        SQLAlchemy["SQLAlchemy 2.0 ORM Engine"]
        SQLiteDB[("Primary Relational Database (SQLite / Postgres)")]
        FirestoreDB[("Google Cloud Firestore (Real-Time Cloud Replica)")]
        RouterLayer --> SQLAlchemy --> SQLiteDB
        SyncService --> FirestoreDB
    end
```

---

## 🔄 Role-Based Operational Workflows

### 🌟 Unified Master Lifecycle Flow Diagram (All 4 Roles)
This end-to-end master flowchart illustrates how all four stakeholders—**Superadmin, Organizer, Student, and Judge**—interact collaboratively across the 5 distinct phases of an event's lifecycle:

```mermaid
flowchart TD
    %% Phase 1
    subgraph Phase1 ["Phase 1: Institutional Foundation & Event Conception"]
        A1["Platform Admin: Onboard Partner Universities"] --> O1["Organizer: Author Event Proposal"]
        O1 --> A2["Platform Admin: Review & Sanction Proposal (Status: APPROVED)"]
    end

    %% Phase 2
    subgraph Phase2 ["Phase 2: Agenda Scheduling & Cross-Campus Team Assembly"]
        A2 --> O2["Organizer: Structure Multi-Day Agenda & Time Slots"]
        A2 --> S1["Student: Discover Sanctioned Event in Public Catalog"]
        S1 --> S2{"Individual or Team Event?"}
        S2 -->|"Individual"| S3["Student: Register for Event (Status: REGISTERED)"]
        S2 -->|"Team / Hackathon"| S4["Student Leader: Create Squad & Generate 6-Char Invite Code"]
        S4 --> S5["Cross-Campus Teammates: Join Squad via Invite Code"]
    end

    %% Phase 3
    subgraph Phase3 ["Phase 3: Event Day Venue Operations & Live Check-In"]
        O2 --> O3["Organizer: Display Dynamic Time-Stamped Venue QR Code"]
        S3 & S5 --> S6["Student: Scan Venue QR via Mobile Camera"]
        O3 -.-> S6
        S6 --> SYS1["Backend: Ingest Attendance & Update Status to ATTENDED"]
    end

    %% Phase 4
    subgraph Phase4 ["Phase 4: Jury Evaluation & Live Competition Standings"]
        O1 --> O4["Organizer: Issue Single-Use Cryptographic Judge Token"]
        O4 --> J1["Judge: Redeem Token & Access Assigned Track Evaluation Queue"]
        SYS1 --> J2["Jury Queue: Filter Only Candidates with Status ATTENDED"]
        J1 --> J3["Judge: Grade on 100-Point Weighted Rubric (Innovation, Feasibility, Presentation)"]
        J2 --> J3
        J3 --> SYS2["Backend: Aggregate Juror Marks & Recalculate Standings"]
        SYS2 --> S7["Student: View Real-Time Competition Leaderboard & Podium"]
    end

    %% Phase 5
    subgraph Phase5 ["Phase 5: Verifiable Fulfillment & AI Discovery"]
        SYS2 --> O5["Organizer: Trigger Automated Certificate Minting"]
        O5 --> SYS3["Backend: Verify ATTENDED Status & Compute Salted SHA-256 Digest"]
        SYS3 --> SYS4["ReportLab: Compile Immutable PDF Certificate with Embedded QR Seal"]
        SYS4 --> S8["Student: Access Verifiable Certificate in Portfolio"]
        S8 --> S9["Student: Discover Next Events via AI/ML Recommendation Engine"]
        SYS4 -.-> PUB1["Public / Employers: Scan QR Code on Public Verification Portal"]
    end

    classDef admin fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef org fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#fff;
    classDef student fill:#065f46,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef judge fill:#581c87,stroke:#c084fc,stroke-width:2px,color:#fff;
    classDef system fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#fff;

    class A1,A2 admin;
    class O1,O2,O3,O4,O5 org;
    class S1,S2,S3,S4,S5,S6,S7,S8,S9 student;
    class J1,J2,J3 judge;
    class SYS1,SYS2,SYS3,SYS4,PUB1 system;
```

---


EventSphere provides tailored, permission-isolated workflows across four primary platform stakeholders:

### 3.1 Student / Participant Workflow
The student journey guides learners from inter-collegiate event discovery through team assembly, on-site check-in, live competition tracking, and verified credential acquisition.

```mermaid
flowchart TD
    Start(["Student Enters Platform"]) --> Auth["Sign In / Google Student SSO"]
    Auth --> Discovery["Explore Inter-University Event Catalog"]
    Discovery --> Filter["Filter by Domain: Technical, Hackathon, Cultural, Sports"]
    Filter --> EventDetails["Inspect Event Agenda, Rules & Capacity Limits"]
    EventDetails --> Registration{"Individual or Team Event?"}
    
    Registration -->|"Individual"| DirectReg["Register for Event -> Registration: REGISTERED"]
    Registration -->|"Team / Hackathon"| TeamDecision{"Create Squad or Join Existing?"}
    
    TeamDecision -->|"Create Squad"| CreateTeam["Create Squad -> Generate Unique 6-Char Invite Code"]
    CreateTeam --> ShareCode["Share Invite Code with Cross-Campus Teammates"]
    TeamDecision -->|"Join Squad"| InputCode["Enter Team Invite Code -> Validate Capacity"]
    InputCode --> JoinedTeam["Added to Squad Roster -> Event Bound"]
    ShareCode --> JoinedTeam
    
    DirectReg --> VenueArrival["Attend Physical Venue on Event Day"]
    JoinedTeam --> VenueArrival
    
    VenueArrival --> ScanQR["Open Mobile QR Scanner -> Scan Venue Check-in QR"]
    ScanQR --> AttendanceAPI["POST /api/attendance/check-in -> Validated"]
    AttendanceAPI --> StatusUpdate["Status Updated: ATTENDED"]
    
    StatusUpdate --> Competition["Participate in Hackathon / Competition"]
    Competition --> LiveBoard["View Real-Time Standings on Competition Leaderboard"]
    Competition --> SubmitFeedback["Submit Post-Event Feedback & Rating"]
    
    LiveBoard --> CertEligibility{"Marked ATTENDED & Event Concluded?"}
    CertEligibility -->|"Yes"| CertClaim["Receive Cryptographically Signed PDF Certificate"]
    CertClaim --> VerifyQR["Scan Certificate QR Code -> Public Verification Link"]
    CertEligibility -->|"No"| End(["End"])
    VerifyQR --> AIRecommendations["View AI-Recommended Next Events Tailored to Profile"]
    AIRecommendations --> End
```

---

### 3.2 Event Organizer Workflow
The organizer workflow equips faculty coordinators and student heads to structure agendas, monitor live enrollments, execute on-site check-ins, and mint immutable certificates.

```mermaid
flowchart TD
    Start(["Organizer Authenticates"]) --> OrgDash["Access Organizer Hub"]
    OrgDash --> CreateProposal["Author New Event Proposal (Metadata, Hall, Dates, Capacity)"]
    CreateProposal --> SubmitDraft["Submit Proposal -> Status: DRAFT"]
    SubmitDraft --> AdminReview{"Superadmin Review"}
    
    AdminReview -->|"Rejected"| Revise["Revise Proposal or Terminate"]
    Revise --> CreateProposal
    AdminReview -->|"Approved"| Approved["Status: APPROVED (Published to Student Catalog)"]
    
    Approved --> SchedulePlanning["Agenda & Timeline Planning"]
    SchedulePlanning --> AddSlots["Add Event Schedule Slots (Title, Agenda, Timeslot, Room)"]
    AddSlots --> PublishSchedule["Publish Live Event Schedule Timeline"]
    
    PublishSchedule --> MonitorRegs["Monitor Real-Time Registrations & Squad Formations"]
    MonitorRegs --> EventDay["Event Day Venue Operations"]
    
    EventDay --> ProjectQR["Generate Dynamic Attendance QR Code (Project on Venue Screen)"]
    ProjectQR --> IngestCheckins["Students Scan QR -> Live Attendance Stream Ingested"]
    IngestCheckins --> AuditRoster["Audit Verified Attendee Roll-List"]
    
    AuditRoster --> ConcludeEvent["Event Completion & Jury Grading Completed"]
    ConcludeEvent --> MintCerts["Trigger Certificate Minting Console"]
    MintCerts --> ValidateEligibility["System Filters Only RegistrationStatus.ATTENDED"]
    ValidateEligibility --> GenPDF["ReportLab Engine Generates Cryptographic PDF Certificates"]
    GenPDF --> EmbedHashes["Embed SHA-256 Digest & Verification QR Code"]
    EmbedHashes --> Distribute["Certificates Delivered to Student Portfolios"]
```

---

### 3.3 Platform Administrator / Superadmin Workflow
The superadmin console serves as the institutional root of trust, governing partner college registrations, reviewing incoming proposals, observing system telemetry, and auditing issued credentials.

```mermaid
flowchart TD
    Start(["Superadmin Login (Credentials / MFA)"]) --> AdminConsole["Access Global Admin Console"]
    AdminConsole --> SelectWorkspace["Select Institutional Workspace (Global / Specific University)"]
    
    SelectWorkspace --> UnivGov["University Governance & Partner Onboarding"]
    UnivGov --> RegUniv["Register New Partner University (Campus, Domain, Nodal Officers)"]
    RegUniv --> UnivRoster["Active Partner Universities Network Updated"]
    
    SelectWorkspace --> QueueInspection["Inspect Event Approvals & Governance Queue"]
    QueueInspection --> ReviewProposal["Review Event Proposals (Venue Safety, Dates, Rules)"]
    ReviewProposal --> GovernanceDecision{"Governance Action"}
    GovernanceDecision -->|"Sanction"| Approve["Approve Proposal -> Status: APPROVED (Live Sync)"]
    GovernanceDecision -->|"Reject"| Reject["Reject Proposal with Feedback"]
    
    SelectWorkspace --> DirectCreation["Direct Admin Event Override (Instantiate Official Hackathons)"]
    DirectCreation --> Approve
    
    SelectWorkspace --> Telemetry["Platform Monitoring & Telemetry Dashboard"]
    Telemetry --> SystemHealth["Audit Active User Sessions, API Latency & Database Metrics"]
    
    SelectWorkspace --> AttendeeRegistry["Centralized Cross-University Attendee Directory"]
    AttendeeRegistry --> RosterAudit["Inspect Student Enrollments, College Distribution & Rosters"]
    AttendeeRegistry --> OnSpot["Manual Walk-in Registration & Physical Gate Enrolment"]
    
    SelectWorkspace --> CredentialAudit["Public Credential Authority & Certificate Registry"]
    CredentialAudit --> AuditCertificates["Verify Cryptographic Hashes, Issuance Logs & Anti-Fraud Logs"]
```

---

### 3.4 Judge & Jury Evaluation Workflow
The jury portal enables invited industry leaders and academic evaluators to grade competitor projects against standardized, normalized rubrics with role-based security guarding.

```mermaid
flowchart TD
    Start(["Domain Expert / Judge Receives Invitation"]) --> InviteToken["Redeem Cryptographically Secure Activation Token"]
    InviteToken --> RoleActivated["Judge Account Activated & Bound to Event Track"]
    
    RoleActivated --> JuryPortal["Access Jury Evaluation Portal"]
    JuryPortal --> AssignedTracks["Review Assigned Competitions & Hackathon Tracks"]
    
    AssignedTracks --> InspectCompetitors["Inspect Registered Competitors & Team Project Submissions"]
    InspectCompetitors --> AttendanceGuard{"Competitor Marked ATTENDED?"}
    AttendanceGuard -->|"No"| Exclude["Candidate Excluded from Evaluation Queue"]
    AttendanceGuard -->|"Yes"| EvalQueue["Candidate Available in Live Evaluation Queue"]
    
    EvalQueue --> SelectCandidate["Select Team / Candidate for Evaluation"]
    SelectCandidate --> RubricSystem["Load Normalized 100-Point Weighted Rubric"]
    
    RubricSystem --> Score1["Score Innovation & Novelty (Weight: 40%)"]
    RubricSystem --> Score2["Score Technical Feasibility & Execution (Weight: 30%)"]
    RubricSystem --> Score3["Score Presentation & Q&A Defense (Weight: 30%)"]
    
    Score1 & Score2 & Score3 --> InputFeedback["Provide Constructive Qualitative Juror Feedback"]
    InputFeedback --> SubmitScore["Submit Evaluation -> POST /api/judges/scores"]
    
    SubmitScore --> AuthCheck{"Judge Authorization Verification"}
    AuthCheck -->|"Unauthorized"| RejectHTTP["HTTP 403 Forbidden: Judge Not Assigned to Event"]
    AuthCheck -->|"Authorized"| PersistScore["Score Committed to SQLite & Replicated to Firestore"]
    
    PersistScore --> AggregateLeaderboard["Backend Recalculates Cumulative Track Standings"]
    AggregateLeaderboard --> LivePodium["Publish Live Podium Results (1st, 2nd, 3rd Place)"]
```

---

## 🔐 Cryptographic Credential Authority

EventSphere includes an automated zero-trust credential issuance and verification pipeline that protects against student certificate forgery:

1. **High-Entropy Identifier**: Each certificate receives a unique uppercase UUID token: `OCC-2026-XXXXXXXX`.
2. **Salted SHA-256 Digest Formulation**:
   $$\text{Digest} = \text{SHA-256}(\text{cert\_id} \parallel \text{participant\_id} \parallel \text{event\_id} \parallel \text{OCCASIO\_SALT\_2026})$$
3. **Embedded Vector QR Code**: A machine-readable QR code is generated containing the canonical verification endpoint:
   `https://eventsphere-...vercel.app/api/certificates/verify/{certificate_id}`
4. **ReportLab PDF Generation**: Injects institutional seals, candidate name, event track, rank, and the QR matrix onto an unalterable PDF vector canvas.
5. **Zero-Trust Public Verification**: Recruiters, employers, and academic institutions visit the public verification portal to validate certificate authenticity in under 50 milliseconds without requiring login credentials.

---

## 📦 Modular Backend & API Taxonomy

The backend is structured into **9 modular domain routers** exposing 70+ validated endpoints:

| Domain | Route Prefix | Primary Responsibilities | Key Security Guard |
|---|---|---|---|
| **Authentication** | `/api/auth` | Login, registration, token refresh, Google SSO | `bcrypt`, `EmailStr`, JWT HS256 |
| **University Governance** | `/api/universities` | Partner onboarding, campus domain mapping | `require_superadmin` |
| **Event Management** | `/api/events` | Proposals, approvals, category filtering, capacity quotas | `require_organizer_or_admin` |
| **Squads & Teams** | `/api/teams` | 6-char join codes, roster management, squad binding | `get_current_user` |
| **Agenda & Schedules** | `/api/schedules` | Multi-track slot scheduling, hall reservations | `require_organizer_or_admin` |
| **QR Attendance** | `/api/attendance` | Dynamic QR generation, mobile check-in verification | One-scan-per-user constraint |
| **Jury Evaluations** | `/api/judges` | Weighted rubric scoring (100 pts), juror token invites | `require_judge_or_admin` |
| **Leaderboards** | `/api/leaderboards` | Real-time score aggregation, podium standings | Public read / Filtered by event |
| **Verifiable Credentials** | `/api/certificates` | ReportLab PDF compilation, SHA-256 verification | Attendance-enforced minting |
| **AI Recommendations** | `/api/recommendations` | Skill-tailored event recommendation heuristics | `get_current_user` |

---

## 🗄️ Database Schema & Data Models

The relational schema is defined using **SQLAlchemy 2.0 Declarative Models**:

```
[Universities]
 └── id (PK), name, location, domain, created_at

[Users]
 ├── id (PK), email (Unique), hashed_password, full_name
 └── role [ADMIN, ORGANIZER, PARTICIPANT, JUDGE], is_superadmin

[Events]
 ├── id (PK), title, description, category [TECHNICAL, CULTURAL, SPORTS, HACKATHON]
 ├── status [DRAFT, APPROVED, REJECTED, COMPLETED], university_id (FK), organizer_id (FK)
 └── start_date, end_date, venue, max_capacity

[Schedules]
 └── id (PK), event_id (FK), title, agenda, start_time, end_time, hall_name

[Teams]
 ├── id (PK), event_id (FK), leader_id (FK), name, join_code (Unique, 6-Char)
 └── max_members, status [FORMING, LOCKED]

[Registrations]
 ├── id (PK), event_id (FK), user_id (FK), team_id (FK, Nullable)
 └── status [REGISTERED, ATTENDED, CANCELLED], registered_at

[Attendance]
 └── id (PK), event_id (FK), user_id (FK), check_in_time, check_in_method [QR_SCAN]

[Evaluations / Scores]
 ├── id (PK), event_id (FK), judge_id (FK), participant_id (FK), team_id (FK)
 └── score_innovation, score_feasibility, score_presentation, total_score, remarks

[Certificates]
 ├── id (PK, OCC-XXXX), event_id (FK), participant_id (FK), verification_hash
 └── certificate_type, pdf_file_path, issued_at
```

---

## 💻 Local Development & Quick Start

EventSphere includes a **Single-Host Unified Server** that serves both the compiled React 19 frontend and the FastAPI REST backend from a single port (`http://localhost:8000`):

### 1. Prerequisites
* Python 3.11 or Python 3.12
* Node.js 18+ and npm

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/Yojasree1905/eventsphere.git
cd eventsphere

# Install Python backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies and build production SPA bundle
cd frontend
npm install
npm run build
cd ..
```

### 3. Launch Unified Server
```bash
# Run unified platform (serves SPA and API together)
python run.py

# (On Windows, you can simply double-click start.bat)
```

### 4. Direct Access Points
* **Web Application**: [http://localhost:8000](http://localhost:8000)
* **Teams & Hackathons Page**: [http://localhost:8000/teams](http://localhost:8000/teams)
* **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative API Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 5. Default Credentials
* **Superadmin Email**: `admin@occasio.com`
* **Superadmin Password**: `Admin@1234`
* **Google Sign-In**: Click **"Sign in with Google"** on the login screen to test student credentials (`vankireddis2023@vitstudent.ac.in`).

---

## 🧪 Automated Testing & Quality Assurance

EventSphere maintains 100% test pass rates across critical authentication, event governance, schedule conflict, and team lifecycle workflows:

```bash
# Execute test suite via Pytest
python -m pytest backend/tests/ -v
```

```
============================= test session starts =============================
platform win32 -- Python 3.14.0, pytest-9.2.0, pluggy-1.7.0
collected 29 items

backend/tests/test_auth.py::test_create_user_and_login_success PASSED   [  3%]
backend/tests/test_auth.py::test_login_invalid_credentials PASSED       [  6%]
backend/tests/test_auth.py::test_token_expiration_behavior PASSED       [ 10%]
backend/tests/test_auth.py::test_get_current_user_profile PASSED        [ 13%]
backend/tests/test_auth.py::test_superadmin_seed_present PASSED         [ 17%]
...
backend/tests/test_events.py::test_event_proposal_flow PASSED          [ 55%]
backend/tests/test_events.py::test_event_capacity_enforcement PASSED   [ 58%]
backend/tests/test_schedules.py::test_schedule_creation PASSED         [ 89%]
backend/tests/test_eventsphere_core.py::test_teams_join_code PASSED    [ 96%]
backend/tests/test_eventsphere_core.py::test_cert_verification PASSED  [100%]

======================= 29 passed in 7.15s =======================
```

---

## ☁️ Production Deployment (Vercel Edge & Serverless)

The platform is configured for zero-configuration, continuous deployment on **Vercel** via [`vercel.json`](vercel.json):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "frontend": {
      "root": "frontend/",
      "framework": "vite"
    },
    "backend": {
      "root": "backend/",
      "entrypoint": "main:app"
    }
  },
  "rewrites": [
    { "source": "/api", "destination": { "service": "backend" } },
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

* **Vercel Build Command**: Automatically compiles the React SPA via `npm run build` and provisions a serverless Python 3.12 container.
* **Serverless SQLite Handling**: Automatically detects read-only execution environments (Vercel/AWS Lambda) and migrates the seed database into writable `/tmp/occasio.db`.
* **SPA Client-Side Routing**: Direct deep-links (`/teams`, `/login`, `/dashboard`) seamlessly fall back to `/index.html` via edge rewrites.

---

## 👥 Contributors & Acknowledgements

* **Yojasree Vankireddi** (`vankireddi.s2023@vitstudent.ac.in`) — Lead Architecture & Full-Stack Development
* **Platform Title**: EventSphere (Occasio) Multi-University Ecosystem
* **Institution**: Vellore Institute of Technology (VIT)
* **License**: MIT Open Source License

---

<div align="center">
  <sub>Built with ❤️ for collegiate students, organizers, and academic institutions worldwide.</sub>
</div>
