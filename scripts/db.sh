#!/usr/bin/env bash
# Supabase CLI wrapper for local development and remote migrations.
# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

TYPES_OUT="${TYPES_OUT:-$REPO_ROOT/types/database.types.ts}"

usage() {
  cat <<USAGE
Usage: scripts/db.sh <command>

Local:
  init           create supabase/config.toml (once)
  start | stop   start or stop the local Supabase stack (Docker)
  new <name>     create an empty migration in supabase/migrations
  reset          rebuild the local database from all migrations and seeds

Remote (project ref and credentials resolved as described below):
  status         compare local migrations with the remote history
  diff           show which migrations push would apply (dry run)
  push           dry run, ask for confirmation, then apply pending migrations
  types          generate TypeScript types from the remote schema into \$TYPES_OUT
                 (default: types/database.types.ts)

Remote settings, first match wins:
  project ref    SUPABASE_PROJECT_REF, else terraform output supabase_project_ref
  access token   SUPABASE_ACCESS_TOKEN, else supabase_access_token in terraform.tfvars
  db password    SUPABASE_DB_PASSWORD, else supabase_database_password in terraform.tfvars
USAGE
}

sb() {
  supabase --workdir "$REPO_ROOT" "$@"
}

load_remote_env() {
  if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    require_cmd terraform "Or set SUPABASE_PROJECT_REF."
    SUPABASE_PROJECT_REF="$(terraform -chdir="$TF_DIR" output -raw supabase_project_ref 2>/dev/null)" \
      || SUPABASE_PROJECT_REF=""
    [[ "$SUPABASE_PROJECT_REF" =~ ^[a-z]{20}$ ]] \
      || die "cannot read supabase_project_ref from Terraform state; run scripts/infra.sh apply or set SUPABASE_PROJECT_REF"
  fi
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    SUPABASE_ACCESS_TOKEN="$(tfvar supabase_access_token)"
  fi
  if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    SUPABASE_DB_PASSWORD="$(tfvar supabase_database_password)"
  fi
  [[ -n "$SUPABASE_ACCESS_TOKEN" ]] || die "missing Supabase access token"
  [[ -n "$SUPABASE_DB_PASSWORD" ]] || die "missing database password"
  export SUPABASE_PROJECT_REF SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD
  info "target project: $SUPABASE_PROJECT_REF"
}

require_supabase_dir() {
  [[ -f "$REPO_ROOT/supabase/config.toml" ]] || die "supabase/config.toml not found, run: scripts/db.sh init"
}

main() {
  require_cmd supabase "Install the Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started"
  local cmd="${1:-}"
  shift || true

  case "$cmd" in
    init)
      [[ ! -f "$REPO_ROOT/supabase/config.toml" ]] || die "supabase/config.toml already exists"
      sb init
      ;;
    start)
      require_supabase_dir
      sb start
      ;;
    stop)
      require_supabase_dir
      sb stop
      ;;
    new)
      require_supabase_dir
      [[ $# -eq 1 ]] || die "usage: scripts/db.sh new <name>"
      sb migration new "$1"
      ;;
    reset)
      require_supabase_dir
      sb db reset
      ;;
    status)
      require_supabase_dir
      load_remote_env
      sb migration list --project-ref "$SUPABASE_PROJECT_REF"
      ;;
    diff)
      require_supabase_dir
      load_remote_env
      sb db push --dry-run --project-ref "$SUPABASE_PROJECT_REF"
      ;;
    push)
      require_supabase_dir
      load_remote_env
      sb db push --dry-run --project-ref "$SUPABASE_PROJECT_REF"
      confirm "Apply these migrations to $SUPABASE_PROJECT_REF?" || die "aborted"
      sb db push --project-ref "$SUPABASE_PROJECT_REF" --yes
      sb migration list --project-ref "$SUPABASE_PROJECT_REF"
      ;;
    types)
      require_supabase_dir
      load_remote_env
      mkdir -p "$(dirname "$TYPES_OUT")"
      sb gen types --lang typescript --project-id "$SUPABASE_PROJECT_REF" >"$TYPES_OUT"
      info "types written to $TYPES_OUT"
      ;;
    -h|--help|help|"")
      usage
      ;;
    *)
      usage
      die "unknown command: $cmd"
      ;;
  esac
}

main "$@"
