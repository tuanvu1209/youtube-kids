import Link from "next/link";
import { getCurrentParent } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const parent = await getCurrentParent();
  const [playlistCount, videoCount, parentCount] = await Promise.all([
    prisma.playlist.count({ where: { isPublic: true } }),
    prisma.video.count(),
    prisma.parent.count(),
  ]);

  return (
    <main className="kid-bg flex-1">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="flex items-center justify-between">
          <span className="font-bold text-xl" style={{ fontFamily: "var(--font-baloo)" }}>
            <span className="text-brand">Kid</span>Tube
          </span>
          {parent ? (
            <span className="text-sm text-muted">Xin chào, {parent.name}</span>
          ) : (
            <Link
              href="/parent/login"
              className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-surface"
            >
              Đăng nhập
            </Link>
          )}
        </header>

        <section className="pop-in flex flex-col gap-6 text-center">
          <h1
            className="text-4xl font-extrabold leading-tight sm:text-6xl"
            style={{ fontFamily: "var(--font-baloo)" }}
          >
            Con xem YouTube như thường,
            <br />
            <span className="text-brand">bố mẹ chọn trước từng video.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            KidTube giữ nguyên trải nghiệm quen thuộc của trẻ, nhưng chỉ phát những video nằm
            trong playlist đã được duyệt. Phụ huynh tuyển chọn một lần, rồi chia sẻ cho cả cộng
            đồng cùng dùng.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={parent ? "/kids" : "/parent/register"}
              className="rounded-full bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              {parent ? "🧸 Vào chế độ trẻ em" : "Bắt đầu miễn phí"}
            </Link>
            <Link
              href="/parent"
              className="rounded-full border border-line bg-surface px-8 py-4 text-lg font-semibold transition hover:border-brand"
            >
              👨‍👩‍👧 Khu vực phụ huynh
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { n: parentCount, label: "phụ huynh tham gia" },
            { n: playlistCount, label: "playlist được chia sẻ" },
            { n: videoCount, label: "video đã qua kiểm duyệt" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-line bg-surface p-6 text-center"
            >
              <div className="text-3xl font-extrabold text-brand">{stat.n}</div>
              <div className="text-sm text-muted">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: "✅",
              title: "Whitelist tuyệt đối",
              body: "Trẻ chỉ thấy và chỉ phát được video trong playlist bố mẹ gán. Không đề xuất, không lạc trôi.",
            },
            {
              icon: "🤝",
              title: "Cộng đồng tuyển chọn",
              body: "Không phải tự dựng kho video từ đầu — sao chép playlist của phụ huynh khác chỉ với một cú nhấp.",
            },
            {
              icon: "⏰",
              title: "Giới hạn thời gian",
              body: "Đặt số phút mỗi ngày cho từng bé. Hết giờ, màn hình tự nhắc bé nghỉ.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl border border-line bg-surface p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
