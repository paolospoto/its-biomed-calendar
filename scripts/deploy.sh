#!/usr/bin/env bash
# Deploys the web app to Vercel from the local working tree.
# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

usage() {
  cat <<USAGE
Usage: scripts/deploy.sh [preview|prod]

  preview   create a preview deployment (default)
  prod      ask for confirmation, then deploy to production

VERCEL_TOKEN overrides vercel_api_token from terraform.tfvars.
USAGE
}

tf_value() {
  echo "$1" | terraform -chdir="$TF_DIR" console 2>/dev/null | tr -d '"'
}

main() {
  local target="${1:-preview}"
  case "$target" in
    preview|prod) ;;
    -h|--help|help)
      usage
      return
      ;;
    *)
      usage
      die "unknown target: $target"
      ;;
  esac

  require_cmd vercel "Install the Vercel CLI: npm i -g vercel"
  require_cmd terraform "Install Terraform >= 1.10: https://developer.hashicorp.com/terraform/install"

  VERCEL_TOKEN="${VERCEL_TOKEN:-$(tfvar vercel_api_token)}"
  [[ -n "$VERCEL_TOKEN" ]] || die "missing Vercel token"
  VERCEL_PROJECT_ID="$(tf_value vercel_project.web.id)"
  VERCEL_ORG_ID="$(tf_value vercel_project.web.team_id)"
  [[ "$VERCEL_PROJECT_ID" == prj_* && "$VERCEL_ORG_ID" == team_* ]] \
    || die "cannot read the Vercel project from Terraform state, run scripts/infra.sh apply"
  export VERCEL_TOKEN VERCEL_PROJECT_ID VERCEL_ORG_ID

  local args=(deploy --cwd "$REPO_ROOT" --yes)
  if [[ "$target" == "prod" ]]; then
    confirm "Deploy the current working tree to production?" || die "aborted"
    args+=(--prod)
  fi
  vercel "${args[@]}"
}

main "$@"
