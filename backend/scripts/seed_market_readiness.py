import sys
import os
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.company import Company
from app.models.user import User
from app.models.finance import Transaction, ExpenseCategory
from app.models.employee import Employee
from app.models.payroll import PayrollRun, PayrollItem
from app.auth.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        print("Starting Market Readiness Seeding...")
        
        # 1. Create Companies
        apex_id = "ENT-001-APEX"
        horizon_id = "LOG-002-HORIZON"
        
        apex = db.query(Company).filter(Company.id == apex_id).first()
        if not apex:
            apex = Company(
                id=apex_id,
                name="Apex Dynamics",
                email="admin@apexdynamics.com",
                phone="+1-555-0100",
                address="750 Financial Plaza, New York, NY",
                tax_id="12-3456789",
                status="active"
            )
            db.add(apex)
            print("Created Company: Apex Dynamics")

        horizon = db.query(Company).filter(Company.id == horizon_id).first()
        if not horizon:
            horizon = Company(
                id=horizon_id,
                name="Horizon Logistics",
                email="ops@horizon.log",
                phone="+1-555-0200",
                address="1200 Terminal Way, Chicago, IL",
                tax_id="98-7654321",
                status="active"
            )
            db.add(horizon)
            print("Created Company: Horizon Logistics")
        
        db.commit()

        # 2. Create Users (with stable IDs for employee linkage)
        password_hash = get_password_hash("StyrCanDemo2026!")
        
        users_data = [
            # Apex Dynamics users
            ("USR-APEX-ADMIN", apex_id, "admin@apexdynamics.com", "Apex", "Admin", "super_admin", True),
            ("USR-APEX-CFO", apex_id, "cfo@apexdynamics.com", "Julia", "Sterling", "company_admin", True),
            ("USR-APEX-MGR", apex_id, "manager@apexdynamics.com", "David", "Chen", "manager", False),
            ("USR-APEX-EMP1", apex_id, "sarah.j@apexdynamics.com", "Sarah", "Johnson", "employee", False),
            ("USR-APEX-EMP2", apex_id, "mike.r@apexdynamics.com", "Mike", "Rodriguez", "employee", False),
            # Horizon Logistics users
            ("USR-HOR-ADMIN", horizon_id, "ops@horizon.log", "Marcus", "Vance", "company_admin", False),
            ("USR-HOR-MGR", horizon_id, "fleet@horizon.log", "Karen", "Brooks", "manager", False),
            ("USR-HOR-EMP1", horizon_id, "driver1@horizon.log", "Tom", "Wilson", "employee", False),
        ]
        
        created_users = {}
        for uid, cid, email, fn, ln, role, tfa in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    id=uid,
                    company_id=cid,
                    email=email,
                    hashed_password=password_hash,
                    first_name=fn,
                    last_name=ln,
                    role=role,
                    twofa_enabled=tfa
                )
                db.add(user)
                print(f"Created User: {email} ({role})")
            created_users[uid] = user
        
        db.commit()

        # 3. Create Expense Categories (Seed for Horizon)
        categories = ["Fuel", "Maintenance", "Insurance", "Lease", "Wages"]
        for cat_name in categories:
            cat = ExpenseCategory(
                id=str(uuid.uuid4()),
                company_id=horizon_id,
                name=cat_name,
                description=f"Standard logistics {cat_name.lower()} expenses",
                budget_limit=Decimal("50000.00")
            )
            db.add(cat)
        
        # 4. Create Transactions (Apex Dynamics - High Volume)
        print("Seeding transaction history for Apex Dynamics...")
        base_date = date.today() - timedelta(days=30)
        for i in range(200):
            tx = Transaction(
                id=str(uuid.uuid4()),
                company_id=apex_id,
                type="expense" if i % 3 != 0 else "income",
                category="Investment" if i % 3 == 0 else "Operations",
                amount=Decimal(str(round(100.50 * (i + 1), 2))),
                description=f"Transaction ref #AX-DATA-{i:03d}",
                transaction_date=base_date + timedelta(days=i//7)
            )
            db.add(tx)
        
        # 5. Create Employees & Payroll (Apex Dynamics)
        # Employees are linked to users via user_id
        print("Seeding employees & payroll for Apex Dynamics...")
        
        apex_employees_data = [
            # (emp_id, user_id, first, last, email, position, department, salary)
            ("EMP-APEX-ADM", "USR-APEX-ADMIN", "Apex", "Admin", "admin@apexdynamics.com", "CEO", "Executive", Decimal("150000.00")),
            ("EMP-APEX-CFO", "USR-APEX-CFO", "Julia", "Sterling", "cfo@apexdynamics.com", "CFO", "Finance", Decimal("130000.00")),
            ("EMP-APEX-MGR", "USR-APEX-MGR", "David", "Chen", "manager@apexdynamics.com", "Strategy Manager", "Strategy", Decimal("105000.00")),
            ("EMP-APEX-001", "USR-APEX-EMP1", "Sarah", "Johnson", "sarah.j@apexdynamics.com", "Financial Analyst", "Strategy", Decimal("85000.00")),
            ("EMP-APEX-002", "USR-APEX-EMP2", "Mike", "Rodriguez", "mike.r@apexdynamics.com", "Junior Analyst", "Strategy", Decimal("72000.00")),
        ]
        
        for emp_id, user_id, fn, ln, email, pos, dept, salary in apex_employees_data:
            existing = db.query(Employee).filter(Employee.id == emp_id).first()
            if not existing:
                employee = Employee(
                    id=emp_id,
                    company_id=apex_id,
                    user_id=user_id,
                    first_name=fn,
                    last_name=ln,
                    email=email,
                    position=pos,
                    department=dept,
                    hire_date=date(2024, 1, 1),
                    salary_amount=salary,
                    status="active"
                )
                db.add(employee)
                print(f"  Created Employee: {fn} {ln} ({pos}) → linked to user {user_id}")
            
            # Add a mock payroll run
            pr_id = f"PR-{emp_id}"
            existing_pr = db.query(PayrollRun).filter(PayrollRun.id == pr_id).first()
            if not existing_pr:
                payroll_run = PayrollRun(
                    id=pr_id,
                    company_id=apex_id,
                    period_start=date(2026, 1, 1),
                    period_end=date(2026, 1, 31),
                    status="completed",
                    total_amount=salary / 12
                )
                db.add(payroll_run)
                
                monthly = salary / 12
                tax = monthly * Decimal("0.22")
                deductions = monthly * Decimal("0.05")
                net = monthly - tax - deductions
                
                item = PayrollItem(
                    id=f"PI-{emp_id}",
                    company_id=apex_id,
                    payroll_run_id=pr_id,
                    employee_id=emp_id,
                    base_salary=monthly.quantize(Decimal("0.01")),
                    net_amount=net.quantize(Decimal("0.01")),
                    tax_amount=tax.quantize(Decimal("0.01")),
                    deductions=deductions.quantize(Decimal("0.01"))
                )
                db.add(item)

        # Horizon Logistics employees
        print("Seeding employees for Horizon Logistics...")
        
        horizon_employees_data = [
            ("EMP-HOR-ADM", "USR-HOR-ADMIN", "Marcus", "Vance", "ops@horizon.log", "Operations Director", "Operations", Decimal("120000.00")),
            ("EMP-HOR-MGR", "USR-HOR-MGR", "Karen", "Brooks", "fleet@horizon.log", "Fleet Manager", "Fleet", Decimal("95000.00")),
            ("EMP-HOR-001", "USR-HOR-EMP1", "Tom", "Wilson", "driver1@horizon.log", "Driver", "Fleet", Decimal("55000.00")),
        ]
        
        for emp_id, user_id, fn, ln, email, pos, dept, salary in horizon_employees_data:
            existing = db.query(Employee).filter(Employee.id == emp_id).first()
            if not existing:
                employee = Employee(
                    id=emp_id,
                    company_id=horizon_id,
                    user_id=user_id,
                    first_name=fn,
                    last_name=ln,
                    email=email,
                    position=pos,
                    department=dept,
                    hire_date=date(2024, 6, 15),
                    salary_amount=salary,
                    status="active"
                )
                db.add(employee)

        db.commit()
        print("Market Readiness Seeding Complete.")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
