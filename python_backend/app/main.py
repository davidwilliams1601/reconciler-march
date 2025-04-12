from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from dotenv import load_dotenv

# Import routers
from app.api.auth import router as auth_router
from app.api.invoices import router as invoices_router
from app.api.dashboard import router as dashboard_router
from app.api.cost_centers import router as cost_centers_router
from app.api.upload import router as upload_router
from app.api.xero import router as xero_router
from app.api.email_processing import router as email_processing_router
from app.api.email_processing import process_emails_and_create_invoices
from app.api.ml import router as ml_router

# Import database
from app.db.database import engine, Base, get_db

# Import task scheduler
from app.core.scheduler import scheduler

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Invoice Reconciler API",
    description="API for invoice processing, OCR, and Xero reconciliation",
    version="0.1.0"
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
    return {
        "status": "healthy",
        "version": app.version
    }

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(invoices_router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(cost_centers_router, prefix="/api/cost-centers", tags=["Cost Centers"])
app.include_router(upload_router, prefix="/api/upload", tags=["File Upload"])
app.include_router(xero_router, prefix="/api/xero", tags=["Xero Integration"])
app.include_router(email_processing_router, prefix="/api/email-processing", tags=["Email Processing"])
app.include_router(ml_router, prefix="/api/ml", tags=["Machine Learning"])

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