"""
PostgreSQL Database Setup - Interactive
Simple script to create PostgreSQL database with password input
"""

import os
import sys
import getpass
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

# Configuration
PG_HOST = "localhost"
PG_PORT = "5432"
PG_USER = "postgres"
PG_DB = "styrcan_db"
PG_APP_USER = "styrcan"  
PG_APP_PASSWORD = "styrcan_password"

INIT_SQL_PATH = Path(__file__).parent.parent / "database" / "init.sql"


def main():
    """Main setup function."""
    print("\n" + "="*60)
    print("PostgreSQL Database Setup for StyrCan")
    print("="*60)
    
    # Get password
    print(f"\nConnecting to PostgreSQL as user '{PG_USER}'")
    print(f"Host: {PG_HOST}:{PG_PORT}")
    
    if "POSTGRES_PASSWORD" in os.environ:
        pg_password = os.environ["POSTGRES_PASSWORD"]
        print("Using password from POSTGRES_PASSWORD environment variable")
    else:
        pg_password = getpass.getpass(f"\nEnter password for PostgreSQL user '{PG_USER}': ")
    
    try:
        # Step 1: Connect to PostgreSQL
        print("\n[1/5] Connecting to PostgreSQL...")
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=pg_password,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        print("      ✅ Connected successfully")
        
        # Step 2: Create database
        print(f"\n[2/5] Creating database '{PG_DB}'...")
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{PG_DB}'")
        if cursor.fetchone():
            print(f"      ✅ Database '{PG_DB}' already exists")
        else:
            cursor.execute(f"CREATE DATABASE {PG_DB}")
            print(f"      ✅ Database created")
        
        # Step 3: Create application user
        print(f"\n[3/5] Creating application user '{PG_APP_USER}'...")
        cursor.execute(f"SELECT 1 FROM pg_roles WHERE rolname = '{PG_APP_USER}'")
        if cursor.fetchone():
            print(f"      ✅ User '{PG_APP_USER}' already exists")
        else:
            cursor.execute(f"CREATE USER {PG_APP_USER} WITH PASSWORD '{PG_APP_PASSWORD}'")
            print(f"      ✅ User created")
        
        # Grant database privileges
        cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {PG_DB} TO {PG_APP_USER}")
        print(f"      ✅ Database privileges granted")
        
        cursor.close()
        conn.close()
        
        # Step 4: Initialize schema
        print(f"\n[4/5] Initializing database schema...")
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=pg_password,
            database=PG_DB
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        if INIT_SQL_PATH.exists():
            with open(INIT_SQL_PATH, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            cursor.execute(sql_content)
            print(f"      ✅ Schema initialized from init.sql")
            
            # Step 5: Grant table privileges
            print(f"\n[5/5] Granting table privileges...")
            cursor.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {PG_APP_USER}")
            cursor.execute(f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {PG_APP_USER}")
            print(f"      ✅ Table privileges granted")
            
            # Verify tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            tables = [row[0] for row in cursor.fetchall()]
            print(f"\n      📊 Tables created ({len(tables)}):")
            for table in tables:
                print(f"         - {table}")
        else:
            print(f"      ⚠️  init.sql not found at {INIT_SQL_PATH}")
        
        cursor.close()
        conn.close()
        
        # Success summary
        print("\n" + "="*60)
        print("✅ PostgreSQL Setup Complete!")
        print("="*60)
        print(f"\nConnection String:")
        print(f"  postgresql://{PG_APP_USER}:****@{PG_HOST}:{PG_PORT}/{PG_DB}")
        
        print(f"\nNext steps:")
        print(f"  1. Test connection: python test_connections.py")
        print(f"  2. Start application: uvicorn app.main:app --reload")
        print()
        
    except psycopg2.Error as e:
        print(f"\n❌ PostgreSQL Error: {e}")
        print(f"\nTroubleshooting:")
        print(f"  1. Verify PostgreSQL is running")
        print(f"  2. Check the password for user '{PG_USER}'")
        print(f"  3. Ensure PostgreSQL is listening on port {PG_PORT}")
        print(f"  4. Check pg_hba.conf allows local connections")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
