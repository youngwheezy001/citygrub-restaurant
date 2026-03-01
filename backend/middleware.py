from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
# import redis.asyncio as redis  # <--- Commented out to prevent crash
import json

# Redis connection (Commented out for now)
# redis_client = redis.Redis(host='localhost', port=6379, db=0)

class TenantGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Skip guard for Docs and Health checks
        if request.url.path.startswith("/health") or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
            return await call_next(request)

        # 2. TEMPORARY BYPASS: Assume Tenant is "Active"
        # Since Redis isn't running, we skip the check so you can test M-Pesa.
        
        # --- OLD CODE (Preserve for later) ---
        # tenant_data_raw = await redis_client.get("tenant_config")
        # if not tenant_data_raw: raise HTTPException...
        # status = json.loads(tenant_data_raw).get("tenant_status")
        # if status == "overdue": raise HTTPException...
        # -------------------------------------

        # 3. Proceed with the request
        response = await call_next(request)
        return response