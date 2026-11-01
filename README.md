# EventSphere (Occasio) — Intelligent Multi-University Event Management Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://eventsphere-vankireddis2023-vitstudentas-projects.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-29%20Passed-brightgreen)](backend/tests)

EventSphere is an intelligent, full-stack multi-university event management and discovery platform. It streamlines event proposals, approvals, schedule tracking, team registrations, live attendance via QR codes, judge evaluations, and automated certificate generation.

---

## ??? System Architecture

EventSphere employs a decoupled modern architecture combining a reactive client Single-Page Application (SPA) with a high-throughput asynchronous Python FastAPI backend, supported by dual-layer persistence (SQLAlchemy relational database with Google Cloud Firestore synchronization).

```mermaid
graph TD
    subgraph Client ["Client Layer (Browser & Mobile)"]
        UI["React 19 SPA (Vite + Tailwind v4)"]
        Router["React Router v7 (Client Routing)"]
        State["Auth Context & Axios Interceptors"]
        UI --> Router --> State
    end

    subgraph Edge ["Routing & Ingestion Layer"]
        VercelCDN["Vercel Global CDN (Edge Routing)"]
        VercelCDN -->|"/(.*) [SPA Routes]"| UI
        VercelCDN -->|"/api/(.*) [REST API]"| FastAPIGateway["FastAPI Gateway (Uvicorn / ASGI)"]
    end

    State -->|"HTTPS REST Requests"| VercelCDN

    subgraph Backend ["Application Backend (FastAPI Python 3.12)"]
        FastAPIGateway --> AuthMW["JWT & RBAC Middleware"]
        AuthMW --> AuthRouter["Auth & Google OAuth Router"]
        AuthMW --> EventsRouter["Events & Approvals Router"]
        AuthMW --> TeamsRouter["Teams & Hackathons Router"]
        AuthMW --> ScheduleRouter["Live Schedules Router"]
        AuthMW --> AttendanceRouter["QR Attendance Router"]
        AuthMW --> JudgeRouter["Judge Evaluations Router"]
        AuthMW --> CertRouter["Certificates & Verification Router"]
    end

    subgraph Services ["Core Services & Engines"]
        CertEngine["ReportLab PDF & QR Code Engine"]
        FirestoreSync["Firestore Real-Time Sync Service"]
        CertRouter --> CertEngine
        EventsRouter --> FirestoreSync
        TeamsRouter --> FirestoreSync
    end

    subgraph Storage ["Persistence Layer"]
        DB[(SQLAlchemy ORM - SQLite / PostgreSQL)]
        FirestoreDB[(Google Cloud Firestore)]
        Backend --> DB
        FirestoreSync --> FirestoreDB
    end
```

---

## ?? GitHub & Deployment Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Git as GitHub (main branch)
    participant CI as Vercel Build Pipeline
    participant Edge as Vercel Production Edge (bom1)
    actor User as End User

    Dev->>Git: git push origin main
    Git->>CI: Webhook Trigger (push event)
    Note over CI: 1. Build React SPA (npm run build -> frontend/dist)<br/>2. Install Python 3.12 dependencies (pip install -r requirements.txt)<br/>3. Package backend ASGI service (main:app)
    CI->>Edge: Deploy Static Assets & Python Serverless Functions
    Edge-->>CI: Healthcheck 200 OK
    User->>Edge: Visit https://eventsphere-...vercel.app/
    Edge->>User: Serve index.html & static assets via Global CDN
    User->>Edge: API calls /api/events, /api/auth
    Edge->>CI: Execute Python Serverless Backend
    CI-->>User: Return JSON Response
```

---

## ?? Core Subsystems

| Module | Purpose | Key Endpoints |
|---|---|---|
| **Auth & Profiles** | JWT access tokens, role-based access control, Google SSO | `/api/auth/login`, `/api/auth/google`, `/api/auth/me` |
| **Events Management** | Proposal submissions, admin approvals, categories, filtering | `/api/events`, `/api/events/{id}/approve` |
| **Teams & Hackathons** | Team formation, invite codes, member rosters, event binding | `/api/teams`, `/api/teams/join` |
| **Attendance & QR** | Dynamic QR code generation, check-in scanning, attendance tracking | `/api/attendance/check-in`, `/api/attendance/event/{id}` |
| **Judge Evaluations** | Rubric scoring, multi-criteria evaluations, live leaderboards | `/api/judges/scores`, `/api/leaderboard/{id}` |
| **Certificates** | Cryptographic PDF certificates with embedded QR verification | `/api/certificates/generate`, `/api/certificates/verify/{id}` |
| **Live Monitoring** | Real-time participant counts, engagement analytics | `/api/monitoring/events/{id}` |

---

## ?? Local Development (Single-Host Unified Server)

Run both the frontend and backend together on a single port (`http://localhost:8000`):

```bash
# 1. Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && npm install && npm run build
cd ..

# 2. Launch unified server
python run.py
# (Or simply double-click start.bat on Windows)
```

The unified server automatically serves:
* **Web UI**: `http://localhost:8000`
* **Teams Page**: `http://localhost:8000/teams`
* **API Endpoints**: `http://localhost:8000/api`
* **Interactive Docs**: `http://localhost:8000/docs`

---

## ?? Testing Suite
Execute the full test suite (29 tests covering authentication, event lifecycles, and scheduling):
```bash
python -m pytest backend/tests/
```
