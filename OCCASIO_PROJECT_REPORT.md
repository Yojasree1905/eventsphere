# Occasio — Comprehensive Project Report

**Platform Title:** Occasio — An Intelligent Multi-College Event Management and Discovery Platform  
**Status:** Fully Implemented, Hardened & Verified  
**Date:** 11 October 2026  

---

## 1. Executive Summary

Occasio is a full-stack multi-college event management system designed to streamline event proposals, approvals, scheduling, registrations, and live monitoring across institutions. The system features a production-grade FastAPI backend with SQLAlchemy ORM and JWT security, coupled with a responsive, modern React dashboard utilizing a custom blue-grey design language and Tailwind CSS.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** Vanilla CSS + Tailwind CSS v4 + Custom Tokens
- **Icons:** Lucide React
- **Routing:** React Router DOM (v7)
- **HTTP Client:** Axios with JWT request & 401 response interceptors
- **Date Utilities:** date-fns

### Backend
- **Framework:** Python 3.13 + FastAPI
- **ASGI Server:** Uvicorn
- **Data Validation:** Pydantic v2 + Pydantic Settings
- **ORM / Database:** SQLAlchemy 2.0 + SQLite (`occasio.db`)
- **Authentication & Security:** JWT (`python-jose`) + bcrypt password hashing (`passlib`)
- **Testing:** Pytest + HTTPX TestClient

---

## 3. Architecture & Directory Structure

```
Occasio_iip/
├── backend/
│   ├── app/
│   │   ├── config.py                # Environment configuration & defaults
│   │   ├── database.py              # Engine, SessionLocal, Base & get_db dependency
│   │   ├── main.py                  # App entry point, CORS, table creation, admin seeding
│   │   ├── middleware/
│   │   │   └── auth_middleware.py   # JWT extraction, get_current_user, require_superadmin
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── user.py              # User account model
│   │   │   ├── event.py             # Event model with category & status enums
│   │   │   ├── schedule.py          # Schedule agenda items with lifecycle flags
│   │   │   ├── participant.py       # Participant directory model
│   │   │   └── registration.py      # Registration join model with unique REG-code
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── event.py
│   │   │   ├── schedule.py          # Computed dynamic status (upcoming, ongoing, completed, etc.)
│   │   │   ├── participant.py
│   │   │   └── registration.py
│   │   ├── services/
│   │   │   └── auth_service.py      # Password hashing, JWT token creation/decoding
│   │   └── routers/                 # APIRouter modules
│   │       ├── auth.py              # /api/auth/login, /api/auth/me
│   │       ├── events.py            # /api/events (CRUD, /submit, /approve, /reject)
│   │       ├── schedules.py         # /api/schedules (CRUD, /complete, /expire, /cancel)
│   │       ├── participants.py      # /api/participants (CRUD, search)
│   │       ├── registrations.py     # /api/registrations (CRUD, tracking)
│   │       └── monitoring.py        # /api/monitoring/stats, /api/monitoring/recent-activity
│   ├── tests/                       # Pytest test suite (24 tests)
│   │   ├── conftest.py              # In-memory SQLite fixture, test client, admin login fixtures
│   │   ├── test_auth.py             # Security, login, tokens, RBAC tests
│   │   ├── test_events.py           # Event CRUD and moderation tests
│   │   └── test_schedules.py        # Schedule dynamic lifecycle, timezone, boundary tests
│   ├── occasio.db                   # SQLite database
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # Axios client & modular API methods
│   │   │   ├── axios.js
│   │   │   ├── auth.js
│   │   │   ├── events.js
│   │   │   ├── schedules.js
│   │   │   ├── participants.js
│   │   │   └── monitoring.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global user state, login(), logout(), session restore
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx      # Blue-grey sidebar with Lucide navigation icons
│   │   │   │   ├── Topbar.jsx       # Top navigation, role badges, notifications
│   │   │   │   └── ProtectedRoute.jsx # Route guard redirecting unauthenticated users
│   │   │   └── ui/                  # Reusable design primitives
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Table.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Admin login with secured notification handling
│   │   │   ├── Dashboard.jsx        # Admin dashboard with KPI metrics & live feeds
│   │   │   ├── events/
│   │   │   │   └── EventList.jsx    # Complete event CRUD, filtering, modals, submission
│   │   │   ├── EventApprovals.jsx   # Moderation queue for approvals & rejections
│   │   │   ├── ScheduleManagement.jsx # Time-aware schedule manager with lifecycle controls
│   │   │   ├── Participants.jsx     # Tabbed view: attendee directory & registrations
│   │   │   └── EventMonitoring.jsx  # Real-time telemetry, server health, audit trails
│   │   └── utils/
│   │       ├── constants.js         # Status badge tokens, categories, colors
│   │       └── formatters.js        # Timezone-aware date parsing and status computations
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
```

---

## 4. Modules & Key Capabilities

### 1. Authentication & Security
- **Endpoints:** `POST /api/auth/login`, `GET /api/auth/me`.
- **Password Protection:** Standard bcrypt hashing with salt; passwords are never logged or stored in plaintext.
- **Token Security:** HS256-signed JWTs containing subject and UTC expiration time. Tampered, expired, or malformed tokens are rejected with HTTP 401.
- **Generic Error Responses:** Inquiries with invalid email or password yield a uniform `"Incorrect email or password"` response without leaking user existence.
- **Role-Based Access Control (RBAC):** Moderation actions (`/approve`, `/reject`) are restricted to superadministrators (`require_superadmin` dependency), returning HTTP 403 to non-admin accounts.
- **Session Management:** Client tokens reside in `localStorage`. Logouts cleanly wipe stored tokens, immediately locking protected routes.
- **Default Seed Account:**
  - **Email:** `admin@occasio.com`
  - **Password:** `Admin@1234`

### 2. Admin Dashboard
- **Telemetry & KPIs:** Real-time counters for Total Events, Pending Moderation, Verified Participants, and Confirmed Registrations.
- **Quick Actions:** Shortcuts to initiate events or review backlogs.
- **Live Event & Registration Feeds:** Audits recent registrations and updates with timestamps and status indicators.

### 3. Event Management (CRUD)
- **Directory Table:** Lists events with college name, venue, dates, categories, and workflow statuses (`draft`, `pending`, `approved`, `rejected`, `completed`, `cancelled`).
- **Search & Filtering:** Search by keyword; filter by discipline category (`technical`, `cultural`, `academic`, `sports`, `workshop`, `seminar`).
- **Creation & Modification Modals:** Forms with field validations for capacity, hosting university, venue, and date ranges.
- **Submission Workflow:** Drafts can be submitted directly into the moderation queue.

### 4. Event Approvals (Moderation Queue)
- **Review Queue:** Lists all pending submissions.
- **One-Click Actions:** Instant approval or modal-driven rejection with mandatory reason recording.

### 5. Schedule & Agenda Management (Time-Aware Lifecycle)
- **UTC Instant Normalization:** Browser `datetime-local` inputs are converted to ISO UTC timestamps upon creation, stored consistently in SQLite, and rendered in the viewer's local timezone.
- **Dynamic Status Lifecycle:**
  - `UPCOMING`: Current instant $<$ `start_time` and not cancelled.
  - `ONGOING`: Current instant $\ge$ `start_time` and $<$ `end_time` (unless marked not conducted).
  - `COMPLETED`: Current instant $\ge$ `end_time` (or explicitly completed).
  - `EXPIRED`: Start time passed without session being conducted.
  - `CANCELLED`: Explicit persisted cancellation overriding temporal states.
- **Reactive Refresh:** 10-second timer ensures status badges update continuously without requiring page reload.
- **Lifecycle Action Buttons:** In-card controls to explicitly mark sessions as *Complete*, *Not Conducted*, or *Cancel*.

### 6. Participants & Registrations
- **Tabbed Interface:**
  1. **All Registrations:** Displays generated tracking codes (`REG-XXXXXXXX`), attendee names, event linkages, and status modification dropdowns (`pending`, `confirmed`, `attended`, `cancelled`).
  2. **Participant Directory:** Searchable directory containing student names, institutional emails, phones, college affiliations, and academic departments.
- **Participant Onboarding:** Modal form for adding new participant profiles.

### 7. Event Monitoring & System Telemetry
- **Infrastructure Status:** Health panels monitoring FastAPI engine response latency, SQLite database connection status, and security JWT guard status.
- **Category Distribution:** Dynamic progress bars illustrating event distribution across disciplines.
- **Audit Trail:** Chronological log of recent event modifications and registrations.

---

## 5. Verification & Quality Assurance

### Pytest Test Suite
All **24 tests** pass with 100% success rate:
- **Authentication (10 tests):** Health check, login success, generic error responses for wrong password/nonexistent user, token validation, tampered token rejection, expired token rejection, RBAC superadmin restriction, and unauthenticated endpoint rejection.
- **Events (5 tests):** Create, list, fetch, update, delete, and submit/approve/reject workflow.
- **Schedules (9 tests):** Upcoming, ongoing, completed, exact boundary conditions, midnight-crossing sessions, CRUD lifecycle, invalid time validation (`end <= start`), persisted cancellation, and persisted completion/expiration.

### Frontend Production Build
`npm run build` generates a clean production bundle with **0 errors and 0 warnings**:
- Transformed 2,301 modules in under 1 second.
- Assets cleanly compiled and minified with zero styling conflicts.
