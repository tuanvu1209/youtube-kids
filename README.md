# KidTube — Kho video an toàn do bố mẹ tuyển chọn

Trẻ vẫn được xem "YouTube" với giao diện quen thuộc, nhưng **chỉ phát được những video nằm
trong playlist bố mẹ đã duyệt**. Phụ huynh tuyển chọn một lần, rồi chia sẻ playlist đó cho cả
cộng đồng phụ huynh khác dùng lại — không ai phải ngồi lọc video từ đầu.

> Sản phẩm dự thi Hackathon Oeditions 2026 (22/08/2026).
>
> **Bản chạy thật: https://youtube-kids-seven.vercel.app** — đăng nhập `demo@kidtube.vn` / `123456`, PIN `1234`.

## Tính năng đã chạy thật

**Chế độ trẻ em** (`/kids`)
- Chọn hồ sơ bé (avatar, nhóm tuổi) như màn hình chọn profile quen thuộc.
- Trang chính: mỗi playlist là một hàng video cuộn ngang, thumbnail thật từ YouTube.
- Trình phát nhúng `youtube-nocookie`, không gợi ý video ngoài luồng, không bình luận.
- **Whitelist tuyệt đối**: gõ thẳng URL của một video chưa duyệt vẫn bị chặn ở phía server.
- **Giới hạn thời gian mỗi ngày**: trình phát gửi nhịp 15 giây về server; hết quota thì màn hình
  chuyển sang "Hết giờ xem hôm nay rồi!".
- **Cổng PIN**: muốn thoát khỏi chế độ trẻ em phải nhập đúng PIN 4 số của bố mẹ.

**Khu vực phụ huynh** (`/parent`)
- Đăng ký / đăng nhập bằng email + mật khẩu (scrypt), phiên ký HMAC trong cookie httpOnly.
- Quản lý hồ sơ các bé: avatar, nhóm tuổi, số phút xem mỗi ngày, theo dõi thời lượng đã xem.
- Tạo playlist theo nhóm tuổi, thêm video bằng **tìm kiếm YouTube** (safeSearch=strict) hoặc
  **dán link** (youtube.com/watch, youtu.be, /shorts, hoặc ID trần).
- Gán / bỏ gán playlist cho từng bé chỉ bằng một cú nhấp.

**Cộng đồng phụ huynh** (`/parent/community`)
- Chia sẻ playlist của mình ra cộng đồng, lọc theo nhóm tuổi.
- Thích (❤️) và **lưu playlist của phụ huynh khác về thư viện** — bản sao thuộc về bạn, sửa
  thoải mái mà không ảnh hưởng bản gốc; playlist gốc được cộng lượt lưu.
- Báo cáo video có nội dung không phù hợp.

## Công nghệ

| Lớp | Lựa chọn |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Ngôn ngữ | TypeScript, React 19 |
| Giao diện | Tailwind CSS v4 |
| Dữ liệu | Prisma 7 + PostgreSQL (driver adapter `@prisma/adapter-pg`) |
| Video | YouTube IFrame embed + YouTube Data API v3 (tuỳ chọn) / oEmbed |
| Xác thực | scrypt + cookie ký HMAC, tự viết (không phụ thuộc dịch vụ ngoài) |

## Chạy trong 4 bước

```bash
cp .env.example .env     # rồi điền DATABASE_URL (Postgres) vào .env
npm install              # postinstall tự chạy prisma generate
npx prisma migrate dev   # tạo bảng (lần đầu)
npm run db:seed          # dữ liệu mẫu: 2 phụ huynh, 2 bé, 3 playlist, video thật
npm run dev              # http://localhost:3000
```

Cần một Postgres bất kỳ (Neon, Supabase, Postgres cục bộ…). Bản deploy đang dùng Neon.

Tài khoản demo:

| Tài khoản | Mật khẩu | PIN |
|---|---|---|
| `demo@kidtube.vn` (Mẹ Bống) | `123456` | `1234` |
| `hangxom@kidtube.vn` (Bố Tít) | `123456` | `4321` |

### Bật tìm kiếm video trong app (tuỳ chọn)

Thêm YouTube Data API v3 key vào `.env`:

```
YOUTUBE_API_KEY="..."
```

Không có key thì app **vẫn chạy đủ**: phụ huynh thêm video bằng cách dán link, metadata lấy qua
oEmbed (không cần key, không dính quota).

## Lệnh hay dùng

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy server phát triển |
| `npm run build` | Build production |
| `npm run db:seed` | Nạp lại dữ liệu mẫu (xoá dữ liệu cũ) |
| `npm run db:reset` | Reset migration + seed |
| `npx prisma studio` | Xem/sửa dữ liệu bằng giao diện |
| `npx eslint .` | Kiểm tra lint |

## Cấu trúc

```
prisma/
  schema.prisma          # Parent, Kid, Playlist, Video, PlaylistItem, KidPlaylist,
                         # PlaylistLike, Report, WatchEvent
  seed.ts                # dữ liệu mẫu, lấy video thật từ YouTube
src/
  app/
    page.tsx             # trang giới thiệu
    kids/                # chế độ trẻ em (chọn bé → trang chính → trình phát)
    parent/              # đăng nhập, tổng quan, chi tiết playlist, cộng đồng
    api/youtube/search/  # tìm video (Data API, safeSearch=strict)
    api/watch/           # nhịp ghi nhận thời lượng xem
  components/            # UI dùng chung (modal, thẻ video, các nút hành động)
  lib/
    actions.ts           # toàn bộ server action (mutation)
    auth.ts, password.ts # phiên đăng nhập, băm mật khẩu
    youtube.ts           # parse link, oEmbed, Data API
    db.ts                # Prisma client + adapter Postgres
```

## Ghi chú kỹ thuật

- **Whitelist kiểm tra ở server**, không phải chỉ ẩn trên UI: `/kids/[kidId]/watch/[videoId]`
  chỉ trả về trình phát khi video nằm trong playlist đang gán cho đúng bé đó.
- **Nhịp xem** giới hạn tối đa 120 giây mỗi lần gọi để không thể "bơm" số liệu, và chỉ đếm khi
  tab đang hiển thị.
- `npm run build` chạy `prisma migrate deploy` trước `next build`, nên mỗi lần deploy Vercel tự
  áp migration mới lên database production.

## Deploy

- Bản production: https://youtube-kids-seven.vercel.app
- Hosting: Vercel; database: Postgres (Neon) gắn qua Vercel Marketplace.
- Biến môi trường trên Vercel: `DATABASE_URL` + `DATABASE_URL_UNPOOLED` (Neon tự gắn),
  `AUTH_SECRET`, và `YOUTUBE_API_KEY` nếu muốn bật tìm kiếm video.
- Deploy lại: `vercel --prod` (hoặc kết nối repo trong Vercel để tự deploy mỗi lần push).
