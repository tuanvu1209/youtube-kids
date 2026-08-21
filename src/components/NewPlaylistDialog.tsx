"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/Modal";
import { createPlaylistAction, type ActionState } from "@/lib/actions";
import { AGE_GROUPS, PLAYLIST_EMOJIS } from "@/lib/constants";

const inputClass =
  "w-full rounded-2xl border border-line bg-background px-4 py-3 outline-none focus:border-brand";

export default function NewPlaylistDialog({ defaultAgeGroup = "3-5" }: { defaultAgeGroup?: string }) {
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState(PLAYLIST_EMOJIS[0]);
  const [state, formAction, pending] = useActionState(createPlaylistAction, {} as ActionState);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
      >
        + Tạo playlist
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Playlist mới">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="emoji" value={emoji} />

          <div>
            <p className="mb-2 text-sm font-medium">Biểu tượng</p>
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
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Tên playlist
            <input name="title" className={inputClass} placeholder="Bài hát tiếng Anh cho bé" required />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Mô tả ngắn
            <input
              name="description"
              className={inputClass}
              placeholder="Nhạc thiếu nhi vui nhộn, không quảng cáo"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Phù hợp nhóm tuổi
            <select name="ageGroup" className={inputClass} defaultValue={defaultAgeGroup}>
              {AGE_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label} · {g.hint}
                </option>
              ))}
            </select>
          </label>

          {state?.error && (
            <p className="rounded-2xl bg-brand/10 px-4 py-3 text-sm text-brand">{state.error}</p>
          )}

          <button
            disabled={pending}
            className="rounded-2xl bg-brand px-4 py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Đang tạo…" : "Tạo và thêm video"}
          </button>
        </form>
      </Modal>
    </>
  );
}
