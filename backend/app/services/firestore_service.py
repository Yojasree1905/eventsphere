import os
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import date, datetime

logger = logging.getLogger("eventsphere.firestore")

_firestore_client = None
_is_initialized = False


def _find_service_account_file() -> Optional[str]:
    # Check common locations
    candidates = [
        os.environ.get("FIREBASE_SERVICE_ACCOUNT"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "serviceAccountKey.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "serviceAccountKey.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "serviceAccountKey.json"),
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return None


def init_firestore():
    global _firestore_client, _is_initialized
    if _is_initialized:
        return _firestore_client

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        sa_path = _find_service_account_file()
        sa_raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")

        if sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            _firestore_client = firestore.client()
            _is_initialized = True
            logger.info(f"Initialized Firestore with service account from {sa_path}")
            return _firestore_client

        elif sa_raw:
            cred_dict = json.loads(sa_raw)
            cred = credentials.Certificate(cred_dict)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            _firestore_client = firestore.client()
            _is_initialized = True
            logger.info("Initialized Firestore with JSON environment variable")
            return _firestore_client

        elif os.environ.get("FIREBASE_PROJECT_ID"):
            if not firebase_admin._apps:
                firebase_admin.initialize_app(options={"projectId": os.environ.get("FIREBASE_PROJECT_ID")})
            _firestore_client = firestore.client()
            _is_initialized = True
            logger.info(f"Initialized Firestore with project {os.environ.get('FIREBASE_PROJECT_ID')}")
            return _firestore_client

        else:
            logger.warning("No Firebase credentials detected. Firestore sync will run in offline simulation/dry-run mode.")
            return None

    except Exception as e:
        logger.warning(f"Could not connect to Cloud Firestore: {e}")
        return None


def _serialize_for_firestore(obj: Any) -> Any:
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if hasattr(obj, "value"):  # Enums
        return obj.value
    if isinstance(obj, dict):
        return {k: _serialize_for_firestore(v) for k, v in obj.items() if not k.startswith("_")}
    if isinstance(obj, list):
        return [_serialize_for_firestore(i) for i in obj]
    return obj


def sync_document(collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
    """
    Writes or updates a document in Cloud Firestore.
    """
    client = init_firestore()
    if not client:
        return False
    try:
        clean_data = _serialize_for_firestore(data)
        clean_data["_updated_at"] = datetime.utcnow().isoformat()
        client.collection(collection).document(str(doc_id)).set(clean_data, merge=True)
        return True
    except Exception as e:
        logger.error(f"Error syncing document {doc_id} to collection {collection}: {e}")
        return False


def delete_document(collection: str, doc_id: str) -> bool:
    """
    Removes a document from Cloud Firestore.
    """
    client = init_firestore()
    if not client:
        return False
    try:
        client.collection(collection).document(str(doc_id)).delete()
        return True
    except Exception as e:
        logger.error(f"Error deleting document {doc_id} from collection {collection}: {e}")
        return False


def batch_export_to_firestore(db) -> Dict[str, int]:
    """
    Exports all current SQLite records into Cloud Firestore collections:
    - users
    - events
    - participants
    - registrations
    - teams
    - universities
    - certificates
    - evaluations
    """
    client = init_firestore()
    if not client:
        raise RuntimeError("Cloud Firestore is not connected. Please provide serviceAccountKey.json or set FIREBASE_PROJECT_ID.")

    from app.models.user import User
    from app.models.event import Event
    from app.models.participant import Participant
    from app.models.registration import Registration
    from app.models.team import Team
    from app.models.university import University
    from app.models.certificate import Certificate
    from app.models.evaluation import EventScore

    counts = {
        "users": 0,
        "events": 0,
        "participants": 0,
        "registrations": 0,
        "teams": 0,
        "universities": 0,
        "certificates": 0,
        "evaluations": 0,
    }

    # 1. Users
    for u in db.query(User).all():
        u_data = {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "college_name": u.college_name,
            "department": u.department,
            "is_active": u.is_active,
            "is_superadmin": u.is_superadmin,
            "created_at": u.created_at,
        }
        sync_document("users", str(u.id), u_data)
        counts["users"] += 1

    # 2. Events
    for e in db.query(Event).all():
        e_data = {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "category": str(e.category),
            "status": str(e.status),
            "college_name": e.college_name,
            "venue": e.venue,
            "start_date": e.start_date,
            "end_date": e.end_date,
            "max_participants": e.max_participants,
            "created_by": e.created_by,
            "created_at": e.created_at,
        }
        sync_document("events", str(e.id), e_data)
        counts["events"] += 1

    # 3. Participants
    for p in db.query(Participant).all():
        p_data = {
            "id": p.id,
            "full_name": p.full_name,
            "email": p.email,
            "college_name": p.college_name,
            "department": p.department,
            "created_at": p.created_at,
        }
        sync_document("participants", str(p.id), p_data)
        counts["participants"] += 1

    # 4. Registrations
    for r in db.query(Registration).all():
        r_data = {
            "id": r.id,
            "event_id": r.event_id,
            "participant_id": r.participant_id,
            "status": str(r.status),
            "registered_at": r.registered_at,
        }
        sync_document("registrations", str(r.id), r_data)
        counts["registrations"] += 1

    # 5. Teams
    for t in db.query(Team).all():
        t_data = {
            "id": t.id,
            "name": t.name,
            "event_id": t.event_id,
            "team_code": t.team_code,
            "leader_id": t.leader_id,
            "created_at": t.created_at,
        }
        sync_document("teams", str(t.id), t_data)
        counts["teams"] += 1

    # 6. Universities
    for uni in db.query(University).all():
        uni_data = {
            "id": uni.id,
            "name": uni.name,
            "code": uni.code,
            "city": uni.city,
            "state": uni.state,
            "domain": uni.domain,
            "description": uni.description,
            "is_active": uni.is_active,
        }
        sync_document("universities", str(uni.id), uni_data)
        counts["universities"] += 1

    # 7. Certificates
    for c in db.query(Certificate).all():
        c_data = {
            "id": c.id,
            "certificate_id": c.certificate_id,
            "event_id": c.event_id,
            "participant_id": c.participant_id,
            "cert_type": c.cert_type,
            "issue_date": c.issue_date,
            "verification_hash": c.verification_hash,
            "is_revoked": c.is_revoked,
            "created_at": c.created_at,
        }
        sync_document("certificates", str(c.certificate_id), c_data)
        counts["certificates"] += 1

    # 8. Evaluations
    for sc in db.query(EventScore).all():
        sc_data = {
            "id": sc.id,
            "event_id": sc.event_id,
            "participant_id": sc.participant_id,
            "team_id": sc.team_id,
            "total_score": sc.total_score,
            "rank": sc.rank,
        }
        sync_document("evaluations", str(sc.id), sc_data)
        counts["evaluations"] += 1

    return counts
