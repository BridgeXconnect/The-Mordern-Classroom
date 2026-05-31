import { NextResponse } from "next/server";
import { checkEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Lightweight health/config probe for deploy smoke tests.
 * Never leaks values — only reports which required/feature keys are absent.
 */
export async function GET() {
  const env = checkEnv();
  return NextResponse.json(
    {
      status: env.ok ? "ok" : "misconfigured",
      timestamp: new Date().toISOString(),
      missingRequired: env.missingRequired,
      missingFeature: env.missingFeature,
    },
    { status: env.ok ? 200 : 503 }
  );
}
