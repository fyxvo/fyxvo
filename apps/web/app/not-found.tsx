import Link from "next/link";
import { Button, Notice } from "@fyxvo/ui";

export default function NotFound() {
  return (
    <div className="space-y-6">
      <Notice tone="warning" title="This route does not exist">
        The requested Fyxvo workspace view could not be found. Use the main navigation to move back into the operator console.
      </Notice>
      <Button asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
