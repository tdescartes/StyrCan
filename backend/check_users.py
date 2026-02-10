"""Check database users."""
import sys
sys.path.insert(0, 'C:\\Users\\Descartes Tuyishime\\OneDrive\\Documents\\Pulse\\Pulse\\backend')

from app.database import SessionLocal
from app.models import User, Company

db = SessionLocal()

print("Companies:")
companies = db.query(Company).all()
for company in companies:
    print(f"  - {company.name} ({company.email})")

print("\nUsers:")
users = db.query(User).all()
for user in users:
    print(f"  - {user.email} (Company: {user.company_id}, Role: {user.role})")

db.close()
