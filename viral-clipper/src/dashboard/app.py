"""FastAPI application factory for the Aperture agency landing page."""

from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

DASHBOARD_DIR = Path(__file__).parent
TEMPLATES_DIR = DASHBOARD_DIR / "templates"
STATIC_DIR = DASHBOARD_DIR / "static"

# In-memory contact submissions (no DB dependency)
contact_submissions: list[dict] = []


def create_app() -> FastAPI:
    app = FastAPI(title="Aperture", docs_url=None, redoc_url=None)

    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

    @app.get("/", response_class=HTMLResponse)
    async def landing(request: Request):
        return templates.TemplateResponse(request, "landing.html")

    @app.get("/terms", response_class=HTMLResponse)
    async def terms(request: Request):
        return templates.TemplateResponse(request, "terms.html")

    @app.get("/privacy", response_class=HTMLResponse)
    async def privacy(request: Request):
        return templates.TemplateResponse(request, "privacy.html")

    @app.post("/contact", response_class=HTMLResponse)
    async def contact(
        request: Request,
        name: str = Form(...),
        email: str = Form(...),
        artist: str = Form(""),
        message: str = Form(""),
    ):
        contact_submissions.append(
            {"name": name, "email": email, "artist": artist, "message": message}
        )
        return templates.TemplateResponse(
            request, "landing.html", context={"form_success": True}
        )

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app
