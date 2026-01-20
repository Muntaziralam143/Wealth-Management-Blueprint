import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# ✅ Read DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("DATABASE_URL is not set")

# ✅ Create engine (PostgreSQL compatible)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

# ✅ Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ✅ Base
Base = declarative_base()

# ✅ Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
