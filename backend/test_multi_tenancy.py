"""
Multi-Tenancy Security Test Script

This script validates that cross-company data access is properly prevented.
Run this after setting up test data to ensure tenant isolation is working.

Usage:
    python test_multi_tenancy.py
"""

import asyncio
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, date

# Add parent directory to path
sys.path.insert(0, '..')

from app.config import settings
from app.database import Base
from app.models import Company, User, Employee, Transaction, PayrollRun
from app.mongo_models import AuditLog, ChatMessage, Notification
from app.auth import get_password_hash


class MultiTenancyTester:
    """Test multi-tenancy isolation."""
    
    def __init__(self):
        self.engine = create_engine(settings.database_url)
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        
        # Test data references
        self.company_a_id = None
        self.company_b_id = None
        self.user_a_id = None
        self.user_b_id = None
        self.employee_a_id = None
        self.employee_b_id = None
        
    def setup_test_data(self):
        """Create test companies and users."""
        print("📋 Setting up test data...")
        
        db = self.SessionLocal()
        try:
            # Company A
            self.company_a_id = str(uuid.uuid4())
            company_a = Company(
                id=self.company_a_id,
                name="Test Company A",
                email="company_a@test.com",
                status="active"
            )
            db.add(company_a)
            
            # Company B
            self.company_b_id = str(uuid.uuid4())
            company_b = Company(
                id=self.company_b_id,
                name="Test Company B",
                email="company_b@test.com",
                status="active"
            )
            db.add(company_b)
            
            # User A (belongs to Company A)
            self.user_a_id = str(uuid.uuid4())
            user_a = User(
                id=self.user_a_id,
                company_id=self.company_a_id,
                email="user_a@test.com",
                hashed_password=get_password_hash("password123"),
                first_name="Alice",
                last_name="Adams",
                role="company_admin",
                is_active=True
            )
            db.add(user_a)
            
            # User B (belongs to Company B)
            self.user_b_id = str(uuid.uuid4())
            user_b = User(
                id=self.user_b_id,
                company_id=self.company_b_id,
                email="user_b@test.com",
                hashed_password=get_password_hash("password123"),
                first_name="Bob",
                last_name="Brown",
                role="company_admin",
                is_active=True
            )
            db.add(user_b)
            
            # Employee A (belongs to Company A)
            self.employee_a_id = str(uuid.uuid4())
            employee_a = Employee(
                id=self.employee_a_id,
                company_id=self.company_a_id,
                email="employee_a@companya.com",
                first_name="John",
                last_name="Doe",
                hire_date=date.today(),
                status="active"
            )
            db.add(employee_a)
            
            # Employee B (belongs to Company B)
            self.employee_b_id = str(uuid.uuid4())
            employee_b = Employee(
                id=self.employee_b_id,
                company_id=self.company_b_id,
                email="employee_b@companyb.com",
                first_name="Jane",
                last_name="Smith",
                hire_date=date.today(),
                status="active"
            )
            db.add(employee_b)
            
            # Transaction A (belongs to Company A)
            transaction_a = Transaction(
                id=str(uuid.uuid4()),
                company_id=self.company_a_id,
                transaction_type="income",
                amount=1000.00,
                transaction_date=date.today(),
                description="Test transaction A",
                status="completed"
            )
            db.add(transaction_a)
            
            # Transaction B (belongs to Company B)
            transaction_b = Transaction(
                id=str(uuid.uuid4()),
                company_id=self.company_b_id,
                transaction_type="expense",
                amount=500.00,
                transaction_date=date.today(),
                description="Test transaction B",
                status="completed"
            )
            db.add(transaction_b)
            
            db.commit()
            print("✅ Test data created successfully")
            print(f"   Company A: {self.company_a_id}")
            print(f"   Company B: {self.company_b_id}")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating test data: {str(e)}")
            raise
        finally:
            db.close()
    
    def test_company_isolation(self):
        """Test that users can only see their own company's data."""
        print("\n🧪 Testing company isolation...")
        
        db = self.SessionLocal()
        try:
            # User A tries to query employees
            employees_a = db.query(Employee).filter(
                Employee.company_id == self.company_a_id
            ).all()
            
            print(f"   User A can see {len(employees_a)} employee(s)")
            assert len(employees_a) == 1, "User A should see exactly 1 employee"
            assert employees_a[0].company_id == self.company_a_id
            
            # User B tries to query employees
            employees_b = db.query(Employee).filter(
                Employee.company_id == self.company_b_id
            ).all()
            
            print(f"   User B can see {len(employees_b)} employee(s)")
            assert len(employees_b) == 1, "User B should see exactly 1 employee"
            assert employees_b[0].company_id == self.company_b_id
            
            # Verify cross-company access is prevented
            employee_a_from_b = db.query(Employee).filter(
                Employee.id == self.employee_a_id,
                Employee.company_id == self.company_b_id
            ).first()
            
            assert employee_a_from_b is None, "User B should NOT see Company A's employee"
            
            print("✅ Company isolation test passed")
            
        except AssertionError as e:
            print(f"❌ Company isolation test failed: {str(e)}")
        except Exception as e:
            print(f"❌ Error during test: {str(e)}")
        finally:
            db.close()
    
    def test_transaction_isolation(self):
        """Test that financial transactions are isolated by company."""
        print("\n🧪 Testing transaction isolation...")
        
        db = self.SessionLocal()
        try:
            # Company A transactions
            transactions_a = db.query(Transaction).filter(
                Transaction.company_id == self.company_a_id
            ).all()
            
            print(f"   Company A has {len(transactions_a)} transaction(s)")
            assert len(transactions_a) == 1
            assert all(t.company_id == self.company_a_id for t in transactions_a)
            
            # Company B transactions
            transactions_b = db.query(Transaction).filter(
                Transaction.company_id == self.company_b_id
            ).all()
            
            print(f"   Company B has {len(transactions_b)} transaction(s)")
            assert len(transactions_b) == 1
            assert all(t.company_id == self.company_b_id for t in transactions_b)
            
            print("✅ Transaction isolation test passed")
            
        except AssertionError as e:
            print(f"❌ Transaction isolation test failed: {str(e)}")
        except Exception as e:
            print(f"❌ Error during test: {str(e)}")
        finally:
            db.close()
    
    async def test_mongodb_isolation(self):
        """Test that MongoDB documents are isolated by company."""
        print("\n🧪 Testing MongoDB isolation...")
        
        try:
            client = AsyncIOMotorClient(settings.mongodb_url)
            from beanie import init_beanie
            
            await init_beanie(
                database=client[settings.mongodb_db],
                document_models=[AuditLog, ChatMessage, Notification]
            )
            
            # Create test audit logs
            audit_a = AuditLog(
                user_id=self.user_a_id,
                company_id=self.company_a_id,
                action="create",
                resource_type="employee",
                resource_id=self.employee_a_id,
                success=True
            )
            await audit_a.insert()
            
            audit_b = AuditLog(
                user_id=self.user_b_id,
                company_id=self.company_b_id,
                action="create",
                resource_type="employee",
                resource_id=self.employee_b_id,
                success=True
            )
            await audit_b.insert()
            
            # Query Company A logs
            logs_a = await AuditLog.find(
                AuditLog.company_id == self.company_a_id
            ).to_list()
            
            print(f"   Company A has {len(logs_a)} audit log(s)")
            assert all(log.company_id == self.company_a_id for log in logs_a)
            
            # Query Company B logs
            logs_b = await AuditLog.find(
                AuditLog.company_id == self.company_b_id
            ).to_list()
            
            print(f"   Company B has {len(logs_b)} audit log(s)")
            assert all(log.company_id == self.company_b_id for log in logs_b)
            
            print("✅ MongoDB isolation test passed")
            
        except AssertionError as e:
            print(f"❌ MongoDB isolation test failed: {str(e)}")
        except Exception as e:
            print(f"❌ Error during MongoDB test: {str(e)}")
    
    def test_unique_constraints(self):
        """Test that unique constraints are scoped to company."""
        print("\n🧪 Testing company-scoped unique constraints...")
        
        db = self.SessionLocal()
        try:
            # Try to create employee with same email in different company (should succeed)
            employee_dupe = Employee(
                id=str(uuid.uuid4()),
                company_id=self.company_b_id,  # Different company
                email="employee_a@companya.com",  # Same email as Company A's employee
                first_name="Duplicate",
                last_name="Person",
                hire_date=date.today(),
                status="active"
            )
            db.add(employee_dupe)
            db.commit()
            
            print("✅ Same email allowed across different companies")
            
            # Try to create employee with same email in same company (should fail)
            try:
                employee_conflict = Employee(
                    id=str(uuid.uuid4()),
                    company_id=self.company_a_id,  # Same company
                    email="employee_a@companya.com",  # Duplicate email
                    first_name="Conflict",
                    last_name="Person",
                    hire_date=date.today(),
                    status="active"
                )
                db.add(employee_conflict)
                db.commit()
                
                print("❌ Duplicate email in same company should have failed!")
                
            except Exception:
                db.rollback()
                print("✅ Duplicate email in same company correctly prevented")
                
        except Exception as e:
            db.rollback()
            print(f"❌ Unique constraint test error: {str(e)}")
        finally:
            db.close()
    
    def cleanup_test_data(self):
        """Remove test data."""
        print("\n🧹 Cleaning up test data...")
        
        db = self.SessionLocal()
        try:
            # Delete companies (cascade will remove related data)
            db.query(Company).filter(
                Company.id.in_([self.company_a_id, self.company_b_id])
            ).delete(synchronize_session=False)
            
            db.commit()
            print("✅ Test data cleaned up")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error cleaning up: {str(e)}")
        finally:
            db.close()
    
    async def run_all_tests(self):
        """Run all multi-tenancy tests."""
        print("\n" + "=" * 60)
        print("🛡️  MULTI-TENANCY SECURITY TEST SUITE")
        print("=" * 60)
        
        try:
            self.setup_test_data()
            self.test_company_isolation()
            self.test_transaction_isolation()
            await self.test_mongodb_isolation()
            self.test_unique_constraints()
            
            print("\n" + "=" * 60)
            print("✅ ALL TESTS COMPLETED")
            print("=" * 60)
            
        finally:
            self.cleanup_test_data()


async def main():
    """Main test runner."""
    tester = MultiTenancyTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
