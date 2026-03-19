"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Notice } from "@fyxvo/ui";
import { submitFeedback } from "../lib/api";
import { usePortal } from "./portal-provider";

const feedbackCategoryOptions = [
  { value: "BUG_REPORT", label: "Bug report" },
  { value: "SUPPORT_REQUEST", label: "Support request" },
  { value: "ONBOARDING_FRICTION", label: "Onboarding friction" },
  { value: "PRODUCT_FEEDBACK", label: "Product feedback" }
] as const;

export function FeedbackCaptureForm({
  source,
  page,
  title = "Report an issue or alpha friction point",
  description = "Use this form for bugs, onboarding friction, support requests, or product feedback. Submissions go into the Fyxvo admin review queue.",
  includeProjectContext = true
}: {
  readonly source: string;
  readonly page?: string;
  readonly title?: string;
  readonly description?: string;
  readonly includeProjectContext?: boolean;
}) {
  const portal = usePortal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Developer");
  const [team, setTeam] = useState("");
  const [category, setCategory] = useState<(typeof feedbackCategoryOptions)[number]["value"]>(
    "ONBOARDING_FRICTION"
  );
  const [message, setMessage] = useState("");
  const [attachProject, setAttachProject] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!name && portal.user?.displayName) {
      setName(portal.user.displayName);
    }

    if (!role && portal.user?.role) {
      setRole(portal.user.role);
    }
  }, [name, portal.user, role]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await submitFeedback(
        {
          name,
          email,
          role,
          ...(team ? { team } : {}),
          category,
          message,
          source,
          ...(page ? { page } : {}),
          ...(portal.walletAddress ? { walletAddress: portal.walletAddress } : {}),
          ...(includeProjectContext && attachProject && portal.selectedProject
            ? { projectId: portal.selectedProject.id }
            : {})
        },
        portal.token ?? undefined
      );

      setSuccessMessage(response.message);
      setCategory("ONBOARDING_FRICTION");
      setMessage("");
      setAttachProject(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The feedback request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {successMessage ? (
          <Notice tone="success" title="Feedback received">
            {successMessage}
          </Notice>
        ) : null}
        {errorMessage ? (
          <Notice tone="danger" title="Submission failed">
            {errorMessage}
          </Notice>
        ) : null}

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jordan Lee"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jordan@northwind.dev"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Developer"
            />
            <Input
              label="Team"
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              placeholder="Northwind"
            />
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--fyxvo-text-soft)]">Category</span>
            <select
              className="rounded-[1.6rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] px-4 py-3 text-[var(--fyxvo-text)] outline-none transition focus:border-brand-400"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as (typeof feedbackCategoryOptions)[number]["value"])
              }
            >
              {feedbackCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--fyxvo-text-soft)]">What happened</span>
            <textarea
              className="min-h-36 rounded-[1.6rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] px-4 py-3 text-[var(--fyxvo-text)] outline-none transition focus:border-brand-400"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the issue, what you expected, what actually happened, and anything that would help the team reproduce or understand the friction."
              required
            />
          </label>

          {includeProjectContext ? (
            <label className="flex items-center gap-3 rounded-[1.4rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] px-4 py-3 text-sm text-[var(--fyxvo-text-soft)]">
              <input
                type="checkbox"
                checked={attachProject}
                onChange={(event) => setAttachProject(event.target.checked)}
                className="h-4 w-4 accent-[var(--fyxvo-brand)]"
                disabled={!portal.selectedProject}
              />
              {portal.selectedProject
                ? `Attach the current project context for ${portal.selectedProject.name}.`
                : "No current project is selected, so no project context will be attached."}
            </label>
          ) : null}

          <Button type="submit" loading={submitting}>
            Submit feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
