import type { CefrLevel } from "@prisma/client";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  embedUrl: string;
}

export interface YouTubeSearchOptions {
  maxResults?: number;
  relevanceLanguage?: string;
  videoDuration?: "short" | "medium" | "long";
  safeSearch?: "moderate" | "strict";
}

/**
 * Search YouTube for educational videos relevant to a lesson.
 * Results should be cached in DB (MediaAsset) to preserve the 10K daily unit quota.
 *
 * @param query - Search query (lesson topic + keywords)
 * @param cefrLevel - Used to append appropriate difficulty keywords
 * @param options - Additional search options
 */
export async function searchYouTube(
  query: string,
  cefrLevel: CefrLevel,
  options: YouTubeSearchOptions = {}
): Promise<YouTubeVideo[]> {
  const {
    maxResults = 6,
    relevanceLanguage = "en",
    videoDuration = "medium",
    safeSearch = "strict",
  } = options;

  const cefrKeywords: Record<CefrLevel, string> = {
    L1: "beginner english very simple",
    A1: "beginner english simple",
    A2: "elementary english easy",
    B1: "intermediate english",
    B2: "upper intermediate english",
  };

  const fullQuery = `${query} ${cefrKeywords[cefrLevel]} ESL`;

  const params = new URLSearchParams({
    part: "snippet",
    q: fullQuery,
    type: "video",
    maxResults: String(maxResults),
    relevanceLanguage,
    videoDuration,
    safeSearch,
    key: process.env.YOUTUBE_API_KEY!,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return (data.items ?? []).map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown>;
    const id = (item.id as Record<string, unknown>).videoId as string;
    return {
      id,
      title: snippet.title as string,
      description: snippet.description as string,
      thumbnail: ((snippet.thumbnails as Record<string, unknown>).medium as Record<string, unknown>).url as string,
      channelTitle: snippet.channelTitle as string,
      publishedAt: snippet.publishedAt as string,
      embedUrl: `https://www.youtube.com/embed/${id}`,
    };
  });
}

/**
 * Build a YouTube embed iframe HTML string.
 */
export function buildEmbedHtml(videoId: string, title: string): string {
  return `<iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/${videoId}"
    title="${title.replace(/"/g, "&quot;")}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>`;
}
