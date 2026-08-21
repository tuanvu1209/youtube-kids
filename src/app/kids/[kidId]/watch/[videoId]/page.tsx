import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import KidHeader from "@/components/KidHeader";
import KidPlayer from "@/components/KidPlayer";
import KidVideoCard from "@/components/KidVideoCard";
import { getCurrentParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function WatchPage({ params }: PageProps<"/kids/[kidId]/watch/[videoId]">) {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");

  const { kidId, videoId } = await params;
  const kid = await prisma.kid.findFirst({
    where: { id: kidId, parentId: parent.id },
    include: { assignments: { select: { playlistId: true } } },
  });
  if (!kid) notFound();

  const allowedPlaylistIds = kid.assignments.map((a) => a.playlistId);

  // Chốt chặn whitelist: video phải nằm trong playlist đã được gán cho đúng bé này.
  const item = await prisma.playlistItem.findFirst({
    where: { videoId, playlistId: { in: allowedPlaylistIds } },
    include: { video: true, playlist: true },
  });
  if (!item) {
    return (
      <div className="kid-bg flex flex-1 flex-col">
        <KidHeader
          avatar={kid.avatar}
          name={kid.name}
          remainingMin={kid.dailyLimitMin}
          limitMin={kid.dailyLimitMin}
        />
        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-5 py-16">
          <div className="rounded-3xl bg-surface/90 p-12 text-center shadow-lg">
            <div className="text-6xl">🚫</div>
            <h1 className="mt-4 text-2xl font-bold">Video này chưa được bố mẹ duyệt</h1>
            <p className="mt-2 text-muted">
              KidTube chỉ phát những video nằm trong playlist bố mẹ đã chọn cho {kid.name}.
            </p>
            <Link
              href={`/kids/${kid.id}`}
              className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white"
            >
              Quay lại trang chính
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = await prisma.watchEvent.aggregate({
    where: { kidId: kid.id, createdAt: { gte: startOfDay } },
    _sum: { seconds: true },
  });
  const watchedSec = today._sum.seconds ?? 0;
  const limitSec = kid.dailyLimitMin * 60;
  const remainingMin = Math.max(0, Math.ceil((limitSec - watchedSec) / 60));

  const siblings = await prisma.playlistItem.findMany({
    where: { playlistId: item.playlistId, NOT: { videoId } },
    include: { video: true },
    orderBy: { position: "asc" },
  });

  return (
    <div className="kid-bg flex flex-1 flex-col">
      <KidHeader
        avatar={kid.avatar}
        name={kid.name}
        remainingMin={remainingMin}
        limitMin={kid.dailyLimitMin}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">
        <Link
          href={`/kids/${kid.id}`}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface/90 px-4 py-2 text-sm font-bold shadow"
        >
          ← Về trang chính
        </Link>

        {watchedSec >= limitSec ? (
          <div className="rounded-3xl bg-surface/90 p-12 text-center shadow-lg">
            <div className="text-6xl">😴</div>
            <h2
              className="mt-4 text-3xl font-extrabold"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              Hết giờ xem hôm nay rồi!
            </h2>
            <p className="mt-2 text-muted">Mai mình xem tiếp nhé.</p>
          </div>
        ) : (
          <KidPlayer
            kidId={kid.id}
            videoId={item.videoId}
            youtubeId={item.video.youtubeId}
            title={item.video.title}
          />
        )}

        <h1 className="mt-4 text-xl font-bold">{item.video.title}</h1>
        <p className="text-sm text-muted">
          {item.video.channelTitle} · trong playlist {item.playlist.emoji} {item.playlist.title}
        </p>

        {siblings.length > 0 && (
          <section className="mt-8">
            <h2
              className="mb-3 text-2xl font-extrabold"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              Xem tiếp nhé
            </h2>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {siblings.map((sib) => (
                <KidVideoCard
                  key={sib.id}
                  href={`/kids/${kid.id}/watch/${sib.videoId}?p=${item.playlistId}`}
                  title={sib.video.title}
                  thumbnailUrl={sib.video.thumbnailUrl}
                  durationSec={sib.video.durationSec}
                  channelTitle={sib.video.channelTitle}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
