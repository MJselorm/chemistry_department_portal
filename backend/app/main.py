from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import admin, announcements, auth, users, directory

settings = get_settings()
app = FastAPI(title="Firebase + Supabase Auth API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(announcements.router)
app.include_router(directory.router)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
