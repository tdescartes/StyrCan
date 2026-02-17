import sys
import os
import uuid
from datetime import datetime
from decimal import Decimal

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.finance import ExpenseCategory
from app.auth.security import get_password_hash

def orchestrate_onboarding(company_name, admin_email):
    """
    Simulates the full onboarding flow for a new tenant.
    """
    print(f"--- Starting Onboarding Orchestration for: {company_name} ---")
    db = SessionLocal()
    try:
        # Step 1: Create Company Instance
        company_id = str(uuid.uuid4())
        company = Company(
            id=company_id,
            name=company_name,
            email=admin_email,
            status="pending_verification"
        )
        db.add(company)
        print(f"[1/4] Created Company Instance: {company_id}")

        # Step 2: Provision Primary Admin
        admin_id = str(uuid.uuid4())
        admin_user = User(
            id=admin_id,
            company_id=company_id,
            email=admin_email,
            hashed_password=get_password_hash("Welcome2026!"),
            first_name="Stellar",
            last_name="Founder",
            role="company_admin",
            is_active=True
        )
        db.add(admin_user)
        print(f"[2/4] Provisioned Primary Admin: {admin_email}")

        # Step 3: Inject System Configuration (Defaults)
        default_categories = ["Operating", "Marketing", "Technology", "Lease"]
        for cat_name in default_categories:
            category = ExpenseCategory(
                id=str(uuid.uuid4()),
                company_id=company_id,
                name=cat_name,
                description="Default category added during onboarding.",
                budget_limit=Decimal("1000.00")
            )
            db.add(category)
        print(f"[3/4] Injected {len(default_categories)} default expense categories")

        # Step 4: Infrastructure Mocking (S3 & Logs)
        # Note: In a real system, we'd call boto3.client('s3').put_object(...) 
        # to create the folder structure: /uploads/{company_id}/
        print(f"[4/4] Infrastructure context initialized at: s3://pulse-storage/{company_id}/")

        # Finalizing
        company.status = "active"
        db.commit()
        print(f"\n✅ ONBOARDING COMPLETE: {company_name} is now LIVE.")
        print(f"Dashboard URL: http://app.styrcan.com/{company_id}/dashboard")
        
    except Exception as e:
        print(f"❌ Onboarding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    orchestrate_onboarding("Stellar Solutions", "connect@stellar.io")
