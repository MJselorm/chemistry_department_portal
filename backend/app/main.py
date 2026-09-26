from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import admin, announcements, auth, users, directory

settings = get_settings()
is_production = settings.app_env == "production"
app = FastAPI(
    title="Chemistry Hub API",
    version="1.0.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=()"
    if request.headers.get("authorization") or request.url.path.startswith(
        ("/auth", "/users", "/admin", "/announcements", "/api/")
    ):
        response.headers["Cache-Control"] = "no-store"
    if is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(announcements.router)
app.include_router(directory.router)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
