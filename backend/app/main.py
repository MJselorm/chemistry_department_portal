from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import admin, announcements, auth, users, directory, resources, events, notifications

settings = get_settings()
app = FastAPI(
    title="Firebase + Supabase Auth API",
    version="1.0.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=()"
    if request.url.path != "/health":
        response.headers["Cache-Control"] = "no-store"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(announcements.router)
app.include_router(directory.router)
app.include_router(resources.router)
app.include_router(events.router)
app.include_router(notifications.router)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
