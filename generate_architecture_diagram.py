import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Set up canvas with 16:9 ratio and high DPI
fig = plt.figure(figsize=(20, 11.25), dpi=300)
ax = fig.add_subplot(111)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Color Palette matching Occasio UI
BG_COLOR = '#0f172a'         # Slate 900
PANEL_BG = '#1e293b'         # Slate 800
PANEL_BORDER = '#334155'     # Slate 700
HEADER_BLUE = '#2563eb'      # Blue 600
TEXT_WHITE = '#ffffff'
TEXT_MUTED = '#94a3b8'       # Slate 400
TEXT_BODY = '#cbd5e1'        # Slate 300
ACCENT_GREEN = '#10b981'     # Emerald 500
ACCENT_AMBER = '#f59e0b'     # Amber 500
ACCENT_BLUE = '#38bdf8'      # Sky 400
CARD_BG = '#0b1120'          # Slate 950 / card surface
BOX_BORDER = '#475569'

fig.patch.set_facecolor(BG_COLOR)
ax.set_facecolor(BG_COLOR)

# Title Header
ax.text(50, 96.5, "OCCASIO — SYSTEM ARCHITECTURE & DATA FLOW", 
        color=TEXT_WHITE, fontsize=20, weight='bold', ha='center', va='center', fontfamily='sans-serif')
ax.text(50, 94.0, "Intelligent Multi-College Event Management & Discovery Platform", 
        color=ACCENT_BLUE, fontsize=12, weight='medium', ha='center', va='center', fontfamily='sans-serif')

def draw_rounded_rect(ax, x, y, w, h, bg, border, radius=1.2, lw=1.5):
    fancy = patches.FancyBboxPatch((x, y), w, h,
                                  boxstyle=f"round,pad=0.2,rounding_size={radius}",
                                  facecolor=bg, edgecolor=border, linewidth=lw)
    ax.add_patch(fancy)

def draw_header_badge(ax, x, y, text, color=HEADER_BLUE):
    ax.text(x, y, text, color=TEXT_WHITE, fontsize=11, weight='bold',
            bbox=dict(boxstyle="round,pad=0.4", facecolor=color, edgecolor='none'))

# ─────────────────────────────────────────────────────────────
# 1. CLIENT / PRESENTATION TIER (LEFT)
# ─────────────────────────────────────────────────────────────
draw_rounded_rect(ax, 3, 10, 28, 80, PANEL_BG, PANEL_BORDER)
draw_header_badge(ax, 5, 87.5, "1. PRESENTATION TIER (React 19 + Vite)")

# Component Cards inside Client
client_modules = [
    ("Auth & Layout Core", ["• React Router DOM (v7)", "• ProtectedRoute & Token Check", "• Blue-Grey Navigation Sidebar", "• Global AuthContext & LocalStorage"], 74, 11),
    ("Management Views", ["• Login.jsx (Clean State & Dismissal)", "• Dashboard.jsx (KPIs & Live Feeds)", "• EventList.jsx (CRUD & Filters)", "• EventApprovals.jsx (Moderation Queue)"], 59, 13),
    ("Schedule & Registry", ["• ScheduleManagement.jsx (Live 10s tick)", "• Dynamic Status: Upcoming/Ongoing/Done", "• In-Card Complete/Expire/Cancel", "• Participants.jsx (Tabs & REG Code)"], 44, 13),
    ("Telemetry & Primitives", ["• EventMonitoring.jsx (Engine Health)", "• Formatters: ISO to Local Timezone", "• Custom UI Primitives: Card, Badge,", "  Table, Modal, Input, Button"], 29, 13),
    ("HTTP API Client", ["• Axios Client (BaseURL: /api)", "• JWT Bearer Auto-Attach Interceptor", "• Protected 401 Bypass on Login"], 14, 13)
]

for title, lines, y, h in client_modules:
    draw_rounded_rect(ax, 5, y, 24, h, CARD_BG, BOX_BORDER, radius=0.8, lw=1.2)
    ax.text(6.5, y + h - 2.2, title, color=ACCENT_BLUE, fontsize=9.5, weight='bold')
    for idx, line in enumerate(lines):
        ax.text(6.5, y + h - 4.5 - (idx * 2.2), line, color=TEXT_BODY, fontsize=8)

# ─────────────────────────────────────────────────────────────
# 2. REST API & APPLICATION TIER (CENTER)
# ─────────────────────────────────────────────────────────────
draw_rounded_rect(ax, 36, 10, 28, 80, PANEL_BG, PANEL_BORDER)
draw_header_badge(ax, 38, 87.5, "2. APPLICATION TIER (FastAPI + ASGI)")

api_modules = [
    ("Security & Gateways", ["• FastAPI CORS Middleware", "• JWT Token Verification (HS256)", "• Password Hashing (bcrypt + salt)", "• Role Enforcement (require_superadmin)"], 74, 11),
    ("REST API Endpoints", ["• /api/auth (login, /me)", "• /api/events (CRUD, /submit, /approve)", "• /api/schedules (/complete, /expire)", "• /api/participants & /api/registrations", "• /api/monitoring (stats & telemetry)"], 56, 16),
    ("Validation & Computation", ["• Pydantic v2 BaseSchemas & Serialization", "• Dynamic ScheduleStatus Computed Field", "• Boundary & Midnight Normalization", "• Generic Error Sanitization (401 Generic)"], 38, 16),
    ("Data Services & Logic", ["• auth_service: JWT & Password Verification", "• Unique REG-Code Generator (REG-XXXX)", "• Event State Machine (Draft->Pending->Approved)", "• Engine Diagnostics & Metric Aggregation"], 20, 16)
]

for title, lines, y, h in api_modules:
    draw_rounded_rect(ax, 38, y, 24, h, CARD_BG, BOX_BORDER, radius=0.8, lw=1.2)
    ax.text(39.5, y + h - 2.2, title, color=ACCENT_GREEN, fontsize=9.5, weight='bold')
    for idx, line in enumerate(lines):
        ax.text(39.5, y + h - 4.5 - (idx * 2.2), line, color=TEXT_BODY, fontsize=8)

# ─────────────────────────────────────────────────────────────
# 3. DATA & PERSISTENCE TIER (RIGHT)
# ─────────────────────────────────────────────────────────────
draw_rounded_rect(ax, 69, 10, 28, 80, PANEL_BG, PANEL_BORDER)
draw_header_badge(ax, 71, 87.5, "3. PERSISTENCE & STORAGE (SQLAlchemy + SQLite)")

db_modules = [
    ("ORM Engine & Session", ["• SQLAlchemy 2.0 Declarative Engine", "• SQLite (occasio.db)", "• Thread-Safe SessionLocal & get_db", "• Cascade Delete & Relational Integrity"], 74, 11),
    ("Relational Models", ["• User: ID, Email, Hash, is_superadmin", "• Event: Title, Dates, Venue, Status, Cat", "• Schedule: start_time, end_time (UTC),", "  is_conducted, is_cancelled", "• Participant: Email, Phone, College, Dept", "• Registration: REG-No, FKs, Status"], 49, 23),
    ("Database Operations", ["• Auto-Seeding (admin@occasio.com)", "• ISO UTC Storage (No Naive Drift)", "• Atomic Transactions & Rollbacks", "• Indexing on Email, Title & Status"], 32, 15),
    ("Automated Testing Suite", ["• Pytest 8 + HTTPX Async TestClient", "• In-Memory Test Database (:memory:)", "• 24 Automated Tests (Auth, Events, Schedules)", "• Boundary, Midnight & Timezone Audits"], 14, 16)
]

for title, lines, y, h in db_modules:
    draw_rounded_rect(ax, 71, y, 24, h, CARD_BG, BOX_BORDER, radius=0.8, lw=1.2)
    ax.text(72.5, y + h - 2.2, title, color=ACCENT_AMBER, fontsize=9.5, weight='bold')
    for idx, line in enumerate(lines):
        ax.text(72.5, y + h - 4.5 - (idx * 2.2), line, color=TEXT_BODY, fontsize=8)

# ─────────────────────────────────────────────────────────────
# CONNECTING FLOW ARROWS & DATA LABELS
# ─────────────────────────────────────────────────────────────
# Arrow 1: Frontend -> Backend
arrow_fwd1 = patches.FancyArrowPatch((31, 56), (36, 56),
                                    arrowstyle='simple,head_width=1.8,head_length=2.5',
                                    color=ACCENT_BLUE, lw=1.5)
ax.add_patch(arrow_fwd1)
ax.text(33.5, 58, "HTTPS / JSON\nBearer JWT", color=ACCENT_BLUE, fontsize=7.5, weight='bold', ha='center')

# Arrow 2: Backend -> Frontend
arrow_back1 = patches.FancyArrowPatch((36, 50), (31, 50),
                                     arrowstyle='simple,head_width=1.8,head_length=2.5',
                                     color='#38bdf8', lw=1.5)
ax.add_patch(arrow_back1)
ax.text(33.5, 47, "REST Response\nDTO / Status", color=TEXT_MUTED, fontsize=7, ha='center')

# Arrow 3: Backend -> DB
arrow_fwd2 = patches.FancyArrowPatch((64, 56), (69, 56),
                                    arrowstyle='simple,head_width=1.8,head_length=2.5',
                                    color=ACCENT_GREEN, lw=1.5)
ax.add_patch(arrow_fwd2)
ax.text(66.5, 58, "SQLAlchemy\nQueries / ORM", color=ACCENT_GREEN, fontsize=7.5, weight='bold', ha='center')

# Arrow 4: DB -> Backend
arrow_back2 = patches.FancyArrowPatch((69, 50), (64, 50),
                                     arrowstyle='simple,head_width=1.8,head_length=2.5',
                                     color='#10b981', lw=1.5)
ax.add_patch(arrow_back2)
ax.text(66.5, 47, "Relational Rows\nCommitted State", color=TEXT_MUTED, fontsize=7, ha='center')

# Footer Summary
ax.text(50, 4, "Occasio Architecture Specification • Multi-Campus Event Operations • Production Certified",
        color=TEXT_MUTED, fontsize=9, ha='center', va='center')

plt.tight_layout()
output_path = r'c:\Users\Hp\Desktop\Occasio_iip\occasio_architecture_diagram.png'
plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
plt.close()
print("Saved to", output_path)
