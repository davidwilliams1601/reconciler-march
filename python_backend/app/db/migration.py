import os
import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from .database import Base, engine
from app.core.config import settings

logger = logging.getLogger(__name__)

def ensure_column_exists(conn, table_name, column_name, column_type):
    """
    Check if a column exists in a table, and if not, add it.
    """
    # Check if column exists
    result = conn.execute(text(f"""
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='{table_name}' 
        AND column_name='{column_name}'
    """))
    
    exists = bool(result.scalar())
    
    if not exists:
        logger.info(f"Adding column {column_name} to table {table_name}")
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
        return True
    
    return False

def run_migrations():
    """
    Run database migrations to ensure the schema is up to date.
    """
    logger.info("Running database migrations...")
    
    try:
        # Create a connection
        with engine.connect() as conn:
            # Ensure the Xero redirect URI column exists
            ensure_column_exists(
                conn, 
                "organization_settings", 
                "xero_redirect_uri", 
                "VARCHAR"
            )
            
            # Ensure Xero tenant name column exists
            ensure_column_exists(
                conn, 
                "organization_settings", 
                "xero_tenant_name", 
                "VARCHAR"
            )
            
            # Ensure Xero access token column exists
            ensure_column_exists(
                conn, 
                "organization_settings", 
                "xero_access_token", 
                "VARCHAR"
            )
            
            # Commit the transaction
            conn.commit()
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        # Don't re-raise the exception as we want the app to start even if migrations fail
        # Instead, log the error and continue
    
    logger.info("Database migrations completed")
    
def create_initial_organization():
    """
    Create an initial organization if none exists
    """
    logger.info("Checking for organizations...")
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Check if any organization exists
        result = session.execute(text("SELECT COUNT(*) FROM organizations"))
        count = result.scalar()
        
        if count == 0:
            # Create an initial organization
            from app.db.models import Organization, User, OrganizationSettings
            import uuid
            from datetime import datetime
            
            # Create organization
            org_id = str(uuid.uuid4())
            org = Organization(
                id=org_id,
                name="Default Organization",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(org)
            
            # Create settings
            settings = OrganizationSettings(
                id=str(uuid.uuid4()),
                organization_id=org_id,
                reconciliation_confidence_threshold=0.95,
                auto_reconcile=False,
                email_enabled=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(settings)
            
            # Commit changes
            session.commit()
            logger.info(f"Created initial organization with ID: {org_id}")
        else:
            logger.info(f"Organizations already exist, skipping creation")
            
    except Exception as e:
        logger.error(f"Error creating initial organization: {e}")
        session.rollback()
    finally:
        session.close() 