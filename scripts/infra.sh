#!/usr/bin/env bash
# Terraform wrapper for infra/terraform. State stays local in infra/terraform/terraform.tfstate.
# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PLAN_FILE="tfplan"
BACKUP_DIR="${TF_STATE_BACKUP_DIR:-$HOME/.its-biomed-calendar/tfstate-backups}"

usage() {
  cat <<USAGE
Usage: scripts/infra.sh <command>

Commands:
  init           terraform init (run once, and after provider changes)
  check          terraform fmt -check and validate
  plan           create a plan in infra/terraform/$PLAN_FILE
  apply          back up the state, then apply the saved plan
  output [name]  show outputs (sensitive ones with a name, e.g. supabase_publishable_key)
  backup         copy the local state to \$TF_STATE_BACKUP_DIR (default: $BACKUP_DIR)
  destroy        back up the state, then destroy everything after typed confirmation
USAGE
}

tf() {
  terraform -chdir="$TF_DIR" "$@"
}

require_tfvars() {
  [[ -f "$TFVARS_FILE" ]] || die "missing $TFVARS_FILE (copy terraform.tfvars.example and fill it in)"
}

backup_state() {
  local state="$TF_DIR/terraform.tfstate"
  if [[ ! -f "$state" ]]; then
    info "no local state yet, nothing to back up"
    return 0
  fi
  mkdir -p "$BACKUP_DIR"
  chmod 700 "$BACKUP_DIR"
  local target
  target="$BACKUP_DIR/terraform.tfstate.$(date +%Y%m%d-%H%M%S)"
  cp "$state" "$target"
  chmod 600 "$target"
  info "state backed up to $target"
}

main() {
  require_cmd terraform "Install Terraform >= 1.10: https://developer.hashicorp.com/terraform/install"
  local cmd="${1:-}"
  shift || true

  case "$cmd" in
    init)
      tf init "$@"
      ;;
    check)
      tf fmt -check -recursive
      tf validate
      ;;
    plan)
      require_tfvars
      tf plan -out="$PLAN_FILE" "$@"
      info "review the plan above, then run: scripts/infra.sh apply"
      ;;
    apply)
      require_tfvars
      [[ -f "$TF_DIR/$PLAN_FILE" ]] || die "no saved plan, run: scripts/infra.sh plan"
      backup_state
      tf apply "$PLAN_FILE"
      rm -f "$TF_DIR/$PLAN_FILE"
      backup_state
      ;;
    output)
      if [[ $# -gt 0 ]]; then
        tf output -raw "$1"
        echo
      else
        tf output
      fi
      ;;
    backup)
      backup_state
      ;;
    destroy)
      require_tfvars
      local answer
      read -r -p "Type 'destroy' to delete the Supabase and Vercel projects: " answer
      [[ "$answer" == "destroy" ]] || die "aborted"
      backup_state
      tf destroy "$@"
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
