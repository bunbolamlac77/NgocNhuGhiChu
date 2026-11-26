# Tài Liệu Thiết Kế — Ghi Chú Của Ngọc Như

- **Ngày lập**: 2026-11-25
- **Loại sản phẩm**: Mobile-first PWA ghi chú cá nhân (1 người dùng duy nhất — Ngọc Như)
- **Nền tảng triển khai**: Vercel (Hobby/Free) + Google Drive API v3 (Folder cá nhân cố định)
- **Trạng thái**: Chờ duyệt trước khi lập kế hoạch thi công (`writing-plans`)

---

## 1. Mục Tiêu, Ý Định & Ranh Giới Sản Phẩm

### 1.1 Ý định cốt lõi
Xây dựng ứng dụng web ghi chú cá nhân mang tính thẩm mỹ kawaii pastel hồng (động vật dễ thương, hoa lá cành, mẫu giấy văn phòng phẩm Nhật/Hàn) để Ngọc Như viết nhật ký, checklist, tự vẽ tranh/sticker và nuôi một **Cây Ước Nguyện** lớn lên theo thói quen ghi chú — đồng thời lưu trữ dữ liệu an toàn trong Google Drive cá nhân mà không cần đăng nhập Google mỗi lần mở máy.

### 1.2 Mục tiêu (Goals)
1. **Trải nghiệm Mobile-first mượt tức thì (Local-First)**: Mở web trên điện thoại, nhập PIN là viết/vẽ ngay với độ trễ 0ms (`IndexedDB`), tự động đồng bộ nền về Google Drive.
2. **Thẩm mỹ Kawaii đồng nhất**: 6 mẫu giấy nâng cấp từ bộ ảnh tham chiếu, 28+ icon/sticker vector SVG tự vẽ, hỗ trợ dán và kéo thả sticker tự do ở bất kỳ vị trí nào trên tờ ghi chú.
3. **Studio vẽ tay giàu tùy biến & Tự tạo Sticker**: Vẽ nhiều loại bút/màu/độ mờ/hình khối; cắt viền trắng (die-cut) biến nét vẽ tay thành sticker riêng để dán lên mọi ghi chú.
4. **Bảo mật 2 lớp thực chất + Không mất dữ liệu khi quên PIN**: Khóa toàn app khi mở + khóa riêng từng ghi chú (mã hóa client-side `AES-256-GCM`) kèm cơ chế khôi phục bằng câu hỏi bảo mật (Envelope Encryption).
5. **Cây Ước Nguyện sống động**: Cây hoa anh đào tiến hóa 5 giai đoạn và mở khóa 6 nhân vật động vật SVG ghé thăm theo chuỗi ghi chú đều đặn & số điều ước hoàn thành.

### 1.3 Ngoài phạm vi (Non-goals ở MVP)
- **Không có báo thức / nhắc nhở theo giờ / Web Push / xuất `.ics`** (đã thống nhất loại bỏ hoàn toàn; chỉ giữ gắn `dateTag` ngày đơn giản trên ghi chú).
- **Không dùng AI** (không chạy Local LLM tại `/Users/phuthanh/LLMLocalAI`, không gọi Google AI API lúc vận hành).
- **Không đa người dùng / không đồng bộ cộng tác thời gian thực (CRDT)**.
- **Không đóng gói app native iOS/macOS** (Capacitor/Swift); không tích hợp Photoshop/DaVinci Resolve.

### 1.4 Điều tối kỵ (Anti-goals)
- Không để lộ nội dung ghi chú riêng tư dạng plain text trên Google Drive; không để folder Drive ở chế độ công khai ("Chỉ xem" hoặc "Người chỉnh sửa").
- Không dùng emoji hệ thống làm icon điều hướng hoặc biểu tượng chức năng (toàn bộ icon/sticker dùng vector SVG đồng bộ nét vẽ).
- Không nhúng ảnh vẽ dung lượng lớn (base64) vào file danh sách tổng gây tràn RAM di động hoặc nghẽn đồng bộ.
- Không bỏ qua rate-limit khiến người ngoài biết URL Vercel có thể dò PIN hoặc gọi thẳng API Drive.

---

## 2. Ràng Buộc Kỹ Thuật & Quyết Định Kiến Trúc

### 2.1 Ràng buộc bắt buộc
- **Môi trường phát triển**: MacBook Pro M1 Pro, 16 GB RAM (ưu tiên nhẹ, không chạy dịch vụ nền nặng).
- **Host**: Vercel Free (Next.js App Router, Serverless Functions, không phụ thuộc Vercel Cron chạy từng phút).
- **Kho lưu trữ**: Folder riêng tư `"Ghi Chú Của Ngọc Như"` do chính app/script setup khởi tạo trong Google Drive của `ththanhphu7703@gmail.com` ở chế độ **Bị hạn chế (Restricted)**, truy cập bằng OAuth scope hẹp `https://www.googleapis.com/auth/drive.file` (chỉ đọc/ghi đúng folder & file do app tạo, không đụng tới bất kỳ file cá nhân nào khác).

### 2.2 Các phương án đã cân nhắc & Lựa chọn cuối cùng

| Hạng mục | Phương án loại bỏ & Lý do | Phương án đã chọn |
|---|---|---|
| **Kết nối Google Drive** | (1) Service Account → lỗi `403 storageQuotaExceeded` trên Gmail cá nhân. (2) Full scope `auth/drive` cho folder tạo tay → lộ quyền đọc/ghi toàn bộ Gmail Drive & dính rào cản Restricted Scope. | **OAuth 2.0 scope hẹp `drive.file`** + script setup tạo 1 folder riêng `"Ghi Chú Của Ngọc Như"` (Restricted), Backend Next.js giữ Refresh Token trong Vercel Env Vars. |
| **Lưu trữ & Mở khóa Offline** | (1) Đọc/ghi trực tiếp Drive → trễ 300–1200ms. (2) Chỉ cho mở khóa online → mất mạng không xem được sổ. | **Local-First toàn phần (`IndexedDB` + Service Worker App Shell)**: Mở khóa offline tức thì (0ms) bằng bản bọc khóa cache trong `IndexedDB` (`PBKDF2 310,000` vòng, khuyến nghị PIN 6 số), tự làm mới phiên `HttpOnly` và đồng bộ nền delta ngay khi có mạng. |
| **Khóa & Quên mật khẩu** | (1) Khóa UI thuần → lộ dữ liệu khi mở Drive. (2) Mã hóa trực tiếp từ PIN → quên PIN mất sạch dữ liệu khóa. | **Server Session Cookie (`HttpOnly`) + Client-side Envelope Encryption** (`Master DEK` ngẫu nhiên bọc 2 bản: theo PIN/mật khẩu ngăn riêng và theo bộ 2 câu hỏi bảo mật). |
| **Công cụ vẽ tay** | Nhúng nguyên Excalidraw/tldraw → nặng bundle, khó đổi phong cách kawaii mobile-first và khó cắt sticker die-cut. | **`perfect-freehand` + HTML5 Canvas tùy biến** (5 loại bút, hình khối, độ mờ, nền trong suốt, auto-crop die-cut sticker). |

---

## 3. Kiến Trúc Hệ Thống & Lưu Trữ Google Drive

### 3.1 Sơ đồ luồng dữ liệu
```text
[Mobile PWA: Next.js Client]
  ├── UI Layer: Tailwind CSS + daisyUI (pastel/valentine) + Motion + Custom SVG
  ├── Local Store: Dexie.js (IndexedDB)  <-- Ghi/đọc tức thì (0ms, hỗ trợ offline)
  ├── Crypto Engine: Native Web Crypto API (PBKDF2 + AES-256-GCM)
  └── Sync Manager (debounce 2.5s + online/focus trigger)
          │  HTTPS + HttpOnly Signed Session Cookie
          ▼
[Vercel Serverless: Next.js App Router API Routes]
  ├── /api/auth/status    (Kiểm tra đã thiết lập vault hay chưa + trạng thái session)
  ├── /api/auth/setup     (Thiết lập lần đầu: lưu vault.json lên Drive)
  ├── /api/auth/unlock    (Xác thực PIN + rate-limit → cấp HttpOnly Session Cookie)
  ├── /api/auth/lock      (Xóa Session Cookie tức thì)
  ├── /api/auth/recover   (Xác thực verifier câu hỏi bảo mật + rate-limit → trả wrappedKeyByRecovery & cập nhật vault)
  ├── /api/sync/index     (Đọc/cập nhật index.json: metadata ghi chú, wish tree, danh sách custom stickers)
  ├── /api/sync/note/[id] (Đọc/ghi/xóa file notes/<noteId>.json)
  └── /api/sync/asset     (Upload/download drawings/<id>.webp|.enc và stickers/<id>.webp)
          │  Google OAuth 2.0 Access Token (tự làm mới từ Refresh Token)
          ▼
[Google Drive Folder: Ghi Chú Của Ngọc Như (Restricted)]
```

### 3.2 Cấu trúc tệp trên Google Drive
```text
Ghi Chú Của Ngọc Như/ (Folder ID: GOOGLE_DRIVE_FOLDER_ID)
├── vault.json                # Cấu hình khóa, salt, verifier hash, 2 bản bọc Master DEK, bộ câu hỏi, lockout state
├── index.json                # Metadata ghi chú + trạng thái Cây Ước Nguyện + danh sách điều ước + mục lục sticker tự vẽ
├── notes/
│   └── <noteId>.json         # Chi tiết 1 ghi chú (nếu isLocked=true: trường encryptedPayload là AES-GCM ciphertext)
├── drawings/
│   ├── <drawingId>.webp      # Ảnh vẽ phẳng cho ghi chú thường (tối ưu tải nhanh, < 150 KB)
│   └── <drawingId>.enc       # Ciphertext AES-GCM của ảnh vẽ khi thuộc ghi chú riêng tư
└── stickers/
    └── <stickerId>.webp      # Sticker tự vẽ tay (PNG/WebP nền trong suốt + viền trắng die-cut, max 384×384px, < 40 KB)
```

### 3.3 Biến môi trường Vercel (Bắt buộc)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN` (của tài khoản chủ sở hữu với scope hẹp `https://www.googleapis.com/auth/drive.file`, OAuth Consent Screen đặt chế độ *Production* để token không hết hạn sau 7 ngày)
- `GOOGLE_DRIVE_FOLDER_ID` (Folder ID do script setup 1 lần tạo tự động dưới quyền `drive.file`, đặt chế độ **Bị hạn chế**)
- `APP_SESSION_SECRET` (chuỗi ngẫu nhiên 32+ byte dùng ký JWT/HMAC cho session cookie)

### 3.4 Chiến lược Đồng bộ Local-First & Xử lý Xung đột
1. **Ghi cục bộ trước**: Mọi thao tác sửa ghi chú, di chuyển sticker, lưu bức vẽ, treo điều ước được ghi ngay vào `IndexedDB` kèm `syncStatus: 'pending'` và `updatedAt = Date.now()`.
2. **Đồng bộ nền thông minh**: Gom thay đổi sau 2.5 giây không gõ (debounce) hoặc ngay khi người dùng bấm nút Lưu / quay lại từ chế độ offline (`window.addEventListener('online')`).
3. **Giải quyết xung đột đa thiết bị**:
   - Khi tải `index.json` về, so sánh `updatedAt` và `lastSyncedAt` cho từng `noteId`.
   - Nếu cả local và Drive đều thay đổi sau lần sync gần nhất: giữ bản mới hơn theo `updatedAt`, đồng thời **nhân bản bản còn lại** thành 1 ghi chú mới có hậu tố `(Bản sao xung đột)` để đảm bảo không bao giờ mất nội dung.
4. **Xóa mềm (Soft Delete)**: Khi xóa ghi chú/sticker, đặt `deleted: true, deletedAt` để đồng bộ lệnh xóa sang thiết bị khác; dọn file rác trên Drive sau 30 ngày.

---

## 4. Thiết Kế Bảo Mật 2 Lớp & Khôi Phục Mật Khẩu

### 4.1 Luồng thiết lập lần đầu (First-Time Setup)
Khi `vault.json` chưa tồn tại trong Drive, app mở màn hình thiết lập 2 bước:
1. Đặt **mã PIN mở sổ** (Lớp 1, **khuyến nghị 6 chữ số** để tăng sức chống dò khi cache offline; cho phép 4–6 số) và tùy chọn đặt **mật khẩu Ngăn Riêng Tư** (Lớp 2, mặc định dùng chung PIN mở sổ hoặc đặt khác nếu muốn — *Quyết định kiến trúc đề xuất*).
2. Chọn/nhập **2 câu hỏi bảo mật cá nhân** (khuyến nghị đáp án khó đoán với người ngoài) và nhập đáp án.

### 4.2 Cơ chế Envelope Encryption (Key Wrapping)
Toàn bộ thao tác sinh khóa và mã hóa/giải mã chạy trên trình duyệt bằng native `Web Crypto API`:
- Chuẩn hóa đáp án câu hỏi bảo mật trước khi dẫn xuất khóa:
  `normalize(s) = s.trim().toLowerCase().normalize('NFC').replace(/\s+/g, ' ')`
- Sinh khóa dữ liệu chính ngẫu nhiên 256-bit: `Master DEK` (`AES-GCM`).
- Dẫn xuất các khóa bọc (Key Encryption Keys) bằng `PBKDF2-HMAC-SHA256` (`310,000` vòng lặp, salt ngẫu nhiên 16 byte riêng biệt):
  - `KEK_appPin = PBKDF2(appPin, saltAppPin)` → mã hóa `Master DEK` thành `wrappedDekByAppPin` (dùng khi Lớp 2 dùng chung PIN) hoặc mã hóa `IndexKey` (nếu Lớp 2 đặt mật khẩu riêng).
  - `KEK_privatePass = PBKDF2(privatePass, saltPrivatePass)` → mã hóa `Master DEK` thành `wrappedDekByPrivatePass` (nếu người dùng đặt mật khẩu Lớp 2 tách biệt).
  - `KEK_rec = PBKDF2(normalize(a1) + '||' + normalize(a2), saltRec)` → mã hóa `Master DEK` thành `wrappedDekByRecovery`.
- Sinh `pinVerifier` và `recoveryVerifier` (hash tách biệt bằng salt riêng, không thể suy ngược lại `KEK`) gửi lên `vault.json` để Backend xác thực và áp dụng rate-limit.
- **Lưu ý bảo mật**: `vault.json` chỉ lưu nội dung 2 câu hỏi (để hiển thị), `salt`, `verifier` và các bản `wrappedDek`; **tuyệt đối không lưu PIN, không lưu mật khẩu riêng, không lưu đáp án và không lưu `Master DEK` dạng rõ**.

### 4.3 Khóa 2 lớp, Mở khóa Offline & Ranh giới mã hóa
1. **Lớp 1 — Khóa toàn App (Bìa Sổ Thỏ) & Mở khóa Offline (Phương án 2A đã chốt)**:
   - Sau lần mở khóa online đầu tiên trên thiết bị, app cache `vaultSnapshot` (`salt`, `wrappedDekByAppPin`, `pinVerifier`) trong `IndexedDB` và cache toàn bộ App Shell qua **Service Worker** để hoạt động 100% offline.
   - **Khi mở sổ (Online & Offline)**: Client dẫn xuất `KEK_appPin` (`PBKDF2 310,000` vòng) và giải bọc khóa cục bộ ngay lập tức (0ms network wait), kèm bộ đếm khóa cục bộ (sai 5 lần khóa 5 phút).
   - **Đồng bộ phiên bảo mật khi có mạng**: Song song ở nền (hoặc ngay khi `online` event kích hoạt), Client gửi `pinProof` tới `/api/auth/unlock` để xác thực với `vault.json`, áp dụng rate-limit phía server và nhận/gia hạn `HttpOnly; Secure; SameSite=Lax` signed cookie (hạn 7 ngày) nhằm cho phép gọi `/api/sync/*`. Nếu phát hiện PIN đã bị đổi trên thiết bị khác, lập tức khóa màn hình và yêu cầu nhập PIN mới.
   - Tự khóa app và xóa khóa giải mã khỏi RAM khi bấm nút Khóa hoặc khi app chạy nền quá 15 phút.
2. **Lớp 2 — Khóa từng Ghi chú Riêng tư (`isLocked: true`)**:
   - **Phạm vi MVP**: Dùng **1 mật khẩu Ngăn Riêng Tư chung** cho mọi ghi chú khóa (mặc định bằng PIN mở sổ, có tùy chọn đổi khác trong Cài đặt; không tạo mật khẩu riêng lẻ khác nhau cho từng ghi chú để đảm bảo gọn UX và khôi phục 100% qua 2 câu hỏi bảo mật).
   - **Ranh giới mã hóa trên Drive & `IndexedDB`**:
     - Trên Google Drive (`index.json`): **mã hóa cả `title` (`encryptedTitle`)** của ghi chú khóa bằng khóa trong vault; chỉ giữ metadata không nhạy cảm (`noteId, updatedAt, deleted, isLocked: true, templateId, category: 'private', dateTag`).
     - Trong `notes/<noteId>.json` và `drawings/<drawingId>.enc`: mã hóa toàn bộ văn bản, checklist, tọa độ sticker và ảnh vẽ bằng `Master DEK` (`AES-256-GCM`, IV ngẫu nhiên 12 byte mỗi lần ghi).
     - Trong `IndexedDB`: giữ nguyên `encryptedPayload` ở dạng ciphertext trên đĩa; chỉ giải mã nội dung vào RAM khi người dùng vượt qua Lớp 2 trên ghi chú đó và xóa khỏi RAM khi đóng ghi chú.
     - **Tìm kiếm cục bộ**: tìm toàn văn trên ghi chú thường và tìm theo tiêu đề đối với ghi chú khóa (không lập chỉ mục nội dung bí mật dạng rõ xuống đĩa).

### 4.4 Luồng Quên mật khẩu (Recovery)
1. Bấm **Quên PIN?** (hoặc quên mật khẩu Ngăn Riêng Tư) → hiển thị 2 câu hỏi bảo mật đã cài.
2. Nhập 2 đáp án → gửi `recoveryProof` lên `/api/auth/recover` (rate-limit tối đa 5 lần sai / 15 phút).
3. Server xác nhận đúng → trả `wrappedDekByRecovery` + token đặt lại ngắn hạn (5 phút).
4. Client dẫn xuất `KEK_rec` → giải bọc `Master DEK` → đặt lại PIN mới (và mật khẩu Ngăn Riêng Tư mới) → bọc lại các khóa và cập nhật `vault.json` → **giữ nguyên 100% ghi chú và ảnh vẽ đã mã hóa**.

---

## 5. Đặc Tả Tính Năng Chi Tiết

### 5.1 Ghi chú & 6 Mẫu giấy nâng cấp
- **6 Mẫu giấy thiết kế lại bằng SVG + CSS** (nâng cấp từ 5 ảnh mẫu người dùng cung cấp):
  1. `sakura-dashed` — Hoa Anh Đào Viền Nét Đứt (dòng kẻ hồng nhẹ, hoa 5 cánh & cành lá góc).
  2. `piggy-plaid` — Caro Hồng Kem Heo Con (kẻ caro hồng sữa, bé heo ló góc, dòng kẻ ngôi sao).
  3. `cloud-frame` — Khung Mây Bồng Bềnh (viền mây bo mềm, hợp vẽ tay & ghi chú ngắn).
  4. `botanical-garden` — Vườn Hoa Lá Nét Vẽ Tay (chấm bi pastel, cành lá xuân 4 góc).
  5. `strawberry-stripe` — Sọc Dâu Kem Gấu Bông (sọc pastel hồng-kem, gấu mật ong).
  6. `heart-grid` — Lưới Trái Tim (giấy ô vuông hồng mảnh, hợp Bullet Journal & checklist).
- **Thành phần 1 ghi chú**:
  - Tiêu đề, nội dung văn bản nhiều dòng, danh sách **Checklist trái tim** (chạm để tô đầy tim + đếm tiến độ `x/y`).
  - Gắn 1 **ngày đơn giản (`dateTag`)** (dạng `YYYY-MM-DD`, chỉ để lưu mốc kỷ niệm/lọc ngày, không có báo thức).
  - Nhãn phân loại (`Nhật ký`, `Checklist`, `Vẽ tay`, `Riêng tư`) + tìm kiếm cục bộ tức thì.
  - Đính kèm tối đa 1 bức vẽ từ Studio Vẽ Tay và nhiều sticker tự do.

### 5.2 Bộ 28+ Icon/Sticker SVG & Kéo thả tự do khắp ghi chú
- **Thư viện 28+ SVG tự vẽ sẵn** (nét nâu mận ấm `#4A2C3A`, bo tròn mềm mại, không dùng emoji hệ thống), phân 4 nhóm:
  - **Động vật (10)**: Thỏ Mochi, Heo Mũm Mĩm, Gấu Mật Ong, Mèo Dâu Tây, Chim Chíp, Bướm Hồng, Cún Corgi, Cáo Nhỏ, Gấu Trúc, Vịt Vàng.
  - **Hoa lá & Thiên nhiên (8)**: Hoa Anh Đào, Cành Lá Xuân, Hoa Tulip, Hoa Cúc Nhỏ, Cỏ 4 Lá, Cầu Vồng Pastel, Đám Mây Cười, Trăng & Sao.
  - **Ngọt ngào & Văn phòng phẩm (6)**: Bánh Kem Dâu, Trà Sữa, Dâu Tây, Đào Hồng, Nơ Ruy-băng, Bút Chì Cười.
  - **Nhật ký & Cảm xúc (4)**: Ổ Khóa Tim, Thẻ Ước Nguyện, Thư Tình Niêm Phong, Trái Tim Lấp Lánh.
- **Kéo thả sticker tự do trên toàn bộ bề mặt ghi chú**:
  - Mỗi ghi chú có lớp `StickerLayer` phủ trọn khung giấy ghi chú.
  - Nút gạt nhanh trên thanh công cụ: **Chế độ Viết chữ** (sticker `pointer-events: none` để gõ chữ/cuộn trang mượt không vướng) ↔ **Chế độ Dán & Kéo Sticker** (chạm chọn bất kỳ sticker nào để kéo di chuyển khắp ghi chú).
  - Khi một sticker đang được chọn: hiện viền nét đứt hồng + cụm điều khiển trực quan (vùng chạm `>= 44×44px`):
    - Kéo thân sticker để đổi vị trí (`xPct`, `yPct` giới hạn `4%–96%`).
    - Nút/thanh chỉnh **Kích thước** (`0.5x–2.2x`), **Góc xoay** (`-180°..180°`), **Đưa lên trên**, **Xóa**.
  - Lưu tọa độ chuẩn hóa theo phần trăm kích thước khung giấy (`xPct`, `yPct`, `scale`, `rotation`, `zIndex`) để vị trí sticker không bị lệch khi mở lại trên màn hình rộng hơn.
  - Giới hạn hợp lý: tối đa 20 sticker / ghi chú để giữ mượt 60fps trên điện thoại.

### 5.3 Studio Vẽ Tay Tùy Biến Cao & Tự Tạo Sticker Vẽ Tay
- **5 loại bút vẽ**:
  1. **Bút mực mượt** (`perfect-freehand`): mô phỏng lực ấn/tốc độ, nét thanh đậm tự nhiên.
  2. **Bút dạ quang (Highlighter)**: nét bán trong suốt, tô nổi mềm mại.
  3. **Bút sáp phấn pastel (Crayon)**: kết cấu chấm mịn giả chất liệu phấn màu.
  4. **Bút nét đứt (Dashed)**: vẽ đường viền trang trí, khung ghi chú.
  5. **Bút lấp lánh (Sparkle Stamp)**: rải trái tim/ngôi sao/cánh hoa dọc đường kéo tay.
- **Tùy biến mở rộng**:
  - **Màu sắc**: 16 màu pastel & mực ấm chọn nhanh + bộ chọn màu tự do (`color picker`).
  - **Cỡ nét** (slider `2px–32px`) và **Độ mờ Opacity** (slider `20%–100%`).
  - **Hình khối kawaii (Shape Stamp)**: Trái tim, Ngôi sao, Hình tròn, Khung mây/bo góc, Bong bóng thoại, Mũi tên — đặt nhanh theo màu đang chọn.
  - **5 nền giấy vẽ**: **Nền trong suốt** (ô caro mờ chuyên để vẽ Sticker), Trắng tinh, Lưới chấm hồng, Caro hồng kem, Dòng kẻ hoa anh đào.
  - **Công cụ hỗ trợ**: Tẩy (Eraser), Undo & Redo (tối thiểu 30 bước), Xóa sạch (có xác nhận), Đính vào ghi chú hiện tại, Xuất ảnh PNG.
- **Tính năng "Lưu làm Sticker tự vẽ tay" (Custom Die-cut Sticker)**:
  1. Người dùng vẽ hình bất kỳ trên Canvas (khuyến nghị chọn nền *Trong suốt*).
  2. Bấm **Lưu làm Sticker riêng** → mở hộp thoại xem trước: đặt tên ngắn + bật/tắt **Viền trắng cắt bế (Die-cut outline)** + bật/tắt bóng mềm.
  3. Xử lý trên Offscreen Canvas (100% client-side, 0 tải server):
     - Tự động quét vùng pixel không trong suốt (`alpha > 10`) để cắt gọn biên thừa + thêm padding 16px.
     - Nếu bật Die-cut: vẽ lớp viền trắng bo đều quanh hình (8–10px) tạo cảm giác nhãn dán giấy kawaii thật.
     - Thu gọn về tối đa `384×384px`, nén xuất `image/webp` (fallback `image/png`, mục tiêu `< 40 KB`).
  4. Lưu vào `IndexedDB` (`customStickers`) và đồng bộ lên Drive (`stickers/<stickerId>.webp`).
  5. Hiển thị ngay trong tab **Tự vẽ** ở khay sticker của trình soạn ghi chú để dán & kéo thả tự do lên mọi ghi chú (có thể xóa sticker tự vẽ trong mục quản lý).

### 5.4 Khu Vườn Cây Ước Nguyện (Nâng cấp Giao diện & Tương tác)
Thiết kế theo phong cách tranh truyện Ghibli/Animal Crossing thu nhỏ, vừa có chiều sâu thị giác vừa tạo cảm giác chăm sóc mỗi ngày:

- **3 Chế độ Bầu trời & Không khí (Atmosphere Modes)**:
  - **Sáng Anh Đào (Day)**: Trời hồng kem → xanh pastel dịu, tia nắng xiên ấm, mây bông trôi chậm, bướm bay.
  - **Hoàng Hôn Đào (Sunset)**: Trời cam đào → hồng oải hương mộng mơ, ánh chiều phủ ấm lên tán hoa.
  - **Đêm Đom Đóm (Night)**: Trời tím đêm dịu mắt, mặt trăng lưỡi liềm cười, sao nhấp nháy, **đom đóm vàng phát sáng bay lượn**, và **đèn lồng hốc cây + các thẻ điều ước phát sáng ấm áp** trên cành.
  - Hỗ trợ chuyển thủ công (`Sáng / Chiều / Đêm`) hoặc tự động theo giờ thực tế.
- **Đồ họa Khu Vườn Cây Anh Đào đa tầng (Multi-layered SVG)**:
  - **Thân cây & Chi tiết sống động**: Thân gỗ ấm có vân nhẹ, rễ ôm đồi cỏ, **hốc cây có đèn lồng mini phát sáng**, **xích đu gỗ dây thừng đung đưa nhẹ** treo dưới cành chính.
  - **Tán hoa 4 tầng chiều sâu**: Lớp tán đậm phía sau → tán hồng phấn giữa → cụm sáng phía trước → bông hoa anh đào 5 cánh chi tiết & dải hoa rủ mềm mại, kèm cánh hoa rơi nhẹ.
  - **Cảnh quan mặt đất**: Đồi cỏ 2 lớp, hàng rào gỗ trắng thấp, lối đá tròn dẫn tới gốc cây, khóm nấm chấm bi hồng, bụi hoa tulip/cúc nhỏ và khăn trải picnic mini.
- **4 Kiểu Thẻ Điều Ước & Ngăn kéo "Hộp Điều Ước"**:
  - Khi tạo điều ước mới, người dùng chọn 1 trong 4 mẫu thẻ có màu ruy-băng riêng: **Thẻ Ema Hồng** (Hạnh phúc), **Thẻ Trái Tim Nơ** (Bản thân), **Thẻ Ngôi Sao Vàng** (Mục tiêu), **Thẻ Đèn Lồng** (Du lịch/Trải nghiệm — phát sáng ấm vào ban đêm).
  - Treo tối đa 8 thẻ mới nhất đung đưa trực tiếp trên cành; toàn bộ điều ước xem gọn trong **Ngăn kéo Hộp Điều Ước** (tab *Đang ấp ủ* / *Đã thành hiện thực*).
  - Khi đánh dấu **Thành hiện thực**: thẻ hóa **Vàng Lấp Lánh (Golden Glow)** kèm cơn mưa cánh hoa anh đào chúc mừng.
- **Chăm sóc cây & Mô hình tiến hóa (`treeXP`)**:
  - **Tưới sương mai (1 lần/ngày)**: Nút tương tác bình tưới hồng kawaii rải giọt sương lấp lánh xuống gốc cây (`+5 XP`), làm tán hoa rung nhẹ và các bạn thú reo vui.
  - **Tạo ghi chú đầu tiên mỗi ngày**: `+10 XP` (tăng `streakDays` nếu nối tiếp ngày hôm trước).
  - **Treo điều ước mới**: `+5 XP`.
  - **Đánh dấu điều ước Đã thành hiện thực**: `+25 XP`.
  - **5 giai đoạn phát triển & 6 bạn thú SVG có phụ kiện riêng**:
    1. **Giai đoạn 1 — Mầm Non** (`0–19 XP`): Mầm xanh 2 lá non bên hàng rào gỗ & nấm hồng.
    2. **Giai đoạn 2 — Cây Con** (`20–59 XP`): Cây nhỏ ra tán hồng → mở khóa **Thỏ Mochi** (cầm bông hoa).
    3. **Giai đoạn 3 — Đơm Nụ** (`60–129 XP`): Tán đầy hơn, có xích đu gỗ & nụ hoa → mở khóa **Heo Mũm Mĩm** (đội chiếc lá nhỏ).
    4. **Giai đoạn 4 — Anh Đào Nở Rộ** (`130–219 XP`): Tán hoa nở rộ, hốc cây sáng đèn, cánh hoa rơi → mở khóa **Gấu Mật Ong** (ngồi thảm picnic) & **Chim Chíp** (đậu tổ nhỏ trên cành).
    5. **Giai đoạn 5 — Vườn Hoa Lung Linh** (`220+ XP`): Dải hoa rủ rực rỡ, đom đóm/lấp lánh → mở khóa **Mèo Dâu Tây** (bên hàng rào gỗ) & **Bướm Hồng**.
  - Chạm vào từng bạn thú hiển thị bóng thoại lời chúc/động viên tiếng Việt + hiệu ứng nhún nhẹ.

---

## 6. Design System, Bố Cục Mobile-First & PWA

### 6.1 Bảng màu chính thức & Tài liệu mẫu trực quan
- **Nguồn tham chiếu trực quan chuẩn (Visual Source of Truth)**: File mẫu tương tác đã được người dùng duyệt đặt ngay trong cùng thư mục đặc tả tại `docs/superpowers/specs/ui-preview-kawaii.html` (chứa đầy đủ mã nguồn SVG chuẩn cho Bìa Sổ Thỏ Khóa Tim, 6 mẫu giấy nâng cấp, 24+ sticker/icon vector, bố cục 5 màn hình mobile-first và 5 giai đoạn Cây Ước Nguyện + 6 bạn thú). Builder sử dụng trực tiếp hệ nét (`#4A2C3A`, bo tròn mềm mại) và tỉ lệ hình khối từ file này khi dựng các component React/SVG thật.

| Token | Mã Hex | Vai trò |
|---|---|---|
| `--k-bg` (Sakura Paper) | `#FFF5F8` | Nền chính toàn app |
| `--k-surface` | `#FFFFFF` | Thẻ ghi chú, modal, thanh điều hướng |
| `--k-pink-soft` | `#FFE4EE` | Nền nhấn nhẹ, nút phụ, badge |
| `--k-pink-plush` | `#FFB7CE` | Bìa sổ, viền khung chính, tán hoa |
| `--k-berry` (Primary CTA) | `#D63D76` | Nút hành động chính, tab đang chọn (tương phản trắng > 4.5:1) |
| `--k-ink` (Cocoa Ink) | `#4A2C3A` | Chữ chính & nét vẽ SVG (tương phản nền sáng > 10:1) |
| `--k-muted` (Blush Muted) | `#8C5A6E` | Nhãn phụ, ngày tháng (tương phản > 4.5:1) |
| `--k-cream` / `--k-mint` | `#FFF4D6` / `#C6EBD1` | Khóa tim vàng, cành lá, thảm cỏ cây ước |

### 6.2 Typography & Layout
- **Font**: `Nunito` hoặc `Quicksand` (hỗ trợ đầy đủ dấu tiếng Việt, tải tối ưu qua `next/font/google`, fallback `ui-rounded, "SF Pro Rounded"`).
- **Khung Mobile-first**: Thiết kế ưu tiên màn hình `375px–430px` (chừa `env(safe-area-inset-top/bottom)` cho iPhone), thanh điều hướng đáy cố định **4 mục** (`Ghi chú`, `Viết mới`, `Vẽ tay`, `Cây ước`), vùng chạm tối thiểu `44×44px`. Trên Desktop căn giữa dạng khung sổ gọn (`max-w-[480px]` hoặc lưới rộng thoáng cho danh sách ghi chú).
- **Chuyển động & Tiếp cận**: Tuân thủ `prefers-reduced-motion`, nhãn `aria-label` cho mọi nút icon, viền focus rõ cho bàn phím.
- **PWA**: `manifest.webmanifest` với tên `"Ghi Chú Ngọc Như"`, `display: "standalone"`, `theme_color: "#FFE0EC"`, bộ icon PWA vẽ từ **Bìa Sổ Thỏ Khóa Tim**.

---

## 7. Tech Stack & Hạng Mục Để Lại Cho Bước Thi Công

### 7.1 Tech Stack chốt
- **Core**: `Next.js` (App Router, TypeScript strict), `React 19`.
- **UI & Animation**: `Tailwind CSS`, `daisyUI` (base theme `pastel`/`valentine`), `motion` (Framer Motion), `lucide-react` (chỉ bổ trợ các icon điều khiển hệ thống mảnh; toàn bộ mascot/sticker/mẫu giấy là SVG tự vẽ).
- **Local-First & State**: `dexie` (`IndexedDB`), `zustand`.
- **Drawing**: `perfect-freehand` + HTML5 Canvas API.
- **Backend & Drive**: Next.js Route Handlers + Google Drive REST API v3 (dùng `fetch` trực tiếp nhẹ hơn `googleapis` SDK cồng kềnh, giảm cold-start Vercel).
- **Security**: Native `Web Crypto API` (client) + Node `crypto` / `jose` (server session JWT).
- **Kiểm thử**: `Vitest` (unit test cho crypto envelope, sync conflict, tree XP, bounding-box crop) + `Playwright` (E2E mobile viewport `390×844`).

### 7.2 Phần để lại cho Builder ở bước lập kế hoạch (`writing-plans`)
- Tổ chức chi tiết cây thư mục `src/` và tách bundle lazy-load cho Studio Vẽ Tay.
- Script hướng dẫn/CLI 1 lần để chủ sở hữu lấy `GOOGLE_REFRESH_TOKEN` an toàn trên máy local.
- Thiết kế chi tiết schema bảng `Dexie` và chiến lược cache metadata `driveFileId` trên local để giảm số lượng call `files.list` lên Drive API.
- Danh sách bộ câu chúc tiếng Việt cho 6 bạn thú trên Cây Ước Nguyện.
