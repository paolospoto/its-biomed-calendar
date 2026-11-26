import pytest

from calendar_parser import extract_calendar
from conftest import FIXTURES

NOV_DEC_2025 = "0 dal 25 NOVEMBRE_DICEMBRE 2025.pdf"
JAN = "1 GENNAIO 2026 INFORMATICO-3.pdf"
APR = "4 APRILE INFORMATICO.pdf"
MAY = "5 MAGGIO 26 INFORMATICO-3.pdf"
JUN = "6 GIUGNO 26 INFORMATICO.pdf"
JUL = "7. LUGLIO 2026.pdf"
SEP = "9 SETTEMBREpdf.pdf"
OCT = "10 OTTOBRE.pdf"
NOV = "11 NOVEMBRE.pdf"

MONTHLY = {
    NOV_DEC_2025: ("2025-11-01", "2025-12-31", 57, 0, 57, 57),
    JAN: ("2026-01-01", "2026-01-31", 90, 0, 90, 90),
    "2 FEBBRAIO 2026 INFORMAT.pdf": ("2026-02-01", "2026-02-28", 40, 0, 100, 100),
    "3 MARZO INFORMATICO VERTICALE.pdf": ("2026-03-01", "2026-03-31", 44, 0, 110, 110),
    APR: ("2026-04-01", "2026-04-30", 38, 3, 95, 95),
    MAY: ("2026-05-01", "2026-05-31", 40, 0, 98, 98),
    JUN: ("2026-06-01", "2026-06-30", 34, 1, 92, 92),
    JUL: ("2026-07-01", "2026-07-31", 38, 1, 104, 105),
    SEP: ("2026-09-01", "2026-09-30", 36, 4, 92, 92),
    OCT: ("2026-10-01", "2026-10-31", 42, 1, 108, 108),
    NOV: ("2026-11-01", "2026-11-30", 39, 0, 100, 100),
}

EXPECTED_ISSUES = {
    NOV_DEC_2025: [
        ("2023-12-22", "13:00", "date_out_of_period"),
        ("2023-12-22", "14:00", "date_out_of_period"),
        ("2023-12-22", "15:00", "date_out_of_period"),
    ],
    MAY: [("2026-05-27", "11:00", "unrecognized_note")],
    JUL: [("2026-07-21", "09:00", "hours_mismatch")],
    SEP: [("2026-09-29", "12:00", "unrecognized_note")],
    OCT: [("2026-10-20", "09:00", "hours_mismatch"), ("2026-10-20", "11:00", "hours_mismatch")],
}

ROW_KEYS = {
    "kind", "row_date", "start_time", "end_time", "raw_module", "raw_teacher", "module_key",
    "teacher_key", "assessment", "event_kind", "title", "note", "issues", "page", "row_no",
}


def lessons(result, day=None):
    return [r for r in result["rows"] if r["kind"] == "lesson" and (day is None or r["row_date"] == day)]


def events(result):
    return [r for r in result["rows"] if r["kind"] == "event"]


def summary(rows):
    return [(r["start_time"], r["end_time"], r["raw_teacher"], r["raw_module"], r["assessment"]) for r in rows]


def hours(row):
    (h1, m1), (h2, m2) = (map(int, t.split(":")) for t in (row["start_time"], row["end_time"]))
    return (h2 * 60 + m2 - h1 * 60 - m1) / 60


@pytest.mark.parametrize("name", sorted(MONTHLY))
def test_monthly_totals(parsed, name):
    start, end, lesson_count, event_count, computed, declared = MONTHLY[name]
    result = parsed(name)
    report = result["file"]["report"]

    assert result["file"]["period_start"] == start
    assert result["file"]["period_end"] == end
    assert result["file"]["declared_hours"] == declared
    assert report["lessons"] == len(lessons(result)) == lesson_count
    assert report["events"] == len(events(result)) == event_count
    assert report["computed_hours"] == sum(hours(r) for r in lessons(result)) == computed
    assert report["hours_match"] is (computed == declared)


@pytest.mark.parametrize("name", sorted(MONTHLY))
def test_only_known_anomalies_are_reported(parsed, name):
    found = [
        (r["row_date"], r["start_time"], i["code"])
        for r in parsed(name)["rows"]
        for i in r["issues"]
    ]
    assert sorted(found) == EXPECTED_ISSUES.get(name, [])


@pytest.mark.parametrize("name", sorted(MONTHLY))
def test_rows_match_import_row_contract(parsed, name):
    for row in parsed(name)["rows"]:
        assert set(row) == ROW_KEYS
        assert row["kind"] in ("lesson", "event")
        assert row["page"] >= 1 and row["row_no"] >= 1
        for item in row["issues"]:
            assert set(item) == {"code", "severity", "message"}
            assert item["severity"] in ("error", "warning")
        if row["kind"] == "lesson":
            assert row["start_time"] < row["end_time"]
            assert row["raw_module"] and row["module_key"] and row["raw_teacher"] and row["teacher_key"]
            assert row["assessment"] in (None, "intermediate_test", "final_test", "postponed_test")
        else:
            assert row["title"] and row["event_kind"] in ("holiday", "suspension", "event", "early_exit")


def test_november_2026_matches_the_review_mockup(parsed):
    result = parsed(NOV)
    assert result["file"]["report"]["title"] == "CALENDARIO DIDATTICO NOVEMBRE 2026"

    week = [r for d in ("2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27") for r in lessons(result, d)]
    assert [(r["row_date"], r["start_time"], r["end_time"], r["teacher_key"], r["assessment"]) for r in week] == [
        ("2026-11-23", "09:00", "11:00", "CANGELOSI ANTONIO", None),
        ("2026-11-23", "11:00", "14:00", "TODARO STEFANO", "final_test"),
        ("2026-11-24", "09:00", "14:00", "CANGELOSI ANTONIO", None),
        ("2026-11-25", "09:00", "12:00", "MANGIAPANE BENEDETTO", None),
        ("2026-11-25", "12:00", "14:00", "TODARO STEFANO", None),
        ("2026-11-26", "09:00", "11:00", "SPOTO PAOLO", None),
        ("2026-11-26", "11:00", "14:00", "TODARO STEFANO", None),
        ("2026-11-27", "09:00", "12:00", "TODARO STEFANO", None),
        ("2026-11-27", "12:00", "14:00", "MANGIAPANE BENEDETTO", None),
    ]
    assert week[1]["raw_module"] == (
        "ELEMENTI DI INFORMATICA MEDICA I: CYBERSECURITY PER DISPOSITIVI MEDICI NELLE RETI IT MEDICALI"
    )
    mhealth = "ELEMENTI DI INFORMATICA MEDICA II DISPOSITIVI MEDICI SOFTWARE APP E MHEALTH 2"
    assert sum(r["module_key"] == mhealth for r in lessons(result)) == 4
    assert sum(r["teacher_key"] == "TODARO STEFANO" for r in lessons(result)) == 7


def test_day_label_split_by_highlighted_row(parsed):
    assert summary(lessons(parsed(NOV), "2026-11-09")) == [
        ("09:00", "12:00", "MANGIAPANE BENEDETTO",
         "ELEMENTI DI INFORMATICA MEDICA II: FONDAMENTI DI IoHT – CLOUD- AZURE E AWS", None),
        ("12:00", "14:00", "VACANTI GIOVANNI ALBERTO",
         "FONDAMENTI DI INFORMATICA: PROGRAMMAZIONE FRONT END", "final_test"),
    ]


def test_day_continuing_on_next_page(parsed):
    result = parsed(JAN)
    friday = lessons(result, "2026-01-30")
    assert [(r["page"], r["start_time"]) for r in friday] == [
        (4, "09:00"), (4, "10:00"), (4, "11:00"), (5, "12:00"), (5, "13:00"),
    ]
    assert friday[-1]["raw_teacher"] == "GRAMAGNOLO ALBA"
    assert friday[-1]["assessment"] == "final_test"
    assert [r["start_time"] for r in lessons(result, "2026-01-09")] == ["09:00", "10:00", "11:00", "12:00", "13:00"]
    assert {r["page"] for r in lessons(result, "2026-01-26")} == {4}
    assert len(lessons(result, "2026-01-26")) == 5


def test_one_hour_rows_under_a_merged_day(parsed):
    day = lessons(parsed(NOV_DEC_2025), "2025-11-25")
    assert summary(day) == [
        ("13:00", "14:00", "PENSABENE MARIA", "COMPETENZE PER LA VITA (LIFECOMP)", None),
        ("14:00", "15:00", "PENSABENE MARIA", "COMPETENZE PER LA VITA (LIFECOMP)", None),
        ("15:00", "16:00", "PENSABENE MARIA", "COMPETENZE PER LA VITA (LIFECOMP)", None),
    ]


def test_wrong_year_in_source_is_an_error(parsed):
    rows = lessons(parsed(NOV_DEC_2025), "2023-12-22")
    assert [r["raw_module"] for r in rows] == ["INGLESE TECNICO"] * 3
    for row in rows:
        assert [(i["code"], i["severity"]) for i in row["issues"]] == [("date_out_of_period", "error")]
    assert parsed(NOV_DEC_2025)["file"]["report"]["errors"] == 3


def test_row_hours_differing_from_times_are_flagged(parsed):
    result = parsed(JUL)
    (row,) = [r for r in lessons(result, "2026-07-21")]
    assert (row["start_time"], row["end_time"]) == ("09:00", "13:00")
    assert row["issues"][0]["severity"] == "warning"
    report = result["file"]["report"]
    assert [i["code"] for i in report["issues"]] == ["total_hours_mismatch"]
    assert report["warnings"] == 1 and report["errors"] == 0


def test_comma_separated_times(parsed):
    assert [(r["start_time"], r["end_time"]) for r in lessons(parsed(JUN), "2026-06-08")] == [
        ("08:30", "11:30"), ("11:30", "13:30"),
    ]
    assert [(r["start_time"], r["end_time"]) for r in lessons(parsed(MAY), "2026-05-08")][-1] == ("10:30", "13:30")


def test_events(parsed):
    def found(name):
        return [(r["row_date"], r["event_kind"], r["title"]) for r in events(parsed(name))]

    assert found(APR) == [
        ("2026-04-02", "holiday", "VACANZE DI PASQUA"),
        ("2026-04-03", "holiday", "VACANZE DI PASQUA"),
        ("2026-04-06", "holiday", "VACANZE DI PASQUA"),
    ]
    assert found(JUN) == [("2026-06-01", "suspension", "SOSPENSIONE DIDATTICA")]
    assert found(JUL) == [("2026-07-15", "holiday", "FESTIVITA'")]
    assert found(OCT) == [("2026-10-12", "early_exit", "USCITA ALLE 12")]
    assert found(SEP) == [
        ("2026-09-14", "early_exit", "uscita alle 11"),
        ("2026-09-16", "event", "PROCLAMAZIONI E INAUGURAZIONE CULLA"),
        ("2026-09-17", "event", "PROCLAMAZIONI E INAUGURAZIONE CULLA"),
        ("2026-09-18", "event", "PROCLAMAZIONI E INAUGURAZIONE CULLA"),
    ]


def test_lessons_around_multi_day_event(parsed):
    result = parsed(SEP)
    assert [r["start_time"] for r in lessons(result, "2026-09-14")] == ["09:00"]
    for day in ("2026-09-16", "2026-09-17", "2026-09-18"):
        assert lessons(result, day) == []
    assert [r["raw_teacher"] for r in lessons(result, "2026-09-21")] == ["TROIA GIANMARCO", "VACANTI GIOVANNI ALBERTO"]


def test_assessments_and_notes(parsed):
    def at(name, day, start):
        (row,) = [r for r in lessons(parsed(name), day) if r["start_time"] == start]
        return row["assessment"], row["note"]

    assert at(OCT, "2026-10-01", "12:00") == ("intermediate_test", None)
    assert at(MAY, "2026-05-07", "09:00") == ("postponed_test", None)
    assert at(MAY, "2026-05-08", "10:30") == ("intermediate_test", None)
    assert at(NOV, "2026-11-30", "11:00") == ("final_test", None)
    assert at(SEP, "2026-09-21", "12:00") == ("final_test", "TEST FINALE ingegneria del software")
    assert at(MAY, "2026-05-27", "11:00") == (None, "TEST FONDAMEN")
    assert at(SEP, "2026-09-29", "12:00") == (None, "?")


def test_file_notes_from_totals_row(parsed):
    assert parsed(APR)["file"]["report"]["notes"] == [
        "I TEST INTERMEDI VERRANNO CONDIVISI DAGLI STESSI DOCENTI A META' DEL PROPRIO MODULO"
    ]
    assert parsed(NOV)["file"]["report"]["notes"] == []


def test_keys_fold_punctuation_and_accents(parsed):
    teachers = {}
    modules = {}
    for name in MONTHLY:
        for row in lessons(parsed(name)):
            teachers.setdefault(row["teacher_key"], set()).add(row["raw_teacher"])
            modules.setdefault(row["module_key"], set()).add(row["raw_module"])

    assert teachers["CALI MARCO"] == {"CALI MARCO", "CALI' MARCO"}
    assert teachers["MINAFO ROSANNA"] == {"MINAFO ROSANNA", "MINAFO' ROSANNA"}
    assert "TROIA GIAMMARCO" in teachers and "TROIA GIANMARCO" in teachers
    assert modules["COMUNICAZIONE SCRITTA PUBBLICA ED EFFICACE"] == {
        "COMUNICAZIONE SCRITTA PUBBLICA ED EFFICACE", "COMUNICAZIONE SCRITTA, PUBBLICA ED EFFICACE",
    }
    assert "ELEMENTI DI REALTA AUMENTATA REALTA VIRTUALE E REALTA MISTA" in modules
    assert len(teachers) == 23
    assert len(modules) == 39


def test_scanned_programme_is_rejected():
    with pytest.raises(ValueError, match="no calendar table"):
        extract_calendar((FIXTURES / "programma Biomed 2025-27.pdf").read_bytes())


def test_non_pdf_is_rejected():
    with pytest.raises(ValueError, match="not a valid PDF"):
        extract_calendar(b"")
