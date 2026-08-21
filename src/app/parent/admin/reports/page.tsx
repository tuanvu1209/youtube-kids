import { redirect } from "next/navigation";
import { HideVideoButton } from "@/components/AdminActions";
import ParentShell from "@/components/ParentShell";
import { getCurrentParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminReportsPage() {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent/login");

  const adminEmail = process.env.ADMIN_EMAIL ?? "demo@kidtube.vn";
  if (parent.email !== adminEmail) redirect("/parent");

  const reports = await prisma.report.findMany({
    include: {
      video: true,
      parent: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Gộp theo video
  const byVideo = new Map<
    string,
    {
      video: (typeof reports)[0]["video"];
      reports: typeof reports;
    }
  >();
  for (const r of reports) {
    const entry = byVideo.get(r.videoId);
    if (entry) {
      entry.reports.push(r);
    } else {
      byVideo.set(r.videoId, { video: r.video, reports: [r] });
    }
  }

  const sorted = [...byVideo.values()].sort(
    (a, b) => b.reports.length - a.reports.length,
  );

  return (
    <ParentShell parentName={parent.name} active="admin" isAdmin>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🛡️ Quản lý báo cáo nội dung</h1>
        <p className="text-sm text-muted">
          Video bị ≥ 3 báo cáo sẽ tự động ẩn khỏi cộng đồng. Admin có thể khôi phục hoặc ẩn thủ
          công.
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center text-sm text-muted">
          Chưa có báo cáo nào.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map(({ video, reports: videoReports }) => (
            <div key={video.id} className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  width={120}
                  height={68}
                  className="h-[68px] w-[120px] shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{video.title}</p>
                    {video.hidden && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">
                        Đang ẩn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{video.channelTitle}</p>
                  <p className="mt-1 text-xs font-semibold text-brand">
                    {videoReports.length} báo cáo
                    {videoReports.length >= 3 && " · tự động ẩn"}
                  </p>
                </div>
                <HideVideoButton videoId={video.id} hidden={video.hidden} />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {videoReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3 text-sm"
                  >
                    <span className="shrink-0 font-medium">{r.parent.name}</span>
                    <span className="text-muted">{r.reason || "(không ghi lý do)"}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ParentShell>
  );
}
