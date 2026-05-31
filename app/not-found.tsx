import Link from "next/link";
import { Compass, Home } from "lucide-react";

/**
 * Global 404 page. Rendered for unmatched routes and explicit notFound() calls.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Compass className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">404</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          We couldn&apos;t find the page you were looking for. It may have been
          moved or deleted.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Home className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>
    </div>
  );
}
