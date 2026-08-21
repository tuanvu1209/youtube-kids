"use client";

import { useActionState, useState, useTransition } from "react";
import Modal from "@/components/Modal";
import {
  copyPlaylistAction,
  reportVideoAction,
  toggleLikeAction,
  type ActionState,
} from "@/lib/actions";

export function LikeButton({
  playlistId,
  liked,
  count,
}: {
  playlistId: string;
  liked: boolean;
  count: number;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => void (await toggleLikeAction(playlistId)))}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
        liked ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:border-brand"
      }`}
    >
      {liked ? "❤️" : "🤍"} {count}
    </button>
  );
}

export function CopyPlaylistButton({
  playlistId,
  alreadyCopied,
}: {
  playlistId: string;
  alreadyCopied: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending || alreadyCopied}
      onClick={() => startTransition(async () => void (await copyPlaylistAction(playlistId)))}
      className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
    >
      {alreadyCopied ? "✓ Đã có trong thư viện" : pending ? "Đang lưu…" : "📥 Lưu về thư viện"}
    </button>
  );
}

export function ReportVideoDialog({
  videoId,
  videoTitle,
}: {
  videoId: string;
  videoTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(reportVideoAction, {} as ActionState);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline-offset-4 hover:text-brand hover:underline"
      >
        🚩 Báo nội dung xấu
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Báo cáo video">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="videoId" value={videoId} />
          <p className="text-sm text-muted">{videoTitle}</p>
          <textarea
            name="reason"
            rows={3}
            className="w-full rounded-2xl border border-line bg-background px-4 py-3 outline-none focus:border-brand"
            placeholder="Lý do: quảng cáo trá hình, hình ảnh đáng sợ…"
          />
          {state?.error && <p className="text-sm text-brand">{state.error}</p>}
          {state?.ok ? (
            <p className="text-sm text-grass">
              Đã ghi nhận. Cảm ơn bạn đã giúp cộng đồng an toàn hơn!
            </p>
          ) : (
            <button
              disabled={pending}
              className="rounded-2xl bg-brand px-4 py-3 font-bold text-white disabled:opacity-60"
            >
              {pending ? "Đang gửi…" : "Gửi báo cáo"}
            </button>
          )}
        </form>
      </Modal>
    </>
  );
}
