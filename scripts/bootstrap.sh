#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PNPM_VERSION="10.23.0"
SOLANA_VERSION="2.3.0"
ANCHOR_VERSION="0.32.1"
CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}"
RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}"
SOLANA_BIN_DIR="$HOME/.local/share/solana/install/active_release/bin"
AVM_BIN_DIR="$HOME/.avm/bin"
export CARGO_HOME
export RUSTUP_HOME
export PATH="$CARGO_HOME/bin:$SOLANA_BIN_DIR:$AVM_BIN_DIR:$PATH"

log() {
  printf "\n[fyxvo] %s\n" "$1"
}

install_system_packages() {
  if ! command -v sudo >/dev/null 2>&1; then
    return
  fi

  log "Installing PostgreSQL client, Redis tools, and native build dependencies"
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    clang \
    curl \
    git \
    jq \
    libclang-dev \
    libssl-dev \
    libudev-dev \
    llvm \
    pkg-config \
    postgresql-client \
    redis-tools
}

install_pnpm() {
  log "Ensuring pnpm ${PNPM_VERSION} is active through Corepack"
  corepack enable
  corepack prepare "pnpm@${PNPM_VERSION}" --activate
}

install_rust() {
  if ! command -v rustup >/dev/null 2>&1; then
    log "Installing Rust toolchain"
    curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
  else
    log "Rust toolchain already available"
  fi

  # shellcheck source=/dev/null
  source "$CARGO_HOME/env"
  rustup default stable >/dev/null
  rustup component add rustfmt clippy >/dev/null
}

install_solana() {
  local current_version=""
  if command -v solana >/dev/null 2>&1; then
    current_version="$(solana --version | awk '{print $2}')"
  fi

  if [[ "$current_version" != "$SOLANA_VERSION" ]]; then
    log "Installing Solana CLI ${SOLANA_VERSION}"
    sh -c "$(curl -sSfL https://release.anza.xyz/v${SOLANA_VERSION}/install)"
  else
    log "Solana CLI ${SOLANA_VERSION} already available"
  fi
}

install_anchor() {
  local current_version=""

  # shellcheck source=/dev/null
  source "$CARGO_HOME/env"

  if ! command -v avm >/dev/null 2>&1; then
    log "Installing Anchor Version Manager"
    cargo install --git https://github.com/coral-xyz/anchor avm --force
  else
    log "Anchor Version Manager already available"
  fi

  export PATH="$CARGO_HOME/bin:$SOLANA_BIN_DIR:$AVM_BIN_DIR:$PATH"

  if command -v anchor >/dev/null 2>&1; then
    current_version="$(anchor --version | awk '{print $2}')"
  fi

  if [[ "$current_version" != "$ANCHOR_VERSION" ]]; then
    log "Installing Anchor CLI ${ANCHOR_VERSION}"
    avm install "$ANCHOR_VERSION"
    avm use "$ANCHOR_VERSION"
  else
    log "Anchor CLI ${ANCHOR_VERSION} already available"
  fi
}

install_workspace_dependencies() {
  log "Installing pnpm workspace dependencies"
  cd "$ROOT_DIR"
  pnpm install
}

main() {
  install_system_packages
  install_pnpm
  install_rust
  install_solana
  install_anchor
  install_workspace_dependencies
  log "Bootstrap complete"
}

main "$@"
