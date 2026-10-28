import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from PIL import Image

# Setup 16:9 canvas tailored for PPT presentation slides (Clean, large fonts, clear flow)
fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
fig.patch.set_facecolor('#F8FAFC')
ax.set_facecolor('#F8FAFC')

# Coordinate boundaries: 0 to 16 horizontally, 0 to 9 vertically
ax.set_xlim(0, 16)
ax.set_ylim(0, 9)
ax.axis('off')

# Title & Subtitle for PPT
ax.text(8.0, 8.4, "OCCASIO PLATFORM — WORKFLOW & METHODOLOGY",
        fontsize=24, fontweight='bold', ha='center', va='center', color='#0F172A', fontfamily='sans-serif')
ax.text(8.0, 8.0, "Step-by-Step Architecture Flow & Core Contributions Implemented",
        fontsize=13, ha='center', va='center', color='#64748B', fontfamily='sans-serif')

# Step 1: Admin Authentication
box1 = FancyBboxPatch((0.8, 4.3), 3.0, 3.1, boxstyle="round,pad=0.2,rounding_size=0.15",
                      facecolor="#FFFFFF", edgecolor="#3B82F6", linewidth=2.5)
ax.add_patch(box1)
# Header tag
tag1 = FancyBboxPatch((1.1, 7.0), 2.4, 0.45, boxstyle="round,pad=0.08,rounding_size=0.08",
                      facecolor="#EFF6FF", edgecolor="#BFDBFE", linewidth=1.2)
ax.add_patch(tag1)
ax.text(2.3, 7.22, "STEP 1: SECURE AUTH", fontsize=11, fontweight='bold', color="#1D4ED8", ha='center', va='center')
ax.text(2.3, 6.4, "Admin Login", fontsize=15, fontweight='bold', color="#0F172A", ha='center', va='center')
ax.text(2.3, 5.4, "- Empty secure inputs\n- 5s toast error feedback\n- JWT Token + Bcrypt\n- Role-Based Access",
        fontsize=11.5, color="#334155", ha='center', va='center')

# Step 2: Event & Approval Management
box2 = FancyBboxPatch((4.5, 4.3), 3.2, 3.1, boxstyle="round,pad=0.2,rounding_size=0.15",
                      facecolor="#FFFFFF", edgecolor="#10B981", linewidth=2.5)
ax.add_patch(box2)
tag2 = FancyBboxPatch((4.9, 7.0), 2.4, 0.45, boxstyle="round,pad=0.08,rounding_size=0.08",
                      facecolor="#ECFDF5", edgecolor="#A7F3D0", linewidth=1.2)
ax.add_patch(tag2)
ax.text(6.1, 7.22, "STEP 2: EVENT CONTROL", fontsize=11, fontweight='bold', color="#047857", ha='center', va='center')
ax.text(6.1, 6.4, "Events & Approvals", fontsize=15, fontweight='bold', color="#0F172A", ha='center', va='center')
ax.text(6.1, 5.4, "- Multi-college events\n- Creation & editing\n- One-click approvals\n- Status: Active/Draft",
        fontsize=11.5, color="#334155", ha='center', va='center')

# Step 3: Dynamic Schedule Lifecycle
box3 = FancyBboxPatch((8.4, 4.3), 3.2, 3.1, boxstyle="round,pad=0.2,rounding_size=0.15",
                      facecolor="#FFFFFF", edgecolor="#F59E0B", linewidth=2.5)
ax.add_patch(box3)
tag3 = FancyBboxPatch((8.8, 7.0), 2.4, 0.45, boxstyle="round,pad=0.08,rounding_size=0.08",
                      facecolor="#FFFBEB", edgecolor="#FDE68A", linewidth=1.2)
ax.add_patch(tag3)
ax.text(10.0, 7.22, "STEP 3: SMART SCHEDULE", fontsize=11, fontweight='bold', color="#B45309", ha='center', va='center')
ax.text(10.0, 6.4, "Time Engine", fontsize=15, fontweight='bold', color="#0F172A", ha='center', va='center')
ax.text(10.0, 5.4, "- Real-time UTC clock\n- Auto status transitions:\n   Upcoming -> Ongoing\n   -> Completed badges",
        fontsize=11.5, color="#334155", ha='center', va='center')

# Step 4: Participants & Telemetry
box4 = FancyBboxPatch((12.3, 4.3), 2.9, 3.1, boxstyle="round,pad=0.2,rounding_size=0.15",
                      facecolor="#FFFFFF", edgecolor="#8B5CF6", linewidth=2.5)
ax.add_patch(box4)
tag4 = FancyBboxPatch((12.55, 7.0), 2.4, 0.45, boxstyle="round,pad=0.08,rounding_size=0.08",
                      facecolor="#F5F3FF", edgecolor="#DDD6FE", linewidth=1.2)
ax.add_patch(tag4)
ax.text(13.75, 7.22, "STEP 4: REGISTRY & LIVE", fontsize=11, fontweight='bold', color="#6D28D9", ha='center', va='center')
ax.text(13.75, 6.4, "Monitoring Hub", fontsize=15, fontweight='bold', color="#0F172A", ha='center', va='center')
ax.text(13.75, 5.4, "- Student registrations\n- Live attendance stats\n- Capacity telemetry\n- System audit health",
        fontsize=11.5, color="#334155", ha='center', va='center')

# Horizontal Flow Arrows between Step 1 -> Step 2 -> Step 3 -> Step 4
def draw_step_arrow(x1, x2, y=5.8):
    arrow = FancyArrowPatch((x1, y), (x2, y),
                            arrowstyle='Simple,tail_width=2.5,head_width=9,head_length=8',
                            color='#3B82F6', alpha=0.9)
    ax.add_patch(arrow)

draw_step_arrow(4.0, 4.4)
draw_step_arrow(7.9, 8.3)
draw_step_arrow(11.8, 12.2)

# Bottom Section: Full Stack Implementation Stack & Data Integrity
bottom_box = FancyBboxPatch((0.8, 0.8), 14.4, 2.8, boxstyle="round,pad=0.2,rounding_size=0.15",
                            facecolor="#0F172A", edgecolor="#1E293B", linewidth=2.0)
ax.add_patch(bottom_box)

ax.text(8.0, 3.1, "UNDERLYING SYSTEM ARCHITECTURE & DATA INTEGRITY",
        fontsize=14, fontweight='bold', color="#38BDF8", ha='center', va='center')

# 3 Pillars at the bottom
# Pillar 1: Frontend
p1 = FancyBboxPatch((1.2, 1.1), 4.2, 1.7, boxstyle="round,pad=0.12,rounding_size=0.1",
                    facecolor="#1E293B", edgecolor="#334155", linewidth=1.2)
ax.add_patch(p1)
ax.text(3.3, 2.45, "FRONTEND LAYER", fontsize=12, fontweight='bold', color="#60A5FA", ha='center')
ax.text(3.3, 1.7, "- React 19 + Vite + Tailwind CSS\n- Axios with JWT Bearer Token\n- date-fns & Responsive Layout",
        fontsize=11, color="#E2E8F0", ha='center')

# Pillar 2: Backend
p2 = FancyBboxPatch((5.9, 1.1), 4.2, 1.7, boxstyle="round,pad=0.12,rounding_size=0.1",
                    facecolor="#1E293B", edgecolor="#334155", linewidth=1.2)
ax.add_patch(p2)
ax.text(8.0, 2.45, "BACKEND API LAYER", fontsize=12, fontweight='bold', color="#34D399", ha='center')
ax.text(8.0, 1.7, "- FastAPI + Uvicorn ASGI Server\n- Pydantic v2 Schemas & Validation\n- Strict UTC Timestamps & RBAC",
        fontsize=11, color="#E2E8F0", ha='center')

# Pillar 3: Database & Testing
p3 = FancyBboxPatch((10.6, 1.1), 4.2, 1.7, boxstyle="round,pad=0.12,rounding_size=0.1",
                    facecolor="#1E293B", edgecolor="#334155", linewidth=1.2)
ax.add_patch(p3)
ax.text(12.7, 2.45, "DATABASE & QUALITY", fontsize=12, fontweight='bold', color="#FBBF24", ha='center')
ax.text(12.7, 1.7, "- SQLite + SQLAlchemy 2.0 ORM\n- Relational Schema with Foreign Keys\n- 24 Automated Tests (100% Pass)",
        fontsize=11, color="#E2E8F0", ha='center')

# Connecting arrow from upper workflow to underlying architecture
down_arrow = FancyArrowPatch((8.0, 4.2), (8.0, 3.5),
                             arrowstyle='Simple,tail_width=2.5,head_width=8,head_length=8',
                             color='#64748B', alpha=0.9)
ax.add_patch(down_arrow)
ax.text(8.0, 3.85, "Seamless API Communication & Relational Queries", fontsize=9.5, color="#64748B", fontweight='bold', ha='center', va='center',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#F8FAFC', edgecolor='none'))

plt.tight_layout()
output_path = r"c:\Users\Hp\Desktop\Occasio_iip\occasio_methodology_flow_ppt.png"
plt.savefig(output_path, dpi=300, bbox_inches='tight')
plt.close()
print("Saved simple PPT diagram to:", output_path)
