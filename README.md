# its-biomed-calendar

## Local operations

Everything runs from your machine. Secrets live only in `infra/terraform/terraform.tfvars` (git-ignored), and the Terraform state stays local.

Requirements: [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.10, the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) and Docker for the local database.

### Infrastructure (`scripts/infra.sh`)

```bash
scripts/infra.sh init      # once
scripts/infra.sh plan      # writes infra/terraform/tfplan
scripts/infra.sh apply     # backs up the state, applies the saved plan
scripts/infra.sh output supabase_project_ref
```

Before every `apply` and `destroy` the state is copied to `~/.its-biomed-calendar/tfstate-backups/` (override with `TF_STATE_BACKUP_DIR`). Keep that folder backed up: losing the state means Terraform no longer knows the Supabase and Vercel projects it created.

### Database migrations (`scripts/db.sh`)

```bash
scripts/db.sh init                 # once, creates supabase/config.toml
scripts/db.sh new initial_schema   # empty file in supabase/migrations
scripts/db.sh start                # local stack
scripts/db.sh reset                # rebuild the local database from all migrations
scripts/db.sh diff                 # what push would apply to the remote project
scripts/db.sh push                 # dry run, confirmation, then apply
scripts/db.sh status               # local vs remote migration history
scripts/db.sh types                # TypeScript types from the remote schema
```

Remote commands target the project in the Terraform state (`supabase_project_ref`) and reuse `supabase_access_token` and `supabase_database_password` from `terraform.tfvars`. `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` override them.

### Users

Auth users are managed with the git-ignored scripts in `scripts/admin/`; see `infra/terraform/README.md`.

## Web app

Next.js (App Router) with Supabase Auth, sessions refreshed in `proxy.ts`. The calendar is visible only after login; admins are the rows of `public.app_admin` and see `/manutenzione`.

```bash
cp .env.example .env.local   # fill in the Supabase URL and publishable key
npm install
npm run dev
```

PDF extraction lives in `api/extract_calendar.py` (Vercel Python function, package `calendar_parser`). It is called by the `/manutenzione/importa` Server Action with the `EXTRACT_FUNCTION_SECRET` header. Whether Next.js and the Python function coexist in one Vercel project still has to be verified with a deploy.

## Calendar parser

`calendar_parser.extract_calendar(pdf_bytes)` reads a monthly calendar exported from Excel and returns `{"file": {...}, "rows": [...]}` in the shape expected by `create_import_batch`:

- `file`: `period_start` and `period_end` from the "CALENDARIO DIDATTICO ..." title (whole months), `declared_hours` from the "ORE TOTALI" row, and a `report` with counts, computed hours and the notes written in the totals row.
- `rows`: one `lesson` per time slot, one `event` per day for rows without a time slot (holidays, suspensions, early exits, events spanning several days). `module_key` and `teacher_key` are the raw names upper-cased without accents and punctuation, used to match `module_alias` and `teacher_alias`.
- `issues` on each row: `error` (no date, date outside the period, invalid time, missing module, overlapping lessons) or `warning` (missing teacher, weekday not matching the date, ORE column not matching the time slot, note not recognised as an assessment).

A PDF without the calendar table (for example a scan) raises `ValueError`, answered with 422.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest                                       # also run by .github/workflows/parser.yml
python -m calendar_parser "tests/fixtures/11 NOVEMBRE.pdf"   # print the extraction as JSON
```

The tests use the real calendars in `tests/fixtures/` (November 2025 to November 2026) and pin the anomalies they contain, such as a day dated 2023 in the November–December 2025 file and a lesson on 21 July 2026 whose ORE column says 5 for a 9:00–13:00 slot.
