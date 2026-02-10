"""
Quick MongoDB Connection Test
Tests only MongoDB (since it's already working)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongodb():
    """Test MongoDB connection and list collections."""
    print("="*60)
    print("MongoDB Connection Test")
    print("="*60)
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        
        # Get database
        db = client['styrcan_logs']
        
        # List collections
        collections = await db.list_collection_names()
        print(f"\n📊 Database: styrcan_logs")
        print(f"   Collections: {len(collections)}")
        
        for coll in collections:
            print(f"   - {coll}")
        
        # Get server info
        server_info = await client.server_info()
        print(f"\n💻 MongoDB Version: {server_info['version']}")
        
        # Test a simple operation
        test_coll = db['application_logs']
        doc_count = await test_coll.count_documents({})
        print(f"\n📝 Documents in 'application_logs': {doc_count}")
        
        client.close()
        
        print("\n" + "="*60)
        print("✅ MongoDB is ready for use!")
        print("="*60)
        print("\nYou can now:")
        print("  1. Complete PostgreSQL setup (see DATABASE_SETUP_GUIDE.md)")
        print("  2. Start the application: uvicorn app.main:app --reload")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_mongodb())
