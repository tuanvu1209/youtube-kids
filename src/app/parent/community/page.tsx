import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyPlaylistButton, LikeButton, ReportVideoDialog } from "@/components/CommunityActions";
import ParentShell from "@/components/ParentShell";
import { getCurrentParent } from "@/lib/auth";
import { AGE_GROUPS, ageGroupLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function CommunityPage({ searchParams }: PageProps<"/parent/community">) {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");

  const { age } = await searchParams;
  const ageFilter = typeof age === "string" && age !== "all" ? age : undefined;

  const [playlists, myPlaylists] = await Promise.all([
    prisma.playlist.findMany({
      where: { isPublic: true, ...(ageFilter ? { ageGroup: ageFilter } : {}) },
      include: {
        owner: { select: { name: true } },
        likes: { select: { parentId: true } },
        items: {
          take: 4,
          orderBy: { position: "asc" },
          include: { video: true },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.playlist.findMany({
      where: { ownerId: parent.id },
      select: { copiedFrom: true },
    }),
  ]);

  const copiedIds = new Set(myPlaylists.map((p) => p.copiedFrom).filter(Boolean));

  const ranked = playlists.sort(
    (a, b) => b.likes.length + b.copyCount - (a.likes.length + a.copyCount),
  );

  return (
    <ParentShell parentName={parent.name} active="community">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Playlist từ cộng đồng phụ huynh</h1>
        <p className="text-sm text-muted">
          Mỗi playlist ở đây đều do một phụ huynh thật ngồi xem và duyệt từng video. Lưu về thư
          viện là dùng được ngay cho bé nhà bạn.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip label="Tất cả" value="all" active={!ageFilter} />
        {AGE_GROUPS.map((g) => (
          <FilterChip key={g.value} label={g.label} value={g.value} active={ageFilter === g.value} />
        ))}
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center text-sm text-muted">
          Chưa có playlist nào được chia sẻ ở nhóm tuổi này. Bạn có thể là người đầu tiên — mở một
          playlist của mình rồi bấm “Chia sẻ cho cộng đồng”.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {ranked.map((p) => {
            const liked = p.likes.some((l) => l.parentId === parent.id);
            const mine = p.ownerId === parent.id;
            return (
              <article key={p.id} className="rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold">{p.title}</h2>
                    <p className="text-sm text-muted">{p.description || "Không có mô tả"}</p>
                    <p className="mt-1 text-xs text-muted">
                      bởi {mine ? "bạn" : p.owner.name} · {ageGroupLabel(p.ageGroup)} ·{" "}
                      {p._count.items} video
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {p.items.map((item) => (
                    <div key={item.id} className="group relative">
                      <Image
                        src={item.video.thumbnailUrl}
                        alt={item.video.title}
                        width={160}
                        height={90}
                        unoptimized
                        className="aspect-video w-full rounded-xl object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <LikeButton playlistId={p.id} liked={liked} count={p.likes.length} />
                  <span className="text-xs text-muted">📥 {p.copyCount} lượt lưu</span>
                  {mine ? (
                    <Link
                      href={`/parent/playlists/${p.id}`}
                      className="ml-auto rounded-full border border-line px-4 py-2 text-xs font-bold transition hover:border-brand"
                    >
                      Quản lý playlist
                    </Link>
                  ) : (
                    <div className="ml-auto flex items-center gap-3">
                      {p.items[0] && (
                        <ReportVideoDialog
                          videoId={p.items[0].videoId}
                          videoTitle={p.items[0].video.title}
                        />
                      )}
                      <CopyPlaylistButton playlistId={p.id} alreadyCopied={copiedIds.has(p.id)} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ParentShell>
  );
}

function FilterChip({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <Link
      href={`/parent/community?age=${value}`}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active ? "border-brand bg-brand text-white" : "border-line text-muted hover:border-brand"
      }`}
    >
      {label}
    </Link>
  );
}
