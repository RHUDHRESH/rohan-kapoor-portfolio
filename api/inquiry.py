"""Vercel serverless inquiry handler (optional deploy target)."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler


def _send_resend(record: dict) -> bool:
    key = os.getenv("RESEND_API_KEY", "").strip()
    notify = os.getenv("NOTIFY_EMAIL", "hello@rohankapoor.photo").strip()
    if not key:
        return False

    body = (
        f"<p><strong>New wedding inquiry</strong></p>"
        f"<p>Names: {record['name']}<br>"
        f"Email: {record['email']}<br>"
        f"Date: {record['date']}<br>"
        f"Venue: {record['venue']}<br>"
        f"Package: {record.get('package') or '—'}</p>"
        f"<p>{record.get('message') or '—'}</p>"
    )

    payload = json.dumps({
        "from": "Rohan Kapoor <onboarding@resend.dev>",
        "to": [notify],
        "reply_to": record["email"],
        "subject": f"Wedding inquiry — {record['name']}",
        "html": body,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as res:
        return 200 <= res.status < 300


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"detail": "Invalid JSON"})
            return

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        date = (data.get("date") or "").strip()
        venue = (data.get("venue") or "").strip()
        if len(name) < 2 or "@" not in email or len(venue) < 2 or not date:
            self._json(422, {"detail": "Missing required fields"})
            return

        record = {
            "received_at": datetime.now(timezone.utc).isoformat(),
            "name": name,
            "email": email,
            "date": date,
            "venue": venue,
            "package": (data.get("package") or "").strip(),
            "message": (data.get("message") or "").strip(),
        }

        try:
            emailed = _send_resend(record)
        except (urllib.error.URLError, TimeoutError):
            emailed = False

        self._json(200, {
            "ok": True,
            "emailed": emailed,
            "message": "Thank you — Rohan will respond within 48 hours.",
        })

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)