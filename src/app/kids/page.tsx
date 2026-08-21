import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { ageGroupLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function KidPickerPage() {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");

  const kids = await prisma.kid.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { assignments: true } } },
  });

  return (
    <main className="kid-bg flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1
        className="mb-2 text-center text-4xl font-extrabold"
        style={{ fontFamily: "var(--font-baloo)" }}
      >
        Ai đang xem nào?
      </h1>
      <p className="mb-10 text-muted">Chạm vào hình của con</p>

      {kids.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface/70 p-10 text-center">
          <p className="mb-4 text-muted">Chưa có hồ sơ bé nào.</p>
          <Link
            href="/parent"
            className="rounded-full bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark"
          >
            Tạo hồ sơ cho bé
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8">
          {kids.map((kid) => (
            <Link
              key={kid.id}
              href={`/kids/${kid.id}`}
              className="pop-in flex w-40 flex-col items-center gap-3 rounded-3xl bg-surface/80 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <span className="text-6xl">{kid.avatar}</span>
              <span className="text-xl font-bold">{kid.name}</span>
              <span className="text-xs text-muted">{ageGroupLabel(kid.ageGroup)}</span>
              <span className="text-xs text-muted">{kid._count.assignments} playlist</span>
            </Link>
          ))}
        </div>
      )}

      <Link href="/parent" className="mt-12 text-sm text-muted underline-offset-4 hover:underline">
        ← Về khu vực phụ huynh
      </Link>
    </main>
  );
}
