from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .db import database
from . import models
from .routers import auth, posts, users # Assuming you create users.py router
from .core.config import settings
from pathlib import Path

from fastapi.responses import FileResponse # Added for serving index.html

models.Base.metadata.create_all(bind=database.engine) # Create database tables

app = FastAPI(title=settings.PROJECT_NAME)

# CORS (Cross-Origin Resource Sharing)
# Adjust origins as needed for your frontend development and production URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"], # Add backend origin if serving frontend from same port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(users.router)

# Serve uploaded images statically
# The path "/uploads/images" will serve files from the "backend/app/uploads/images" directory
# This should come BEFORE the SPA static files mount if UPLOADS_DIR is outside frontend_build_dir
uploads_dir = Path(settings.UPLOADS_DIR)
if not uploads_dir.exists():
    uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/images", StaticFiles(directory=uploads_dir), name="uploaded_images")

# --- Serve Frontend Static Files ---
frontend_build_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "build"

# Mount static assets (js, css, media) from the build directory
# This needs to be specific enough not to catch the root path for index.html yet
app.mount("/static", StaticFiles(directory=frontend_build_dir / "static"), name="static_frontend_assets")

@app.get("/")
async def serve_spa_root():
    index_path = frontend_build_dir / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found. Run 'npm run build' in the frontend directory.")
    return FileResponse(index_path)

# Catch-all for SPA routing - must be LAST
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_path = frontend_build_dir / "index.html"
    # Check if the requested path might be a direct file in the build root (e.g., manifest.json, favicon.ico)
    potential_file = frontend_build_dir / full_path
    if potential_file.exists() and potential_file.is_file():
        return FileResponse(potential_file)
    # Otherwise, serve index.html for SPA routing
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend index.html not found.")
    return FileResponse(index_path)