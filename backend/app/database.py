"""
Database connection and session management.

`get_db` is a FastAPI dependency that yields a session per-request and
always closes it afterwards, even if the request raises an exception.
"""
import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.config import settings

# `connect_args` is only needed for SQLite (used in the test suite); it is
# ignored by Postgres so the same engine-creation code works everywhere.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class GUID(TypeDecorator):
    """Platform-independent UUID type.

    Uses Postgres's native UUID type when available (production), and
    falls back to a CHAR(36) column on SQLite (used by the test suite),
    so the same model definitions work against both databases.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(str(value))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
