export function shortenAddress(value: string, lead = 4, tail = 4) {
  if (value.length <= lead + tail) {
    return value;
  }

  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDuration(value: number) {
  return `${Math.round(value)} ms`;
}

export function formatRelativeDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function lamportsToSol(lamports: number | string) {
  return Number(lamports) / 1_000_000_000;
}

export function formatSol(lamports: number | string) {
  return `${lamportsToSol(lamports).toFixed(2)} SOL`;
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function classForStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("ok") || normalized.includes("online") || normalized.includes("active") || normalized.includes("confirmed")) {
    return "success" as const;
  }
  if (normalized.includes("warn") || normalized.includes("degraded") || normalized.includes("provision")) {
    return "warning" as const;
  }
  if (normalized.includes("error") || normalized.includes("offline") || normalized.includes("failed") || normalized.includes("revoked")) {
    return "danger" as const;
  }
  return "neutral" as const;
}
