import { NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth";
import { hasApiKey, searchVideos } from "@/lib/youtube";

export async function GET(request: Request) {
  const parent = await getCurrentParent();
  if (!parent) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ items: [] });

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "Chưa cấu hình YOUTUBE_API_KEY — hãy dùng tab dán link." },
      { status: 400 },
    );
  }

  try {
    const items = await searchVideos(query);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tìm kiếm thất bại" },
      { status: 502 },
    );
  }
}
