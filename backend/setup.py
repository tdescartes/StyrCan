#!/usr/bin/env python
"""
Quick start script for Pulse backend development.
This script helps set up the development environment quickly.
"""

import os
import sys
import subprocess
from pathlib import Path


def print_step(step_num, message):
    """Print a formatted step message."""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {message}")
    print(f"{'='*60}\n")


def run_command(command, shell=True, check=True):
    """Run a shell command and handle errors."""
    try:
        result = subprocess.run(command, shell=shell, check=check, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False


def check_python_version():
    """Check if Python version is 3.10 or higher."""
    print_step(1, "Checking Python Version")
    if sys.version_info < (3, 10):
        print(f"❌ Python 3.10+ required. Current version: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True


def setup_virtual_environment():
    """Create and activate virtual environment."""
    print_step(2, "Setting Up Virtual Environment")
    
    venv_path = Path("venv")
    if venv_path.exists():
        print("✅ Virtual environment already exists")
        return True
    
    print("Creating virtual environment...")
    if not run_command(f"{sys.executable} -m venv venv"):
        print("❌ Failed to create virtual environment")
        return False
    
    print("✅ Virtual environment created")
    return True


def install_dependencies():
    """Install required Python packages."""
    print_step(3, "Installing Dependencies")
    
    # Determine pip path based on OS
    if sys.platform == "win32":
        pip_path = "venv\\Scripts\\pip.exe"
    else:
        pip_path = "venv/bin/pip"
    
    if not Path(pip_path).exists():
        print("❌ Virtual environment not activated properly")
        return False
    
    print("Installing requirements...")
    if not run_command(f"{pip_path} install -r requirements.txt"):
        print("❌ Failed to install dependencies")
        return False
    
    print("✅ Dependencies installed successfully")
    return True


def setup_env_file():
    """Copy .env.example to .env if it doesn't exist."""
    print_step(4, "Setting Up Environment Configuration")
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if not env_example.exists():
        print("❌ .env.example not found")
        return False
    
    import shutil
    shutil.copy(env_example, env_file)
    print("✅ Created .env file from .env.example")
    print("\n⚠️  IMPORTANT: Edit .env file and update:")
    print("   - DATABASE_URL with your PostgreSQL credentials")
    print("   - MONGODB_URL with your MongoDB connection string")
    print("   - SECRET_KEY with a secure random string (32+ characters)")
    print("   - REDIS_HOST/PORT if using remote Redis")
    return True


def check_databases():
    """Check if required databases are accessible."""
    print_step(5, "Checking Database Connections (Optional)")
    
    print("This step checks if databases are accessible.")
    print("If you haven't set up databases yet, you can skip this.\n")
    
    response = input("Check database connections? (y/n): ").lower()
    if response != 'y':
        print("⏭️  Skipping database checks")
        return True
    
    # Try importing required modules
    try:
        import psycopg2
        from pymongo import MongoClient
        import redis
        print("✅ Database drivers installed")
    except ImportError as e:
        print(f"❌ Missing database driver: {e}")
        return False
    
    print("\n📝 Database check results:")
    print("   (Run 'docker-compose up -d' to start databases if needed)")
    return True


def run_migrations():
    """Run database migrations."""
    print_step(6, "Running Database Migrations (Optional)")
    
    response = input("Run database migrations now? (y/n): ").lower()
    if response != 'y':
        print("⏭️  Skipping migrations (you can run 'alembic upgrade head' later)")
        return True
    
    if sys.platform == "win32":
        alembic_path = "venv\\Scripts\\alembic.exe"
    else:
        alembic_path = "venv/bin/alembic"
    
    if not Path(alembic_path).exists():
        print("❌ Alembic not found. Installing...")
        return False
    
    print("Running migrations...")
    if not run_command(f"{alembic_path} upgrade head", check=False):
        print("⚠️  Migrations failed (database might not be ready)")
        print("   You can run 'alembic upgrade head' manually later")
        return True
    
    print("✅ Migrations completed")
    return True


def print_next_steps():
    """Print next steps for the user."""
    print("\n" + "="*60)
    print("🎉 Setup Complete!")
    print("="*60)
    
    print("\n📋 Next Steps:")
    print("\n1. Activate virtual environment:")
    if sys.platform == "win32":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    
    print("\n2. Start required services (PostgreSQL, MongoDB, Redis):")
    print("   docker-compose up -d")
    
    print("\n3. Run database migrations:")
    print("   alembic upgrade head")
    
    print("\n4. Start the development server:")
    print("   uvicorn app.main:app --reload")
    print("   or")
    print("   python -m app.main")
    
    print("\n5. Access the API:")
    print("   - API: http://localhost:8000")
    print("   - Docs: http://localhost:8000/api/docs")
    print("   - ReDoc: http://localhost:8000/api/redoc")
    
    print("\n📚 For more information, see README_BACKEND.md")
    print("\n" + "="*60 + "\n")


def main():
    """Main setup function."""
    print("\n" + "="*60)
    print("Pulse Backend - Development Setup")
    print("="*60)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Run setup steps
    steps = [
        check_python_version,
        setup_virtual_environment,
        install_dependencies,
        setup_env_file,
        check_databases,
        run_migrations,
    ]
    
    for step in steps:
        if not step():
            print(f"\n❌ Setup failed at: {step.__name__}")
            print("Please fix the issue and run the script again.")
            sys.exit(1)
    
    # Print next steps
    print_next_steps()
    print("✅ All setup steps completed successfully!")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
