"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionState } from "@/lib/actions";

type Props = {
  mode: "login" | "register";
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand";

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isRegister && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tên của bạn
          <input name="name" className={inputClass} placeholder="Mẹ Bống" required />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          className={inputClass}
          placeholder="bame@email.com"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Mật khẩu
        <input
          name="password"
          type="password"
          className={inputClass}
          placeholder="Ít nhất 6 ký tự"
          required
        />
      </label>

      {isRegister && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Mã PIN 4 số
          <input
            name="pin"
            inputMode="numeric"
            maxLength={4}
            className={inputClass}
            placeholder="1234"
            defaultValue="1234"
            required
          />
          <span className="text-xs font-normal text-muted">
            Dùng để thoát khỏi chế độ trẻ em — bé sẽ không tự ra được.
          </span>
        </label>
      )}

      {state?.error && (
        <p className="rounded-2xl bg-brand/10 px-4 py-3 text-sm text-brand">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-brand px-4 py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
      </button>

      <p className="text-center text-sm text-muted">
        {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <Link
          href={isRegister ? "/parent/login" : "/parent/register"}
          className="font-semibold text-brand"
        >
          {isRegister ? "Đăng nhập" : "Đăng ký"}
        </Link>
      </p>
    </form>
  );
}
