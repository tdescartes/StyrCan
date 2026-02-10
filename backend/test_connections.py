"""
Database Connection Test Script
Tests both PostgreSQL and MongoDB connections
"""

import sys
import asyncio
from sqlalchemy import create_engine, text
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings

def test_postgresql():
    """Test PostgreSQL connection."""
    print("\n" + "="*50)
    print("Testing PostgreSQL Connection")
    print("="*50)
    
    try:
        # Create test engine
        engine = create_engine(settings.database_url)
        
        print(f"📊 Connecting to: {settings.database_url.split('@')[1] if '@' in settings.database_url else settings.database_url}")
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            
            print(f"✅ Connection successful!")
            print(f"   PostgreSQL Version: {version.split(',')[0]}")
            
            # Test schema
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            
            print(f"   Tables found: {len(tables)}")
            if tables:
                print(f"   Tables: {', '.join(tables)}")
            else:
                print(f"   ⚠️  No tables found. Run init.sql to create schema.")
            
            # Test for required tables
            required_tables = [
                'companies', 'users', 'employees', 'transactions',
                'payroll_runs', 'payroll_items', 'messages'
            ]
            missing_tables = [t for t in required_tables if t not in tables]
            
            if missing_tables:
                print(f"   ⚠️  Missing required tables: {', '.join(missing_tables)}")
            else:
                print(f"   ✅ All required tables present")
            
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL connection failed!")
        print(f"   Error: {str(e)}")
        print(f"\n   Troubleshooting:")
        print(f"   1. Check if PostgreSQL is running")
        print(f"   2. Verify DATABASE_URL in .env file")
        print(f"   3. Run setup_databases.ps1 to create database")
        return False


async def test_mongodb():
    """Test MongoDB connection."""
    print("\n" + "="*50)
    print("Testing MongoDB Connection")
    print("="*50)
    
    try:
        # Create test client
        client = AsyncIOMotorClient(settings.mongodb_url)
        
        print(f"📊 Connecting to: {settings.mongodb_url}")
        
        # Test connection with ping
        await client.admin.command('ping')
        print(f"✅ Connection successful!")
        
        # Get database
        db = client[settings.mongodb_db]
        
        # List collections
        collections = await db.list_collection_names()
        print(f"   Database: {settings.mongodb_db}")
        print(f"   Collections found: {len(collections)}")
        
        if collections:
            print(f"   Collections: {', '.join(collections)}")
        else:
            print(f"   ⚠️  No collections found. They will be created on first use.")
        
        # Test expected collections
        expected_collections = [
            'audit_logs', 'chat_messages', 'notifications',
            'analytics_events', 'document_metadata', 'application_logs'
        ]
        
        missing_collections = [c for c in expected_collections if c not in collections]
        if missing_collections:
            print(f"   ℹ️  Collections not yet created: {', '.join(missing_collections)}")
            print(f"      (Will be auto-created by application)")
        
        # Get server info
        server_info = await client.server_info()
        print(f"   MongoDB Version: {server_info['version']}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed!")
        print(f"   Error: {str(e)}")
        print(f"\n   Troubleshooting:")
        print(f"   1. Check if MongoDB is running (mongod service)")
        print(f"   2. Verify MONGODB_URL in .env file")
        print(f"   3. Default MongoDB port is 27017")
        print(f"   4. MongoDB is optional for core features (used for logging)")
        return False


def print_environment_info():
    """Print current environment configuration."""
    print("\n" + "="*50)
    print("Environment Configuration")
    print("="*50)
    print(f"   App Name: {settings.app_name}")
    print(f"   Version: {settings.app_version}")
    print(f"   Environment: {settings.environment}")
    print(f"   Debug Mode: {settings.debug}")
    print(f"   PostgreSQL Pool Size: {settings.database_pool_size}")
    print(f"   MongoDB Database: {settings.mongodb_db}")


async def main():
    """Run all connection tests."""
    print("\n" + "="*70)
    print("🔧 StyrCan Database Connection Test")
    print("="*70)
    
    # Print environment info
    print_environment_info()
    
    # Test PostgreSQL
    pg_success = test_postgresql()
    
    # Test MongoDB
    mongo_success = await test_mongodb()
    
    # Summary
    print("\n" + "="*50)
    print("Test Summary")
    print("="*50)
    print(f"   PostgreSQL: {'✅ PASS' if pg_success else '❌ FAIL'}")
    print(f"   MongoDB:    {'✅ PASS' if mongo_success else '❌ FAIL (Optional)'}")
    
    if pg_success:
        print(f"\n✅ Core database (PostgreSQL) is ready!")
        print(f"   You can now start the application with: uvicorn app.main:app --reload")
    else:
        print(f"\n❌ PostgreSQL connection failed. Please fix the issues above.")
        sys.exit(1)
    
    if not mongo_success:
        print(f"\n⚠️  MongoDB is not available but application can still run.")
        print(f"   Logging and analytics features may be limited.")
    
    print("")


if __name__ == "__main__":
    asyncio.run(main())
