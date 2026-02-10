"""
Database Setup Script for StyrCan
Creates and initializes PostgreSQL and MongoDB databases using Python
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pymongo import MongoClient
from pathlib import Path

# Configuration
PG_HOST = "localhost"
PG_PORT = "5432"
PG_USER = "postgres"
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")  # Default postgres password
PG_DB = "styrcan_db"
PG_APP_USER = "styrcan"
PG_APP_PASSWORD = "styrcan_password"

MONGO_HOST = "localhost"
MONGO_PORT = 27017
MONGO_DB = "styrcan_logs"

INIT_SQL_PATH = Path(__file__).parent.parent / "database" / "init.sql"


def print_header(text):
    """Print formatted header."""
    print("\n" + "="*50)
    print(text)
    print("="*50)


def print_step(step_num, text):
    """Print step header."""
    print(f"\n{'='*50}")
    print(f"Step {step_num}: {text}")
    print(f"{'='*50}")


def setup_postgresql():
    """Create and initialize PostgreSQL database."""
    print_step(1, "Setting up PostgreSQL")
    
    try:
        # Connect to PostgreSQL server (default database)
        print(f"  Connecting to PostgreSQL at {PG_HOST}:{PG_PORT}...")
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print(f"  [OK] Connected successfully")
        
        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{PG_DB}'")
        if cursor.fetchone():
            print(f"  Database '{PG_DB}' already exists")
        else:
            print(f"  Creating database '{PG_DB}'...")
            cursor.execute(f"CREATE DATABASE {PG_DB}")
            print(f"  [OK] Database created")
        
        # Check if user exists
        cursor.execute(f"SELECT 1 FROM pg_roles WHERE rolname = '{PG_APP_USER}'")
        if cursor.fetchone():
            print(f"  User '{PG_APP_USER}' already exists")
        else:
            print(f"  Creating user '{PG_APP_USER}'...")
            cursor.execute(f"CREATE USER {PG_APP_USER} WITH PASSWORD '{PG_APP_PASSWORD}'")
            print(f"  [OK] User created")
        
        # Grant privileges
        print(f"  Granting privileges...")
        cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {PG_DB} TO {PG_APP_USER}")
        print(f"  [OK] Privileges granted")
        
        cursor.close()
        conn.close()
        
        # Now connect to the new database and run schema
        print(f"\n  Initializing database schema...")
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            database=PG_DB
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Read and execute init.sql
        if INIT_SQL_PATH.exists():
            print(f"  Executing init.sql from {INIT_SQL_PATH}...")
            with open(INIT_SQL_PATH, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            cursor.execute(sql_content)
            print(f"  [OK] Schema initialized")
            
            # Grant privileges on all tables
            cursor.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {PG_APP_USER}")
            cursor.execute(f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {PG_APP_USER}")
            print(f"  [OK] Table privileges granted to {PG_APP_USER}")
            
            # Verify tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            tables = [row[0] for row in cursor.fetchall()]
            print(f"  [OK] Tables created: {', '.join(tables)}")
        else:
            print(f"  [WARNING] init.sql not found at {INIT_SQL_PATH}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"  [FAIL] PostgreSQL error: {e}")
        print(f"\n  Troubleshooting:")
        print(f"    1. Check if PostgreSQL is running")
        print(f"    2. Verify connection settings (host={PG_HOST}, port={PG_PORT})")
        print(f"    3. Check password for user '{PG_USER}'")
        print(f"    4. Set POSTGRES_PASSWORD environment variable if not 'postgres'")
        return False
    except Exception as e:
        print(f"  [FAIL] Unexpected error: {e}")
        return False


def setup_mongodb():
    """Create and initialize MongoDB database."""
    print_step(2, "Setting up MongoDB")
    
    try:
        print(f"  Connecting to MongoDB at {MONGO_HOST}:{MONGO_PORT}...")
        client = MongoClient(f"mongodb://{MONGO_HOST}:{MONGO_PORT}/", serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        print(f"  [OK] Connected successfully")
        
        # Get or create database
        db = client[MONGO_DB]
        
        # Create collections
        collections = [
            'audit_logs',
            'chat_messages',
            'notifications',
            'analytics_events',
            'document_metadata',
            'application_logs'
        ]
        
        existing_collections = db.list_collection_names()
        print(f"  Creating collections...")
        
        for coll_name in collections:
            if coll_name not in existing_collections:
                db.create_collection(coll_name)
                print(f"    - {coll_name}")
        
        print(f"  [OK] MongoDB database '{MONGO_DB}' initialized")
        print(f"  [OK] Collections: {', '.join(collections)}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"  [WARNING] MongoDB connection failed: {e}")
        print(f"  MongoDB is optional for core features (used for logging)")
        print(f"\n  To enable MongoDB:")
        print(f"    1. Install MongoDB from https://www.mongodb.com/try/download/community")
        print(f"    2. Start MongoDB service")
        print(f"    3. Run this script again")
        return False


def setup_env_file():
    """Create or verify .env file."""
    print_step(3, "Setting up Environment File")
    
    env_path = Path(__file__).parent / ".env"
    env_example_path = Path(__file__).parent / ".env.example"
    
    if env_path.exists():
        print(f"  [OK] .env file already exists at {env_path}")
    else:
        if env_example_path.exists():
            import shutil
            shutil.copy(env_example_path, env_path)
            print(f"  [OK] Created .env from .env.example")
        else:
            print(f"  Creating new .env file...")
            env_content = f"""# Database Configuration
DATABASE_URL=postgresql://{PG_APP_USER}:{PG_APP_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}

# MongoDB Configuration
MONGODB_URL=mongodb://{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}
MONGODB_HOST={MONGO_HOST}
MONGODB_PORT={MONGO_PORT}
MONGODB_DB={MONGO_DB}

# JWT Configuration (CHANGE IN PRODUCTION!)
SECRET_KEY=dev-secret-key-change-in-production-{os.urandom(16).hex()}

# Application Settings
DEBUG=True
ENVIRONMENT=development
"""
            with open(env_path, 'w') as f:
                f.write(env_content)
            print(f"  [OK] Created .env file")
        
        print(f"  [NOTE] Review .env and update SECRET_KEY for production!")


def main():
    """Main setup function."""
    print_header("🔧 StyrCan Database Setup")
    
    # Setup PostgreSQL (required)
    pg_success = setup_postgresql()
    
    # Setup MongoDB (optional)
    mongo_success = setup_mongodb()
    
    # Setup environment file
    setup_env_file()
    
    # Summary
    print_header("Setup Summary")
    print(f"  PostgreSQL: {'✅ SUCCESS' if pg_success else '❌ FAILED'}")
    print(f"  MongoDB:    {'✅ SUCCESS' if mongo_success else '⚠️  OPTIONAL (not available)'}")
    
    if pg_success:
        print_header("✅ Database Setup Complete!")
        print(f"\nDatabase Information:")
        print(f"  PostgreSQL:")
        print(f"    - Host: {PG_HOST}")
        print(f"    - Port: {PG_PORT}")
        print(f"    - Database: {PG_DB}")
        print(f"    - User: {PG_APP_USER}")
        print(f"    - Connection: postgresql://{PG_APP_USER}:****@{PG_HOST}:{PG_PORT}/{PG_DB}")
        
        if mongo_success:
            print(f"\n  MongoDB:")
            print(f"    - Host: {MONGO_HOST}")
            print(f"    - Port: {MONGO_PORT}")
            print(f"    - Database: {MONGO_DB}")
            print(f"    - Connection: mongodb://{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}")
        
        print(f"\nNext Steps:")
        print(f"  1. Review .env file and update SECRET_KEY")
        print(f"  2. Test connections: python test_connections.py")
        print(f"  3. Start application: uvicorn app.main:app --reload")
        print()
    else:
        print_header("❌ Setup Failed")
        print(f"\nPlease fix the PostgreSQL connection issues above and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
