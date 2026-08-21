# Kịch bản demo (5 phút)

Chuẩn bị trước: `npm run db:seed && npm run dev`, mở sẵn hai tab trình duyệt.

| Phút | Màn hình | Nói gì / làm gì |
|---|---|---|
| 0:00 | `/` | Nêu vấn đề: cho con xem YouTube, vài video sau là nội dung không kiểm soát được. |
| 0:30 | `/parent` (đăng nhập `demo@kidtube.vn` / `123456`) | "Đây là góc của bố mẹ": hai hồ sơ bé, giới hạn phút mỗi ngày. |
| 1:00 | `/parent/playlists/...` | Dán một link YouTube bất kỳ → video được duyệt và vào playlist ngay. Gán playlist cho bé Bống. |
| 2:00 | `/kids` → chọn Bống | Chuyển sang góc nhìn của trẻ: giao diện quen thuộc, bấm là xem. Phát thật một video. |
| 3:00 | Gõ tay URL một video chưa duyệt | Bị chặn: "Video này chưa được bố mẹ duyệt" — whitelist chặn ở server, không phải ẩn nút. |
| 3:30 | Bấm 🔒 Thoát, nhập sai PIN rồi nhập `1234` | Trẻ không tự thoát được; bố mẹ mới mở khoá được. |
| 4:00 | `/parent/community` | Điểm khác biệt: playlist của phụ huynh khác, bấm "Lưu về thư viện" là dùng được ngay cho con mình. |
| 4:30 | Quay lại `/parent` | Chốt: một phụ huynh duyệt, nhiều gia đình dùng chung. Đó là thứ YouTube Kids không có. |

Mẹo: nếu muốn demo màn hình "Hết giờ xem hôm nay", sửa giới hạn của bé xuống 1 phút trong
"Sửa hồ sơ", để video chạy khoảng một phút (trình phát gửi nhịp mỗi 15 giây) rồi tải lại trang.
