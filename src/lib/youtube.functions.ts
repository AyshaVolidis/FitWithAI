import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchInput = z.object({
  query: z.string().min(2).max(120),
  maxResults: z.number().min(1).max(10).default(5),
});

export type YouTubeVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  description: string;
};

/**
 * Search YouTube for embeddable fitness videos.
 * Uses the YouTube Data API v3 — public endpoint, server-only key.
 */
export const searchYouTubeVideos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SearchInput.parse(d))
  .handler(async ({ data }): Promise<{ videos: YouTubeVideo[]; error: string | null }> => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return { videos: [], error: "YOUTUBE_API_KEY not configured" };

    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      safeSearch: "strict",
      maxResults: String(data.maxResults),
      q: data.query + " workout",
      key,
    });

    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!r.ok) {
        const body = await r.text();
        console.error("YouTube API error", r.status, body);
        return { videos: [], error: `YouTube error (${r.status})` };
      }
      const json = await r.json() as {
        items?: Array<{
          id: { videoId: string };
          snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } }; description: string };
        }>;
      };
      const videos: YouTubeVideo[] = (json.items ?? []).map((it) => ({
        id: it.id.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        thumbnail: it.snippet.thumbnails?.medium?.url ?? it.snippet.thumbnails?.default?.url ?? "",
        description: it.snippet.description,
      }));
      return { videos, error: null };
    } catch (e) {
      console.error("YouTube fetch failed", e);
      return { videos: [], error: "YouTube request failed" };
    }
  });
