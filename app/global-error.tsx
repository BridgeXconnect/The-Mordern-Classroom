"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary that wraps the root layout itself. Must render its
 * own <html>/<body> because the failing layout never mounted. Kept dependency-
 * free (no shared UI) so it can render even if the design system is the culprit.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          color: "#111827",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: "28rem", color: "#6b7280", margin: 0 }}>
          The application hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            cursor: "pointer",
            borderRadius: "0.375rem",
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
