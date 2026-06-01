import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireEnv, checkEnv, REQUIRED_ENV, FEATURE_ENV } from "@/lib/env";

const ALL_KEYS = [...REQUIRED_ENV, ...FEATURE_ENV];

describe("lib/env", () => {
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    // Save and clear every key the module knows about for a clean slate.
    snapshot = {};
    for (const k of ALL_KEYS) {
      snapshot[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ALL_KEYS) {
      if (snapshot[k] === undefined) delete process.env[k];
      else process.env[k] = snapshot[k];
    }
  });

  describe("requireEnv", () => {
    it("returns the value when set", () => {
      process.env.DATABASE_URL = "postgres://example";
      expect(requireEnv("DATABASE_URL")).toBe("postgres://example");
    });

    it("throws a descriptive error when missing", () => {
      expect(() => requireEnv("DATABASE_URL")).toThrowError(/Missing required environment variable: DATABASE_URL/);
    });

    it("throws for an empty-string value (treated as unset)", () => {
      process.env.CLERK_SECRET_KEY = "";
      expect(() => requireEnv("CLERK_SECRET_KEY")).toThrow();
    });
  });

  describe("checkEnv", () => {
    it("reports not-ok and lists every missing required key when none are set", () => {
      const report = checkEnv();
      expect(report.ok).toBe(false);
      expect(report.missingRequired).toEqual([...REQUIRED_ENV]);
      expect(report.missingFeature).toEqual([...FEATURE_ENV]);
    });

    it("is ok once all required keys are present, even if feature keys are missing", () => {
      for (const k of REQUIRED_ENV) process.env[k] = "set";
      const report = checkEnv();
      expect(report.ok).toBe(true);
      expect(report.missingRequired).toEqual([]);
      expect(report.missingFeature).toEqual([...FEATURE_ENV]);
    });

    it("reports a fully-configured environment as ok with nothing missing", () => {
      for (const k of ALL_KEYS) process.env[k] = "set";
      expect(checkEnv()).toEqual({ ok: true, missingRequired: [], missingFeature: [] });
    });

    it("never includes the secret values, only the key names", () => {
      process.env.DATABASE_URL = "super-secret-connection-string";
      const report = checkEnv();
      expect(JSON.stringify(report)).not.toContain("super-secret-connection-string");
    });
  });
});
