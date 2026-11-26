import hmac
import json
import os
from http.server import BaseHTTPRequestHandler

from calendar_parser import extract_calendar

MAX_BODY = 4 * 1024 * 1024


class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        secret = os.environ.get("EXTRACT_FUNCTION_SECRET", "")
        given = self.headers.get("x-extract-secret", "")
        if not secret or not hmac.compare_digest(secret, given):
            return self._send(401, {"error": "unauthorized"})

        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BODY:
            return self._send(400, {"error": "invalid body size"})

        try:
            result = extract_calendar(self.rfile.read(length))
        except NotImplementedError:
            return self._send(501, {"error": "not implemented"})
        except Exception as exc:
            return self._send(422, {"error": str(exc)})
        self._send(200, result)
