import { describe, it, expect } from "vitest";
import {
  videoIdFromEmbedUrl,
  thumbFromEmbedUrl,
  buildEmbedHtml,
} from "@/lib/youtube";

describe("videoIdFromEmbedUrl", () => {
  it("extracts the id from a plain embed URL", () => {
    expect(videoIdFromEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("strips a trailing query string", () => {
    expect(videoIdFromEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ?start=30")).toBe("dQw4w9WgXcQ");
  });

  it("returns an empty string for an empty input", () => {
    expect(videoIdFromEmbedUrl("")).toBe("");
  });
});

describe("thumbFromEmbedUrl", () => {
  it("defaults to medium-quality thumbnail", () => {
    expect(thumbFromEmbedUrl("https://www.youtube.com/embed/abc123")).toBe(
      "https://img.youtube.com/vi/abc123/mqdefault.jpg"
    );
  });

  it("supports the high-quality variant", () => {
    expect(thumbFromEmbedUrl("https://www.youtube.com/embed/abc123", "hq")).toBe(
      "https://img.youtube.com/vi/abc123/hqdefault.jpg"
    );
  });
});

describe("buildEmbedHtml", () => {
  it("embeds the given video id in the iframe src", () => {
    const html = buildEmbedHtml("abc123", "My Lesson");
    expect(html).toContain("https://www.youtube.com/embed/abc123");
    expect(html).toContain('title="My Lesson"');
    expect(html).toContain("allowfullscreen");
  });

  it("escapes double quotes in the title to keep the attribute well-formed", () => {
    const html = buildEmbedHtml("abc123", 'Watch "this"');
    expect(html).toContain('title="Watch &quot;this&quot;"');
    // the raw, unescaped quoted title must not appear
    expect(html).not.toContain('title="Watch "this""');
  });
});
