"use client";

import { useActionState, useState, useTransition } from "react";
import Modal from "@/components/Modal";
import {
  deletePlaylistAction,
  removeVideoAction,
  togglePublishAction,
  updatePlaylistAction,
  type ActionState,
} from "@/lib/actions";
import { AGE_GROUPS, PLAYLIST_EMOJIS } from "@/lib/constants";

const inputClass =
  "w-full rounded-2xl border border-line bg-background px-4 py-3 outline-none focus:border-brand";

type Playlist = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  ageGroup: string;
  isPublic: boolean;
};

export function PublishToggle({ playlist }: { playlist: Playlist }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => void (await togglePublishAction(playlist.id)))}
      className={`rounded-full px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${
        playlist.isPublic
          ? "bg-grass/15 text-grass hover:bg-grass/25"
          : "bg-brand text-white hover:bg-brand-dark"
      }`}
    >
      {playlist.isPublic ? "✓ Đang chia sẻ cộng đồng" : "Chia sẻ cho cộng đồng"}
    </button>
  );
}

export function EditPlaylistDialog({ playlist }: { playlist: Playlist }) {
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState(playlist.emoji);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updatePlaylistAction(prev, formData);
      if (result?.ok) setOpen(false);
      return result;
    },
    {} as ActionState,
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-brand"
      >
        Chỉnh sửa
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Chỉnh sửa playlist">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="playlistId" value={playlist.id} />
          <input type="hidden" name="emoji" value={emoji} />

          <div className="flex flex-wrap gap-2">
            {PLAYLIST_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`h-11 w-11 rounded-2xl text-xl transition ${
                  emoji === e ? "bg-brand/15 ring-2 ring-brand" : "bg-background"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Tên playlist
            <input name="title" className={inputClass} defaultValue={playlist.title} required />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Mô tả
            <input name="description" className={inputClass} defaultValue={playlist.description} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Nhóm tuổi
            <select name="ageGroup" className={inputClass} defaultValue={playlist.ageGroup}>
              {AGE_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label} · {g.hint}
                </option>
              ))}
            </select>
          </label>

          {state?.error && <p className="text-sm text-brand">{state.error}</p>}

          <button
            disabled={pending}
            className="rounded-2xl bg-brand px-4 py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function DeletePlaylistButton({ playlistId }: { playlistId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-full border border-line px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand"
      >
        Xoá
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-muted">Xoá hẳn playlist?</span>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => void (await deletePlaylistAction(playlistId)))}
        className="rounded-full bg-brand px-3 py-1.5 font-bold text-white disabled:opacity-60"
      >
        Xoá
      </button>
      <button onClick={() => setConfirming(false)} className="text-muted underline">
        Huỷ
      </button>
    </span>
  );
}

export function RemoveVideoButton({
  playlistId,
  videoId,
}: {
  playlistId: string;
  videoId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => void (await removeVideoAction(playlistId, videoId)))
      }
      className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-brand hover:text-brand disabled:opacity-60"
    >
      {pending ? "…" : "Gỡ"}
    </button>
  );
}
