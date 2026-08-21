"use client";

import { useTransition } from "react";
import { setVideoHiddenAction } from "@/lib/actions";

export function HideVideoButton({
  videoId,
  hidden,
}: {
  videoId: string;
  hidden: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setVideoHiddenAction(videoId, !hidden);
        })
      }
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
        hidden
          ? "bg-grass/15 text-grass hover:bg-grass/25"
          : "bg-brand/15 text-brand hover:bg-brand/25"
      }`}
    >
      {pending ? "…" : hidden ? "✓ Khôi phục" : "🚫 Ẩn video"}
    </button>
  );
}
