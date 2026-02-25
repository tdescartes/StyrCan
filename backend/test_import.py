"""Test if the FastAPI app can be imported and started."""
import sys
import os

# Change to backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("Testing app import...")
try:
    from app.config import settings
    print(f"  Settings loaded: DB={settings.database_url[:30]}...")
    print(f"  Environment: {settings.environment}")
except Exception as e:
    print(f"  Settings FAILED: {e}")
    sys.exit(1)

print("Testing database engine creation...")
try:
    from app.database import engine, Base
    print(f"  Engine: {engine.url}")
except Exception as e:
    print(f"  Database engine FAILED: {e}")
    sys.exit(1)

print("Testing model imports...")
try:
    from app.models import User, Company, Employee
    print(f"  Models OK: User, Company, Employee")
except Exception as e:
    print(f"  Models FAILED: {e}")
    sys.exit(1)

print("Testing table creation...")
try:
    Base.metadata.create_all(bind=engine)
    print("  Tables created OK")
except Exception as e:
    print(f"  Table creation FAILED: {e}")
    sys.exit(1)

print("Testing full app import...")
try:
    from app.main import app
    print(f"  App imported OK: {app.title}")
    print(f"  Routes: {len(app.routes)}")
except Exception as e:
    print(f"  App import FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nAll checks passed! Backend should start fine.")
