from typing import Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
import httpx
import os
import logging
from fastapi.encoders import jsonable_encoder

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health-status")
async def check_endpoints_health():
    """
    Check the health of all API endpoints.
    This is for debugging purposes and should not be publicly accessible in production.
    """
    base_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    
    # Endpoints to check (add all important endpoints)
    endpoints = [
        "/health",
        "/api/auth/me",  
        "/api/dashboard/stats",
        "/api/xero/status",
        "/api/xero/debug",
        "/api/settings",
        "/api/invoices",
        "/api/cost-centers",
        "/api/email-processing/settings"
    ]
    
    results = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for endpoint in endpoints:
            url = f"{base_url}{endpoint}"
            try:
                response = await client.get(url)
                results.append({
                    "endpoint": endpoint,
                    "status_code": response.status_code,
                    "status": "OK" if response.status_code < 400 else "ERROR",
                    "response_size": len(response.content) if response.content else 0
                })
            except Exception as e:
                results.append({
                    "endpoint": endpoint,
                    "status_code": None,
                    "status": "ERROR",
                    "error": str(e)
                })
    
    missing_endpoints = [r for r in results if r["status"] == "ERROR"]
    working_endpoints = [r for r in results if r["status"] == "OK"]
    
    return {
        "all_endpoints_working": len(missing_endpoints) == 0,
        "total_endpoints": len(endpoints),
        "working_endpoints_count": len(working_endpoints),
        "missing_endpoints_count": len(missing_endpoints),
        "working_endpoints": working_endpoints,
        "missing_endpoints": missing_endpoints,
        "base_url": base_url
    } 