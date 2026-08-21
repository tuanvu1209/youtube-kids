import { NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Heartbeat từ trình phát: ghi nhận số giây bé đã xem để tính giới hạn mỗi ngày. */
export async function POST(request: Request) {
  const parent = await getCurrentParent();
  if (!parent) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { kidId, videoId, seconds } = await request.json();
  const kid = await prisma.kid.findFirst({
    where: { id: String(kidId), parentId: parent.id },
  });
  if (!kid) return NextResponse.json({ error: "Không tìm thấy bé" }, { status: 404 });

  const delta = Math.max(0, Math.min(120, Number(seconds) || 0));
  if (delta > 0) {
    await prisma.watchEvent.create({
      data: { kidId: kid.id, videoId: String(videoId), seconds: delta },
    });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = await prisma.watchEvent.aggregate({
    where: { kidId: kid.id, createdAt: { gte: startOfDay } },
    _sum: { seconds: true },
  });
  const watchedSec = today._sum.seconds ?? 0;

  return NextResponse.json({
    watchedSec,
    limitSec: kid.dailyLimitMin * 60,
    exhausted: watchedSec >= kid.dailyLimitMin * 60,
  });
}
