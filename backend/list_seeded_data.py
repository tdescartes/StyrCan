
import os
import sys

# Add the current directory to sys.path to find the 'app' module
sys.path.insert(0, os.getcwd())

from app.database import SessionLocal
from app.models import User, Company

def list_data():
    try:
        db = SessionLocal()
        print("--- Companies ---")
        companies = db.query(Company).all()
        for company in companies:
            print(f"ID: {company.id} | Name: {company.name} | Email: {company.email}")
        
        print("\n--- Users ---")
        users = db.query(User).all()
        for user in users:
            print(f"UID: {user.id} | Email: {user.email} | Role: {user.role} | CID: {user.company_id}")
        
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_data()
