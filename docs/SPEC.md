# Spec — KidTube

## 1. Vấn đề

Phụ huynh Việt Nam cho con xem YouTube vì trẻ thích, nhưng ba vấn đề lặp đi lặp lại:

1. **Thuật toán đề xuất không kiểm soát được.** Bắt đầu bằng một bài hát thiếu nhi, sau vài
   video tự động là nội dung giật gân, quảng cáo trá hình, hoặc video "nhái" nhân vật hoạt hình
   với nội dung bạo lực.
2. **YouTube Kids vẫn là hộp đen.** Phụ huynh không tự quyết định được chính xác con xem gì; vẫn
   là thuật toán chọn, chỉ khác bộ lọc.
3. **Tự lọc thì quá tốn công.** Một phụ huynh muốn tự duyệt video phải ngồi xem hàng chục video
   — và mọi phụ huynh khác đều đang lặp lại đúng công việc đó một cách riêng lẻ.

## 2. Hướng giải quyết

Một web app giữ nguyên trải nghiệm xem quen thuộc của trẻ, nhưng đảo ngược quyền quyết định
nội dung: **danh sách trắng do phụ huynh duyệt, và công sức duyệt đó được chia sẻ chung.**

- **Với trẻ:** giao diện giống thứ trẻ đã quen — hàng thumbnail, bấm là xem. Không thanh tìm
  kiếm, không video đề xuất, không lối ra nếu không có PIN của bố mẹ.
- **Với phụ huynh:** công cụ duyệt video nhanh (tìm kiếm hoặc dán link), gán playlist cho từng
  bé theo nhóm tuổi, đặt giới hạn thời gian mỗi ngày.
- **Với cộng đồng:** playlist đã duyệt có thể chia sẻ. Phụ huynh khác lưu về thư viện của mình
  trong một cú nhấp — công sức duyệt của một người phục vụ được nhiều gia đình.

## 3. Phạm vi bản dựng trong hackathon

Đã làm (chạy thật, có dữ liệu thật):

| Nhóm | Chức năng |
|---|---|
| Tài khoản | Đăng ký, đăng nhập, đăng xuất, PIN thoát chế độ trẻ em |
| Hồ sơ bé | Thêm/sửa/xoá, avatar, nhóm tuổi, giới hạn phút/ngày |
| Playlist | Tạo, sửa, xoá, gán cho bé, chia sẻ công khai |
| Video | Thêm bằng tìm kiếm YouTube (safeSearch=strict) hoặc dán link; gỡ khỏi playlist |
| Chế độ trẻ em | Chọn hồ sơ, trang chính theo playlist, trình phát nhúng, chặn video ngoài whitelist |
| Thời lượng | Ghi nhận nhịp 15 giây, khoá màn hình khi hết quota ngày |
| Cộng đồng | Duyệt playlist công khai, lọc theo tuổi, thích, lưu về thư viện, báo cáo video |

Chưa làm (ngoài phạm vi 5.75 giờ):

- Ứng dụng di động (bản web đã responsive).
- Kiểm duyệt tự động bằng AI cho video mới thêm.
- Quản trị viên xử lý báo cáo, chặn video ở cấp hệ thống.
- Đồng bộ nhiều thiết bị theo thời gian thực.

## 4. Mô hình dữ liệu

```
Parent ─┬─< Kid ──< KidPlaylist >── Playlist ──< PlaylistItem >── Video
        ├─< Playlist (owner)                                        │
        ├─< PlaylistLike >── Playlist                               │
        └─< Report >───────────────────────────────────────────────┘
Kid ──< WatchEvent >── Video
```

- `Playlist.copiedFrom` giữ nguồn gốc khi một phụ huynh lưu playlist của người khác;
  `copyCount` đếm số lần playlist gốc được lưu — đây là tín hiệu xếp hạng ở trang cộng đồng.
- `WatchEvent` cộng dồn theo ngày để tính giới hạn thời gian của từng bé.

## 5. Ràng buộc an toàn

1. Kiểm tra whitelist đặt ở server (`/kids/[kidId]/watch/[videoId]`), không dựa vào việc ẩn UI.
2. Mọi mutation đều xác thực chủ sở hữu: phụ huynh chỉ sửa được playlist và hồ sơ bé của mình.
3. Mật khẩu băm bằng scrypt kèm salt ngẫu nhiên; cookie phiên ký HMAC-SHA256, httpOnly, SameSite=Lax.
4. Nhịp ghi nhận thời lượng bị chặn trần 120 giây mỗi lần gọi để không thể giả mạo số liệu.
5. Video nhúng qua `youtube-nocookie.com` với `rel=0`, `iv_load_policy=3` để giảm gợi ý và chú thích.

## 6. Tiêu chí "chạy được" khi demo

- Đăng nhập bằng tài khoản demo → vào chế độ trẻ em → phát được video thật.
- Dán một link YouTube mới trong khu vực phụ huynh → video xuất hiện ngay ở màn hình của bé.
- Gõ tay URL một video chưa duyệt → bị chặn.
- Lưu playlist từ tab Cộng đồng → playlist xuất hiện trong thư viện của mình, gán được cho bé.
