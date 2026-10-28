from app.database import Base  # noqa: F401 – imported so models register with Base

from app.models.user import User  # noqa: F401
from app.models.event import Event  # noqa: F401
from app.models.schedule import Schedule  # noqa: F401
from app.models.participant import Participant  # noqa: F401
from app.models.registration import Registration  # noqa: F401

# Person 3 Models: Evaluation, Scoring & Certificates
from app.models.feedback import Feedback  # noqa: F401
from app.models.evaluation import EventScore  # noqa: F401
from app.models.certificate import Certificate  # noqa: F401

# EventSphere Lifecycle Models: Teams & Attendance
from app.models.team import Team, TeamMember  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401

# Multi-University Governance & Judge RBAC
from app.models.university import University  # noqa: F401
from app.models.judge import JudgeInvitation, JudgeAssignment  # noqa: F401

