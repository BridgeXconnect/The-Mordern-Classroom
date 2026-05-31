/**
 * Centralised environment-variable contract.
 *
 * `requireEnv` throws a descriptive error at the call site (runtime, not build)
 * so a missing key surfaces immediately with actionable context instead of an
 * opaque downstream failure. `checkEnv` returns a non-throwing report used by
 * the /api/health endpoint for deploy smoke tests.
 */

/** Vars the app cannot function without. */
export const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

/** Vars required only by specific AI/media features (degrade gracefully if absent). */
export const FEATURE_ENV = [
  "OPENROUTER_API_KEY",
  "HUGGINGFACE_API_KEY",
  "YOUTUBE_API_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

/**
 * Read a required env var or throw with a clear message.
 * @param name - environment variable key
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local (see .env.example) or your Vercel project settings.`
    );
  }
  return value;
}

export interface EnvReport {
  ok: boolean;
  missingRequired: string[];
  missingFeature: string[];
}

/** Non-throwing audit of configured env vars. */
export function checkEnv(): EnvReport {
  const missingRequired = REQUIRED_ENV.filter((k) => !process.env[k]);
  const missingFeature = FEATURE_ENV.filter((k) => !process.env[k]);
  return {
    ok: missingRequired.length === 0,
    missingRequired,
    missingFeature,
  };
}
