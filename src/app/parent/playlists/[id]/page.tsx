import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AddVideoPanel from "@/components/AddVideoPanel";
import AssignChips from "@/components/AssignChips";
import ParentShell from "@/components/ParentShell";
import {
  DeletePlaylistButton,
  EditPlaylistDialog,
  PublishToggle,
  RemoveVideoButton,
} from "@/components/PlaylistActions";
import { getCurrentParent } from "@/lib/auth";
import { ageGroupLabel, formatDuration } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { hasApiKey } from "@/lib/youtube";

export default async function PlaylistDetailPage({
  params,
}: PageProps<"/parent/playlists/[id]">) {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");

  const { id } = await params;
  const playlist = await prisma.playlist.findFirst({
    where: { id, ownerId: parent.id },
    include: {
      items: { include: { video: true }, orderBy: { position: "asc" } },
      assignments: { select: { kidId: true } },
    },
  });
  if (!playlist) notFound();

  const kids = await prisma.kid.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, avatar: true },
  });

  return (
    <ParentShell parentName={parent.name} active="overview">
      <Link href="/parent" className="text-sm text-muted hover:text-brand">
        ← Về tổng quan
      </Link>

      <div className="mt-4 rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="text-5xl">{playlist.emoji}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{playlist.title}</h1>
            <p className="text-sm text-muted">{playlist.description || "Chưa có mô tả"}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              <span>👶 {ageGroupLabel(playlist.ageGroup)}</span>
              <span>🎬 {playlist.items.length} video đã duyệt</span>
              <span>📥 {playlist.copyCount} phụ huynh đã lưu</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PublishToggle playlist={playlist} />
            <EditPlaylistDialog playlist={playlist} />
            <DeletePlaylistButton playlistId={playlist.id} />
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold text-muted">Gán playlist này cho bé:</p>
          <AssignChips
            playlistId={playlist.id}
            kids={kids}
            assignedKidIds={playlist.assignments.map((a) => a.kidId)}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <h2 className="mb-3 text-lg font-bold">Video trong playlist</h2>
          {playlist.items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">
              Playlist đang trống. Thêm video ở khung bên cạnh — bé chỉ xem được những video này.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {playlist.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-line bg-surface p-3"
                >
                  <Image
                    src={item.video.thumbnailUrl}
                    alt=""
                    width={128}
                    height={72}
                    unoptimized
                    className="h-[72px] w-[128px] shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">{item.video.title}</p>
                    <p className="text-xs text-muted">
                      {item.video.channelTitle}
                      {item.video.durationSec
                        ? ` · ${formatDuration(item.video.durationSec)}`
                        : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${item.video.youtubeId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted underline-offset-4 hover:underline"
                      >
                        Xem thử
                      </a>
                      <RemoveVideoButton playlistId={playlist.id} videoId={item.videoId} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <AddVideoPanel
          playlistId={playlist.id}
          searchEnabled={hasApiKey()}
          existingYoutubeIds={playlist.items.map((i) => i.video.youtubeId)}
        />
      </div>
    </ParentShell>
  );
}
