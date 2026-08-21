"use client";

import { useActionState, useState, useTransition } from "react";
import Modal from "@/components/Modal";
import {
  createKidAction,
  deleteKidAction,
  updateKidAction,
  type ActionState,
} from "@/lib/actions";
import { AGE_GROUPS, AVATARS } from "@/lib/constants";

type Kid = {
  id: string;
  name: string;
  avatar: string;
  ageGroup: string;
  dailyLimitMin: number;
};

const inputClass =
  "w-full rounded-2xl border border-line bg-background px-4 py-3 outline-none focus:border-brand";

export default function KidDialog({
  kid,
  trigger,
}: {
  kid?: Kid;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [avatar, setAvatar] = useState(kid?.avatar ?? AVATARS[0]);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await (kid ? updateKidAction : createKidAction)(prev, formData);
      if (result?.ok) setOpen(false);
      return result;
    },
    {} as ActionState,
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="contents">
        {trigger}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={kid ? `Chỉnh hồ sơ ${kid.name}` : "Thêm hồ sơ cho bé"}
      >
        <form action={formAction} className="flex flex-col gap-4">
          {kid && <input type="hidden" name="kidId" value={kid.id} />}
          <input type="hidden" name="avatar" value={avatar} />

          <div>
            <p className="mb-2 text-sm font-medium">Chọn hình đại diện</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`h-12 w-12 rounded-2xl text-2xl transition ${
                    avatar === a ? "bg-brand/15 ring-2 ring-brand" : "bg-background"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Tên bé
            <input
              name="name"
              className={inputClass}
              defaultValue={kid?.name}
              placeholder="Bông"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Nhóm tuổi
            <select name="ageGroup" className={inputClass} defaultValue={kid?.ageGroup ?? "3-5"}>
              {AGE_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label} · {g.hint}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Giới hạn mỗi ngày (phút)
            <input
              name="dailyLimitMin"
              type="number"
              min={1}
              max={240}
              className={inputClass}
              defaultValue={kid?.dailyLimitMin ?? 30}
            />
          </label>

          {state?.error && (
            <p className="rounded-2xl bg-brand/10 px-4 py-3 text-sm text-brand">{state.error}</p>
          )}

          <button
            disabled={pending}
            className="rounded-2xl bg-brand px-4 py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Lưu"}
          </button>
        </form>

        {kid &&
          (confirmingDelete ? (
            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4 text-sm">
              <span className="text-muted">Xoá hồ sơ {kid.name} và lịch sử xem?</span>
              <button
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    await deleteKidAction(kid.id);
                    setOpen(false);
                  })
                }
                className="rounded-full bg-brand px-3 py-1.5 font-bold text-white disabled:opacity-60"
              >
                Xoá
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="text-muted underline">
                Huỷ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="mt-4 w-full border-t border-line pt-4 text-sm text-muted hover:text-brand"
            >
              Xoá hồ sơ này
            </button>
          ))}
      </Modal>
    </>
  );
}
