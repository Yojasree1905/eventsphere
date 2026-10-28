import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.firestore_service import batch_export_to_firestore, init_firestore

def main():
    print("=" * 60)
    print("  EventSphere - Cloud Firestore Database Synchronization")
    print("=" * 60)
    print()

    client = init_firestore()
    if not client:
        print("[!] No active Firebase credentials detected.")
        print("    To sync your tables into Cloud Firestore:")
        print("    1. Go to Firebase Console -> Project Settings -> Service accounts.")
        print("    2. Click 'Generate new private key' and save as 'serviceAccountKey.json' in this folder.")
        print("    3. Re-run this script: python migrate_to_firestore.py")
        print()
        sys.exit(1)

    print("[*] Connected to Cloud Firestore successfully!")
    print("[*] Reading all records from local database and exporting to Firestore...")

    db = SessionLocal()
    try:
        counts = batch_export_to_firestore(db)
        print()
        print("[SUCCESS] All tables have been mirrored to Cloud Firestore collections:")
        for col, count in counts.items():
            print(f"  - Collection '{col}': {count} documents created/updated")
        print()
        print("Open your Firebase Console -> Firestore Database to inspect your live tables!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
