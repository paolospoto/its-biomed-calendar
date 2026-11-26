# TODO

## Data model inconsistencies

Found while rebuilding the approved mockups as the static preview (`/anteprima`, PR #8) against `supabase/migrations/20261120130000_initial_schema.sql` and the real calendars in `tests/fixtures/`.

- [ ] **Empty `module_alias` on the first import.** `create_import_batch` links rows only through `module_alias` / `teacher_alias`. With no aliases, every lesson of the first import shows up as an unknown module and `apply_import` is blocked. Seed `module_alias` with `make_key(module.name)` for every module (and decide how teachers are created). The preview assumes this seed.
- [ ] **Calendar names with no matching module.** `EUROLINGUE` (7 lessons, June–July 2026, teacher Tigani Giuseppe) and `ASP_SICUREZZA` (3 lessons, June 2026, teacher Trapani Elisa) match no module of the quadro orario. Decide which module they belong to, or add modules for them.
- [ ] **Spelling variants to link.** In the preview these are linked by hand: `ELEMENTI DI MATEMATICA FISICA E STATISTICA`, `ECONOMIA DI BASE E CREAZIONE D IMPRESA PER L INDUSTRIA 4 0`, `PRIMO SOCCORSO ASP SICUREZZA`. The same goes for two teacher variants: `TROIA GIAMMARCO` → `TROIA GIANMARCO`, `RICCA CARMELO` → `RICCA CARMELO CRISTIAN`. Confirm them.
- [ ] **Parser errors in the Nov–Dec 2025 calendar.** Three rows are dated 2023 (`date_out_of_period`). They need a manual fix before that month can be applied.
- [ ] **No module–teacher relation.** The module page shows the teachers found in the module's lessons. Add a relation if a module should have an official teacher.
- [ ] **Ambiguous `module.semesters`.** The quadro orario writes ranges such as "I – III", which can mean semesters I and III or I to III, while the column is a set (`smallint[]`). The preview stores the endpoints as written.
- [ ] **Completion can exceed planned hours.** `module_progress.done_hours` is not capped by `planned_hours` (e.g. Elementi di biologia umana: 27 of 25 h), so summing it overstates course completion. Decide whether to cap per module.
- [ ] **No course-level planned hours.** The 1,200 h of theory and lab (2,000 h with the internship) only exist as the sum of `module.planned_hours`. Fine as long as every module of the quadro is in `module`, including the internship.
- [ ] **Manual edits that an import overwrites.** `lesson.edited_at` marks edited lessons. However, a lesson deleted by hand leaves no trace, and nothing links a lesson to the `import_row` that replaces it, so the "after import (from PDF)" column of the review needs heuristic matching (date + module). Consider a deleted-lessons log or tombstones, and a matching rule.
- [ ] **"Remember the link (alias)" checkbox.** The mockup offers it when fixing a row, but `apply_import` always inserts the aliases (`on conflict do nothing`). The preview shows a note in its place. Either drop the option for good or make alias creation optional.
- [ ] **Import batch audit columns.** `import_batch.created_at`, `created_by` and `applied_at` only exist after a real import, so the preview type omits them.
- [ ] **No user names.** There is no profile table and no names in `auth.users` metadata: the UI shows only "Studente" / "Amministratore", as in the mockups.
