"""Build lib/preview/data.json for the static UI preview from the real calendar fixtures.

Modules, semesters and planned hours are transcribed from the scanned
"Quadro orario" (tests/fixtures/programma Biomed 2025-27.pdf).
"""

import hashlib
import json
import re
from pathlib import Path

from calendar_parser import extract_calendar
from calendar_parser.extract import make_key

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "tests" / "fixtures"
OUT = ROOT / "lib" / "preview" / "data.json"

REFERENCE_DATE = "2026-11-20"
REFERENCE_TIME = "14:00"
DRAFT_FILE = "11 NOVEMBRE.pdf"

COURSE = {
    "id": 1,
    "code": "BIOMED 4.0",
    "name": "Informatico biomedicale tecnico superiore per la digitalizzazione e l'applicazione di tecnologie abilitanti nelle biotecnologie e nel biomedicale",
    "edition": "2025–2027",
    "venue": "Via Principe di Belmonte 105, Palermo",
    "timezone": "Europe/Rome",
}

MODULES = [
    ("Orientamento al ruolo", "theory", [1, 3], 15),
    ("Comunicazione scritta, pubblica ed efficace", "theory", [1], 10),
    ("Competenze per la vita (LifeComp)", "theory", [1], 10),
    ("Inglese tecnico", "theory", [1, 3], 110),
    ("Elementi di biologia umana", "theory", [1], 25),
    ("Elementi di matematica e fisica e statistica", "theory", [1, 2], 30),
    ("Fondamenti di networking", "theory", [2], 25),
    ("Economia di base e creazione di impresa per l'industria 4.0", "theory", [1, 3], 25),
    ("Principi giuridici e responsabilità professionale", "theory", [1, 2], 30),
    ("Normativa di riferimento: gestione della qualità - il software come dispositivo medico", "theory", [1], 20),
    ("Sicurezza e prevenzione degli infortuni sui luoghi di lavoro", "theory", [1, 2], 25),
    ("Proprietà industriale e processo di innovazione aperta", "theory", [3], 25),
    ("Organizzazione sanitaria e modelli di percorsi intra ed extra ospedalieri", "theory", [2, 3], 40),
    ("Tassonomia delle apparecchiature biomediche", "theory", [2, 3], 35),
    ("Project management per l'industria 4.0 e design thinking", "theory", [1, 2], 15),
    ("Pari opportunità e contrasto ad ogni forma di discriminazione", "theory", [1], 20),
    ("Sostenibilità ambientale e sociale nel settore biomedicale", "theory", [1], 30),
    ("Informatica ECDL", "lab", [1, 2], 40),
    ("Project management per l'industria 4.0 e design thinking (laboratorio)", "lab", [1, 2], 15),
    ("Primo soccorso", "lab", [1], 20),
    ("Fondamenti di informatica: programmazione ad oggetti", "lab", [1, 2], 30),
    ("Fondamenti di informatica: programmazione back end", "lab", [1, 2], 20),
    ("Fondamenti di informatica: programmazione front end", "lab", [1, 2], 30),
    ("Fondamenti di informatica: ingegneria del software", "lab", [1, 2], 20),
    ("Fondamenti di informatica: analisi dei requisiti di un software medicale", "lab", [1, 2], 20),
    ("Complementi di informatica medica: architettura dei calcolatori", "lab", [2], 30),
    ("Complementi di informatica medica: reti di calcolatori e networking", "lab", [2], 30),
    ("Complementi di informatica medica: sistemi operativi e laboratorio SW", "lab", [2], 30),
    ("Complementi di informatica medica: basi di dati", "lab", [2], 30),
    ("Privacy e sicurezza dei dati", "lab", [2, 3], 30),
    ("Elementi di informatica medica I: cybersecurity per dispositivi medici nelle reti IT medicali", "lab", [2, 3], 40),
    ("Elementi di informatica medica I: dispositivi medici software, app e mHealth - 1", "lab", [2, 3], 40),
    ("Elementi di informatica medica I: standard: DICOM, HL7 e iniziativa IHE", "lab", [2, 3], 40),
    ("Elementi di informatica medica II: modelli di cartella clinica, infermieristica e socio-sanitaria elettronica", "lab", [3], 40),
    ("Elementi di informatica medica II: dispositivi medici software, app e mHealth - 2", "lab", [3], 40),
    ("Elementi di informatica medica II: fondamenti di IoHT – cloud-Azure e AWS", "lab", [3], 40),
    ("Elementi di realtà aumentata, realtà virtuale e realtà mista", "lab", [3], 35),
    ("Fondamenti di intelligenza artificiale", "lab", [3], 35),
    ("Project work", "lab", [3], 55),
    ("Stage aziendali/tirocini", "internship", [4], 800),
]

# Spelling variants an admin would link by hand; ambiguous names (EUROLINGUE, ASP SICUREZZA) stay unlinked.
MODULE_ALIASES = {
    "ELEMENTI DI MATEMATICA FISICA E STATISTICA": "Elementi di matematica e fisica e statistica",
    "ECONOMIA DI BASE E CREAZIONE D IMPRESA PER L INDUSTRIA 4 0": "Economia di base e creazione di impresa per l'industria 4.0",
    "PRIMO SOCCORSO ASP SICUREZZA": "Primo soccorso",
}
TEACHER_ALIASES = {
    "TROIA GIAMMARCO": "TROIA GIANMARCO",
    "RICCA CARMELO": "RICCA CARMELO CRISTIAN",
}


def teacher_name(raw: str) -> str:
    name = re.sub(r"([AEIOU])'(?=\s|$)", lambda m: {"A": "À", "E": "È", "I": "Ì", "O": "Ò", "U": "Ù"}[m[1]], raw.strip())
    return name.title()


def minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def main() -> None:
    modules = [
        {
            "id": i + 1,
            "course_id": COURSE["id"],
            "name": name,
            "area": area,
            "semesters": semesters,
            "planned_hours": hours,
            "in_curriculum": True,
            "sort_order": i + 1,
        }
        for i, (name, area, semesters, hours) in enumerate(MODULES)
    ]
    module_by_key = {make_key(m["name"]): m["id"] for m in modules}
    by_name = {m["name"]: m["id"] for m in modules}
    module_by_key.update({k: by_name[v] for k, v in MODULE_ALIASES.items()})

    files = sorted(
        (p for p in FIXTURES.glob("*.pdf") if not p.name.startswith("programma")),
        key=lambda p: extract_calendar(p.read_bytes())["file"]["period_start"],
    )

    teacher_raw: dict[str, dict[str, int]] = {}
    extracted = []
    for path in files:
        data = path.read_bytes()
        result = extract_calendar(data)
        extracted.append((path, hashlib.sha256(data).hexdigest(), result))
        for row in result["rows"]:
            key = row["teacher_key"]
            if key:
                key = TEACHER_ALIASES.get(key, key)
                counts = teacher_raw.setdefault(key, {})
                counts[row["raw_teacher"]] = counts.get(row["raw_teacher"], 0) + 1

    teachers = []
    teacher_by_key = {}
    for i, key in enumerate(sorted(teacher_raw)):
        raw = max(teacher_raw[key].items(), key=lambda kv: kv[1])[0]
        teachers.append({"id": i + 1, "full_name": teacher_name(raw)})
        teacher_by_key[key] = i + 1
    teacher_by_key.update({k: teacher_by_key[v] for k, v in TEACHER_ALIASES.items()})

    batches, lessons, events, draft_rows, skipped = [], [], [], [], []
    for batch_id, (path, sha256, result) in enumerate(extracted, start=1):
        file = result["file"]
        batches.append({
            "id": batch_id,
            "course_id": COURSE["id"],
            "file_name": path.name,
            "storage_path": f"{file['period_start'][:7]}/{sha256}.pdf",
            "sha256": sha256,
            "period_start": file["period_start"],
            "period_end": file["period_end"],
            "declared_hours": file["declared_hours"],
            "status": "applied",
            "report": file["report"],
        })
        for row in result["rows"]:
            module_id = module_by_key.get(row["module_key"])
            teacher_id = teacher_by_key.get(row["teacher_key"]) if row["teacher_key"] else None
            if path.name == DRAFT_FILE:
                draft_rows.append({**row, "module_id": module_id, "teacher_id": teacher_id})
            if any(i["severity"] == "error" for i in row["issues"]):
                skipped.append({"file": path.name, "reason": "parser error", "row": row["row_no"], "page": row["page"]})
                continue
            if row["kind"] == "event":
                events.append({
                    "course_id": COURSE["id"],
                    "event_date": row["row_date"],
                    "kind": row["event_kind"],
                    "title": row["title"],
                    "import_batch_id": batch_id,
                    "edited_at": None,
                    "edited_by": None,
                })
            elif module_id is None:
                skipped.append({"file": path.name, "reason": "unlinked module", "raw_module": row["raw_module"]})
            else:
                lessons.append({
                    "course_id": COURSE["id"],
                    "module_id": module_id,
                    "teacher_id": teacher_id,
                    "lesson_date": row["row_date"],
                    "start_time": row["start_time"],
                    "end_time": row["end_time"],
                    "assessment": row["assessment"],
                    "note": row["note"],
                    "hours": (minutes(row["end_time"]) - minutes(row["start_time"])) / 60,
                    "import_batch_id": batch_id,
                    "edited_at": None,
                    "edited_by": None,
                })

    lessons.sort(key=lambda l: (l["lesson_date"], l["start_time"]))
    for i, lesson in enumerate(lessons, start=1):
        lesson["id"] = i
    events.sort(key=lambda e: e["event_date"])
    for i, event in enumerate(events, start=1):
        event["id"] = i

    draft_source = next(b for b in batches if b["file_name"] == DRAFT_FILE)
    draft = {**draft_source, "id": len(batches) + 1, "status": "draft"}
    for i, row in enumerate(draft_rows, start=1):
        row["id"] = i
        row["batch_id"] = draft["id"]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "reference": {"date": REFERENCE_DATE, "time": REFERENCE_TIME},
        "course": COURSE,
        "modules": modules,
        "teachers": teachers,
        "lessons": lessons,
        "calendar_events": events,
        "import_batches": batches + [draft],
        "import_rows": draft_rows,
        "skipped": skipped,
    }, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"{len(lessons)} lessons, {len(events)} events, {len(skipped)} skipped rows -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
