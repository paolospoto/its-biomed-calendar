from functools import cache
from pathlib import Path

import pytest

from calendar_parser import extract_calendar

FIXTURES = Path(__file__).parent / "fixtures"


@cache
def _extract(name: str) -> dict:
    return extract_calendar((FIXTURES / name).read_bytes())


@pytest.fixture
def parsed():
    return _extract
