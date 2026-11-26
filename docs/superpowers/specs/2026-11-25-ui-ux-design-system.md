# Hệ Thống Thiết Kế UI/UX Đã Chốt — Ghi Chú Của Ngọc Như

- **Trạng thái**: **ĐÃ CHỐT (LOCKED)** bởi chủ sở hữu vào `2026-11-25`
- **Bản mẫu trực quan chuẩn**: [ui-preview-kawaii.html](ui-preview-kawaii.html) (V3)
- **Nguyên tắc bắt buộc**: Mọi giai đoạn lập kế hoạch và code frontend đều phải giữ đúng hệ màu, nét vẽ SVG, bố cục Mobile-first và tương tác đã chốt trong tài liệu này.

---

## 1. Nhận Diện Thẩm Mỹ Cốt Lõi
- **Phong cách**: Kawaii Pastel Stationery (Sổ tay văn phòng phẩm Nhật/Hàn kết hợp tranh truyện Ghibli/Animal Crossing thu nhỏ).
- **Hệ nét vẽ SVG thống nhất**:
  - Màu viền chính: `#4A2C3A` (nâu mận ấm, không dùng đen `#000000`), `stroke-linecap="round"`, `stroke-linejoin="round"`.
  - Nhân vật thú dáng mochi tròn mũm mĩm, mắt đặt thấp tách rộng có chấm sáng trắng, má hồng oval `#FF9EB5` (opacity `0.75–0.8`), miệng chữ `w` nhỏ.
  - **Cấm dùng emoji hệ thống** làm icon điều hướng hoặc biểu tượng tính năng — 100% vector SVG sắc nét.

## 2. Bảng Màu Chính Thức (Design Tokens)
| Token | Mã Hex | Ứng dụng & Chuẩn tương phản |
|---|---|---|
| `--k-bg` (Sakura Paper) | `#FFF5F8` | Nền chính toàn app |
| `--k-surface` | `#FFFFFF` | Thẻ ghi chú, modal, thanh điều hướng đáy |
| `--k-pink-soft` | `#FFE4EE` | Nền nút phụ, badge, ô nhấn nhẹ |
| `--k-pink-plush` | `#FFB7CE` | Bìa sổ thỏ, viền chính, tán hoa anh đào |
| `--k-pink-ribbon` | `#FF8FB8` | Ruy-băng, nét trang trí, tim |
| `--k-berry` (Primary CTA) | `#D63D76` | Nút hành động chính, tab active (tương phản chữ trắng > 4.5:1) |
| `--k-berry-dark` | `#B52A5E` | Trạng thái hover/pressed, chữ nhãn nhấn |
| `--k-ink` (Cocoa Ink) | `#4A2C3A` | Chữ chính & nét vẽ SVG (tương phản nền sáng > 10:1) |
| `--k-muted` (Blush Muted) | `#8C5A6E` | Chữ phụ, ngày tháng (tương phản > 4.5:1) |
| `--k-cream` / `--k-gold` | `#FFF4D6` / `#FFE07D` | Ổ khóa tim, đèn lồng, sao, thẻ ước hoàn thành |
| `--k-mint` / `--k-sky` | `#C6EBD1` / `#DFF2FF` | Lá xuân, thảm cỏ cây ước, cửa sổ trời, nút Tưới sương |

## 3. Typography, Khoảng Cách & PWA Mobile-first
- **Font chữ**: `Nunito` hoặc `Quicksand` (tiếng Việt đầy đủ qua `next/font/google`, fallback `ui-rounded, "SF Pro Rounded", sans-serif`).
- **Bố cục chuẩn điện thoại (`375px–430px`)**:
  - Chừa an toàn `env(safe-area-inset-top)` và `env(safe-area-inset-bottom)`.
  - Thanh điều hướng đáy cố định **4 mục**: `Ghi chú`, `Viết mới`, `Vẽ tay`, `Cây ước`.
  - Mọi nút bấm/ô chạm đạt tối thiểu `44×44px`, có phản hồi nhấn mềm (`scale(0.95)`, `120ms`).
  - Desktop hiển thị khung sổ gọn gàng căn giữa (`max-w-[480px]` hoặc lưới thẻ thoáng), tôn trọng `prefers-reduced-motion`.
- **PWA Icon**: Bìa sổ hồng khâu chỉ trắng + Thỏ Mochi + khóa tim vàng + bút chì cười.

## 4. Danh Mục Tài Sản Đồ Họa Đã Chốt
1. **6 Mẫu giấy ghi chú nâng cấp (CSS + SVG)**:
   - `sakura-dashed`: Hoa Anh Đào Viền Nét Đứt (dòng kẻ hồng nhẹ).
   - `piggy-plaid`: Caro Hồng Kem Heo Con (khung trắng bo tròn, bullet ngôi sao).
   - `cloud-frame`: Khung Mây Bồng Bềnh (gradient hồng-kem).
   - `botanical-garden`: Vườn Hoa Lá Nét Vẽ Tay (chấm bi pastel, cành lá góc).
   - `strawberry-stripe`: Sọc Dâu Kem Gấu Bông (sọc dọc hồng-kem ấm).
   - `heart-grid`: Giấy Lưới Trái Tim (ô vuông hồng mảnh).
2. **Thư viện 24+ Icon/Sticker SVG sẵn có + Tab `Tự vẽ`**:
   - *Động vật (10)*: Thỏ Mochi, Heo Mũm Mĩm, Gấu Mật Ong, Mèo Dâu Tây, Cún Corgi, Gấu Trúc, Cáo Nhỏ, Vịt Vàng, Chim Chíp, Bướm Hồng.
   - *Hoa lá & Thiên nhiên (6+)*: Hoa Anh Đào, Hoa Tulip, Cành Lá Xuân, Cỏ 4 Lá, Cầu Vồng, Trăng Sao (+ Hoa Cúc, Đám Mây Cười khi mở rộng đủ 28).
   - *Đồ ngọt & Nhật ký (8+)*: Bánh Kem Dâu, Trà Sữa, Dâu Tây, Đào Hồng, Nơ Ruy-băng, Thư Tình, Bút Chì Cười, Tim Lấp Lánh (+ Ổ Khóa Tim, Thẻ Ước).
   - *Tab `Tự vẽ`*: Sticker người dùng tự vẽ tay, tự cắt gọn và bọc viền trắng die-cut.
3. **5 Màn hình chuẩn**:
   - **Màn 1 — Bìa Sổ Khóa Thỏ**: Hình bìa sổ thỏ + khóa tim vàng + chấm PIN hình trái tim + bàn phím tròn kẹo + nút `Quên PIN?`.
   - **Màn 2 — Trang Chủ Ghi Chú**: Header thỏ + trạng thái đồng bộ + lọc danh mục + lưới 2 cột thẻ giấy + checklist tim + thẻ riêng tư phủ ổ khóa tim.
   - **Màn 3 — Soạn & Trang Trí**: Chuyển đổi chế độ `Kéo Sticker` ↔ `Sửa chữ`, kéo thả tự do + thanh chỉnh phóng to/thu nhỏ/xoay/xóa sticker đang chọn, chọn 6 mẫu giấy, khay sticker 4 nhóm.
   - **Màn 4 — Studio Vẽ Tay**: Khung vẽ + badge chế độ, 5 loại bút (`Mực mượt`, `Dạ quang`, `Sáp phấn`, `Nét đứt`, `Lấp lánh`) + `Tẩy`, bảng màu pastel + chọn màu tự do, slider Cỡ & Độ mờ, dấu hình khối (`Tim`, `Sao`, `Hoa`, `Mây`), đổi 5 nền giấy (mặc định *Trong suốt* để vẽ sticker), Undo/Redo và nút `+ Lưu thành Sticker`.
   - **Màn 5 — Khu Vườn Cây Ước Nguyện**:
     - 3 chế độ bầu trời: **Sáng Anh Đào** (`#FFDDE9→#FFF3F8→#DCF4E2`), **Hoàng Hôn Đào** (`#FFCBA8→#FFBDD1→#E4CCF2`), **Đêm Đom Đóm** (`#352754→#583F78→#7D5B8A` + trăng cười, sao nhấp nháy, đom đóm phát sáng, thẻ & hốc cây phát sáng).
     - Cây đa tầng 4 lớp tán hoa + dải hoa rủ + thân gỗ có vân & hốc đèn lồng + xích đu dây thừng + hàng rào gỗ trắng + lối đá tròn + nấm hồng chấm bi + tulip + thảm picnic + 6 bạn thú có phụ kiện.
     - 4 kiểu thẻ điều ước (`Ema`, `Tim`, `Sao`, `Đèn lồng`), thanh XP, nút `Tưới sương`, `+ Treo ước` và `Hộp` danh sách điều ước.
