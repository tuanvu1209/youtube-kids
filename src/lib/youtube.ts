export type VideoMeta = {
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSec: number;
};

const API = "https://www.googleapis.com/youtube/v3";

export function hasApiKey() {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

/** Chấp nhận: ID trần, youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID */
export function extractVideoId(input: string): string | null {
  const raw = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const m = url.pathname.match(/\/(embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[2];
  } catch {
    return null;
  }
  return null;
}

export function parseIsoDuration(iso: string): number {
  const m = iso.match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const [, d, h, min, s] = m;
  return (
    Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0)
  );
}

export function thumbFor(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

/** Lấy metadata video: ưu tiên Data API (có duration), fallback oEmbed (không cần key). */
export async function fetchVideoMeta(youtubeId: string): Promise<VideoMeta | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    try {
      const res = await fetch(
        `${API}/videos?part=snippet,contentDetails&id=${youtubeId}&key=${key}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          return {
            youtubeId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle ?? "",
            thumbnailUrl:
              item.snippet.thumbnails?.high?.url ?? thumbFor(youtubeId),
            durationSec: parseIsoDuration(item.contentDetails?.duration ?? ""),
          };
        }
      }
    } catch {
      /* rơi xuống oEmbed */
    }
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      youtubeId,
      title: data.title ?? youtubeId,
      channelTitle: data.author_name ?? "",
      thumbnailUrl: data.thumbnail_url ?? thumbFor(youtubeId),
      durationSec: 0,
    };
  } catch {
    return null;
  }
}

/** Tìm kiếm video (an toàn cho trẻ: safeSearch=strict, embeddable). Cần API key. */
export async function searchVideos(query: string, max = 12): Promise<VideoMeta[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(max),
    safeSearch: "strict",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    key,
  });
  const res = await fetch(`${API}/search?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`YouTube API lỗi ${res.status}`);
  const data = await res.json();
  const ids: string[] = (data.items ?? [])
    .map((i: { id?: { videoId?: string } }) => i.id?.videoId)
    .filter(Boolean);
  if (ids.length === 0) return [];

  const detailRes = await fetch(
    `${API}/videos?part=snippet,contentDetails&id=${ids.join(",")}&key=${key}`,
    { cache: "no-store" },
  );
  if (!detailRes.ok) throw new Error(`YouTube API lỗi ${detailRes.status}`);
  const detail = await detailRes.json();
  return (detail.items ?? []).map(
    (item: {
      id: string;
      snippet: {
        title: string;
        channelTitle?: string;
        thumbnails?: { high?: { url: string } };
      };
      contentDetails?: { duration?: string };
    }) => ({
      youtubeId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle ?? "",
      thumbnailUrl: item.snippet.thumbnails?.high?.url ?? thumbFor(item.id),
      durationSec: parseIsoDuration(item.contentDetails?.duration ?? ""),
    }),
  );
}
