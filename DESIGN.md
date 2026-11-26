# DESIGN — Ghi Chú Của Ngọc Như

- **Trạng thái**: **ĐÃ CHỐT (LOCKED)** theo bộ thiết kế V3
- **Bản mẫu trực quan chuẩn**: [ui-preview-kawaii.html](docs/superpowers/specs/ui-preview-kawaii.html)
- **Tài liệu nguồn UI/UX**: [2026-11-25-ui-ux-design-system.md](docs/superpowers/specs/2026-11-25-ui-ux-design-system.md)
- **Phạm vi giao diện**: Mobile-first PWA (`375px–430px`) và khung sổ căn giữa trên Desktop (`max-w-[480px]`).
- **Phân kỳ (v2.0, 2026-11-26)**: Hệ màu/typography/thành phần giữ nguyên. MVP chỉ triển khai bầu trời **Sáng**, 2 bạn thú (**Thỏ hoa**, **Mèo dâu**) và bút `ink`/`highlighter`/`dashed`; bầu trời Chiều/Đêm, 4 bạn thú còn lại, bút `crayon`/`sparkle` thuộc Giai đoạn 2 nhưng thiết kế dưới đây vẫn là chuẩn khi làm. Luồng khóa/khôi phục theo [ARCHITECTURE.md §5.2](ARCHITECTURE.md): PIN cục bộ + Mật khẩu sổ + Mã khôi phục (không còn câu hỏi bảo mật, không còn `IndexKey`).

---

## 1. Design Principles

1. **Kawaii Pastel Stationery**: Tái hiện sổ tay văn phòng phẩm Nhật/Hàn kết hợp chất liệu tranh truyện Ghibli / Animal Crossing thu nhỏ — ấm áp, tinh tế, không lòe loẹt.
2. **Hệ nét SVG đồng nhất, không emoji hệ thống**: Mọi linh vật, sticker, icon cảm xúc và trang trí đều vẽ bằng vector SVG với viền nâu mận `#4A2C3A` (`stroke-linecap="round"`, `stroke-linejoin="round"`). Tuyệt đối cấm dùng emoji hệ thống làm icon điều hướng hoặc sticker.
3. **Phản hồi tức thì Local-First**: Giao diện mở tức thì từ `IndexedDB` và App Shell PWA; không hiển thị vòng xoay chờ mạng làm đứt mạch cảm xúc viết nhật ký.
4. **Ưu tiên chạm bằng một tay trên di động**: Thanh điều hướng đặt ở đáy, công cụ quan trọng nằm trong tầm ngón tay cái, tách bạch rõ giữa chế độ viết chữ và kéo sticker.

---

## 2. Design System

- **Nền tảng UI**: Tailwind CSS + daisyUI (base theme `pastel`/`valentine`) + `motion` (Framer Motion) + `lucide-react` (chỉ dùng cho các icon điều khiển hệ thống mảnh như quay lại, tìm kiếm, đồng bộ, khóa, đóng modal).
- **Quy chuẩn tạo hình nhân vật Mochi**: Thân hình tròn mũm mĩm, mắt đặt thấp tách rộng có điểm sáng, má hồng oval `#FF9EB5` (`opacity: 0.75–0.8`), miệng chữ `w` nhỏ, nét viền `#4A2C3A` độ dày `1.8–3px` tùy tỉ lệ khung.
- **Độ sâu & Bo góc**:
  - Thẻ ghi chú: `rounded-[22px]`, khung giấy soạn thảo: `rounded-[24px]`, nút/khung phụ: `rounded-2xl` / `rounded-xl`, pill điều hướng & badge: `rounded-full`.
  - Bóng đổ chuẩn trong `src/styles/kawaii.css`:
    - `.k-shadow`: `0 6px 18px -4px rgba(181, 42, 94, 0.14), 0 2px 6px rgba(74, 44, 58, 0.05)`
    - `.k-shadow-sm`: `0 3px 10px -2px rgba(181, 42, 94, 0.12)`
    - `.diecut-shadow`: `drop-shadow(0 2px 4px rgba(74, 44, 58, 0.18))`

---

## 3. Color Tokens

### 3.1 Token hệ thống chính thức (`src/styles/kawaii.css`)
| Token | Mã Hex | Vai trò & Tiêu chuẩn tương phản |
|---|---|---|
| `--k-bg` | `#FFF5F8` | Sakura Paper — Nền chính toàn ứng dụng |
| `--k-surface` | `#FFFFFF` | Thẻ ghi chú, modal, thanh điều hướng đáy |
| `--k-pink-soft` | `#FFE4EE` | Nền nút phụ, badge, ô nhấn nhẹ |
| `--k-pink-plush` | `#FFB7CE` | Bìa sổ thỏ, viền khung chính, tán hoa anh đào |
| `--k-pink-ribbon` | `#FF8FB8` | Ruy-băng, nét trang trí, trái tim |
| `--k-berry` | `#D63D76` | Primary CTA, tab đang chọn (tương phản chữ trắng `> 4.5:1`) |
| `--k-berry-dark` | `#B52A5E` | Trạng thái hover/pressed, chữ nhãn nhấn |
| `--k-ink` | `#4A2C3A` | Cocoa Ink — Chữ chính & nét vẽ SVG (tương phản nền sáng `> 10:1`) |
| `--k-muted` | `#8C5A6E` | Blush Muted — Chữ phụ, ngày tháng (tương phản `> 4.5:1`) |
| `--k-cream` | `#FFF4D6` | Khóa tim, nền nhấn ấm (biến thể preview `#FFF6E0`) |
| `--k-gold` | `#FFE07D` | Ổ khóa tim, đèn lồng, sao, thẻ ước hoàn thành (viền nhấn `#F6C85F`) |
| `--k-mint` | `#C6EBD1` | Lá xuân, thảm cỏ cây ước, nút Tưới sương |
| `--k-sky` | `#DFF2FF` | Cửa sổ trời, huy hiệu bìa sổ |

### 3.2 Bảng màu 3 chế độ bầu trời Cây Ước Nguyện
- **Sáng Anh Đào (`day`, 05:00–16:59)**: `linear-gradient(180deg, #FFDDE9 0%, #FFF3F8 54%, #DCF4E2 100%)`
- **Hoàng Hôn Đào (`sunset`, 17:00–18:59)**: `linear-gradient(180deg, #FFCBA8 0%, #FFBDD1 54%, #E4CCF2 100%)`
- **Đêm Đom Đóm (`night`, 19:00–04:59)**: `linear-gradient(180deg, #352754 0%, #583F78 54%, #7D5B8A 100%)` (chữ tiêu đề chuyển sáng `#FFF5F8` bảo đảm tương phản).

### 3.3 Bảng màu Studio Vẽ Tay
- 16 màu pastel & mực ấm chọn nhanh (khởi đầu với 9 màu cốt lõi từ preview `#4A2C3A`, `#D63D76`, `#FF8FB8`, `#FFB7CE`, `#F5A26F`, `#F2C94C`, `#6BC48D`, `#7CB8F7`, `#B388EB` + 7 màu pastel bổ sung kem, bạc hà, oải hương, san hô, đào, xanh da trời, trắng ngà) + bộ chọn màu tự do (`<input type="color">`).

---

## 4. Typography

- **Font chính**: `Nunito` hoặc `Quicksand` tải tối ưu qua `next/font/google` (hỗ trợ đầy đủ bộ dấu tiếng Việt).
- **Font fallback**: `ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", sans-serif`.
- **Thang chữ chuẩn Mobile**:
  - Tiêu đề màn hình / Bìa sổ: `17px–18px` (`font-extrabold`, line-height `1.3`).
  - Tiêu đề ghi chú trong editor: `15px–16px` (`font-extrabold`).
  - Tiêu đề thẻ ghi chú ở Trang Chủ & nội dung ghi chú: `12px–14px` (`font-semibold` / `leading-relaxed`).
  - Nhãn phụ, ngày tháng, badge danh mục: `11px–12px` (vùng nút/nhãn chính bảo đảm độ đọc rõ và tương phản `>= 4.5:1`).
  - Phím số PIN: `18px–20px` (`font-extrabold`).

---

## 5. Spacing

- **Đơn vị lưới**: Bội số `4px` (`4, 8, 12, 16, 20, 24px`).
- **Khoảng đệm màn hình**: `px-3.5` đến `px-5` (`14px–20px`) để khung `375px` giữ tỷ lệ thở thoáng.
- **Lưới Trang Chủ**: 2 cột `grid-cols-2 gap-3` (`12px`).
- **Vùng an toàn (Safe Areas)**: Chừa `padding-top: env(safe-area-inset-top)` ở header và `padding-bottom: env(safe-area-inset-bottom)` ở `BottomNav`.
- **Kích thước chạm tối thiểu**: Mọi nút bấm, thẻ checklist, ô sticker control và phím PIN đạt tối thiểu `44×44px` vùng tương tác (cho phép phần tử thị giác nhỏ hơn nhưng phải mở rộng hitbox `>= 44×44px`).

---

## 6. Layout

Ứng dụng gồm **5 màn hình chính** và **Ngăn Cài Đặt (Settings Drawer)**:
1. **Màn 1 — Thiết lập lần đầu & Bìa Sổ Khóa Thỏ (`FirstTimeSetup` / `LockScreen`)**:
   - Bố cục dọc căn giữa không có `BottomNav`: trên là bìa sổ thỏ khóa tim + bút chì cười (`BunnyLockCover`), giữa là 4–6 chấm trái tim PIN + dòng báo lỗi/đếm ngược lockout, dưới là bàn phím tròn kẹo 3×4 + nút `Quên PIN?`.
2. **Màn 2 — Trang Chủ Ghi Chú (`HomeScreen`)**:
   - Header pastel (`from-[#FFE0EC] to-[#FFF5F8]`): avatar Thỏ, tên sổ, đèn trạng thái đồng bộ + chuỗi ngày, nút Cài đặt và nút Khóa sổ.
   - Thanh tìm kiếm cục bộ + 5 pill lọc ngang (`Tất cả`, `Nhật ký`, `Checklist`, `Vẽ tay`, `Riêng tư`).
   - Lưới 2 cột thẻ giấy (`NoteCard`): hiển thị thẻ thường, thẻ checklist tick trực tiếp, thẻ vẽ tay, thẻ riêng tư phủ khóa tim vàng.
3. **Màn 3 — Soạn & Trang Trí (`NoteEditor`)**:
   - Top bar: nút `Quay lại`, công tắc 2 trạng thái `Kéo Sticker` ↔ `Sửa chữ`, nút `Lưu`.
   - Khung giấy soạn thảo (`PaperCanvas`) phủ lớp `StickerLayer` toàn bề mặt, gồm badge `dateTag`, nút bật/tắt `Khóa riêng`, input tiêu đề, nội dung, `ChecklistEditor` và ảnh vẽ đính kèm (nếu có).
   - Thanh `StickerControlsBar` (thu nhỏ, phóng to, xoay trái/phải, đưa lên trên, xóa), dải chọn nhanh 6 mẫu giấy và khay `StickerTray` 4 tab (`Thú`, `Hoa lá`, `Đồ ngọt`, `Tự vẽ`).
4. **Màn 4 — Studio Vẽ Tay (`DrawingStudio`)**:
   - Top bar: Undo, Redo, Xóa sạch (có xác nhận), `+ Lưu thành Sticker`, `Đính vào ghi chú` / `Xuất PNG`.
   - Khung Canvas chiếm phần lớn chiều cao với badge báo bút + nền hiện tại.
   - `BrushDock` gọn 4 hàng dưới đáy: 5 chế độ bút + Tẩy, bảng màu + color picker, slider Cỡ & Độ mờ, 6 hình khối kawaii + đổi 5 nền giấy.
5. **Màn 5 — Khu Vườn Cây Ước Nguyện (`WishingTreeScreen`)**:
   - Header: tiêu đề khu vườn, cấp độ hiện tại (bộ chuyển `Sáng / Chiều / Đêm` thuộc Giai đoạn 2).
   - Thanh XP + `streakDays` gọn phía trên.
   - Sân khấu SVG đa tầng chiếm toàn bộ phần giữa (`SanctuarySvg` + `WishTagLayer` tối đa 8 thẻ treo trên cành + bóng thoại thú).
   - Thanh hành động dưới đáy: nút `Tưới sương` (bình tưới hồng), `+ Treo ước`, `Hộp Điều Ước`.

---

## 7. Components

| Nhóm Component | Chi tiết thiết kế bắt buộc |
|---|---|
| **6 Mẫu giấy (`PaperCanvas`)** | `sakura-dashed` (dòng kẻ hồng + viền đứt + hoa 5 cánh góc), `piggy-plaid` (caro hồng sữa + khung bo + bullet sao), `cloud-frame` (gradient hồng-kem `#FFEBF2→#FFF7EE` + viền mây), `botanical-garden` (chấm bi pastel + cành lá 4 góc), `strawberry-stripe` (sọc dọc hồng-kem ấm + gấu mật ong), `heart-grid` (lưới ô vuông hồng mảnh `#FFFFFF`). |
| **28 Sticker SVG (`builtin-stickers.tsx`)** | Tab `Thú` (10): Thỏ Mochi, Heo Mũm Mĩm, Gấu Mật Ong, Mèo Dâu Tây, Cún Corgi, Gấu Trúc, Cáo Nhỏ, Vịt Vàng, Chim Chíp, Bướm Hồng. Tab `Hoa lá` (8): Hoa Anh Đào, Hoa Tulip, Cành Lá Xuân, Cỏ 4 Lá, Cầu Vồng, Trăng Sao, Hoa Cúc, Đám Mây Cười. Tab `Đồ ngọt & Nhật ký` (10): Bánh Kem Dâu, Trà Sữa, Dâu Tây, Đào Hồng, Nơ Ruy-băng, Thư Tình, Bút Chì Cười, Tim Lấp Lánh, Ổ Khóa Tim, Thẻ Ước. |
| **Thẻ Riêng Tư (`NoteCard` locked)** | Nền gradient hồng dịu, biểu tượng ổ khóa tim vàng, chỉ hiện nhãn "Ghi chú riêng tư", `dateTag` và dòng "Chạm để mở khóa", tuyệt đối không lộ snippet. |
| **Cây Ước Nguyện (`SanctuarySvg`)** | 4 lớp tán hoa (`canopy-back`, `canopy-mid`, `canopy-front` kèm dải hoa rủ, `canopy-blossoms`), thân gỗ có vân + hốc đèn lồng sáng ở Cấp 4+, xích đu gỗ đung đưa ở Cấp 3+, hàng rào gỗ trắng, lối đá, nấm hồng chấm bi, hoa tulip, thảm picnic và 6 bạn thú có phụ kiện (Thỏ hoa, Heo lá, Gấu hũ mật, Chim tổ cành, Mèo dâu, Bướm hồng). |
| **4 Kiểu thẻ điều ước (`WishTagLayer`)** | `ema` (thẻ gỗ hồng), `heart` (trái tim ruy-băng), `star` (ngôi sao vàng), `lantern` (đèn lồng phát sáng ấm vào ban đêm). |
| **Modals & Toasts** | `RecoveryModal` (nhập Mã khôi phục + đặt Mật khẩu sổ mới), `DeviceLinkScreen` (nhập Mật khẩu sổ trên thiết bị mới), `PrivatePassModal` (nhập Mật khẩu sổ để mở Ngăn Riêng Tư), `SaveStickerModal` (xem trước die-cut, đặt tên, bật/tắt viền trắng + bóng), `NewWishModal`, `WishBoxDrawer`, `SettingsDrawer` và Toast thông báo có nút **Hoàn tác (5 giây)** khi xóa ghi chú. |

---

## 8. Navigation

- **Thanh điều hướng đáy cố định (`BottomNav`)**: Đúng 4 mục hiển thị trên các màn đã mở khóa (ẩn ở `LockScreen` và `FirstTimeSetup`):
  1. `Ghi chú` (`HomeScreen`)
  2. `Viết mới` (`NoteEditor`)
  3. `Vẽ tay` (`DrawingStudio`)
  4. `Cây ước` (`WishingTreeScreen`)
- **Điều hướng trên cùng**: Nút Ổ khóa (khóa ngay lập tức và xóa khóa RAM) + nút Cài đặt (`SettingsDrawer`) tại Trang Chủ; nút `Quay lại` trong `NoteEditor`.

---

## 9. Interaction

- **Phản hồi chạm**: Mọi nút dùng `.btn-press` (`scale(0.95)` trong `120ms`, `prefers-reduced-motion` tắt chuyển động mạnh).
- **Chuyển chế độ trong Editor**: Khi ở `Sửa chữ`, `StickerLayer` đặt `pointer-events: none` giúp cuộn giấy và chọn chữ không vướng. Khi ở `Kéo Sticker` (hoặc ngay khi vừa chèn sticker mới từ khay), `StickerLayer` nhận `pointer-events: auto` và kéo bằng Pointer Events (`setPointerCapture`), giữ `touch-action: none` trên `.floating-sticker`.
- **Phản hồi bảo mật**: Nhập sai PIN làm hàng chấm trái tim chạy hoạt ảnh rung nhẹ (`anim-shake` `0.35s`) và hiện số lần còn lại.
- **Hoạt ảnh Khu Vườn**: Bìa sổ thỏ nổi nhẹ (`floatSoft`), cánh hoa rơi (`petalFall`), xích đu đung đưa (`swingGentle`), thẻ ước khẽ xoay (`swayTag`), sao nhấp nháy & đom đóm bay ở chế độ Đêm (`twinkle`, `fireflyDrift`), giọt sương rơi khi tưới (`dewSplash`), Golden Glow + mưa cánh hoa khi điều ước thành hiện thực, chạm bạn thú bật bóng thoại `popIn` kèm lời chúc tiếng Việt.

---

## 10. Loading / Empty / Error / Success States

| Tình huống | Loading | Empty | Error | Success |
|---|---|---|---|---|
| **Mở khóa (Màn 1)** | Kiểm PIN cục bộ, không chờ mạng. | Chưa đặt PIN → tự chuyển sang `FirstTimeSetup` (iOS chưa cài → `InstallGate`). | Sai PIN → rung chấm tim + số lần còn lại; Lockout 5 lần → khóa nút bàn phím + đếm ngược 5 phút. | Chấm tim đầy hồng, mở Trang Chủ ngay, đồng bộ nền nếu đã liên kết. |
| **Trang Chủ (Màn 2)** | Đọc `IndexedDB` tức thì; chỉ hiện badge mảnh "Đang đồng bộ..." ở header. | Không có ghi chú / không khớp tìm kiếm → minh họa Thỏ Mochi kèm nút "Viết ghi chú đầu tiên". | Mất mạng → huy hiệu "Ngoại tuyến · Đã lưu máy"; Phiên đồng bộ hết hạn (`401`) → badge "Cần nhập Mật khẩu sổ", không khóa app. | Hiện badge chấm xanh "Đã đồng bộ Drive". |
| **Editor & Sticker (Màn 3)** | Tải ảnh vẽ từ `IndexedDB.drawings` bằng Blob URL. | Tab `Tự vẽ` chưa có sticker → lời mời "Vẽ sticker đầu tiên ở tab Vẽ tay!". | Vượt quá `20` sticker/ghi chú hoặc ghi chú quá `120 KB` → toast cảnh báo không mất chữ đang gõ. | Toast nhẹ "Đã lưu cục bộ" / "Đã lưu & đồng bộ Drive"; xóa mềm hiện toast Hoàn tác 5s. |
| **Studio Vẽ (Màn 4)** | Lazy-load chunk Studio với khung skeleton pastel gọn gàng. | Canvas trống chưa có nét → vô hiệu hoặc cảnh báo khi bấm `+ Lưu thành Sticker`. | Nén quá `45 KB` → tự giảm còn `256px` và thử lại; hết dung lượng → cảnh báo rõ. | Xem trước die-cut sắc nét, lưu xong chuyển tab `Tự vẽ` hoặc dán vào ghi chú. |
| **Cây Ước (Màn 5)** | Khởi tạo từ `IndexedDB.meta.treeState` tức thì. | Chưa có điều ước → Hộp Điều Ước hiển thị thông điệp gợi ý treo ước đầu tiên. | Đã tưới hôm nay → nút hiển thị "Đã tưới hôm nay" (trạng thái hoàn thành, không lỗi); nhập ước > 140 ký tự → chặn & đếm ký tự. | Cộng XP mượt mà, chuyển giai đoạn & mở thú mới kèm bóng thoại chúc mừng. |

---

## 11. Accessibility

- **Tương phản WCAG AA**: Chữ chính `#4A2C3A` trên nền sáng đạt `> 10:1`; nút `#D63D76` chữ trắng và nhãn `#B52A5E`/`#8C5A6E` đạt `>= 4.5:1`. Chế độ Đêm của Cây Ước đổi màu chữ nền tối sang `#FFF5F8` / `#FFE4EE`.
- **Điều hướng bàn phím & Trình đọc màn hình**: Mọi nút chỉ có icon (khóa sổ, xóa số PIN, cài đặt, xoay/phóng sticker, tưới sương) đều có `aria-label` tiếng Việt rõ nghĩa; modal có `role="dialog"` và quản lý focus; hiển thị `focus-visible` viền hồng đậm `#D63D76`.
- **Giảm chuyển động (`prefers-reduced-motion: reduce`)**: CSS tắt toàn bộ hoạt ảnh lặp (`floatSoft`, `petalFall`, `swingGentle`, `swayTag`, `twinkle`, `fireflyDrift`) và chuyển `motion` sang hiệu ứng chuyển trạng thái tức thì/mờ nhẹ.

---

## 12. Responsive Behavior

- **Mobile chuẩn (`375×667`, `390×844`, `430×932`)**: Lấp đầy viewport dọc (`100dvh`), chừa `safe-area-inset`, `0` cuộn ngang toàn trang; lưới thẻ Trang Chủ giữ 2 cột gọn; các dải filter/template/brush có thể cuộn ngang riêng trong vùng chứa với thanh cuộn mảnh ẩn hợp lý.
- **Tablet & Desktop (`>= 768px`)**: Căn giữa giao diện trong khung sổ di động `max-w-[480px]` bo mềm trên nền hồng nhạt `#FFF5F8` (hoặc mở rộng lưới thẻ Trang Chủ tối đa 3 cột trong container gọn) để giữ nguyên tỷ lệ thiết kế giấy & sticker.
- **Tọa độ sticker độc lập màn hình**: Lưu `xPct`, `yPct` (`4..96%`) theo tỉ lệ kích thước khung `PaperCanvas` để sticker không bị lệch vị trí giữa các kích thước màn hình.

---

## 13. UI UX Pro Max Guidelines

- Chỉ kích hoạt **UI UX Pro Max** trong giai đoạn S05–S08 để rà soát chất lượng chi tiết: kiểm tra spacing, độ tương phản màu, trạng thái hover/focus/disabled, micro-interaction kéo thả & modal.
- **Ràng buộc bất biến**: Mọi gợi ý từ UI UX Pro Max phải tôn trọng tuyệt đối bản sắc Kawaii Pastel Stationery V3 trong `DESIGN.md` và `ui-preview-kawaii.html` — không tự ý đổi bảng màu `--k-*`, không thay font tròn sang font kỹ thuật khô cứng, không thay SVG mascot/sticker bằng emoji hay icon thư viện khác.

---

## 14. Agent Desktop UI Test Scenarios

Các kịch bản kiểm thử giao diện thực tế cho **Agent Desktop** / **Playwright** ở viewport `375×667` và `390×844`:
1. **Scenario 1 — Thiết lập & Mở khóa**: Đặt PIN; khóa sổ; thử nhập sai PIN 5 lần kiểm tra rung chấm tim & khóa 5 phút; mở khóa đúng ở chế độ offline.
2. **Scenario 2 — Ngăn Riêng Tư**: Tạo ghi chú bật `Khóa riêng`, quay ra Trang Chủ xác nhận thẻ hiển thị lớp phủ khóa tim (không lộ nội dung), chạm thẻ mở `PrivatePassModal`, nhập đúng Mật khẩu sổ để xem và đóng lại xác nhận khóa lại.
3. **Scenario 3 — Soạn thảo & 6 Mẫu giấy**: Tạo ghi chú, đổi qua lại toàn bộ 6 mẫu giấy, thêm/tick checklist trái tim (cập nhật đếm `x/y`), gắn `dateTag`, xóa mềm và bấm `Hoàn tác` trong 5 giây.
4. **Scenario 4 — Kéo thả Sticker tự do**: Dán 3 sticker (gồm sticker tự vẽ), kéo di chuyển tới góc giấy ở chế độ `Kéo Sticker`, phóng to, xoay góc, lưu và reload trang xác nhận tọa độ `%` không lệch; chuyển sang `Sửa chữ` xác nhận gõ văn bản bình thường không bị sticker cản.
5. **Scenario 5 — Studio Vẽ Tay & Die-cut Sticker**: Vẽ bằng cả 5 loại bút + đóng dấu 1 hình khối trên nền Trong suốt, thử Undo/Redo, bấm `+ Lưu thành Sticker`, bật viền trắng die-cut, xác nhận sticker mới xuất hiện trong tab `Tự vẽ` và có kích thước `< 45 KB`.
6. **Scenario 6 — Khu Vườn Cây Ước Nguyện**: Bấm Tưới sương xác nhận `+5 XP` và chặn tưới lần 2 trong ngày, treo ước mới, mở Hộp Điều Ước đánh dấu Hoàn thành xác nhận XP tăng đúng `+25` và không tăng thêm khi mở lại, chạm bạn thú thấy bóng thoại tiếng Việt.
7. **Scenario 7 — Offline & Đồng bộ lại**: Tắt mạng trong trình duyệt, tạo mới ghi chú + sticker + tưới cây, bật mạng lại xác nhận hàng đợi tự đồng bộ về backend mock/Drive và trạng thái chuyển sang đã đồng bộ.
8. **Scenario 8 — Tiếp cận & Responsive**: Quét overflow ngang ở `375×667` và `390×844` (`scrollWidth <= innerWidth`), kiểm tra kích thước nút `>= 44×44px` và bật `prefers-reduced-motion: reduce`.

---

## 15. Visual Quality Acceptance Criteria

- `0` emoji hệ thống xuất hiện trong thanh điều hướng, tiêu đề thẻ, nút chức năng hay danh sách sticker.
- `100%` màu chủ đạo khớp token `--k-*` đã chốt; viền SVG dùng `#4A2C3A`, không dùng `#000000`.
- `0` lỗi cuộn ngang trên viewport `375×667`, `390×844` và `430×932`; không chữ nào bị cắt cụt hoặc chồng lấn ở khung `375px`.
- Đủ `6` mẫu giấy và `28` sticker SVG tự vẽ hiển thị sắc nét trên màn Retina; sticker die-cut tự vẽ có viền trắng đều mịn xung quanh và nền trong suốt sạch sẽ.
- Đủ `5` giai đoạn Cây Ước Nguyện, bầu trời Sáng và `2` bạn thú MVP (Giai đoạn 2: thêm Chiều/Đêm và 4 bạn thú) không tràn khung SVG.
- Mọi vùng bấm đạt `>= 44×44px` và độ tương phản đạt chuẩn WCAG AA `>= 4.5:1`.
