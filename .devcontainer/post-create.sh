#!/usr/bin/env bash
set -euo pipefail

export HOME="${HOME:-/home/vscode}"
export NVM_DIR="${NVM_DIR:-/usr/local/share/nvm}"
export CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}"
export RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}"

mkdir -p "$CARGO_HOME" "$RUSTUP_HOME" "$HOME/.avm" "$HOME/.local/share/solana/install"

if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # The Node feature installs via nvm, but non-login postCreate shells do not always source it.
  # Load it explicitly so corepack, npm, and pnpm are available before bootstrap begins.
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1 || nvm use --lts >/dev/null 2>&1 || true
fi

bash ./scripts/bootstrap.sh
