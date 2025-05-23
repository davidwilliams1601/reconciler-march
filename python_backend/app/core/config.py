import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    # General settings
    PROJECT_NAME: str = "Invoice Reconciler API"
    API_V1_STR: str = "/api"
    
    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://frontend-new-er0k.onrender.com")
    
    # Backend URL
    BACKEND_URL: str = os.getenv("BACKEND_URL", "https://reconciler-march.onrender.com")
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./invoicereconciler.db")
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Email settings
    EMAIL_POLLING_ENABLED: bool = os.getenv("EMAIL_POLLING_ENABLED", "False").lower() == "true"
    EMAIL_POLLING_INTERVAL_MINUTES: int = int(os.getenv("EMAIL_POLLING_INTERVAL_MINUTES", "60"))
    EMAIL_ADDRESS: Optional[str] = os.getenv("EMAIL_ADDRESS")
    EMAIL_PASSWORD: Optional[str] = os.getenv("EMAIL_PASSWORD")
    EMAIL_SERVER: str = os.getenv("EMAIL_SERVER", "imap.gmail.com")
    EMAIL_FOLDER: str = os.getenv("EMAIL_FOLDER", "INBOX")
    
    # Google Vision settings
    GOOGLE_VISION_API_KEY: Optional[str] = os.getenv("GOOGLE_VISION_API_KEY")
    
    # Xero integration settings
    XERO_CLIENT_ID: Optional[str] = os.getenv("XERO_CLIENT_ID")
    XERO_CLIENT_SECRET: Optional[str] = os.getenv("XERO_CLIENT_SECRET")
    XERO_REDIRECT_URI: str = os.getenv("XERO_REDIRECT_URI", f"{FRONTEND_URL}/xero-callback")

# Instantiate settings
settings = Settings() 