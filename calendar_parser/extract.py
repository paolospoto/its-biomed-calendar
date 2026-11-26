import calendar
import io
import re
import unicodedata
from dataclasses import dataclass, field
from itertools import takewhile
from datetime import date

import pdfplumber
from pdfplumber.utils.exceptions import PdfminerException

PARSER_VERSION = "1"

MONTHS = [
    "GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO",
    "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE",
]
WEEKDAYS = ["LUNEDI", "MARTEDI", "MERCOLEDI", "GIOVEDI", "VENERDI", "SABATO", "DOMENICA"]

DATE_RE = re.compile(r"([^\W\d_]+)\s+(\d{1,2})\s+([^\W\d_]+)\s+(\d{4})")
TIME_RE = re.compile(r"^(\d{1,2})[.:,](\d{2})\s*/\s*(\d{1,2})[.:,](\d{2})$")
LABEL_TOLERANCE = 2.5
HOURS_RE = re.compile(r"^\d+(?:[.,]\d+)?$")

HEADER_COLUMNS = {
    "DATA": "date",
    "ORARIO": "time",
    "DOCENTE": "teacher",
    "MODULO": "module",
    "ORE": "hours",
    "TEST": "note",
    "AULA": "note",
    "NOTE": "note",
}
ASSESSMENT_LABELS = {
    "TEST FINALE": "final_test",
    "TEST INTERMEDI": "intermediate_test",
    "TEST INTERMEDIO": "intermediate_test",
    "VALUTAZIONE INTERMEDIA": "intermediate_test",
    "TEST RINVIATO": "postponed_test",
}


def fold(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c)).upper()


def make_key(text: str | None) -> str | None:
    if not text:
        return None
    key = " ".join(re.sub(r"[^A-Z0-9]+", " ", fold(text)).split())
    return key or None


def clean(text: str | None) -> str:
    return " ".join((text or "").split())


def issue(code: str, severity: str, message: str) -> dict:
    return {"code": code, "severity": severity, "message": message}


@dataclass
class Cell:
    bbox: tuple
    text: str

    def spans(self, y: float) -> bool:
        return self.bbox[1] <= y <= self.bbox[3]


@dataclass
class ParsedDate:
    value: date | None
    issues: list = field(default_factory=list)


@dataclass
class DateBlock:
    top: float
    bottom: float
    label_mid: float
    date: ParsedDate


def char_inside(obj, bbox) -> bool:
    x0, top, x1, bottom = bbox
    cx = (obj["x0"] + obj["x1"]) / 2
    cy = (obj["top"] + obj["bottom"]) / 2
    return x0 <= cx <= x1 and top <= cy <= bottom


def cell_text(page, bbox) -> str:
    kept = page.filter(lambda o: o.get("object_type") != "char" or char_inside(o, bbox))
    return clean(kept.crop(bbox).extract_text())


def text_mid(page, bbox) -> float:
    chars = [c for c in page.chars if c["text"].strip() and char_inside(c, bbox)]
    return sum((c["top"] + c["bottom"]) / 2 for c in chars) / len(chars)


def date_blocks(page, cells: list) -> list:
    """Group date cells into days.

    A day label is centred on its merged cell, but the PDF can split that cell into
    several: a label takes the largest run of empty neighbours that keeps it centred.
    """
    cells = sorted(cells, key=lambda c: c.bbox[1])
    blocks = []
    for i, cell in enumerate(cells):
        if not cell.text or fold(cell.text).startswith("ORE TOTALI"):
            continue
        parsed = parse_date(cell.text) or ParsedDate(
            None, [issue("invalid_date", "error", f"Data non riconosciuta: «{cell.text}»")]
        )
        label = text_mid(page, cell.bbox)
        above = list(takewhile(lambda c: not c.text, reversed(cells[:i])))
        below = list(takewhile(lambda c: not c.text, cells[i + 1:]))
        candidates = []
        for k in range(len(above) + 1):
            for m in range(len(below) + 1):
                top = above[k - 1].bbox[1] if k else cell.bbox[1]
                bottom = below[m - 1].bbox[3] if m else cell.bbox[3]
                offset = abs((top + bottom) / 2 - label)
                centred = offset <= LABEL_TOLERANCE
                candidates.append(((not centred, -(k + m) if centred else offset), top, bottom))
        _, top, bottom = min(candidates)
        blocks.append(DateBlock(top, bottom, label, parsed))
    return blocks


def row_mid(row) -> float:
    cells = [c for c in row.cells if c is not None]
    return (min(c[1] for c in cells) + min(c[3] for c in cells)) / 2


def parse_date(text: str) -> ParsedDate | None:
    match = DATE_RE.search(text)
    if not match:
        return None
    weekday, day, month, year = match.groups()
    month_no = MONTHS.index(fold(month)) + 1 if fold(month) in MONTHS else None
    if month_no is None:
        return ParsedDate(None, [issue("invalid_date", "error", f"Data non riconosciuta: «{text}»")])
    try:
        value = date(int(year), month_no, int(day))
    except ValueError:
        return ParsedDate(None, [issue("invalid_date", "error", f"Data inesistente: «{text}»")])
    issues = []
    if fold(weekday) in WEEKDAYS and WEEKDAYS[value.weekday()] != fold(weekday):
        issues.append(issue(
            "weekday_mismatch", "warning",
            f"«{text}»: il {value.isoformat()} non è {weekday.lower()}",
        ))
    return ParsedDate(value, issues)


def parse_title(text: str) -> tuple[str, date, date] | None:
    for line in text.splitlines():
        folded = fold(line)
        pos = folded.find("CALENDARIO DIDATTICO")
        if pos < 0:
            continue
        rest = folded[pos + len("CALENDARIO DIDATTICO"):]
        months = []
        for token in re.findall(r"[A-Z]{3,}", rest):
            found = next((i for i, m in enumerate(MONTHS, 1) if m.startswith(token)), None)
            if found:
                months.append(found)
        years = [int(y) for y in re.findall(r"\d{4}", rest)]
        if not months or not years:
            return None
        end_year = years[-1]
        start_year = years[0] if len(years) > 1 else end_year - (months[0] > months[-1])
        start = date(start_year, months[0], 1)
        end = date(end_year, months[-1], calendar.monthrange(end_year, months[-1])[1])
        return clean(line), start, end
    return None


def parse_hours(text: str) -> float | None:
    return float(text.replace(",", ".")) if HOURS_RE.match(text) else None


def classify_note(note: str) -> tuple[str | None, str | None, list]:
    if not note:
        return None, None, []
    folded = " ".join(fold(note).split())
    for label, kind in ASSESSMENT_LABELS.items():
        if folded == label:
            return kind, None, []
        if folded.startswith(label + " "):
            return kind, note, []
    return None, note, [issue("unrecognized_note", "warning", f"Nota non interpretata come valutazione: «{note}»")]


def classify_event(title: str) -> str:
    folded = fold(title)
    if "USCITA" in folded:
        return "early_exit"
    if "SOSPENSIONE" in folded:
        return "suspension"
    if "VACANZ" in folded or "FESTIVITA" in folded:
        return "holiday"
    return "event"


def empty_row(kind: str, page_no: int, row_no: int) -> dict:
    return {
        "kind": kind,
        "row_date": None,
        "start_time": None,
        "end_time": None,
        "raw_module": None,
        "raw_teacher": None,
        "module_key": None,
        "teacher_key": None,
        "assessment": None,
        "event_kind": None,
        "title": None,
        "note": None,
        "issues": [],
        "page": page_no,
        "row_no": row_no,
    }


class CalendarExtractor:
    def __init__(self, pdf):
        self.pdf = pdf
        self.columns: dict[str, int] | None = None
        self.last_date: ParsedDate | None = None
        self.declared_hours: float | None = None
        self.notes: list[str] = []
        self.finished = False
        self.lessons: list[dict] = []
        self.events: list[dict] = []

    def run(self) -> None:
        for page_no, page in enumerate(self.pdf.pages, 1):
            if self.finished:
                break
            row_no = 0
            for table in page.find_tables():
                row_no = self.read_table(page, page_no, table, row_no)
                if self.finished:
                    break

    def read_table(self, page, page_no: int, table, row_no: int) -> int:
        rows = table.rows
        start = 0
        for i, row in enumerate(rows):
            labels = [fold(cell_text(page, b)) if b else "" for b in row.cells]
            if labels and labels[0] == "DATA":
                self.columns = {HEADER_COLUMNS[l]: j for j, l in enumerate(labels) if l in HEADER_COLUMNS}
                start = i + 1
                break
        if self.columns is None or len(rows[0].cells) <= max(self.columns.values()):
            return row_no + len(rows)

        body = rows[start:]
        cols = {
            name: [Cell(r.cells[j], cell_text(page, r.cells[j])) for r in body if r.cells[j] is not None]
            for name, j in self.columns.items()
        }
        blocks = date_blocks(page, cols["date"])
        first_block_top = min((b.top for b in blocks), default=None)
        table_lessons = []

        def text_at(name: str, y: float) -> str:
            return next((c.text for c in cols.get(name, []) if c.spans(y)), "")

        def date_for(y: float) -> ParsedDate | None:
            found = next((b for b in blocks if b.top <= y <= b.bottom), None)
            if found:
                return found.date
            if first_block_top is None or y < first_block_top:
                return self.last_date
            return None

        for offset, row in enumerate(body, start + 1):
            y = row_mid(row)
            date_text = text_at("date", y)
            if fold(date_text).startswith("ORE TOTALI"):
                self.read_totals(page, row)
                break

            time_text = text_at("time", y)
            teacher = text_at("teacher", y)
            if TIME_RE.match(time_text) or teacher:
                lesson = self.read_lesson(page_no, row_no + offset, y, date_for(y), time_text, teacher, text_at)
                table_lessons.append((y, lesson))
                continue

            skip = (self.columns["date"], self.columns.get("hours"))
            content = [Cell(b, cell_text(page, b)) for j, b in enumerate(row.cells) if b is not None and j not in skip]
            content = [c for c in content if c.text]
            if not content:
                continue
            title = clean(" ".join(c.text for c in content))
            span = max((c.bbox for c in content), key=lambda b: b[3] - b[1])
            dated = [b.date for b in blocks if span[1] <= b.label_mid <= span[3]] or [date_for(y)]
            for parsed in dated:
                self.events.append(self.make_event(page_no, row_no + offset, parsed, title))

        if blocks:
            self.last_date = max(blocks, key=lambda b: b.top).date
        self.check_row_hours(cols.get("hours", []), table_lessons)
        return row_no + len(rows)

    def read_totals(self, page, row) -> None:
        self.finished = True
        hours_idx = self.columns.get("hours")
        for j, bbox in enumerate(row.cells):
            if bbox is None or j == self.columns["date"]:
                continue
            text = cell_text(page, bbox)
            if j == hours_idx and parse_hours(text) is not None:
                self.declared_hours = parse_hours(text)
            elif text:
                self.notes.append(text)

    def read_lesson(self, page_no, row_no, y, parsed, time_text, teacher, text_at) -> dict:
        row = empty_row("lesson", page_no, row_no)
        issues = row["issues"]
        self.apply_date(row, parsed)

        match = TIME_RE.match(time_text)
        if match:
            h1, m1, h2, m2 = map(int, match.groups())
            if h1 * 60 + m1 < h2 * 60 + m2 and h2 < 24 and m1 < 60 and m2 < 60:
                row["start_time"] = f"{h1:02d}:{m1:02d}"
                row["end_time"] = f"{h2:02d}:{m2:02d}"
            else:
                issues.append(issue("invalid_time", "error", f"Orario non valido: «{time_text}»"))
        else:
            issues.append(issue("invalid_time", "error", f"Orario non riconosciuto: «{time_text}»"))

        module = text_at("module", y)
        row["raw_module"] = module or None
        row["module_key"] = make_key(module)
        if not module:
            issues.append(issue("missing_module", "error", "Modulo mancante"))
        row["raw_teacher"] = teacher or None
        row["teacher_key"] = make_key(teacher)
        if not teacher:
            issues.append(issue("missing_teacher", "warning", "Docente mancante"))

        assessment, note, note_issues = classify_note(text_at("note", y))
        row["assessment"] = assessment
        row["note"] = note
        issues.extend(note_issues)
        self.lessons.append(row)
        return row

    def make_event(self, page_no, row_no, parsed, title) -> dict:
        row = empty_row("event", page_no, row_no)
        self.apply_date(row, parsed)
        row["title"] = title
        row["event_kind"] = classify_event(title)
        return row

    @staticmethod
    def apply_date(row: dict, parsed: ParsedDate | None) -> None:
        if parsed is None:
            row["issues"].append(issue("missing_date", "error", "Nessuna data associata alla riga"))
            return
        row["row_date"] = parsed.value.isoformat() if parsed.value else None
        row["issues"].extend(parsed.issues)

    @staticmethod
    def check_row_hours(hours_cells: list[Cell], table_lessons: list) -> None:
        for cell in hours_cells:
            declared = parse_hours(cell.text)
            if declared is None:
                continue
            covered = [lesson for y, lesson in table_lessons if cell.spans(y)]
            if not covered or any(lesson["start_time"] is None for lesson in covered):
                continue
            computed = sum(lesson_hours(lesson) for lesson in covered)
            if abs(computed - declared) > 1e-6:
                for lesson in covered:
                    lesson["issues"].append(issue(
                        "hours_mismatch", "warning",
                        f"Colonna ORE: {format_hours(declared)}, dall'orario: {format_hours(computed)}",
                    ))


def lesson_hours(row: dict) -> float:
    if not row["start_time"] or not row["end_time"]:
        return 0.0
    h1, m1 = map(int, row["start_time"].split(":"))
    h2, m2 = map(int, row["end_time"].split(":"))
    return (h2 * 60 + m2 - h1 * 60 - m1) / 60


def format_hours(value: float) -> str:
    return f"{value:g}".replace(".", ",")


def check_period(rows: list[dict], start: date, end: date) -> None:
    for row in rows:
        if row["row_date"] and not start.isoformat() <= row["row_date"] <= end.isoformat():
            row["issues"].append(issue(
                "date_out_of_period", "error",
                f"Il {row['row_date']} è fuori dal periodo del calendario "
                f"({start.isoformat()} – {end.isoformat()})",
            ))


def check_overlaps(lessons: list[dict]) -> None:
    timed = sorted(
        (r for r in lessons if r["row_date"] and r["start_time"] and r["end_time"]),
        key=lambda r: (r["row_date"], r["start_time"]),
    )
    for prev, cur in zip(timed, timed[1:]):
        if prev["row_date"] == cur["row_date"] and cur["start_time"] < prev["end_time"]:
            for row, other in ((prev, cur), (cur, prev)):
                row["issues"].append(issue(
                    "overlap", "error",
                    f"Si sovrappone alla lezione {other['start_time']}–{other['end_time']} dello stesso giorno",
                ))


def extract_calendar(pdf_bytes: bytes) -> dict:
    try:
        pdf = pdfplumber.open(io.BytesIO(pdf_bytes))
    except PdfminerException as exc:
        raise ValueError("the file is not a valid PDF") from exc

    with pdf:
        title = parse_title(pdf.pages[0].extract_text() or "") if pdf.pages else None
        extractor = CalendarExtractor(pdf)
        extractor.run()
        page_count = len(pdf.pages)

    if extractor.columns is None:
        raise ValueError("no calendar table found (expected a header row starting with DATA)")

    lessons, events = extractor.lessons, extractor.events
    file_issues = []
    if title:
        title_text, period_start, period_end = title
    else:
        dates = sorted(r["row_date"] for r in lessons + events if r["row_date"])
        if not dates:
            raise ValueError("no dated rows found in the calendar")
        first, last = date.fromisoformat(dates[0]), date.fromisoformat(dates[-1])
        title_text = None
        period_start = first.replace(day=1)
        period_end = last.replace(day=calendar.monthrange(last.year, last.month)[1])
        file_issues.append(issue("missing_title", "warning", "Titolo «CALENDARIO DIDATTICO» non trovato: periodo dedotto dalle date"))

    check_period(lessons + events, period_start, period_end)
    check_overlaps(lessons)

    computed = sum(lesson_hours(r) for r in lessons)
    declared = extractor.declared_hours
    if declared is None:
        file_issues.append(issue("missing_declared_hours", "warning", "Riga «ORE TOTALI» non trovata"))
    elif abs(computed - declared) > 1e-6:
        file_issues.append(issue(
            "total_hours_mismatch", "warning",
            f"Ore totali dichiarate {format_hours(declared)}, calcolate {format_hours(computed)}",
        ))

    rows = sorted(
        lessons + events,
        key=lambda r: (r["row_date"] or "9999-12-31", r["start_time"] or "", r["page"], r["row_no"]),
    )
    severities = [i["severity"] for r in rows for i in r["issues"]]
    return {
        "file": {
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "declared_hours": declared,
            "report": {
                "parser_version": PARSER_VERSION,
                "title": title_text,
                "pages": page_count,
                "lessons": len(lessons),
                "events": len(events),
                "computed_hours": computed,
                "declared_hours": declared,
                "hours_match": declared is not None and abs(computed - declared) <= 1e-6,
                "errors": severities.count("error"),
                "warnings": severities.count("warning"),
                "notes": extractor.notes,
                "issues": file_issues,
            },
        },
        "rows": rows,
    }
