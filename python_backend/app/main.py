from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
import logging
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy.sql import text

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import routers
from app.api.auth import router as auth_router
from app.api.invoices import router as invoices_router
from app.api.dashboard import router as dashboard_router
from app.api.cost_centers import router as cost_centers_router
from app.api.upload import router as upload_router
from app.api.email_processing import router as email_processing_router
from app.api.email_processing import process_emails_and_create_invoices
from app.api.ml import router as ml_router
from app.api.settings import router as settings_router
from app.api.test_endpoints import router as test_endpoints_router

# Import database
from app.db.database import engine, Base, get_db
from app.db.migration import run_migrations, create_initial_organization

# Import task scheduler
from app.core.scheduler import scheduler

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Run migrations to update existing tables
run_migrations()

# Create initial organization if needed
create_initial_organization()

# Create FastAPI app
app = FastAPI(
    title="Invoice Reconciler API",
    description="API for invoice processing, OCR, and Xero reconciliation",
    version="0.1.0",
    # Handle trailing slashes consistently - redirects /some-path/ to /some-path
    redirect_slashes=True
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "https://frontend-new-er0k.onrender.com",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Invoice Reconciler API"}

# Health check
@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint that reports on API status.
    """
    # List all registered routes
    routes = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name
            })
    
    # Check database connectivity
    db_status = "unknown"
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            if result.scalar() == 1:
                db_status = "connected"
            else:
                db_status = "error"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Collect environment information
    env_info = {
        "FRONTEND_URL": os.environ.get("FRONTEND_URL", "not set"),
        "DATABASE_URL": os.environ.get("DATABASE_URL", "not set").replace("://", "://***:***@"),
        "GOOGLE_VISION_API_KEY": bool(os.environ.get("GOOGLE_VISION_API_KEY")),
    }
    
    return {
        "status": "healthy",
        "version": app.version,
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "registered_routes_count": len(routes),
        "api_routes": [r for r in routes if r["path"].startswith("/api")],
        "environment": env_info
    }

# Include routers with logging
logger.info("Registering API routers...")

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
logger.info("Registered auth_router at /api/auth")

app.include_router(invoices_router, prefix="/api/invoices", tags=["Invoices"])
logger.info("Registered invoices_router at /api/invoices")

app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
logger.info("Registered dashboard_router at /api/dashboard")

app.include_router(cost_centers_router, prefix="/api/cost-centers", tags=["Cost Centers"])
logger.info("Registered cost_centers_router at /api/cost-centers")

app.include_router(upload_router, prefix="/api/upload", tags=["File Upload"])
logger.info("Registered upload_router at /api/upload")

app.include_router(email_processing_router, prefix="/api/email-processing", tags=["Email Processing"])
logger.info("Registered email_processing_router at /api/email-processing")

app.include_router(ml_router, prefix="/api/ml", tags=["Machine Learning"])
logger.info("Registered ml_router at /api/ml")

app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
logger.info("Registered settings_router at /api/settings")

app.include_router(test_endpoints_router, prefix="/api/test-endpoints", tags=["Test Endpoints"], include_in_schema=False)
logger.info("Registered test_endpoints_router at /api/test-endpoints")

logger.info("All routers registered successfully")

# Setup background tasks
@app.on_event("startup")
async def startup_event():
    """Runs at application startup."""
    # Start the scheduler
    scheduler.start()
    
    # Configure scheduled tasks
    if os.environ.get("EMAIL_POLLING_ENABLED", "False").lower() == "true":
        interval_minutes = int(os.environ.get("EMAIL_POLLING_INTERVAL_MINUTES", "60"))
        
        # This is a placeholder function to get a DB session - 
        # we'll need to create a proper session in the actual task
        async def poll_emails_task():
            # Create a new DB session
            from sqlalchemy.orm import Session
            from app.db.models import Organization
            db = Session(engine)
            try:
                # Get the organization - in a real system, you'd iterate through all orgs
                # or have a setting to determine which orgs have email polling enabled
                org = db.query(Organization).first()
                if org:
                    await process_emails_and_create_invoices(
                        db=db,
                        organization=org,
                        user_id=None,  # System user
                        limit=20
                    )
            finally:
                db.close()
        
        # Add the task to the scheduler
        scheduler.add_task(
            name="poll_emails",
            func=poll_emails_task,
            interval_minutes=interval_minutes
        )

@app.on_event("shutdown")
async def shutdown_event():
    """Runs at application shutdown."""
    # Stop the scheduler
    scheduler.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 