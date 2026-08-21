import Link from "next/link";
import { redirect } from "next/navigation";
import AssignChips from "@/components/AssignChips";
import KidDialog from "@/components/KidDialog";
import NewPlaylistDialog from "@/components/NewPlaylistDialog";
import ParentShell from "@/components/ParentShell";
import { getCurrentParent } from "@/lib/auth";
import { ageGroupLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function ParentDashboard() {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [kids, playlists] = await Promise.all([
    prisma.kid.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "asc" },
      include: {
        assignments: { select: { playlistId: true } },
        watches: {
          where: { createdAt: { gte: startOfDay } },
          select: { seconds: true },
        },
      },
    }),
    prisma.playlist.findMany({
      where: { ownerId: parent.id },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: { select: { kidId: true } },
        _count: { select: { items: true, likes: true } },
      },
    }),
  ]);

  const kidChips = kids.map((k) => ({ id: k.id, name: k.name, avatar: k.avatar }));

  return (
    <ParentShell
      parentName={parent.name}
      active="overview"
      isAdmin={parent.email === (process.env.ADMIN_EMAIL ?? "demo@kidtube.vn")}
    >
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hồ sơ các bé</h1>
          <KidDialog
            trigger={
              <span className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-bold transition hover:border-brand">
                + Thêm bé
              </span>
            }
          />
        </div>

        {kids.length === 0 ? (
          <EmptyBox text="Tạo hồ sơ cho bé để bắt đầu gán playlist an toàn." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kids.map((kid) => {
              const watchedMin = Math.round(
                kid.watches.reduce((sum, w) => sum + w.seconds, 0) / 60,
              );
              const percent = Math.min(100, (watchedMin / kid.dailyLimitMin) * 100);
              return (
                <div key={kid.id} className="rounded-3xl border border-line bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{kid.avatar}</span>
                    <div>
                      <div className="text-lg font-bold">{kid.name}</div>
                      <div className="text-xs text-muted">{ageGroupLabel(kid.ageGroup)}</div>
                    </div>
                    <KidDialog
                      kid={kid}
                      trigger={
                        <span className="ml-auto cursor-pointer text-xs text-muted hover:text-brand">
                          Sửa
                        </span>
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>Đã xem hôm nay</span>
                      <span>
                        {watchedMin}/{kid.dailyLimitMin} phút
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-grass"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted">
                    {kid.assignments.length} playlist được gán
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Playlist của tôi</h2>
          <NewPlaylistDialog />
        </div>

        {playlists.length === 0 ? (
          <EmptyBox
            text="Chưa có playlist nào. Tạo mới, hoặc sang tab Cộng đồng để sao chép playlist của phụ huynh khác."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {playlists.map((p) => (
              <div key={p.id} className="rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/parent/playlists/${p.id}`}
                      className="text-lg font-bold hover:text-brand"
                    >
                      {p.title}
                    </Link>
                    <p className="truncate text-sm text-muted">
                      {p.description || "Không có mô tả"}
                    </p>
                  </div>
                  {p.isPublic && (
                    <span className="rounded-full bg-grass/15 px-2.5 py-1 text-xs font-semibold text-grass">
                      Đã chia sẻ
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span>🎬 {p._count.items} video</span>
                  <span>👶 {ageGroupLabel(p.ageGroup)}</span>
                  <span>❤️ {p._count.likes}</span>
                  <span>📥 {p.copyCount} lượt lưu</span>
                  {p.copiedFrom && <span>🔁 sao chép từ cộng đồng</span>}
                </div>

                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-xs font-semibold text-muted">Gán cho bé:</p>
                  <AssignChips
                    playlistId={p.id}
                    kids={kidChips}
                    assignedKidIds={p.assignments.map((a) => a.kidId)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ParentShell>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface/60 p-8 text-center text-sm text-muted">
      {text}
    </div>
  );
}
