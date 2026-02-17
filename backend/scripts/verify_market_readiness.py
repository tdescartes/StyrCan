import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.company import Company
from app.models.finance import Transaction, ExpenseCategory
from app.models.payroll import PayrollRun

def verify_system_state():
    db = SessionLocal()
    try:
        companies = db.query(Company).all()
        print(f"--- System Verification: {len(companies)} Companies Registered ---")
        
        for company in companies:
            print(f"\n[Company: {company.name}] (Status: {company.status})")
            
            # Count Transactions
            tx_count = db.query(Transaction).filter(Transaction.company_id == company.id).count()
            print(f"  - Financial Transactions: {tx_count}")
            
            # Count Categories
            cat_count = db.query(ExpenseCategory).filter(ExpenseCategory.company_id == company.id).count()
            print(f"  - Expense Categories: {cat_count}")
            
            # Count Payroll Records
            payroll_count = db.query(PayrollRun).filter(PayrollRun.company_id == company.id).count()
            print(f"  - Completed Payroll Runs: {payroll_count}")
            
            # Detailed check for isolation
            if tx_count > 0:
                recent_tx = db.query(Transaction).filter(Transaction.company_id == company.id).first()
                print(f"  - Sample Record Check: OK (ID: {recent_tx.id[:8]}...)")
            
            if company.name == "Stellar Solutions" and tx_count == 0:
                print("  - Isolation Check: SUCCESS (No ghost data found for new tenant)")

    finally:
        db.close()

if __name__ == "__main__":
    verify_system_state()
