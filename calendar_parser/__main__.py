import json
import sys

from .extract import extract_calendar

for path in sys.argv[1:]:
    with open(path, "rb") as fh:
        json.dump(extract_calendar(fh.read()), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
