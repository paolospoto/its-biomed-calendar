#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="$REPO_ROOT/infra/terraform"
TFVARS_FILE="$TF_DIR/terraform.tfvars"

die() {
  echo "error: $*" >&2
  exit 1
}

info() {
  echo "==> $*" >&2
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' not found in PATH. $2"
}

confirm() {
  local answer
  [[ -t 0 ]] || die "confirmation needed but stdin is not a terminal"
  read -r -p "$1 [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]]
}

# Reads a simple `key = "value"` line from terraform.tfvars.
tfvar() {
  [[ -f "$TFVARS_FILE" ]] || return 0
  sed -nE "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*\"(.*)\"[[:space:]]*$/\1/p" "$TFVARS_FILE" | tail -n 1
}
