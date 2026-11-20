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
