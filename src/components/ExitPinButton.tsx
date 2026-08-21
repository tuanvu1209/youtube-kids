"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/Modal";
import { verifyPinAction, type ActionState } from "@/lib/actions";

export default function ExitPinButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(verifyPinAction, {} as ActionState);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-black shadow transition hover:bg-white"
        title="Chỉ bố mẹ mới mở được"
      >
        🔒 Thoát
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nhập mã PIN của bố mẹ">
        <form action={formAction} className="flex flex-col gap-4">
          <input
            name="pin"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            className="w-full rounded-2xl border border-line bg-background px-4 py-4 text-center text-3xl tracking-[0.5em] outline-none focus:border-brand"
            placeholder="••••"
          />
          {state?.error && <p className="text-sm text-brand">{state.error}</p>}
          <button
            disabled={pending}
            className="rounded-2xl bg-brand px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {pending ? "Đang kiểm tra…" : "Mở khoá"}
          </button>
        </form>
      </Modal>
    </>
  );
}
