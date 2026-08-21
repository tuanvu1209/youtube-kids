import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import KidHeader from "@/components/KidHeader";
import KidVideoCard from "@/components/KidVideoCard";
import { getCurrentParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function KidHomePage({ params }: PageProps<"/kids/[kidId]">) {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");

  const { kidId } = await params;
  const kid = await prisma.kid.findFirst({
    where: { id: kidId, parentId: parent.id },
    include: {
      assignments: {
        include: {
          playlist: {
            include: {
              items: { include: { video: true }, orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!kid) notFound();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = await prisma.watchEvent.aggregate({
    where: { kidId: kid.id, createdAt: { gte: startOfDay } },
    _sum: { seconds: true },
  });
  const watchedSec = today._sum.seconds ?? 0;
  const limitSec = kid.dailyLimitMin * 60;
  const remainingMin = Math.max(0, Math.ceil((limitSec - watchedSec) / 60));

  const playlists = kid.assignments
    .map((a) => a.playlist)
    .filter((p) => p.items.length > 0);

  return (
    <div className="kid-bg flex flex-1 flex-col">
      <KidHeader
        avatar={kid.avatar}
        name={kid.name}
        remainingMin={remainingMin}
        limitMin={kid.dailyLimitMin}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {watchedSec >= limitSec ? (
          <TimeUp name={kid.name} />
        ) : playlists.length === 0 ? (
          <div className="rounded-3xl bg-surface/90 p-12 text-center shadow-lg">
            <div className="text-6xl">🎈</div>
            <h2 className="mt-4 text-2xl font-bold">Chưa có video nào cho {kid.name}</h2>
            <p className="mt-2 text-muted">
              Bố mẹ hãy vào khu vực phụ huynh để gán playlist cho bé nhé.
            </p>
            <Link
              href="/parent"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white"
            >
              Mở khu vực phụ huynh
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {playlists.map((playlist) => (
              <section key={playlist.id} className="pop-in">
                <h2
                  className="mb-3 flex items-center gap-2 text-2xl font-extrabold"
                  style={{ fontFamily: "var(--font-baloo)" }}
                >
                  <span className="text-3xl">{playlist.emoji}</span>
                  {playlist.title}
                </h2>
                <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                  {playlist.items.map((item) => (
                    <KidVideoCard
                      key={item.id}
                      href={`/kids/${kid.id}/watch/${item.video.id}?p=${playlist.id}`}
                      title={item.video.title}
                      thumbnailUrl={item.video.thumbnailUrl}
                      durationSec={item.video.durationSec}
                      channelTitle={item.video.channelTitle}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TimeUp({ name }: { name: string }) {
  return (
    <div className="rounded-3xl bg-surface/90 p-12 text-center shadow-lg">
      <div className="text-6xl">😴</div>
      <h2 className="mt-4 text-3xl font-extrabold" style={{ fontFamily: "var(--font-baloo)" }}>
        Hết giờ xem hôm nay rồi, {name} ơi!
      </h2>
      <p className="mt-2 text-muted">
        Mai mình xem tiếp nhé. Giờ ra ngoài chơi một chút thôi nào!
      </p>
    </div>
  );
}
