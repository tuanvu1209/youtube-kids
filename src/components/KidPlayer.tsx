"use client";

import { useEffect, useRef, useState } from "react";

const HEARTBEAT_SEC = 15;

export default function KidPlayer({
  kidId,
  videoId,
  youtubeId,
  title,
}: {
  kidId: string;
  videoId: string;
  youtubeId: string;
  title: string;
}) {
  const [exhausted, setExhausted] = useState(false);
  const visibleRef = useRef(true);

  useEffect(() => {
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    const timer = setInterval(async () => {
      if (!visibleRef.current) return;
      try {
        const res = await fetch("/api/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kidId, videoId, seconds: HEARTBEAT_SEC }),
        });
        const data = await res.json();
        if (data?.exhausted) setExhausted(true);
      } catch {
        /* mất mạng thì bỏ qua nhịp này */
      }
    }, HEARTBEAT_SEC * 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [kidId, videoId]);

  if (exhausted) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-3xl bg-surface text-center shadow-lg">
        <div className="text-6xl">😴</div>
        <h2 className="mt-4 text-2xl font-extrabold" style={{ fontFamily: "var(--font-baloo)" }}>
          Hết giờ xem hôm nay rồi!
        </h2>
        <p className="mt-2 text-muted">Mai mình xem tiếp nhé.</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl">
      <iframe
        key={youtubeId}
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
