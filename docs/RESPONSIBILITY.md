# Responsibility note — KidTube

> Điền tên thật của từng thành viên trước khi nộp. Thể lệ yêu cầu mỗi người đóng góp
> **10%–30%** tổng số code đo trên GitHub, nên chia việc theo các mảng dưới đây và commit
> bằng đúng tài khoản của mình.

## Phân công

| Thành viên | Mảng phụ trách | Tệp/thư mục chính | Ước lượng |
|---|---|---|---|
| _(tên)_ | Nền tảng dữ liệu & xác thực | `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/password.ts` | ~20% |
| _(tên)_ | Khu vực phụ huynh | `src/app/parent/**`, `src/components/KidDialog.tsx`, `NewPlaylistDialog.tsx`, `PlaylistActions.tsx`, `AssignChips.tsx` | ~25% |
| _(tên)_ | Chế độ trẻ em & trình phát | `src/app/kids/**`, `src/components/KidHeader.tsx`, `KidVideoCard.tsx`, `KidPlayer.tsx`, `ExitPinButton.tsx`, `src/app/api/watch/**` | ~25% |
| _(tên)_ | Tích hợp YouTube & cộng đồng | `src/lib/youtube.ts`, `src/app/api/youtube/search/**`, `src/components/AddVideoPanel.tsx`, `CommunityActions.tsx`, `src/app/parent/community/**` | ~20% |
| _(cả nhóm)_ | Giao diện chung, tài liệu, demo | `src/app/globals.css`, `src/app/layout.tsx`, `README.md`, `docs/**` | ~10% |

## Quy ước làm việc

- Mỗi mảng làm trên nhánh riêng: `feat/<mang>`, mở PR vào `main`, người khác review nhanh rồi merge.
- Commit bằng tài khoản GitHub cá nhân (kiểm tra `git config user.email` trước khi commit đầu tiên).
- Tránh để một người commit hộ cả nhóm — vi phạm ràng buộc 10–30% bị trừ 20 điểm.
- Trước khi nộp: mời `sonnh@ownego.com` vào repo, gửi link repo lên Slack.

## Checklist nộp bài

- [ ] Spec — `docs/SPEC.md`
- [ ] Prototype — bản dựng giao diện/luồng màn hình
- [ ] Product — repo này, chạy được bằng `npm install && npm run db:seed && npm run dev`
- [ ] Responsibility note — chính là tệp này, đã điền tên
- [ ] Đã mời `sonnh@ownego.com` vào repo
- [ ] Đã gửi link repo lên Slack
