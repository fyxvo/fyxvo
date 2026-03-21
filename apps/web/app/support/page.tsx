"use client";

import { useState } from "react";
import { usePortal } from "../../components/portal-provider";
import { PageHeader } from "../../components/page-header";
import { submitFeedback, isPortalApiError } from "../../lib/api";

type TicketCategory = "BUG_REPORT" | "SUPPORT_REQUEST" | "ONBOARDING_FRICTION" | "PRODUCT_FEEDBACK";
type TicketPriority = "low" | "normal" | "high" | "urgent";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface SupportTicket {
  readonly id: string;
  readonly subject: string;
  readonly category: TicketCategory;
  readonly status: TicketStatus;
  readonly createdAt: string;
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  BUG_REPORT: "Bug Report",
  SUPPORT_REQUEST: "Support Request",
  ONBOARDING_FRICTION: "Onboarding Issue",
  PRODUCT_FEEDBACK: "Product Feedback",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const STATUS_STYLES: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  in_progress: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  resolved: { label: "Resolved", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  closed: { label: "Closed", className: "bg-[var(--fyxvo-text-muted)]/10 text-[var(--fyxvo-text-muted)] border-[var(--fyxvo-text-muted)]/20" },
};

function StatusBadge({ status }: { readonly status: TicketStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SupportPage() {
  const portal = usePortal();

  const [category, setCategory] = useState<TicketCategory>("SUPPORT_REQUEST");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (portal.walletPhase !== "authenticated" || !portal.token) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--fyxvo-text-muted)]">
          Sign in to submit a support ticket.
        </p>
      </div>
    );
  }

  const user = portal.user;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    if (!portal.token || !user) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitFeedback(
        {
          name: user.displayName ?? user.walletAddress,
          email: "support@fyxvo.com",
          category,
          message: `[${PRIORITY_LABELS[priority]} priority] ${subject}\n\n${description}`,
          source: "support-page",
          page: "/support",
          ...(portal.walletAddress ? { walletAddress: portal.walletAddress } : {}),
        },
        portal.token
      );

      const newTicket: SupportTicket = {
        id: result.item.id,
        subject,
        category,
        status: "open",
        createdAt: result.item.createdAt,
      };

      setTickets((prev) => [newTicket, ...prev]);
      setSubject("");
      setDescription("");
      setCategory("SUPPORT_REQUEST");
      setPriority("normal");
      setSubmitted(true);
    } catch (err) {
      if (isPortalApiError(err)) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to submit ticket. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Help"
        title="Support"
        description="Submit a support ticket and track your requests."
      />

      {submitted && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-500">
          Your ticket has been submitted. Our team will follow up via the contact on file.
        </div>
      )}

      <div className="rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)]">
        <div className="border-b border-[var(--fyxvo-border)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--fyxvo-text)]">New Ticket</h2>
          <p className="mt-0.5 text-xs text-[var(--fyxvo-text-muted)]">
            Describe your issue and our team will get back to you.
          </p>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-medium text-[var(--fyxvo-text-muted)]">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full rounded-md border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-3 py-2 text-sm text-[var(--fyxvo-text)] focus:outline-none focus:ring-1 focus:ring-[var(--fyxvo-brand)]"
              >
                {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="priority" className="text-xs font-medium text-[var(--fyxvo-text-muted)]">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full rounded-md border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-3 py-2 text-sm text-[var(--fyxvo-text)] focus:outline-none focus:ring-1 focus:ring-[var(--fyxvo-brand)]"
              >
                {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((key) => (
                  <option key={key} value={key}>
                    {PRIORITY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-xs font-medium text-[var(--fyxvo-text-muted)]">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              required
              maxLength={200}
              className="w-full rounded-md border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-3 py-2 text-sm text-[var(--fyxvo-text)] placeholder:text-[var(--fyxvo-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--fyxvo-brand)]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-medium text-[var(--fyxvo-text-muted)]">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide as much detail as possible — steps to reproduce, error messages, relevant project IDs, etc."
              required
              rows={5}
              maxLength={4000}
              className="w-full rounded-md border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-3 py-2 text-sm text-[var(--fyxvo-text)] placeholder:text-[var(--fyxvo-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--fyxvo-brand)] resize-y"
            />
            <p className="text-right text-xs text-[var(--fyxvo-text-muted)]">
              {description.length} / 4000
            </p>
          </div>

          {submitError ? (
            <p className="text-xs text-red-500">{submitError}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !description.trim()}
              className="rounded-md bg-[var(--fyxvo-brand)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>

      {tickets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--fyxvo-text)]">Your Tickets</h2>
          <div className="overflow-hidden rounded-lg border border-[var(--fyxvo-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--fyxvo-text-muted)]">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--fyxvo-text-muted)]">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--fyxvo-text-muted)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--fyxvo-text-muted)]">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-[var(--fyxvo-border)] last:border-0 bg-[var(--fyxvo-bg-elevated)]">
                    <td className="px-4 py-3 font-medium text-[var(--fyxvo-text)]">{ticket.subject}</td>
                    <td className="px-4 py-3 text-[var(--fyxvo-text-muted)]">{CATEGORY_LABELS[ticket.category]}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--fyxvo-text-muted)]">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
