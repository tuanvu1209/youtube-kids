"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addVideoByLinkAction,
  addVideoFromSearchAction,
  type ActionState,
} from "@/lib/actions";
import { formatDuration } from "@/lib/constants";
import type { VideoMeta } from "@/lib/youtube";

const inputClass =
  "w-full rounded-2xl border border-line bg-background px-4 py-3 outline-none focus:border-brand";

export default function AddVideoPanel({
  playlistId,
  searchEnabled,
  existingYoutubeIds,
}: {
  playlistId: string;
  searchEnabled: boolean;
  existingYoutubeIds: string[];
}) {
  const [tab, setTab] = useState<"search" | "link">(searchEnabled ? "search" : "link");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VideoMeta[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [linkState, linkAction, linkPending] = useActionState(
    addVideoByLinkAction,
    {} as ActionState,
  );

  const inPlaylist = (id: string) => existingYoutubeIds.includes(id) || added.includes(id);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tìm kiếm thất bại");
      setResults(data.items ?? []);
      if ((data.items ?? []).length === 0) setSearchError("Không tìm thấy video phù hợp.");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Tìm kiếm thất bại");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  const tabClass = (key: typeof tab) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      tab === key ? "bg-brand text-white" : "bg-background text-muted hover:text-foreground"
    }`;

  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-lg font-bold">Thêm video vào playlist</h2>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab("search")} className={tabClass("search")}>
          🔍 Tìm trên YouTube
        </button>
        <button onClick={() => setTab("link")} className={tabClass("link")}>
          🔗 Dán link
        </button>
      </div>

      {tab === "search" ? (
        <>
          {!searchEnabled && (
            <p className="mb-3 rounded-2xl bg-sun/15 px-4 py-3 text-sm">
              Chưa có <code>YOUTUBE_API_KEY</code> trong file <code>.env</code>. Bạn vẫn thêm được
              video bằng cách dán link.
            </p>
          )}
          <form onSubmit={runSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={inputClass}
              placeholder="Ví dụ: bài hát chữ cái tiếng Việt"
            />
            <button
              disabled={searching || !searchEnabled}
              className="rounded-2xl bg-brand px-6 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {searching ? "…" : "Tìm"}
            </button>
          </form>

          {searchError && <p className="mt-3 text-sm text-brand">{searchError}</p>}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {results.map((video) => (
              <div
                key={video.youtubeId}
                className="flex gap-3 rounded-2xl border border-line p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  width={120}
                  height={68}
                  className="h-[68px] w-[120px] shrink-0 rounded-xl object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const id = video.youtubeId;
                    if (img.src.includes("hqdefault")) {
                      img.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
                    } else if (img.src.includes("mqdefault")) {
                      img.src = `https://i.ytimg.com/vi/${id}/default.jpg`;
                    }
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{video.title}</p>
                  <p className="text-xs text-muted">
                    {video.channelTitle}
                    {video.durationSec ? ` · ${formatDuration(video.durationSec)}` : ""}
                  </p>
                  <button
                    disabled={pending || inPlaylist(video.youtubeId)}
                    onClick={() =>
                      startTransition(async () => {
                        await addVideoFromSearchAction(playlistId, video.youtubeId);
                        setAdded((prev) => [...prev, video.youtubeId]);
                      })
                    }
                    className="mt-2 rounded-full bg-grass px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {inPlaylist(video.youtubeId) ? "✓ Đã duyệt" : "+ Duyệt video này"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <form action={linkAction} className="flex flex-col gap-3">
          <input type="hidden" name="playlistId" value={playlistId} />
          <div className="flex gap-2">
            <input
              name="link"
              className={inputClass}
              placeholder="https://www.youtube.com/watch?v=…"
              required
            />
            <button
              disabled={linkPending}
              className="rounded-2xl bg-brand px-6 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {linkPending ? "…" : "Thêm"}
            </button>
          </div>
          {linkState?.error && <p className="text-sm text-brand">{linkState.error}</p>}
          {linkState?.ok && <p className="text-sm text-grass">Đã thêm video vào playlist.</p>}
          <p className="text-xs text-muted">
            Hỗ trợ link dạng youtube.com/watch, youtu.be, /shorts hoặc dán trực tiếp ID video.
          </p>
        </form>
      )}
    </div>
  );
}
