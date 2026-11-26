# PRD — Ghi Chú Của Ngọc Như

- **Phiên bản**: 2.0 (S00 — Bản rút gọn sau rà soát 2026-11-26)
- **Ngày lập**: 2026-11-25 · **Cập nhật**: 2026-11-26
- **Loại sản phẩm**: Mobile-first PWA ghi chú cá nhân (1 người dùng duy nhất)
- **Nền tảng triển khai**: Vercel (Hobby/Free, Next.js App Router) + Google Drive API v3 (Folder Restricted)
- **Nguồn đặc tả gốc**: [design](docs/superpowers/specs/2026-11-25-ghi-chu-ngoc-nhu-design.md), [app-spec](docs/superpowers/specs/2026-11-25-ghi-chu-ngoc-nhu-app-spec.md), [ui-ux](docs/superpowers/specs/2026-11-25-ui-ux-design-system.md). Khi spec gốc mâu thuẫn với bộ tài liệu v2.0 ở phần bảo mật/đồng bộ/XP, **v2.0 thắng** (xem [ARCHITECTURE.md §14](ARCHITECTURE.md)).

---

## 1. Product Overview

**Ghi Chú Của Ngọc Như** là PWA di động để viết nhật ký, quản lý checklist trái tim, vẽ tay, tự chế sticker die-cut dán lên trang giấy và chăm sóc **Cây Ước Nguyện** lớn lên theo thói quen ghi chép.

Kiến trúc **Local-First**: dữ liệu nằm trong `IndexedDB` trên máy, app dùng được hoàn toàn offline; đồng bộ nền về 1 thư mục Google Drive riêng tư qua scope `drive.file`. Ghi chú riêng tư được mã hóa đầu-cuối bằng **Mật khẩu sổ**.

---

## 2. Mục Tiêu và Phạm Vi

### 2.1 Mục tiêu cốt lõi
1. **Mở là viết**: Nhập PIN là vào ngay, không chờ mạng; tự lưu cục bộ; đồng bộ nền khi có mạng.
2. **Thẩm mỹ Kawaii Pastel Stationery**: 6 mẫu giấy SVG+CSS, 28 sticker SVG (nét `#4A2C3A`, không emoji hệ thống), kéo thả sticker tự do.
3. **Studio Vẽ Tay & Sticker Die-cut**: bút vẽ, 6 hình khối, Undo/Redo 30+ bước, tự cắt biên + viền trắng thành sticker (`<= 45 KB`).
4. **Riêng tư thực chất & không mất dữ liệu**: ghi chú riêng tư mã hóa `AES-256-GCM` bằng Mật khẩu sổ; quên mật khẩu vẫn khôi phục được bằng Mã khôi phục; có xuất/nhập `.json`.
5. **Cây Ước Nguyện**: XP, chuỗi ngày, tưới sương, 5 giai đoạn tiến hóa, thẻ điều ước.

### 2.2 Phạm vi kỹ thuật & vận hành
- Chạy trên Vercel Hobby/Free, không Cron.
- Toàn bộ tệp đồng bộ nằm trong folder Restricted `"Ghi Chú Của Ngọc Như"` trên Drive của chủ hạ tầng (`ththanhphu7703@gmail.com`).
- Không dùng AI lúc vận hành.
- Phát triển trên MacBook Pro M1 Pro 16 GB.
- **Trên iOS bắt buộc cài PWA vào Màn hình chính** (Safari có thể xóa dữ liệu web không được cài).

---

## 3. Đối Tượng Sử Dụng

| Vai trò | Định danh | Bối cảnh |
|---|---|---|
| **Người dùng chính** | Ngọc Như | Dùng hằng ngày qua PWA trên điện thoại (`375px–430px`), desktop căn giữa `max-w-[480px]`. |
| **Chủ hạ tầng** | `ththanhphu7703@gmail.com` | Cấu hình env Vercel, chạy script OAuth `drive.file` 1 lần. |

---

## 4. User Journeys

### 4.1 Hành trình 1 — Cài đặt lần đầu (không cần mạng)
1. Mở app trên iPhone → `InstallGate` hướng dẫn "Thêm vào Màn hình chính" (Android/desktop: bỏ qua).
2. Đặt PIN 4–6 số + xác nhận. PIN chỉ lưu dạng băm trên máy này.
3. Vào Trang Chủ, dùng ngay toàn bộ tính năng ghi chú/vẽ/cây ước cục bộ.

### 4.2 Hành trình 2 — Mở khóa hằng ngày
1. Mở app hoặc quay lại sau > 15 phút ẩn → Bìa Sổ Thỏ.
2. Nhập PIN → kiểm tra cục bộ → vào Trang Chủ. Sai 5 lần → khóa giao diện 5 phút + rung chấm tim.
3. Nếu thiết bị đã bật đồng bộ và đang online → SyncEngine chạy nền.

### 4.3 Hành trình 3 — Bật đồng bộ & tạo Mật khẩu sổ (thiết bị đầu tiên)
1. Cài đặt → **Bật đồng bộ Drive** (cần mạng) → `GET /api/auth/status` trả `initialized: false`.
2. Đặt **Mật khẩu sổ** (>= 10 ký tự, không chỉ gồm số) + xác nhận.
3. App sinh DEK + **Mã khôi phục** 128-bit → hiển thị mã, bắt buộc tick "Tôi đã chép/in mã" mới đi tiếp.
4. `POST /api/auth/setup` → nhận cookie → đẩy toàn bộ dữ liệu cục bộ lên Drive.

### 4.4 Hành trình 4 — Liên kết thiết bị mới
1. Cài đặt → Bật đồng bộ → `status` trả `initialized: true` → `DeviceLinkScreen` hỏi Mật khẩu sổ.
2. Client tính `proof` → `POST /api/auth/unlock` → nhận cookie + vault → lưu `vaultSnapshot` → kéo toàn bộ dữ liệu về.
3. Sai 5 lần → `429`, đếm ngược 5 phút.

### 4.5 Hành trình 5 — Quên PIN / Quên Mật khẩu sổ
- **Quên PIN**: bấm *Quên PIN?* → nhập Mật khẩu sổ (kiểm offline bằng `vaultSnapshot`) → đặt PIN mới. Thiết bị chưa bật đồng bộ → chỉ có thể xóa dữ liệu app hoặc nhập lại từ file `.json` (cảnh báo rõ khi đặt PIN).
- **Quên Mật khẩu sổ** (cần mạng): nhập Mã khôi phục → `POST /api/auth/recover/verify` (5 lần sai / 15 phút) → đặt mật khẩu mới → `POST /api/auth/recover/reset`. 100% ghi chú riêng tư giữ nguyên.

### 4.6 Hành trình 6 — Ghi chú, Checklist & Ngăn Riêng Tư
1. Trang Chủ: lọc 5 nhóm (`Tất cả`, `Nhật ký`, `Checklist`, `Vẽ tay`, `Riêng tư`), tìm kiếm cục bộ (ghi chú thường: toàn văn; ghi chú khóa: không tìm), chạm thẻ để mở.
2. Editor: chọn mẫu giấy, tiêu đề, nội dung, checklist trái tim (đếm `x/y`), `dateTag`, danh mục, bật `Khóa riêng` (chỉ khi đã bật đồng bộ, vì cần Mật khẩu sổ).
3. Tự lưu `IndexedDB` sau `400ms`; sync sau `2.5s`.
4. Mở thẻ khóa → `PrivatePassModal` hỏi Mật khẩu sổ → giải mã vào RAM; rời ghi chú → xóa bản rõ. DEK giữ trong RAM tới khi khóa app / ẩn 15 phút.
5. Xóa mềm + toast **Hoàn tác (5 giây)**; dọn cứng sau 30 ngày.

### 4.7 Hành trình 7 — Kéo thả Sticker
1. Gạt `Sửa chữ` ↔ `Kéo Sticker`.
2. Chọn sticker từ khay 4 tab (`Thú`, `Hoa lá`, `Đồ ngọt`, `Tự vẽ`) → chèn giữa trang, chọn sẵn.
3. Kéo (`setPointerCapture`) cập nhật `xPct`, `yPct` (`4..96`); chỉnh `scale` (`0.5..2.2`), xoay (`-180..180`), đưa lên trên, xóa. Tối đa 20 sticker/ghi chú.

### 4.8 Hành trình 8 — Studio Vẽ & Sticker Die-cut
1. Mở tab `Vẽ tay` hoặc *Vẽ đính kèm*.
2. Chọn bút (`ink`, `highlighter`, `dashed`) hoặc `eraser`, 16 màu + color picker, cỡ `2..32px`, mờ `20%..100%`, 6 hình khối, 5 nền giấy (mặc định Trong suốt), Undo/Redo 30+ bước.
3. **Đính vào ghi chú**: WebP (fallback PNG) `< 150 KB`, cạnh max `1200px`; ghi chú khóa → lưu `.enc`.
4. **Lưu thành Sticker**: cắt biên `alpha > 12`, `pad = 16px`, viền trắng 16 hướng `borderR = 8px` (tùy chọn) + bóng mềm, max `384×384px`, `<= 45 KB` → hiện ngay ở tab `Tự vẽ`.

### 4.9 Hành trình 9 — Cây Ước Nguyện
1. Bấm **Tưới sương** (1 lần/ngày) → `+5 XP`, hiệu ứng giọt sương.
2. Mỗi ngày có ghi chú → `+10 XP`, tăng `streakDays`.
3. **+ Treo ước**: <= 140 ký tự, 4 kiểu thẻ (`ema | heart | star | lantern`) → `+5 XP`; cành hiện 8 thẻ mới nhất.
4. **Hộp Điều Ước** (*Đang ấp ủ* / *Đã xong*): đánh dấu **Thành hiện thực** → `+25 XP`, thẻ vàng + mưa cánh hoa.
5. XP được tính lại từ dữ liệu mỗi lần hiển thị nên không bao giờ cộng trùng hoặc mất khi đồng bộ 2 máy.
6. 5 giai đoạn (`0–19`, `20–59`, `60–129`, `130–219`, `220+`), mở khóa bạn thú có lời chúc tiếng Việt.

### 4.10 Hành trình 10 — Cài Đặt
Đổi PIN; bật đồng bộ / đổi Mật khẩu sổ / tạo lại Mã khôi phục; xem/xóa sticker tự vẽ; trạng thái sync + **Đồng bộ ngay**; trạng thái lưu trữ bền (`persisted`); **Xuất** và **Nhập** sao lưu `.json`.

---

## 5. Functional Requirements

| Mã | Tên | Mô tả |
|---|---|---|
| **FR-01** | Khóa giao diện PIN | PIN 4–6 số băm cục bộ (`meta.pinLock`), sai 5 lần khóa 5 phút, tự khóa sau 15 phút ẩn hoặc bấm Khóa. |
| **FR-02** | Mật khẩu sổ, Liên kết & Khôi phục | `GET /api/auth/status`, `POST /api/auth/setup`, `POST /api/auth/unlock`, `POST /api/auth/lock`, `/api/auth/recover/verify|reset`, `PUT /api/auth/vault`; Mã khôi phục 128-bit; rate-limit 5 lần/5 phút (mật khẩu), 5 lần/15 phút (mã khôi phục). |
| **FR-03** | Ghi chú & 6 Mẫu giấy | Tạo/sửa/xem/xóa mềm (Hoàn tác 5s), 6 mẫu (`sakura-dashed`, `piggy-plaid`, `cloud-frame`, `botanical-garden`, `strawberry-stripe`, `heart-grid`), tự lưu `400ms`. |
| **FR-04** | Checklist, DateTag & Tìm kiếm | Checklist trái tim (tick inline trên Trang Chủ & Editor, đếm `x/y`), `dateTag`, 4 danh mục, tìm kiếm cục bộ. |
| **FR-05** | Sticker SVG & Kéo thả | 28 sticker (`Thú` 10, `Hoa lá` 8, `Đồ ngọt & Nhật ký` 10) + tab `Tự vẽ`; kéo thả, scale, xoay, `zIndex`; max 20/ghi chú. |
| **FR-06** | Studio Vẽ Tay | `DrawCommand[]` + `perfect-freehand`; bút `ink`, `highlighter`, `dashed` + `eraser`; 16 màu + picker; cỡ, độ mờ; 6 hình khối; 5 nền; Undo/Redo 30+; đính ảnh & xuất PNG. |
| **FR-07** | Sticker Die-cut | Theo Hành trình 8 bước 4. |
| **FR-08** | Cây Ước Nguyện | XP tính từ dữ liệu, 5 giai đoạn, tưới 1 lần/ngày, thẻ ước 4 kiểu, Hộp Điều Ước, bầu trời `Sáng`, 2 bạn thú (Thỏ hoa, Mèo dâu). |
| **FR-09** | Đồng bộ Local-First | `rev`/`baseRev`, mutex, backoff `1s→3s→10s→30s`, 4 điểm kích hoạt, `409` → bản sao xung đột, server merge `index.json`, purge 30 ngày phía server. |
| **FR-10** | Ngăn Riêng Tư | Mã hóa `encryptedPayload` và `.enc` bằng DEK, AAD theo `contentId`; thẻ khóa chỉ hiện "Ghi chú riêng tư". |
| **FR-11** | Sao lưu `.json` | Xuất toàn bộ (ghi chú khóa giữ nguyên ciphertext) và **nhập lại** (gộp theo ID). |
| **FR-12** | PWA & Headers | Manifest, SW (runtime cache `/_next/static/*`, không cache `/api/*`), `/offline`, `InstallGate`, `storage.persist()`, CSP nonce. |
| **FR-13** | Script Drive 1 lần | `scripts/setup-google-drive.mjs`: OAuth loopback `drive.file`, tạo folder, in env vars. |

---

## 6. Non-Functional Requirements

| Nhóm | Tiêu chuẩn |
|---|---|
| **Hiệu năng** | Mở bằng PIN không chờ mạng; vẽ & kéo sticker mượt trên iPhone tầm trung; `dpr <= 2`; lazy-load Studio Vẽ; note `<= 120 KB`, drawing `<= 250 KB` (client `< 150 KB`), sticker `<= 60 KB` (client `<= 45 KB`). |
| **Bảo mật** | Theo [ARCHITECTURE.md §10](ARCHITECTURE.md): PBKDF2 600k, AES-GCM + AAD, cookie HttpOnly 30 ngày, `timingSafeEqual`, validate ID, không lưu bản rõ mật khẩu/DEK/ghi chú khóa ở đâu cả. |
| **Độ tin cậy** | Không mất dữ liệu khi mất mạng, đóng tab đột ngột hoặc 2 thiết bị sửa cùng lúc; trình duyệt dọn bộ nhớ → cảnh báo + có sao lưu. |
| **A11y** | Tương phản `>= 4.5:1`, vùng chạm `>= 44×44px`, `prefers-reduced-motion`, `aria-label` cho nút icon, focus ring. |
| **Bố cục** | `375×667` → `430×932`, `safe-area-inset`, không cuộn ngang. |
| **Máy phát triển** | Ít worker test, không cài gói nặng. |

---

## 7. MVP và Giai Đoạn 2

| Nhóm | MVP (B1–B8 trong `TASKS.md`) | Giai đoạn 2 |
|---|---|---|
| **Khóa & Bảo mật** | PIN cục bộ, Mật khẩu sổ, Mã khôi phục, Ngăn Riêng Tư, tự khóa 15 phút | WebAuthn/Passkey |
| **Ghi chú** | 6 mẫu giấy, checklist, `dateTag`, tìm kiếm, xóa mềm, 28 sticker + kéo thả | Mẫu giấy & sticker theo mùa |
| **Studio Vẽ** | `ink`, `highlighter`, `dashed`, `eraser`, 6 hình khối, die-cut | Bút `crayon`, `sparkle`; Layers |
| **Cây Ước** | Bầu trời Sáng, 5 giai đoạn, 2 bạn thú, tưới, thẻ ước, Hộp Điều Ước | Bầu trời Chiều/Đêm (đom đóm, đèn lồng), 4 bạn thú còn lại, thiệp tổng kết tháng |
| **Đồng bộ & Hạ tầng** | Script Drive, sync `rev`, PWA, xuất/nhập `.json` | Dark Mode toàn app |

---

## 8. Use Cases

| ID | Tên | Tiền điều kiện | Luồng chính | Ngoại lệ | Hậu điều kiện |
|---|---|---|---|---|---|
| **UC-01** | Cài đặt lần đầu | App mới | Cài PWA → đặt PIN | iOS chưa cài → `InstallGate` | Dùng được offline ngay |
| **UC-02** | Mở khóa PIN | Đã đặt PIN | Nhập PIN → Trang Chủ | Sai 5 lần → khóa 5 phút | Sync nền nếu đã liên kết |
| **UC-03** | Bật đồng bộ | Online, chưa có vault | Đặt Mật khẩu sổ → lưu Mã khôi phục → `setup` | `409` → chuyển sang UC-04 | Dữ liệu cục bộ lên Drive |
| **UC-04** | Liên kết thiết bị mới | Online, đã có vault | Nhập Mật khẩu sổ → `unlock` | `401`/`429` | Dữ liệu Drive về máy |
| **UC-05** | Khôi phục | Online, có Mã khôi phục | `recover/verify` → mật khẩu mới → `recover/reset` | Sai 5 lần → `429` 15 phút; token > 5 phút → `401` | Ghi chú khóa vẫn mở được |
| **UC-06** | Ghi chú riêng tư | Đã bật đồng bộ | Bật `Khóa riêng` → mã hóa bằng DEK | Chưa nhập Mật khẩu sổ → `PrivatePassModal` | Không có bản rõ trên đĩa/Drive |
| **UC-07** | Kéo thả sticker | Đang mở Editor | Thêm, kéo, chỉnh, lưu | > 20 sticker → chặn | Vị trí `%` đúng sau reload |
| **UC-08** | Vẽ & lưu sticker | Đang ở Studio | Vẽ → `+ Lưu thành Sticker` | Canvas rỗng → nhắc; > 45 KB → hạ `256px` | Sticker ở tab `Tự vẽ` |
| **UC-09** | Chăm Cây Ước | — | Tưới, treo ước, hoàn thành ước | Đã tưới hôm nay → nút tắt | XP/giai đoạn tính lại đúng |
| **UC-10** | Đồng bộ xung đột | 2 máy sửa cùng 1 ghi chú | Máy sau nhận `409` | — | Có thêm `(Bản sao xung đột)`, không mất chữ |

---

## 9. Acceptance Criteria

- **AC-01 (Mật mã)**: Unit test PBKDF2, AES-GCM, AAD sai → giải mã thất bại, đổi mật khẩu & khôi phục giữ dữ liệu: 100% PASS. `notes/<id>.json` của ghi chú khóa và `index.json` có `0` chuỗi bản rõ của `title`, `body`, `checklist`.
- **AC-02 (API)**: Không cookie → `401`; sai mật khẩu 5 lần → `429` 5 phút; sai mã khôi phục 5 lần → `429` 15 phút; ID sai regex → `400`; `baseRev` cũ → `409`; vượt ngưỡng → `413`.
- **AC-03 (Offline & Đồng bộ)**: Tắt mạng vẫn mở PIN, tạo ghi chú/sticker/tưới; bật mạng tự đẩy lên Drive; kịch bản 2 máy cùng sửa sinh đúng 1 `(Bản sao xung đột)`, kể cả với ghi chú khóa khi DEK không có trong RAM.
- **AC-04 (Canvas)**: 3 bút + tẩy + 6 hình khối, Undo/Redo 30 bước; sticker die-cut `<= 384px` và `<= 45 KB`; vị trí/góc/kích thước sticker khớp sau reload ở `390×844`.
- **AC-05 (Cây Ước)**: XP = công thức §5.5 ARCHITECTURE trên mọi bộ dữ liệu test; tưới tối đa 1 lần/ngày; 2 máy cùng tưới cùng ngày chỉ tính 1 lần; đủ 5 giai đoạn; bạn thú không tràn khung `375px`.
- **AC-06 (Giới hạn)**: 20 sticker/ghi chú; `413` đúng ngưỡng.
- **AC-07 (Giao diện)**: `0` cuộn ngang ở `375×667`, `390×844`; vùng chạm `>= 44×44px`; tương phản `>= 4.5:1`; `prefers-reduced-motion`; `0` emoji hệ thống.
- **AC-08 (PWA)**: Script Drive tạo folder với scope `drive.file`; SW phục vụ `/offline` khi mất mạng, không cache `/api/*`; app mở được offline sau lần tải đầu; không lỗi CSP trên console.
- **AC-09 (Sao lưu)**: Xuất rồi nhập vào app trống khôi phục đủ ghi chú, ảnh vẽ, sticker, điều ước, ngày tưới.

---

## 10. Out-of-Scope

- Báo thức, nhắc nhở, Web Push, `.ics`.
- AI cục bộ hoặc Google AI API trong app.
- Đa người dùng, chia sẻ, cộng tác thời gian thực (CRDT).
- Native iOS/macOS (Swift, Capacitor, Electron); Photoshop / DaVinci Resolve.
- Mật khẩu riêng cho từng ghi chú.
- `googleapis`, Service Account.
- Câu hỏi bảo mật (đã thay bằng Mã khôi phục).
