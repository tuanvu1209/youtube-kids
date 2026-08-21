import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/actions";
import { getCurrentParent } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentParent()) redirect("/parent");

  return (
    <main className="kid-bg flex flex-1 items-center justify-center px-6 py-16">
      <div className="pop-in w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-xl shadow-black/5">
        <Link href="/" className="text-xl font-bold" style={{ fontFamily: "var(--font-baloo)" }}>
          <span className="text-brand">Kid</span>Tube
        </Link>
        <h1 className="mt-4 mb-6 text-2xl font-bold">Chào mừng bố mẹ trở lại</h1>
        <AuthForm mode="login" action={loginAction} />
      </div>
    </main>
  );
}
