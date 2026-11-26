# Đặc Tả Chi Tiết Ứng Dụng (Detailed Application Specification) — Ghi Chú Của Ngọc Như

- **Phiên bản**: 1.0 (Căn cứ trên Thiết kế kiến trúc [2026-11-25-ghi-chu-ngoc-nhu-design.md](2026-11-25-ghi-chu-ngoc-nhu-design.md) và UI/UX đã chốt [2026-11-25-ui-ux-design-system.md](2026-11-25-ui-ux-design-system.md))
- **Ngày lập**: 2026-11-25
- **Mục tiêu tài liệu**: Quy định chính xác luồng nghiệp vụ, lược đồ dữ liệu (TypeScript / `IndexedDB` / Google Drive), hợp đồng API, đặc tả mật mã học, thuật toán đồng bộ, engine vẽ & cắt sticker die-cut, và tiêu chí nghiệm thu làm căn cứ trực tiếp cho bước lập kế hoạch thi công (`writing-plans`).

---

## 1. Luồng Nghiệp Vụ & Máy Trạng Thái (User Flows & State Machines)

### 1.1 Luồng 1 — Khởi tạo lần đầu (`First-Time Setup`)
1. App tải xong → gọi `GET /api/auth/status` (nếu offline mà chưa từng cài trên máy → báo cần mạng cho lần thiết lập đầu tiên).
2. Nếu `initialized === false` (chưa có `vault.json` trên Drive):
   - Hiển thị màn hình **Tạo Sổ Nhỏ Ngọc Như** gồm 2 bước:
     - **Bước 1**: Nhập mã PIN mở sổ (**khuyến nghị 6 chữ số**, chấp nhận 4–6 số) + xác nhận lại PIN; tùy chọn gạt công tắc *"Dùng mật khẩu riêng cho Ngăn Ghi Chú Riêng Tư"* (mặc định tắt = dùng chung PIN mở sổ).
     - **Bước 2**: Chọn hoặc tự viết **2 câu hỏi bảo mật** + nhập 2 đáp án (hiển thị nhắc nhở: đáp án không phân biệt hoa/thường và tự gộp khoảng trắng thừa).
3. Client chạy Web Crypto sinh `Master DEK`, `IndexKey`, các `salt`, `wrappedDek*`, `pinVerifier`, `recoveryVerifier`.
4. Client gửi `POST /api/auth/setup` → Server kiểm tra chắc chắn `vault.json` chưa tồn tại (tránh ghi đè) → ghi `vault.json` & `index.json` rỗng ban đầu vào Drive → cấp `HttpOnly` Session Cookie → lưu `vaultSnapshot` vào `IndexedDB` → vào Trang Chủ.

### 1.2 Luồng 2 — Mở khóa hàng ngày (Online & Offline 0ms — Phương án 2A)
```text
[App Open / Resume > 15m idle]
   │
   ├─► (Chưa có vaultSnapshot ở IndexedDB) ──► Gọi /api/auth/status → Tải salt & verifier (cần mạng lần đầu)
   │
   ▼
[Màn hình Bìa Sổ Thỏ — Nhập PIN]
   │
   ├─► Kiểm tra localLockoutUntil (IndexedDB): nếu còn hạn → hiện đếm ngược, chặn nhập.
   │
   ▼
[Xác thực PIN cục bộ (0ms network)]
   ├─ Dẫn xuất KEK_appPin (PBKDF2 310,000 vòng) → thử giải bọc khóa cục bộ
   ├─ Sai → tăng localFailedAttempts (đủ 5 lần → khóa 5 phút) + rung nhẹ chấm trái tim
   └─ Đúng → Nạp khóa vào RAM → Vào Trang Chủ ngay (0ms!)
          │
          ▼ (Chạy nền không chặn UI khi navigator.onLine === true)
   [POST /api/auth/unlock với pinProof]
   ├─ 200 OK → Nhận/gia hạn HttpOnly Session Cookie + đồng bộ delta Drive
   ├─ 401 (PIN đã bị đổi trên thiết bị khác) → Xóa khóa RAM, cập nhật vaultSnapshot, quay lại Bìa Sổ Thỏ + thông báo
   └─ 429 (Server lockout) → Xóa khóa RAM, quay lại Bìa Sổ Thỏ + hiện thời gian chờ
```
- **Tự động khóa an toàn**: Lắng nghe `document.visibilitychange`. Nếu ẩn app quá **15 phút** (hoặc người dùng bấm nút Ổ khóa trên Header), lập tức xóa `Master DEK`/`IndexKey` khỏi RAM và chuyển về Bìa Sổ Thỏ (trạng thái soạn nháp dở đã được lưu vào `IndexedDB` nên không mất chữ).

### 1.3 Luồng 3 — Quên PIN / Khôi phục qua 2 câu hỏi bảo mật
1. Tại Bìa Sổ Thỏ (hoặc hộp thoại mở Ngăn Riêng Tư), bấm **Quên PIN?** (yêu cầu có mạng để đồng bộ `vault.json` mới và kiểm soát rate-limit từ server).
2. Hiển thị 2 câu hỏi đọc từ `vault.json` / `vaultSnapshot`.
3. Người dùng nhập 2 đáp án → Client chuẩn hóa (`trim().toLowerCase().normalize('NFC').replace(/\s+/g, ' ')`), tính `recoveryProof` gửi `POST /api/auth/recover/verify`.
4. Server kiểm tra `recoveryLockoutUntil` (tối đa 5 lần sai / 15 phút) → nếu đúng, trả `wrappedDekByRecovery` + `recoveryToken` hiệu lực 5 phút.
5. Client tính `KEK_rec`, giải bọc `Master DEK` trong RAM → hiển thị form nhập **PIN mở sổ mới** (và mật khẩu Ngăn Riêng Tư mới nếu dùng riêng) → bọc lại khóa mới → gửi `POST /api/auth/recover/reset` cập nhật `vault.json` → cập nhật `vaultSnapshot` trong `IndexedDB` → cấp Session Cookie mới → mở sổ thành công, giữ nguyên 100% ghi chú mã hóa.

### 1.4 Luồng 4 — Quản lý Ghi chú, Checklist & Khóa Lớp 2
- **Tạo / Sửa**: Mở trình soạn thảo, chọn 1 trong 6 mẫu giấy, nhập tiêu đề + nội dung + danh sách checklist trái tim (thêm/sửa/tick/xóa dòng) + tùy chọn `dateTag` (`YYYY-MM-DD`) + nhãn danh mục (`diary | checklist | draw | private`).
- **Tự lưu cục bộ**: Ghi vào `IndexedDB` sau mỗi 400ms dừng gõ (UI phản hồi tức thì), đẩy vào hàng đợi đồng bộ Drive sau 2.5 giây.
- **Khóa/Mở Lớp 2 (`isLocked`)**:
  - Khi bật `isLocked = true`: thẻ tự động gắn danh mục `private`, khi lưu xuống `IndexedDB` và đẩy lên Drive sẽ mã hóa toàn bộ nội dung (`encryptedPayload`), tiêu đề (`encryptedTitle`) và ảnh vẽ đính kèm (`drawings/<id>.enc`).
  - Khi chạm vào thẻ `isLocked = true` ở Trang Chủ: mở modal nhập mật khẩu Ngăn Riêng Tư (mặc định là PIN sổ, hoặc mật khẩu riêng Lớp 2). Xác thực đúng → giải mã nội dung vào RAM cho riêng phiên xem ghi chú đó → đóng ghi chú thì xóa bản rõ khỏi RAM.
- **Xóa mềm**: Chuyển `deleted = true`, `deletedAt = now`; hiện toast có nút **Hoàn tác (5 giây)**.

### 1.5 Luồng 5 — Kéo thả Sticker tự do khắp Ghi chú
- Trên màn soạn thảo có nút chuyển đổi 2 chế độ: **`Sửa chữ`** (lớp sticker không bắt chạm `pointer-events: none`, người dùng gõ chữ/cuộn tự nhiên) ↔ **`Kéo Sticker`** (lớp sticker bắt chạm `pointer-events: auto`).
- Khi chạm 1 sticker từ khay (4 tab: `Thú`, `Hoa lá`, `Đồ ngọt`, `Tự vẽ`): app tự chuyển sang chế độ `Kéo Sticker`, thêm sticker vào giữa vùng nhìn của giấy, đánh dấu đang chọn (`selected`).
- Kéo thả bằng Pointer Events (`setPointerCapture`) cập nhật tọa độ chuẩn hóa `xPct` (`4..96`), `yPct` (`4..96`).
- Thanh công cụ dưới tờ giấy chỉnh sticker đang chọn: Thu nhỏ/Phóng to (`0.5..2.2`), Xoay (`-180°..180°` bước 15° hoặc xoay mượt), Đưa lên lớp trên cùng (`zIndex`), Xóa. Giới hạn tối đa **20 sticker/ghi chú**.

### 1.6 Luồng 6 — Studio Vẽ Tay & Tạo Sticker Tự Vẽ Tay (Die-cut)
- Vào từ tab `Vẽ tay` (vẽ độc lập hoặc tạo sticker) hoặc từ nút *"Vẽ đính kèm"* trong 1 ghi chú.
- **Đính vào ghi chú**: Xuất ảnh phẳng `WebP` (fallback `PNG`, `< 150 KB`, kích thước cạnh lớn nhất `1200px`) lưu vào `IndexedDB.drawings` và đồng bộ lên `drawings/<drawingId>.webp` (hoặc `.enc` nếu ghi chú đang khóa).
- **Lưu thành Sticker tự vẽ tay**: Chạy thuật toán cắt biên + bọc viền trắng die-cut (Mục 6) → nén `< 40 KB` (`max 384×384px`) → lưu vào `IndexedDB.customStickers` + đồng bộ `stickers/<stickerId>.webp` → xuất hiện ngay trong tab `Tự vẽ` của khay sticker.

### 1.7 Luồng 7 — Khu Vườn Cây Ước Nguyện
- **Bầu trời**: Mặc định theo giờ máy (`05:00–16:59`: `day`, `17:00–18:59`: `sunset`, `19:00–04:59`: `night`); người dùng có thể bấm nút `Sáng / Chiều / Đêm` để xem thử bất cứ lúc nào.
- **Tưới sương mai**: Kiểm tra `treeState.lastWateredDate !== todayLocalDate` → cho bấm, cộng `+5 XP`, lưu `lastWateredDate = todayLocalDate`, phát hiệu ứng giọt nước & rung tán hoa. (Nếu đã tưới hôm nay, nút hiển thị trạng thái *"Đã tưới hôm nay"* nhẹ nhàng).
- **Điều ước**:
  - Thêm mới: nhập nội dung (tối đa 140 ký tự), chọn 1 trong 4 kiểu thẻ (`ema | heart | star | lantern`) → `+5 XP`, tự gán vào 1 trong 8 vị trí treo đẹp trên cành.
  - Đánh dấu **Thành hiện thực**: đặt `done = true, completedAt = now` → `+25 XP` (chỉ cộng 1 lần duy nhất cho mỗi điều ước nhờ cờ `xpAwarded`, chống spam tick đi tick lại!) → thẻ hóa vàng lấp lánh + mưa cánh hoa.
  - Xem/quản lý toàn bộ trong **Hộp Điều Ước** (lọc *Đang ấp ủ* / *Đã xong*, sửa, xóa).

### 1.8 Luồng 8 — Cài đặt & Bảo trì (Modal/Drawer từ Trang Chủ)
- Đổi mã PIN mở sổ (nhập PIN cũ → bọc lại khóa → cập nhật `vault.json`).
- Bật/đổi mật khẩu riêng cho Ngăn Riêng Tư Lớp 2.
- Cập nhật 2 câu hỏi bảo mật.
- Quản lý thư viện Sticker tự vẽ (xem danh sách, xóa sticker không dùng).
- Xem trạng thái đồng bộ Google Drive (lần sync cuối, số mục chờ đồng bộ, nút **Đồng bộ ngay**).
- **Xuất sao lưu cục bộ (`.json`)**: Tải về máy bản xuất dữ liệu dự phòng (ghi chú khóa giữ nguyên dạng mã hóa hoặc hỏi PIN để giải mã tùy chọn).

---

## 2. Lược Đồ Dữ Liệu Chi Tiết (TypeScript Data Models)

### 2.1 Kiểu dữ liệu cốt lõi (`src/types/models.ts`)
```ts
export type PaperTemplateId =
  | 'sakura-dashed'
  | 'piggy-plaid'
  | 'cloud-frame'
  | 'botanical-garden'
  | 'strawberry-stripe'
  | 'heart-grid';

export type NoteCategory = 'diary' | 'checklist' | 'draw' | 'private';
export type WishCardStyle = 'ema' | 'heart' | 'star' | 'lantern';
export type TreeAtmosphere = 'auto' | 'day' | 'sunset' | 'night';

export interface EncryptedEnvelope {
  v: 1;
  alg: 'AES-256-GCM';
  iv: string;          // Base64 (12 bytes)
  ct: string;          // Base64 ciphertext + auth tag
}

export interface VaultDocument {
  schemaVersion: 1;
  updatedAt: number;
  kdf: {
    alg: 'PBKDF2-SHA256';
    iterations: 310000;
  };
  hasSeparatePrivatePass: boolean;
  salts: {
    appPinKek: string;          // Base64 (16 bytes)
    appPinVerifier: string;     // Base64 (16 bytes)
    privatePassKek: string;     // Base64 (16 bytes)
    privatePassVerifier: string;// Base64 (16 bytes)
    recoveryKek: string;        // Base64 (16 bytes)
    recoveryVerifier: string;   // Base64 (16 bytes)
  };
  verifiers: {
    appPinHash: string;         // Base64 SHA-256 / PBKDF2 verifier
    privatePassHash: string;
    recoveryHash: string;
  };
  wrappedKeys: {
    dekByAppPin: EncryptedEnvelope;        // Master DEK bọc bằng App PIN (khi dùng chung) hoặc IndexKey bọc bằng App PIN
    indexKeyByAppPin: EncryptedEnvelope;   // IndexKey chuyên giải mã tiêu đề thẻ khóa ở Trang Chủ
    dekByPrivatePass: EncryptedEnvelope;   // Master DEK bọc bằng mật khẩu Lớp 2
    dekByRecovery: EncryptedEnvelope;      // Master DEK bọc bằng 2 câu hỏi bảo mật
    indexKeyByRecovery: EncryptedEnvelope; // IndexKey bọc bằng 2 câu hỏi bảo mật
  };
  securityQuestions: [string, string];     // Chỉ lưu câu hỏi, tuyệt đối không lưu đáp án
  rateLimit: {
    pinFailedCount: number;
    pinLockoutUntil: number;               // Epoch ms
    recoveryFailedCount: number;
    recoveryLockoutUntil: number;
  };
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface PlacedSticker {
  uid: string;
  source: 'builtin' | 'custom';
  assetId: string;     // Builtin SVG id hoặc customSticker.id
  xPct: number;        // 4..96 (% chiều rộng khung giấy)
  yPct: number;        // 4..96 (% chiều cao khung giấy)
  scale: number;       // 0.5..2.2
  rotation: number;    // -180..180 (độ)
  zIndex: number;
}

export interface NoteContentPayload {
  title: string;
  body: string;
  checklist: ChecklistItem[];
  stickers: PlacedSticker[];
  drawingId: string | null;
}

export interface NoteDocument {
  id: string;                 // UUID v4
  revision: number;           // Tăng +1 mỗi lần sửa thành công
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt: number | null;
  isLocked: boolean;
  templateId: PaperTemplateId;
  category: NoteCategory;
  dateTag: string | null;     // 'YYYY-MM-DD' hoặc null
  // Nếu isLocked === false → dùng payload; nếu isLocked === true → payload = null, dùng encryptedPayload
  payload: NoteContentPayload | null;
  encryptedPayload: EncryptedEnvelope | null;
}

export interface NoteIndexEntry {
  id: string;
  revision: number;
  updatedAt: number;
  deleted: boolean;
  deletedAt: number | null;
  isLocked: boolean;
  templateId: PaperTemplateId;
  category: NoteCategory;
  dateTag: string | null;
  // Nếu isLocked === false → lưu title + snippet ngắn + checklistProgress; nếu true → dùng encryptedTitle
  title: string | null;
  snippet: string | null;
  checklistDone: number;
  checklistTotal: number;
  stickerCount: number;
  hasDrawing: boolean;
  encryptedTitle: EncryptedEnvelope | null;
}

export interface CustomStickerMeta {
  id: string;                 // UUID v4
  name: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  mimeType: 'image/webp' | 'image/png';
  width: number;
  height: number;
  sizeBytes: number;
  hasDieCutBorder: boolean;
}

export interface WishItem {
  id: string;
  text: string;               // Max 140 chars
  style: WishCardStyle;
  done: boolean;
  xpAwarded: boolean;         // Chống cộng XP trùng khi bấm đi bấm lại
  slotIndex: number;          // 0..7 vị trí treo trên cành cây
  createdAt: number;
  completedAt: number | null;
  updatedAt: number;
  deleted: boolean;
}

export interface TreeState {
  xp: number;
  stage: 1 | 2 | 3 | 4 | 5;
  streakDays: number;
  lastNoteDate: string | null;      // 'YYYY-MM-DD' theo múi giờ máy
  lastWateredDate: string | null;   // 'YYYY-MM-DD'
  preferredAtmosphere: TreeAtmosphere;
  updatedAt: number;
}

export interface IndexDocument {
  schemaVersion: 1;
  updatedAt: number;
  notes: Record<string, NoteIndexEntry>;
  customStickers: Record<string, CustomStickerMeta>;
  wishes: Record<string, WishItem>;
  treeState: TreeState;
}
```

### 2.2 Cấu trúc bảng `IndexedDB` (`Dexie.js`)
| Bảng | Primary Key & Indexes | Vai trò |
|---|---|---|
| `notes` | `id, updatedAt, category, isLocked, deleted, syncStatus` | Lưu bản cục bộ của mọi `NoteDocument` (ghi chú khóa giữ nguyên `encryptedPayload`, không lưu bản rõ lên đĩa) |
| `drawings` | `id, noteId, updatedAt, syncStatus` | Lưu `Blob` ảnh vẽ (`image/webp` hoặc ciphertext binary nếu thuộc ghi chú khóa) |
| `customStickers` | `id, updatedAt, deleted, syncStatus` | Lưu `CustomStickerMeta` + `blob` ảnh sticker tự vẽ để hiển thị 0ms |
| `wishes` | `id, done, updatedAt, deleted` | Lưu danh sách điều ước |
| `meta` | `key` | Lưu `treeState`, `vaultSnapshot`, `localRateLimit`, `lastSyncedAt` |
| `syncQueue` | `++seq, entityType, entityId, updatedAt` | Hàng đợi thao tác chờ đẩy lên Drive khi offline/mạng yếu |

---

## 3. Hợp Đồng API Backend (Next.js App Router)

Mọi endpoint `/api/sync/*` và `/api/auth/vault` đều **bắt buộc xác thực Session Cookie `ngocnhu_session`** (`HttpOnly; Secure; SameSite=Lax`, ký `HS256` bằng `APP_SESSION_SECRET`). Không có cookie hợp lệ → trả ngay `401 Unauthorized`.

| Endpoint | Method | Auth | Request | Response & Mã lỗi |
|---|---|---|---|---|
| `/api/auth/status` | `GET` | Công khai | — | `200 { initialized, authenticated, securityQuestions?, lockoutUntil? }` |
| `/api/auth/setup` | `POST` | Công khai (chỉ 1 lần) | `{ vault: VaultDocument }` | `201 { ok: true }` + Set Session Cookie; `409` nếu `vault.json` đã tồn tại |
| `/api/auth/unlock` | `POST` | Công khai (rate-limited) | `{ appPinProof: string }` | `200 { vault: VaultPublicPayload }` + Set Session Cookie; `401 { remainingAttempts }`; `429 { lockoutUntil }` |
| `/api/auth/lock` | `POST` | Có cookie | — | `200 { ok: true }` + Clear Session Cookie |
| `/api/auth/recover/verify` | `POST` | Công khai (rate-limited) | `{ recoveryProof: string }` | `200 { recoveryToken, wrappedKeys, salts }`; `401`; `429 { lockoutUntil }` |
| `/api/auth/recover/reset` | `POST` | `recoveryToken` | `{ recoveryToken, updatedVault }` | `200 { ok: true }` + Set Session Cookie; `401` nếu token hết hạn |
| `/api/auth/vault` | `PUT` | Có cookie | `{ currentPinProof, updatedVault }` | `200 { ok: true }` (dùng khi đổi PIN / đổi mật khẩu Lớp 2 / đổi câu hỏi bảo mật) |
| `/api/sync/index` | `GET` | Có cookie | — | `200 { index: IndexDocument, driveEtag? }` |
| `/api/sync/index` | `PUT` | Có cookie | `{ index: IndexDocument }` | `200 { updatedAt }` (cập nhật `index.json` trên Drive) |
| `/api/sync/notes/[id]` | `GET` | Có cookie | — | `200 { note: NoteDocument }`; `404` nếu không tồn tại |
| `/api/sync/notes/[id]` | `PUT` | Có cookie | `{ note: NoteDocument }` | `200 { updatedAt, revision }`; `413` nếu > 120 KB |
| `/api/sync/notes/[id]` | `DELETE` | Có cookie | — | `200 { ok: true }` (dọn cứng file khi quá hạn soft-delete 30 ngày) |
| `/api/sync/assets/[type]/[id]` | `GET` | Có cookie | `type ∈ { drawings, stickers }` | Binary stream (`image/webp`, `image/png`, hoặc `application/octet-stream` cho `.enc`), `Cache-Control: private, max-age=3600` |
| `/api/sync/assets/[type]/[id]` | `PUT` | Có cookie | Raw binary body + `Content-Type` | `200 { ok: true, sizeBytes }`; `413` nếu sticker > 60 KB hoặc drawing > 250 KB |

### Quy ước gọi Google Drive REST API v3 phía Server (`src/lib/server/drive.ts`)
- Không dùng gói `googleapis` cồng kềnh (~100 MB) — gọi trực tiếp `fetch` tới `https://oauth2.googleapis.com/token` và `https://www.googleapis.com/drive/v3/files` + `https://www.googleapis.com/upload/drive/v3/files`.
- **Cache Access Token trong bộ nhớ tiến trình** (tái sử dụng cho đến trước thời điểm hết hạn 60 giây) và **cache bản đồ `name -> driveFileId`** trong warm instance để giảm tối đa lệnh `files.list`.
- Tự động đảm bảo 3 thư mục con `notes/`, `drawings/`, `stickers/` tồn tại bên trong `GOOGLE_DRIVE_FOLDER_ID`.
- Mọi tên tệp (`id`) đều validate chặt bằng regex `/^[a-zA-Z0-9_-]{8,64}$/` trước khi truyền vào query Drive (chống query injection).

---

## 4. Đặc Tả Mật Mã Học Chi Tiết (Security & Crypto)

1. **Dẫn xuất khóa & Tách biệt Verifier**:
   - Tuyệt đối không gửi `KEK` hay `PIN` lên server.
   - Dùng 2 salt ngẫu nhiên khác nhau cho cùng một bí mật:
     - `KEK` dẫn xuất bằng `PBKDF2(secret, saltKek, 310000, SHA-256)` → chỉ ở trên trình duyệt để `wrapKey` / `unwrapKey`.
     - `Proof` dẫn xuất bằng `PBKDF2(secret, saltVerifier, 310000, SHA-256)` → gửi lên Server; Server băm thêm 1 lượt `SHA-256(proof + serverPepper?)` hoặc so sánh hằng thời gian (`crypto.timingSafeEqual`) với `verifiers.*Hash` trong `vault.json`.
2. **Mã hóa AEAD có ràng buộc ngữ cảnh (`AAD`)**:
   - Mọi thao tác `AES-256-GCM` sinh `iv = crypto.getRandomValues(new Uint8Array(12))` mới tinh mỗi lần ghi.
   - Truyền `additionalData` (AAD) chứa `noteId` (khi mã hóa ghi chú/tiêu đề/ảnh vẽ) hoặc `"vault-key-wrap"` (khi bọc khóa) → ngăn chặn tấn công tráo đổi ciphertext giữa hai ghi chú khác nhau.
3. **Cách ly Lớp 1 & Lớp 2**:
   - `IndexKey` (giải mã `encryptedTitle` để hiện tên thẻ trên Trang Chủ) được bọc bằng `KEK_appPin` → nạp vào RAM sau Lớp 1.
   - `Master DEK` (giải mã nội dung & ảnh vẽ của ghi chú khóa) được bọc bằng `KEK_privatePass` → chỉ giải bọc khi người dùng nhập mật khẩu Lớp 2 để mở thẻ riêng tư, và tự xóa khỏi RAM khi rời khỏi ghi chú đó.
4. **Chuẩn hóa tiếng Việt cho Câu hỏi bảo mật**:
   - `normalizeAnswer(s) = s.trim().toLowerCase().normalize('NFC').replace(/\s+/g, ' ')`.
   - Ghép 2 đáp án bằng ký tự ngăn cách cố định: `${normalizeAnswer(a1)}\u001F${normalizeAnswer(a2)}`.

---

## 5. Thuật Toán Đồng Bộ Local-First & Ngoại Lệ

1. **Chu kỳ đồng bộ (`SyncEngine`)**:
   - Kích hoạt ở 4 thời điểm: (a) ngay sau khi mở khóa có mạng, (b) sau 2.5 giây kể từ thay đổi cục bộ gần nhất (debounce), (c) khi sự kiện `online` kích hoạt, (d) khi người dùng bấm *"Đồng bộ ngay"*.
   - Khóa chống chạy chồng (mutex boolean `isSyncing`) và giới hạn backoff khi lỗi mạng (`1s → 3s → 10s → 30s`).
2. **Merge 2 chiều theo `IndexDocument`**:
   - Bước 1: Kéo `remoteIndex` từ `GET /api/sync/index`.
   - Bước 2: So sánh từng `noteId`, `customStickerId`, `wishId` giữa `local` và `remote`:
     - Chỉ local đổi (`local.updatedAt > lastSyncedAt && remote.updatedAt <= lastSyncedAt`) → đẩy `PUT /api/sync/notes/[id]` (+ asset nếu có).
     - Chỉ remote đổi (`remote.updatedAt > lastSyncedAt && local.updatedAt <= lastSyncedAt`) → kéo `GET /api/sync/notes/[id]` cập nhật `IndexedDB`.
     - **Cả 2 phía cùng đổi (Conflict)**:
       - Với `Note`: giữ bản có `updatedAt` mới hơn ở `noteId` gốc; đồng thời nhân bản bản cũ hơn thành `noteId` mới với tiêu đề nối thêm `(Bản sao xung đột)` để không bao giờ mất chữ.
       - Với `TreeState`: cộng gộp bảo toàn giá trị lớn hơn (`xp = Math.max(local.xp, remote.xp)`, `streakDays = Math.max(...)`, ngày tưới mới nhất).
       - Với `WishItem`: last-write-wins theo `updatedAt`; cờ `done` ưu tiên `true` nếu một phía đã hoàn thành.
   - Bước 3: Ghi `mergedIndex` lên `PUT /api/sync/index` và cập nhật `lastSyncedAt`.
3. **Dọn rác Soft-Delete**:
   - Khi đồng bộ online, mọi mục có `deleted === true` và `now - deletedAt > 30 ngày` được xóa cứng trên Drive (`DELETE`) và xóa khỏi `IndexedDB`.

---

## 6. Đặc Tả Kỹ Thuật Studio Vẽ Tay & Die-Cut Sticker Engine

### 6.1 Kiến trúc Canvas & Quản lý RAM
- Giới hạn tỉ lệ điểm ảnh `dpr = Math.min(window.devicePixelRatio || 1, 2)` để nét sắc trên màn Retina mà không tràn RAM điện thoại.
- Lưu lịch sử vẽ dạng mảng đối tượng vector `DrawCommand[]` (không lưu snapshot bitmap cho từng bước Undo) → hỗ trợ **Undo/Redo 30+ bước** với bộ nhớ < 2 MB!
- **5 chế độ bút**:
  1. `ink`: Dùng `getStroke()` từ `perfect-freehand` (tham số `thinning: 0.45, smoothing: 0.6, streamline: 0.55`) vẽ polygon lấp đầy cực mượt.
  2. `highlighter`: Đường nét `lineCap: 'butt'`, `globalAlpha: Math.min(alpha, 0.35)`, cỡ nét ×2.
  3. `crayon`: Rải các hạt chấm nhỏ dọc nét bằng bộ sinh số giả ngẫu nhiên có `seed` cố định theo `strokeId` (đảm bảo khi redraw/undo hạt phấn không bị nhảy nhót!).
  4. `dashed`: `ctx.setLineDash([size * 1.4, size * 1.3])`.
  5. `sparkle`: Rải hình ngôi sao 4 cánh / trái tim nhỏ cách đều nhau theo khoảng cách tích lũy `step = size * 2.2`.
- **6 Hình khối Kawaii (`ShapeCommand`)**: `heart`, `star`, `flower`, `cloud`, `circle`, `speech-bubble` (có thể chèn vào vị trí chạm/giữa canvas).

### 6.2 Thuật toán Cắt Biên & Viền Trắng Die-cut (`src/lib/drawing/diecut.ts`)
1. Vẽ toàn bộ `DrawCommand[]` (bỏ qua nền giấy trang trí) lên một Offscreen Canvas trong suốt.
2. Quét `ImageData` tìm hộp bao nhỏ nhất `(minX, minY, maxX, maxY)` chứa pixel có `alpha > 12`. Nếu trống → báo người dùng vẽ thêm.
3. Tạo canvas kết quả kích thước `(cropW + pad*2) × (cropH + pad*2)` (với `pad = 16px`), thu phóng tỉ lệ nếu cạnh lớn nhất vượt quá `384px`.
4. Nếu `hasDieCutBorder === true`:
   - Tạo lớp silhouette màu trắng (`#FFFFFF`) bằng `globalCompositeOperation = 'source-in'`.
   - Đóng dấu lớp silhouette theo vòng tròn 16 hướng bán kính `borderR = 8px` (tạo viền cắt bế trắng đều mịn quanh mọi chi tiết).
   - Vẽ bóng đổ nhẹ (`shadowColor: rgba(74,44,58,0.18)`, `shadowBlur: 4`) rồi vẽ hình gốc đè lên trên.
5. Xuất `canvas.toBlob(..., 'image/webp', 0.88)` (nếu trình duyệt cũ không hỗ trợ `image/webp` → fallback `image/png`). Kiểm tra dung lượng `<= 45 KB` (nếu lớn hơn tự giảm kích thước tối đa xuống `256px` và nén lại).

---

## 7. Hạ Tầng OAuth `drive.file`, Vercel & PWA

### 7.1 Script thiết lập Google Drive 1 lần (`scripts/setup-google-drive.mjs`)
- Chạy cục bộ 1 lần trên MacBook của chủ sở hữu (`ththanhphu7703@gmail.com`):
  1. Mở luồng OAuth2 loopback (`http://localhost:3456/callback`) chỉ xin đúng 1 scope hẹp: `https://www.googleapis.com/auth/drive.file` kèm `access_type=offline&prompt=consent`.
  2. Đổi mã xác thực lấy `GOOGLE_REFRESH_TOKEN`.
  3. Dùng Access Token vừa nhận gọi Drive API v3 tạo mới 1 thư mục `"Ghi Chú Của Ngọc Như"` (mặc định ở chế độ **Bị hạn chế / Restricted**, thuộc sở hữu app nên `drive.file` toàn quyền đọc/ghi mà không đụng bất kỳ file nào khác trong Drive).
  4. In ra sẵn khối biến môi trường (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`, `APP_SESSION_SECRET`) để dán vào Vercel Project Settings.
- **Lưu ý Google Cloud Console**: Xuất bản OAuth Consent Screen sang **In Production** (không chọn scope nhạy cảm/restricted nên Google không bắt kiểm định bảo mật tốn phí, và Refresh Token sẽ không bị hết hạn sau 7 ngày!).

### 7.2 Cấu hình PWA & Security Headers (`next.config.ts`)
- `manifest.webmanifest`: `name: "Ghi Chú Của Ngọc Như"`, `short_name: "Sổ Ngọc Như"`, `display: "standalone"`, `orientation: "portrait"`, `background_color: "#FFF5F8"`, `theme_color: "#FFE0EC"`.
- Service Worker: Precache App Shell + trang offline + tài nguyên tĩnh; **tuyệt đối không cache response của `/api/*`**.
- HTTP Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Content-Security-Policy` chặt (chỉ cho phép `self`, `blob:`, `data:` cho ảnh vẽ/sticker).

---

## 8. Ma Trận Kiểm Thử & Tiêu Chí Nghiệm Thu (Acceptance Criteria)

| Hạng mục | Kiểm thử bắt buộc | Tiêu chí đạt |
|---|---|---|
| **Mật mã học (`Vitest`)** | Wrap/unwrap `Master DEK` bằng PIN & 2 câu hỏi; chuẩn hóa dấu tiếng Việt NFC; kiểm tra AAD chống tráo ciphertext; đổi PIN giữ nguyên dữ liệu khóa | 100% test pass; file khóa trên Drive không chứa bất kỳ chuỗi rõ nào của `title`, `body`, `checklist` |
| **Bảo mật API (`Vitest` / Integration)** | Gọi `/api/sync/*` không có cookie → `401`; nhập sai PIN 5 lần → `429` khóa 5 phút; thử `noteId` chứa ký tự lạ → `400` | Không thể đọc/ghi Drive khi chưa có session hợp lệ |
| **Đồng bộ & Offline (`Vitest` + `Playwright`)** | Tắt mạng hoàn toàn (offline) → mở sổ bằng PIN 0ms, tạo ghi chú, vẽ sticker, tưới cây → bật mạng lại tự đồng bộ lên Drive; mô phỏng 2 thiết bị sửa cùng 1 ghi chú | Không mất dữ liệu; tự tạo `(Bản sao xung đột)` khi xung đột |
| **Sticker & Canvas (`Vitest` + `Playwright`)** | Vẽ bằng cả 5 loại bút + hình khối; Undo/Redo; bấm *Lưu thành Sticker* kiểm tra auto-crop & viền trắng < 45 KB; kéo thả/xoay/phóng sticker trên viewport `390×844` | Tọa độ `%` khớp sau khi reload; khung hình vẽ không giật lag |
| **Cây Ước Nguyện (`Vitest` + `Playwright`)** | Chuyển 3 chế độ Sáng/Chiều/Đêm; tưới sương chỉ cộng XP 1 lần/ngày; hoàn thành điều ước chỉ cộng `+25 XP` 1 lần; tiến hóa đủ 5 giai đoạn mở 6 bạn thú | Hiển thị đủ đồ họa đa tầng, không tràn khung màn hình `375px` |
| **Hiệu năng & Tiếp cận** | Chạy kiểm tra trên viewport `375×667` và `390×844`, bật `prefers-reduced-motion` | Không cuộn ngang, nút chạm `>= 44×44px`, độ tương phản chữ `>= 4.5:1`, phản hồi ghi cục bộ `< 16ms` |
