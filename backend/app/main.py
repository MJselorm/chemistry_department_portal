import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .config import get_settings
from .database import engine
from .routers import admin, announcements, auth, users, directory, resources, events, notifications, privacy, mentorship

settings = get_settings()
logger = logging.getLogger(__name__)
app = FastAPI(title="Firebase + Supabase Auth API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(announcements.router)
app.include_router(directory.router)
app.include_router(resources.router)
app.include_router(events.router)
app.include_router(notifications.router)
app.include_router(privacy.router)
app.include_router(privacy.admin_router)
app.include_router(privacy.api_router)
app.include_router(mentorship.router)


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    logger.exception("Unhandled API error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


@app.get("/health", tags=["system"])
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "ok"}
    except Exception:
        logger.exception("Database health check failed")
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "error"},
        )
