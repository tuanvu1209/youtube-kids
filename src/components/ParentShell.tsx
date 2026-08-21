import Link from "next/link";
import { logoutAction } from "@/lib/actions";

type Props = {
  parentName: string;
  active: "overview" | "community" | "admin";
  isAdmin?: boolean;
  children: React.ReactNode;
};

export default function ParentShell({ parentName, active, isAdmin, children }: Props) {
  const linkClass = (key: Props["active"]) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      active === key ? "bg-brand text-white" : "hover:bg-brand/10"
    }`;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <Link
            href="/parent"
            className="mr-2 text-lg font-bold"
            style={{ fontFamily: "var(--font-baloo)" }}
          >
            <span className="text-brand">Kid</span>Tube
            <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
              Phụ huynh
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/parent" className={linkClass("overview")}>
              Tổng quan
            </Link>
            <Link href="/parent/community" className={linkClass("community")}>
              Cộng đồng
            </Link>
            {isAdmin && (
              <Link href="/parent/admin/reports" className={linkClass("admin")}>
                🛡️ Admin
              </Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/kids"
              className="rounded-full bg-sun px-4 py-2 text-sm font-bold text-black transition hover:brightness-95"
            >
              🧸 Chế độ trẻ em
            </Link>
            <span className="hidden text-sm text-muted sm:inline">{parentName}</span>
            <form action={logoutAction}>
              <button className="text-sm text-muted underline-offset-4 hover:underline">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
