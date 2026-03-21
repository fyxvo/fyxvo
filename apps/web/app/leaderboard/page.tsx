import Link from "next/link";
import { PageHeader } from "../../components/page-header";

interface LeaderboardEntry {
  rank: number;
  projectName: string;
  totalRequests: number;
  avgLatencyMs: number;
  hasPublicPage: boolean;
  publicSlug: string | null;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

async function fetchLeaderboard(): Promise<LeaderboardResponse | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiBase}/v1/leaderboard`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as LeaderboardResponse;
  } catch {
    return null;
  }
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "text-yellow-400 font-bold";
  if (rank === 2) return "text-slate-300 font-bold";
  if (rank === 3) return "text-orange-400 font-bold";
  return "text-[var(--fyxvo-text-muted)]";
}

export default async function LeaderboardPage() {
  const data = await fetchLeaderboard();

  return (
    <div className="space-y-10 lg:space-y-12">
      <PageHeader
        eyebrow="Community"
        title="Developer Leaderboard"
        description="Top projects by request volume — last 30 days. Opt in from project settings."
      />

      {data === null ? (
        <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-6 py-8 text-center">
          <p className="text-sm text-[var(--fyxvo-text-muted)]">
            Leaderboard is temporarily unavailable.
          </p>
        </div>
      ) : data.entries.length === 0 ? (
        <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--fyxvo-text-muted)]">
            No projects have opted into the leaderboard yet. Be the first — enable it in your{" "}
            <Link href="/settings" className="text-[var(--fyxvo-brand)] underline">
              project settings
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--fyxvo-border)]">
                <th className="py-3 pr-4 text-left font-medium text-[var(--fyxvo-text-muted)] w-12">
                  Rank
                </th>
                <th className="py-3 px-4 text-left font-medium text-[var(--fyxvo-text-muted)]">
                  Project
                </th>
                <th className="py-3 px-4 text-right font-medium text-[var(--fyxvo-text-muted)]">
                  Requests (30d)
                </th>
                <th className="py-3 px-4 text-right font-medium text-[var(--fyxvo-text-muted)]">
                  Avg Latency
                </th>
                <th className="py-3 pl-4 text-right font-medium text-[var(--fyxvo-text-muted)] w-16">
                  Profile
                </th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr
                  key={entry.rank}
                  className="border-b border-[var(--fyxvo-border)] transition-colors hover:bg-[var(--fyxvo-panel-soft)]"
                >
                  <td className="py-4 pr-4">
                    <span
                      className={`font-mono text-base ${rankBadgeClass(entry.rank)}`}
                    >
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-[var(--fyxvo-text)]">
                      {entry.projectName}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[var(--fyxvo-text)]">
                    {entry.totalRequests.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-[var(--fyxvo-text-muted)]">
                    {entry.avgLatencyMs.toFixed(1)} ms
                  </td>
                  <td className="py-4 pl-4 text-right">
                    {entry.hasPublicPage && entry.publicSlug ? (
                      <Link
                        href={`/p/${entry.publicSlug}`}
                        className="text-xs font-medium text-[var(--fyxvo-brand)] hover:underline"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--fyxvo-text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--fyxvo-text-muted)]">
        Leaderboard updates every 5 minutes.
      </p>
    </div>
  );
}
