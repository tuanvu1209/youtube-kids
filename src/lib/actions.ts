"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  KID_COOKIE,
  SESSION_COOKIE,
  getCurrentParent,
  hashPassword,
  makeToken,
  requireParent,
  verifyPassword,
} from "@/lib/auth";
import { extractVideoId, fetchVideoMeta, thumbFor, type VideoMeta } from "@/lib/youtube";

export type ActionState = { error?: string; ok?: boolean };

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/* ---------------------------------------------------------------- auth --- */

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();

  if (!name || !email || !password) return { error: "Vui lòng điền đủ thông tin." };
  if (password.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  if (!/^\d{4}$/.test(pin)) return { error: "Mã PIN phải gồm 4 chữ số." };

  const existing = await prisma.parent.findUnique({ where: { email } });
  if (existing) return { error: "Email này đã được đăng ký." };

  const parent = await prisma.parent.create({
    data: { name, email, passwordHash: hashPassword(password), pin },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(parent.id), COOKIE_OPTS);
  redirect("/parent");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const parent = await prisma.parent.findUnique({ where: { email } });
  if (!parent || !verifyPassword(password, parent.passwordHash)) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(parent.id), COOKIE_OPTS);
  redirect("/parent");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(KID_COOKIE);
  redirect("/");
}

/** Cổng PIN: trẻ không tự thoát khỏi chế độ xem được. */
export async function verifyPinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await getCurrentParent();
  if (!parent) return { error: "Phiên đăng nhập đã hết hạn." };
  const pin = String(formData.get("pin") ?? "").trim();
  if (pin !== parent.pin) return { error: "Mã PIN không đúng." };
  redirect("/parent");
}

/* ---------------------------------------------------------------- kids --- */

export async function createKidAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Bé cần có tên." };

  await prisma.kid.create({
    data: {
      parentId: parent.id,
      name,
      avatar: String(formData.get("avatar") ?? "🐻"),
      ageGroup: String(formData.get("ageGroup") ?? "3-5"),
      dailyLimitMin: Number(formData.get("dailyLimitMin") ?? 30) || 30,
    },
  });
  revalidatePath("/parent");
  revalidatePath("/kids");
  return { ok: true };
}

export async function updateKidAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const id = String(formData.get("kidId") ?? "");
  const kid = await prisma.kid.findFirst({ where: { id, parentId: parent.id } });
  if (!kid) return { error: "Không tìm thấy hồ sơ bé." };

  await prisma.kid.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? kid.name).trim() || kid.name,
      avatar: String(formData.get("avatar") ?? kid.avatar),
      ageGroup: String(formData.get("ageGroup") ?? kid.ageGroup),
      dailyLimitMin: Number(formData.get("dailyLimitMin") ?? kid.dailyLimitMin) || kid.dailyLimitMin,
    },
  });
  revalidatePath("/parent");
  revalidatePath("/kids");
  return { ok: true };
}

export async function deleteKidAction(kidId: string) {
  const parent = await requireParent();
  await prisma.kid.deleteMany({ where: { id: kidId, parentId: parent.id } });
  revalidatePath("/parent");
  revalidatePath("/kids");
}

/* ----------------------------------------------------------- playlists --- */

export async function createPlaylistAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Playlist cần có tên." };

  const playlist = await prisma.playlist.create({
    data: {
      ownerId: parent.id,
      title,
      description: String(formData.get("description") ?? "").trim(),
      emoji: String(formData.get("emoji") ?? "🎨"),
      ageGroup: String(formData.get("ageGroup") ?? "3-5"),
    },
  });
  revalidatePath("/parent");
  redirect(`/parent/playlists/${playlist.id}`);
}

export async function updatePlaylistAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const id = String(formData.get("playlistId") ?? "");
  const playlist = await prisma.playlist.findFirst({
    where: { id, ownerId: parent.id },
  });
  if (!playlist) return { error: "Không tìm thấy playlist." };

  await prisma.playlist.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? playlist.title).trim() || playlist.title,
      description: String(formData.get("description") ?? playlist.description),
      emoji: String(formData.get("emoji") ?? playlist.emoji),
      ageGroup: String(formData.get("ageGroup") ?? playlist.ageGroup),
    },
  });
  revalidatePath(`/parent/playlists/${id}`);
  revalidatePath("/parent");
  return { ok: true };
}

export async function deletePlaylistAction(playlistId: string) {
  const parent = await requireParent();
  await prisma.playlist.deleteMany({ where: { id: playlistId, ownerId: parent.id } });
  revalidatePath("/parent");
  redirect("/parent");
}

export async function togglePublishAction(playlistId: string) {
  const parent = await requireParent();
  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, ownerId: parent.id },
  });
  if (!playlist) return;
  await prisma.playlist.update({
    where: { id: playlistId },
    data: { isPublic: !playlist.isPublic },
  });
  revalidatePath(`/parent/playlists/${playlistId}`);
  revalidatePath("/parent/community");
  revalidatePath("/parent");
}

/* -------------------------------------------------------------- videos --- */

async function upsertVideo(meta: VideoMeta) {
  return prisma.video.upsert({
    where: { youtubeId: meta.youtubeId },
    update: {
      title: meta.title,
      channelTitle: meta.channelTitle,
      thumbnailUrl: meta.thumbnailUrl || thumbFor(meta.youtubeId),
      durationSec: meta.durationSec,
    },
    create: {
      youtubeId: meta.youtubeId,
      title: meta.title,
      channelTitle: meta.channelTitle,
      thumbnailUrl: meta.thumbnailUrl || thumbFor(meta.youtubeId),
      durationSec: meta.durationSec,
    },
  });
}

async function attachVideo(playlistId: string, ownerId: string, meta: VideoMeta) {
  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, ownerId },
  });
  if (!playlist) return { error: "Không tìm thấy playlist." };

  const video = await upsertVideo(meta);
  const count = await prisma.playlistItem.count({ where: { playlistId } });
  await prisma.playlistItem.upsert({
    where: { playlistId_videoId: { playlistId, videoId: video.id } },
    update: {},
    create: { playlistId, videoId: video.id, position: count },
  });
  revalidatePath(`/parent/playlists/${playlistId}`);
  return { ok: true };
}

/** Thêm video bằng link/ID YouTube — không cần API key (dùng oEmbed). */
export async function addVideoByLinkAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const playlistId = String(formData.get("playlistId") ?? "");
  const input = String(formData.get("link") ?? "");
  const youtubeId = extractVideoId(input);
  if (!youtubeId) return { error: "Link YouTube không hợp lệ." };

  const meta = await fetchVideoMeta(youtubeId);
  if (!meta) return { error: "Không lấy được thông tin video này." };

  return attachVideo(playlistId, parent.id, meta);
}

/** Thêm video từ kết quả tìm kiếm trong app. */
export async function addVideoFromSearchAction(playlistId: string, youtubeId: string) {
  const parent = await requireParent();
  const meta = await fetchVideoMeta(youtubeId);
  if (!meta) return { error: "Không lấy được thông tin video này." };
  return attachVideo(playlistId, parent.id, meta);
}

export async function removeVideoAction(playlistId: string, videoId: string) {
  const parent = await requireParent();
  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, ownerId: parent.id },
  });
  if (!playlist) return;
  await prisma.playlistItem.deleteMany({ where: { playlistId, videoId } });
  revalidatePath(`/parent/playlists/${playlistId}`);
}

/* ------------------------------------------------------------ gán / chia sẻ --- */

export async function toggleAssignAction(kidId: string, playlistId: string) {
  const parent = await requireParent();
  const kid = await prisma.kid.findFirst({ where: { id: kidId, parentId: parent.id } });
  if (!kid) return;

  const existing = await prisma.kidPlaylist.findUnique({
    where: { kidId_playlistId: { kidId, playlistId } },
  });
  if (existing) {
    await prisma.kidPlaylist.delete({ where: { id: existing.id } });
  } else {
    await prisma.kidPlaylist.create({ data: { kidId, playlistId } });
  }
  revalidatePath("/parent");
  revalidatePath(`/parent/playlists/${playlistId}`);
  revalidatePath(`/kids/${kidId}`);
}

export async function toggleLikeAction(playlistId: string) {
  const parent = await requireParent();
  const existing = await prisma.playlistLike.findUnique({
    where: { parentId_playlistId: { parentId: parent.id, playlistId } },
  });
  if (existing) {
    await prisma.playlistLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.playlistLike.create({ data: { parentId: parent.id, playlistId } });
  }
  revalidatePath("/parent/community");
}

/** Sao chép playlist của phụ huynh khác về thư viện của mình (crowdsourcing). */
export async function copyPlaylistAction(playlistId: string) {
  const parent = await requireParent();
  const source = await prisma.playlist.findFirst({
    where: { id: playlistId, isPublic: true },
    include: { items: true },
  });
  if (!source) return;

  const copy = await prisma.playlist.create({
    data: {
      ownerId: parent.id,
      title: source.title,
      description: source.description,
      emoji: source.emoji,
      ageGroup: source.ageGroup,
      copiedFrom: source.id,
      items: {
        create: source.items.map((item, index) => ({
          videoId: item.videoId,
          position: index,
        })),
      },
    },
  });
  await prisma.playlist.update({
    where: { id: source.id },
    data: { copyCount: { increment: 1 } },
  });

  revalidatePath("/parent/community");
  revalidatePath("/parent");
  redirect(`/parent/playlists/${copy.id}`);
}

export async function reportVideoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const videoId = String(formData.get("videoId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return { error: "Không tìm thấy video." };

  const existing = await prisma.report.findUnique({
    where: { parentId_videoId: { parentId: parent.id, videoId } },
  });
  if (existing) return { error: "Bạn đã báo cáo video này rồi." };

  await prisma.report.create({ data: { parentId: parent.id, videoId, reason } });

  const count = await prisma.report.count({ where: { videoId } });
  if (count >= 3) {
    await prisma.video.update({ where: { id: videoId }, data: { hidden: true } });
  }

  revalidatePath("/parent/community");
  revalidatePath("/parent/admin/reports");
  return { ok: true };
}

export async function setVideoHiddenAction(
  videoId: string,
  hidden: boolean,
): Promise<ActionState> {
  const parent = await requireParent();
  const adminEmail = process.env.ADMIN_EMAIL ?? "demo@kidtube.vn";
  if (parent.email !== adminEmail) return { error: "Không có quyền admin." };
  await prisma.video.update({ where: { id: videoId }, data: { hidden } });
  revalidatePath("/parent/community");
  revalidatePath("/parent/admin/reports");
  return { ok: true };
}
