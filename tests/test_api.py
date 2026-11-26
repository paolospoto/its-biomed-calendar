import importlib.util
import json
import threading
import urllib.error
import urllib.request
from http.server import HTTPServer
from pathlib import Path

import pytest

from conftest import FIXTURES

SECRET = "test-secret"


@pytest.fixture
def server(monkeypatch):
    monkeypatch.setenv("EXTRACT_FUNCTION_SECRET", SECRET)
    path = Path(__file__).parent.parent / "api" / "extract_calendar.py"
    spec = importlib.util.spec_from_file_location("extract_calendar_api", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    httpd = HTTPServer(("127.0.0.1", 0), module.handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{httpd.server_port}"
    httpd.shutdown()
    httpd.server_close()


def post(url: str, body: bytes, secret: str | None = SECRET) -> tuple[int, dict]:
    headers = {"content-type": "application/pdf"}
    if secret is not None:
        headers["x-extract-secret"] = secret
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as err:
        return err.code, json.load(err)


def test_extracts_a_real_calendar(server):
    status, payload = post(server, (FIXTURES / "11 NOVEMBRE.pdf").read_bytes())
    assert status == 200
    assert payload["file"]["period_start"] == "2026-11-01"
    assert payload["file"]["report"]["lessons"] == 39


def test_rejects_missing_or_wrong_secret(server):
    body = (FIXTURES / "11 NOVEMBRE.pdf").read_bytes()
    assert post(server, body, secret=None)[0] == 401
    assert post(server, body, secret="wrong")[0] == 401


def test_rejects_a_pdf_that_is_not_a_calendar(server):
    status, payload = post(server, (FIXTURES / "programma Biomed 2025-27.pdf").read_bytes())
    assert status == 422
    assert "no calendar table" in payload["error"]
