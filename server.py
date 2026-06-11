"""Rohan Kapoor — static site + inquiry API for Cloud Run / local dev."""

from __future__ import annotations

import json
import os
import smtplib
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from pydantic import BaseModel, EmailStr, Field

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
INQUIRIES_FILE = DATA_DIR / "inquiries.json"

app = FastAPI(title="Rohan Kapoor Photography", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def protect_private_paths(request: Request, call_next):
    if request.url.path.startswith("/data") or request.url.path in {"/server.py", "/requirements.txt"}:
        return JSONResponse({"detail": "Not found"}, status_code=404)
    return await call_next(request)


class InquiryPayload(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    date: str = Field(min_length=4, max_length=32)
    venue: str = Field(min_length=2, max_length=200)
    package: str = Field(default="", max_length=40)
    message: str = Field(default="", max_length=2000)


def _load_inquiries() -> list[dict[str, Any]]:
    if not INQUIRIES_FILE.exists():
        return []
    try:
        return json.loads(INQUIRIES_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def _save_inquiry(record: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    rows = _load_inquiries()
    rows.append(record)
    INQUIRIES_FILE.write_text(json.dumps(rows, indent=2), encoding="utf-8")


def _send_notification(record: dict[str, Any]) -> bool:
    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASS", "").strip()
    notify = os.getenv("NOTIFY_EMAIL", "hello@rohankapoor.photo").strip()
    port = int(os.getenv("SMTP_PORT", "587"))

    if not host or not user or not password:
        return False

    body = (
        f"New wedding inquiry\n\n"
        f"Names: {record['name']}\n"
        f"Email: {record['email']}\n"
        f"Date: {record['date']}\n"
        f"Venue: {record['venue']}\n"
        f"Package: {record.get('package') or '—'}\n\n"
        f"Message:\n{record.get('message') or '—'}\n"
    )

    msg = EmailMessage()
    msg["Subject"] = f"Wedding inquiry — {record['name']}"
    msg["From"] = user
    msg["To"] = notify
    msg["Reply-To"] = record["email"]
    msg.set_content(body)

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)
    return True


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> FileResponse:
    return FileResponse(ROOT / "images" / "B2-xs.webp", media_type="image/webp")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "rohan-kapoor"}


@app.post("/api/inquiry")
def submit_inquiry(payload: InquiryPayload) -> dict[str, Any]:
    record = {
        "id": str(uuid.uuid4()),
        "received_at": datetime.now(timezone.utc).isoformat(),
        "name": payload.name.strip(),
        "email": str(payload.email).strip(),
        "date": payload.date.strip(),
        "venue": payload.venue.strip(),
        "package": payload.package.strip(),
        "message": payload.message.strip(),
    }

    try:
        _save_inquiry(record)
        emailed = _send_notification(record)
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Could not save inquiry") from exc

    return {
        "ok": True,
        "id": record["id"],
        "emailed": emailed,
        "message": "Thank you — Rohan will respond within 48 hours.",
    }


app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")