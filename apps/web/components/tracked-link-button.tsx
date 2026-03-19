"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { Button, type ButtonProps } from "@fyxvo/ui";
import { trackLaunchEvent } from "../lib/tracking";
import type { LaunchEventName } from "../lib/types";

export function TrackedLinkButton({
  href,
  eventName,
  eventSource,
  children,
  variant,
  size,
  className,
  target,
  rel
}: {
  readonly href: string;
  readonly eventName: LaunchEventName;
  readonly eventSource: string;
  readonly children: ReactNode;
  readonly variant?: ButtonProps["variant"];
  readonly size?: ButtonProps["size"];
  readonly className?: string;
  readonly target?: ComponentPropsWithoutRef<typeof Link>["target"];
  readonly rel?: ComponentPropsWithoutRef<typeof Link>["rel"];
}) {
  return (
    <Button asChild {...(variant ? { variant } : {})} {...(size ? { size } : {})} className={className}>
      <Link
        href={href}
        {...(target ? { target } : {})}
        {...(rel ? { rel } : {})}
        onClick={() => {
          void trackLaunchEvent({
            name: eventName,
            source: eventSource
          });
        }}
      >
        {children}
      </Link>
    </Button>
  );
}
