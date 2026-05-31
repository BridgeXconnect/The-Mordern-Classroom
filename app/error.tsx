"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary. Catches render/runtime errors thrown by any
 * page or nested layout and offers recovery (retry / go home) instead of a
 * blank screen. Logged to the console so Sentry/Vercel captures the stack.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to your
          dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset} size="sm">
          <RotateCw className="mr-2 h-3.5 w-3.5" />
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
