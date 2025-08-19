from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingest, search, insights, podcast
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Adobe Hackathon Backend")

# --- 1. Allowed Origins for local dev ---
origins = [
    "http://localhost:3000",  # CRA dev
    "http://localhost:5173",  # Vite dev
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://localhost:8080",  # when running Docker
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. Static directories ---
PODCAST_DIR = "store/podcasts"
os.makedirs(PODCAST_DIR, exist_ok=True)
app.mount("/podcasts", StaticFiles(directory=PODCAST_DIR), name="podcasts")

# ✅ Serve React build from frontend_dist
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "../frontend_dist")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

# --- 3. Routers ---
app.include_router(ingest.router, prefix="/ingest", tags=["Ingest"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])
app.include_router(podcast.router, prefix="/podcast", tags=["Podcast"])

# --- 4. Root API route (keeps API alive check) ---
@app.get("/api/health")
def health():
    return {"message": "Backend is running 🚀"}

# --- 5. Catch-all for React Router (important if you use client-side routing) ---
if os.path.exists(FRONTEND_DIR):
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        return FileResponse(index_file)

@app.get("/config/adobe-key")
def get_adobe_key():
    value = os.environ.get("ADOBE_EMBED_API_KEY")
    print(">>> Adobe Key being served:", value)   # Debug
    return {"adobe_embed_api_key": value}
