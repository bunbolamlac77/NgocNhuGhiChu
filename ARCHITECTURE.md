# ARCHITECTURE — Ghi Chú Của Ngọc Như

- **Phiên bản**: 2.0 (S00 — Bản rút gọn sau rà soát 2026-11-26)
- **Ngày lập**: 2026-11-25 · **Cập nhật**: 2026-11-26
- **Nền tảng mục tiêu**: Mobile-first PWA trên Vercel Hobby/Free + Google Drive API v3 (`drive.file`)
- **Môi trường phát triển**: MacBook Pro M1 Pro, 16 GB RAM

> **Thay đổi chính so với v1.0** (lý do chi tiết ở §14):
> 1. PIN 4–6 số chỉ là **khóa giao diện cục bộ**, không dùng làm khóa mật mã.
> 2. Thêm **Mật khẩu sổ** (>= 10 ký tự) dùng cho thiết bị mới + Ngăn Riêng Tư; thay 2 câu hỏi bảo mật bằng **Mã khôi phục** ngẫu nhiên 128-bit.
> 3. Bỏ `IndexKey` và `encryptedTitle`; vault chỉ còn 1 khóa dữ liệu (`DEK`) bọc 2 lần.
> 4. AAD dùng `contentId` cố định thay cho `noteId` (cho phép nhân bản xung đột mà không cần khóa).
> 5. Đồng bộ theo `rev`/`baseRev` từng mục, server tự merge `index.json`; không so sánh giờ thiết bị.
> 6. XP Cây Ước **tính ra từ dữ liệu**, không lưu và không cần merge.

---

## 1. Tech Stack Đã Duyệt

| Tầng | Công nghệ đã duyệt | Vai trò | Phương án loại bỏ & Lý do |
|---|---|---|---|
| **Framework & Language** | `Next.js` (App Router), `React 19`, `TypeScript` (strict) | Giao diện PWA + API Route Handlers Serverless | Backend Node riêng ngoài Vercel → tốn hạ tầng |
| **Styling & Motion** | `Tailwind CSS`, `daisyUI` (`pastel`/`valentine`), `motion`, `lucide-react` | Hệ màu kawaii, hoạt ảnh, icon điều khiển mảnh | Emoji hệ thống làm icon → lệch thẩm mỹ SVG |
| **Local-First Store** | `dexie` (`IndexedDB`), `zustand` | Lưu bền cục bộ + trạng thái RAM | Đọc/ghi thẳng Drive → trễ `300–1200ms`, mất offline |
| **Drawing & Die-cut** | `perfect-freehand`, HTML5 Canvas | Bút vẽ, auto-crop viền trắng die-cut | Excalidraw/tldraw → bundle nặng, khó tùy biến |
| **Crypto & Session** | Native `Web Crypto API` (client), Node `crypto` + `jose` (server) | `PBKDF2`, `AES-256-GCM`, cookie `ngocnhu_session` HS256 | Mã hóa bằng PIN ngắn → bẻ được offline trong vài phút |
| **Drive Integration** | Native `fetch` tới Google OAuth2 & Drive REST v3 | Đọc/ghi 1 folder Restricted qua `drive.file` | `googleapis` (~100 MB) → cold-start chậm; Service Account → `403 storageQuotaExceeded` |
| **Testing** | `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `fake-indexeddb`, `@playwright/test` | Unit/component/integration + E2E mobile | Chỉ kiểm tra thủ công |

Validation viết tay trong `src/lib/validation.ts` (không dùng `zod`).

---

## 2. Architecture Overview

```text
+-------------------------------------------------------------------------+
| TẦNG 1: MOBILE PWA CLIENT (bắt buộc cài lên màn hình chính trên iOS)    |
|  - UI Kawaii (Next.js + Tailwind/daisyUI + Motion + SVG)                |
|  - Khóa giao diện PIN (cục bộ) · DEK trong RAM khi mở Ngăn Riêng Tư     |
|  - Web Crypto (PBKDF2 600,000 vòng + AES-256-GCM + AAD contentId)       |
|  - Dexie IndexedDB (6 bảng) + navigator.storage.persist()               |
|  - SyncEngine (mutex + debounce 2.5s + backoff, rev/baseRev)            |
+------------------------------------+------------------------------------+
                                     | HTTPS + Cookie ngocnhu_session (HttpOnly)
                                     v
+-------------------------------------------------------------------------+
| TẦNG 2: VERCEL SERVERLESS BFF (Route Handlers)                          |
|  - /api/auth/* : status, setup, unlock, lock, recover/verify|reset,vault|
|  - /api/sync/* : index, items/[kind]/[id], assets/[type]/[id], purge    |
|  - Kiểm tra rev (409), tự merge index.json, timingSafeEqual, rate-limit |
|  - Drive Client: token cache + name->fileId cache (fetch v3)            |
+------------------------------------+------------------------------------+
                                     | OAuth 2.0 Bearer (scope: drive.file)
                                     v
+-------------------------------------------------------------------------+
| TẦNG 3: GOOGLE DRIVE RESTRICTED FOLDER ("Ghi Chú Của Ngọc Như")         |
|  - vault.json, index.json, notes/*.json, drawings/*.webp|.enc,          |
|    stickers/*.webp                                                      |
+-------------------------------------------------------------------------+
```

---

## 3. Cấu Trúc Thư Mục Dự Kiến

```text
GhiChu/
├── package.json · tsconfig.json · next.config.ts · middleware.ts
├── vitest.config.ts · playwright.config.ts
├── public/
│   ├── sw.js
│   └── icons/ (icon-192.png, icon-512.png, apple-touch-icon.png)
├── scripts/setup-google-drive.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx · page.tsx · manifest.ts · offline/page.tsx
│   │   └── api/
│   │       ├── auth/{status,setup,unlock,lock,vault}/route.ts
│   │       ├── auth/recover/{verify,reset}/route.ts
│   │       └── sync/
│   │           ├── index/route.ts
│   │           ├── items/[kind]/[id]/route.ts
│   │           ├── assets/[type]/[id]/route.ts
│   │           └── purge/route.ts
│   ├── types/ (models.ts, api.ts, drawing.ts)
│   ├── styles/kawaii.css
│   ├── hooks/useAutoLock.ts
│   ├── stores/ (useAuthStore.ts, useNotesStore.ts, useSyncStore.ts)
│   ├── lib/
│   │   ├── validation.ts · ids.ts
│   │   ├── crypto/ (kdf.ts, aead.ts, vault.ts, pin-lock.ts, session-keys.ts)
│   │   ├── db/ (database.ts, notes-repo.ts, assets-repo.ts, wishes-repo.ts, meta-repo.ts, backup.ts)
│   │   ├── server/ (env.ts, drive.ts, session.ts, rate-limit.ts, index-store.ts)
│   │   ├── sync/ (sync-engine.ts, conflict.ts)
│   │   ├── drawing/ (commands.ts, brushes.ts, shapes.ts, diecut.ts)
│   │   └── tree/ (progression.ts, animal-quotes.ts)
│   └── components/
│       ├── layout/ (AppShell.tsx, BottomNav.tsx, InstallGate.tsx)
│       ├── papers/ (PaperCanvas.tsx, paper-templates.ts)
│       ├── stickers/builtin-stickers.tsx
│       ├── mascots/BunnyLockCover.tsx
│       ├── auth/ (FirstTimeSetup.tsx, LockScreen.tsx, DeviceLinkScreen.tsx, RecoveryModal.tsx, PrivatePassModal.tsx)
│       ├── home/ (HomeScreen.tsx, NoteCard.tsx)
│       ├── settings/SettingsDrawer.tsx
│       ├── editor/ (NoteEditor.tsx, ChecklistEditor.tsx, StickerLayer.tsx, StickerControlsBar.tsx, StickerTray.tsx)
│       ├── draw/ (DrawingStudio.tsx, BrushDock.tsx, SaveStickerModal.tsx, AttachDrawingFlow.tsx)
│       └── tree/ (WishingTreeScreen.tsx, SanctuarySvg.tsx, WishTagLayer.tsx, WishBoxDrawer.tsx, NewWishModal.tsx)
└── tests/
    ├── unit/ (validation, crypto, db-backup, drive-client, sync-conflict, diecut, tree-progression).test.ts
    ├── component/ (home, editor-stickers, drawing-studio, wishing-tree).test.tsx
    ├── integration/ (auth-api, sync-api).test.ts
    └── e2e/ (local-notes, drawing-diecut, sync-two-devices, private-notes).spec.ts
```

Thứ tự hình thành thư mục theo các bước B1–B8 trong [TASKS.md](TASKS.md): app chạy hoàn toàn cục bộ trước (B1–B6), sau đó mới thêm `api/`, `server/`, `sync/`, `crypto/` (B7–B8).

---

## 4. Module Responsibilities

| Module | Trách nhiệm chính |
|---|---|
| `next.config.ts`, `middleware.ts` | Security headers tĩnh; CSP có **nonce** sinh mỗi request trong `middleware.ts` (Next App Router cần script inline). |
| `public/sw.js`, `src/app/manifest.ts`, `src/app/offline/page.tsx` | SW precache `/`, `/offline`, icon; **runtime cache-first** cho `/_next/static/*` (tên chunk có hash nên không liệt kê trước); network-only cho `/api/*`. |
| `components/layout/InstallGate.tsx` | Trên iOS Safari chưa cài PWA → hướng dẫn "Thêm vào Màn hình chính"; sau khi cài gọi `navigator.storage.persist()`. |
| `scripts/setup-google-drive.mjs` | OAuth2 loopback 1 lần, scope `drive.file`, tạo folder Restricted, in block env vars cho Vercel. |
| `src/types/*`, `lib/validation.ts`, `lib/ids.ts` | Kiểu dữ liệu, validate ID `/^[a-zA-Z0-9_-]{8,64}$/`, giới hạn kích thước, sinh ID ngẫu nhiên. |
| `lib/crypto/*` | PBKDF2 (`kdf.ts`), AES-GCM + AAD (`aead.ts`), tạo/bọc/mở vault (`vault.ts`), băm & kiểm PIN cục bộ (`pin-lock.ts`), giữ/xóa DEK trong RAM (`session-keys.ts`). |
| `lib/db/*` | Dexie 6 bảng, repo CRUD, xuất/nhập sao lưu `.json`. |
| `lib/server/*` | Env, Drive client, cookie/`recoveryToken`, rate-limit, đọc–merge–ghi `index.json` (`index-store.ts`). |
| `lib/sync/*` | Đẩy/kéo theo `rev`, xử lý `409` bằng nhân bản xung đột (`conflict.ts`). |
| `lib/drawing/*` | `DrawCommand[]`, bút, hình khối, die-cut. |
| `lib/tree/*` | Tính XP/giai đoạn/streak **từ dữ liệu** (`progression.ts`), lời chúc của bạn thú. |
| `stores/*`, `hooks/useAutoLock.ts` | Trạng thái RAM; tự khóa giao diện + xóa DEK sau 15 phút ẩn app. |

---

## 5. Module Contracts & Data Flow

### 5.1 Kiểu dữ liệu cốt lõi (`src/types/models.ts`)
- `PaperTemplateId`: `'sakura-dashed' | 'piggy-plaid' | 'cloud-frame' | 'botanical-garden' | 'strawberry-stripe' | 'heart-grid'`
- `NoteCategory`: `'diary' | 'checklist' | 'draw' | 'private'`
- `WishCardStyle`: `'ema' | 'heart' | 'star' | 'lantern'`
- `EncryptedEnvelope`: `{ v: 1, alg: 'AES-256-GCM', iv: string, ct: string }`
- **`SyncMeta`** (mọi mục đồng bộ đều có): `{ id, rev: number, updatedAt, deleted, deletedAt }` — `rev` do **server** tăng; `updatedAt` chỉ để hiển thị, không dùng để quyết định đồng bộ.
- `NoteDocument`: `SyncMeta & { contentId, createdAt, isLocked, templateId, category, dateTag, payload, encryptedPayload }`. `contentId` sinh 1 lần khi tạo, **được sao chép nguyên** sang bản sao xung đột. Khi `isLocked === true` → `payload = null`.
- `NotePayload`: `{ title, body, checklist[], stickers[], drawingIds[] }`.
- `NoteIndexEntry` (trong `index.json`): `SyncMeta & { isLocked, templateId, category, dateTag, createdAt, title, snippet }`; ghi chú khóa → `title = null`, `snippet = null` (Trang Chủ hiện "Ghi chú riêng tư").
- `WishItem`: `SyncMeta & { text (<= 140), style, done, doneAt }`.
- `Watering`: `SyncMeta & { id: 'w-YYYY-MM-DD' }` — mỗi ngày tưới là 1 mục bất biến, không bao giờ xung đột.
- `CustomStickerMeta`: `SyncMeta & { name, width, height, sizeBytes, mime }`.
- `IndexDocument`: `{ schemaVersion: 2, notes: Record<id, NoteIndexEntry>, wishes: Record<id, WishItem>, waterings: Record<id, Watering>, stickers: Record<id, CustomStickerMeta> }`.
- `VaultDocument`: `{ schemaVersion: 2, kdf: { alg: 'PBKDF2-SHA256', iterations: 600000 }, password: { saltKek, saltVerifier, verifier, wrappedDek }, recovery: { saltKek, saltVerifier, verifier, wrappedDek }, rateLimit }`. Không có PIN, không có câu hỏi bảo mật.

### 5.2 Mô hình khóa (thay thế Envelope 2 lớp cũ)
| Thành phần | Nằm ở đâu | Vai trò |
|---|---|---|
| **PIN 4–6 số** | Chỉ trên từng thiết bị: `meta.pinLock = { salt, hash, failCount, lockoutUntil }` | Khóa giao diện chống người tò mò cầm máy. **Không bảo vệ dữ liệu khỏi người có quyền đọc ổ đĩa** — ghi rõ trong UI Cài đặt. Mỗi thiết bị đặt PIN riêng. |
| **Mật khẩu sổ** (>= 10 ký tự) | Không lưu ở đâu cả | (a) Liên kết thiết bị mới với server; (b) mở Ngăn Riêng Tư. `KEK_pw = PBKDF2(pw, saltKek)`, `proof = PBKDF2(pw, saltVerifier)`, server lưu `verifier = SHA-256(proof)`. |
| **Mã khôi phục** (128-bit, hiển thị dạng 8 nhóm 4 ký tự base32) | Người dùng in/chép giữ | Thay 2 câu hỏi bảo mật. Bọc DEK lần 2 → quên mật khẩu sổ vẫn giữ 100% dữ liệu. |
| **DEK** (AES-256 ngẫu nhiên) | Bọc trong `vault.json` + `meta.vaultSnapshot`; bản rõ chỉ ở RAM | Mã hóa `encryptedPayload` và `drawings/<id>.enc`. Xóa khỏi RAM khi rời ghi chú khóa hoặc sau 15 phút ẩn app. |

AAD chuẩn: `"ngocnhu:v2:note:" + contentId`, `"ngocnhu:v2:drawing:" + drawingId`, `"ngocnhu:v2:vault-wrap"`.

### 5.3 Hợp đồng API

Mọi `/api/sync/*`, `/api/auth/lock`, `PUT /api/auth/vault` cần cookie `ngocnhu_session` hợp lệ; thiếu/sai → `401`.

| Endpoint | Method | Auth | Request | Response |
|---|---|---|---|---|
| `/api/auth/status` | `GET` | Công khai | — | `200 { initialized, authenticated, passwordSaltVerifier?, recoverySaltVerifier? }` (salt verifier công khai là an toàn vì mật khẩu/mã đủ mạnh) |
| `/api/auth/setup` | `POST` | Công khai (1 lần) | `{ vault }` | `201` + Set Cookie; `409` nếu đã có `vault.json` |
| `/api/auth/unlock` | `POST` | Công khai, rate-limited | `{ proof }` | `200 { vault }` + Set Cookie; `401 { remainingAttempts }`; `429 { lockoutUntil }` |
| `/api/auth/lock` | `POST` | Cookie | — | `200` + Clear Cookie |
| `/api/auth/recover/verify` | `POST` | Công khai, rate-limited | `{ recoveryProof }` | `200 { recoveryToken (5 phút), vault }`; `401`; `429` |
| `/api/auth/recover/reset` | `POST` | `recoveryToken` | `{ recoveryToken, updatedVault }` | `200` + Set Cookie; `401` |
| `/api/auth/vault` | `PUT` | Cookie | `{ currentProof, updatedVault }` | `200`; `401` (đổi mật khẩu sổ / tạo lại mã khôi phục) |
| `/api/sync/index` | `GET` | Cookie | — | `200 { index }` |
| `/api/sync/items/[kind]/[id]` | `GET` | Cookie | `kind ∈ { notes }` | `200 { note }`; `404` |
| `/api/sync/items/[kind]/[id]` | `PUT` | Cookie | `{ item, baseRev }`, `kind ∈ { notes, wishes, waterings, stickers }` | `200 { rev }`; `409 { remote }` nếu `remote.rev !== baseRev`; `400`; `413` (note > 120 KB) |
| `/api/sync/assets/[type]/[id]` | `GET` / `PUT` / `DELETE` | Cookie | `type ∈ { drawings, stickers }`, raw binary | `GET`: `Cache-Control: private, max-age=3600`; `PUT`: `413` nếu sticker > 60 KB, drawing > 250 KB |
| `/api/sync/purge` | `POST` | Cookie | — | `200 { purged }` — server xóa cứng mục `deleted` quá 30 ngày (file + entry) |

Soft delete = `PUT` mục với `deleted = true`. Note body nằm ở `notes/<id>.json`; wishes, waterings, sticker meta nằm thẳng trong `index.json`.

### 5.4 Đồng bộ 2 chiều (`SyncEngine`)
1. **Kích hoạt**: sau khi mở app online, debounce `2.5s` sau lần sửa cuối, sự kiện `online`, nút **Đồng bộ ngay**. Mutex `isSyncing`; lỗi mạng → backoff `1s → 3s → 10s → 30s`.
2. **Kéo**: `GET /api/sync/index`. Với mỗi mục: nếu `remote.rev > local.baseRev` và local không `dirty` → kéo về (note thì `GET` body); nếu local `dirty` → chuyển sang bước 3 (server sẽ trả `409`).
3. **Đẩy**: mỗi mục `syncStatus = 'dirty'` → `PUT { item, baseRev }`.
   - `200` → lưu `rev` mới làm `baseRev`, đặt `synced`.
   - `409` → `conflict.ts`: **Note**: giữ bản remote ở ID gốc, bản local thành ghi chú mới (ID mới, **giữ nguyên `contentId` và `encryptedPayload`** — không cần DEK), tiêu đề thêm `(Bản sao xung đột)` nếu không khóa; **Wish**: `done = local.done || remote.done`, text lấy bản local, đẩy lại với `baseRev = remote.rev`; **Watering**: bất biến, coi như thành công; **Sticker meta**: lấy remote.
4. **Server (`index-store.ts`)**: mỗi `PUT` đọc `index.json` → kiểm `rev` → ghi body (nếu có) → cập nhật entry `rev + 1` → ghi `index.json`. Thử lại tối đa 2 lần nếu đọc–ghi bị chen. (Drive v3 không có ghi có điều kiện; với 1 người dùng, cửa sổ chen < 1s là rủi ro chấp nhận được và được ghi nhận ở §14.)
5. Cuối phiên sync gọi `POST /api/sync/purge` tối đa 1 lần/ngày.

### 5.5 Cây Ước Nguyện — tính từ dữ liệu (`lib/tree/progression.ts`)
- `noteDays` = số ngày khác nhau (theo `createdAt` giờ máy) có >= 1 ghi chú chưa xóa.
- `XP = 10 × noteDays + 5 × waterings + 5 × wishes + 25 × wishesDone` (chỉ đếm mục chưa xóa).
- `streakDays` = số ngày liên tiếp tính đến hôm nay (hoặc hôm qua) có ghi chú.
- Giai đoạn: `0–19`, `20–59`, `60–129`, `130–219`, `220+`.
- Tưới: chỉ tạo được `w-<hôm nay>` nếu chưa tồn tại. Không cần `xpAwarded`, không cần merge `TreeState`.

---

## 6. Database & Storage

### 6.1 IndexedDB (`Dexie.js`) — 6 bảng
| Bảng | Primary Key & Indexes | Vai trò |
|---|---|---|
| `notes` | `id, updatedAt, category, isLocked, deleted, syncStatus` | `NoteDocument` + `baseRev`, `syncStatus: 'dirty' | 'synced'` |
| `drawings` | `id, noteId, syncStatus` | Blob `image/webp` hoặc ciphertext |
| `customStickers` | `id, deleted, syncStatus` | Meta + blob sticker tự vẽ |
| `wishes` | `id, done, deleted, syncStatus` | Điều ước |
| `waterings` | `id, syncStatus` | Ngày đã tưới |
| `meta` | `key` | `pinLock`, `vaultSnapshot`, `deviceLinked`, `lastPurgeAt`, `preferredAtmosphere` |

Không có bảng `syncQueue`: cờ `syncStatus = 'dirty'` trên từng hàng là hàng đợi.

### 6.2 Google Drive & Env
Folder `Ghi Chú Của Ngọc Như/` (`GOOGLE_DRIVE_FOLDER_ID`, Restricted): `vault.json`, `index.json`, `notes/<id>.json`, `drawings/<id>.webp|.enc`, `stickers/<id>.webp`.

5 biến môi trường Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`, `APP_SESSION_SECRET` (>= 32 byte).

---

## 7. Error Handling

| Nhóm lỗi | Cách xử lý |
|---|---|
| **Chưa liên kết thiết bị** | Trước B7: không áp dụng. Từ B7: app vẫn dùng cục bộ bình thường; badge "Chưa bật đồng bộ" + nút liên kết bằng Mật khẩu sổ. |
| **Mạng lỗi khi sync** | Giữ `dirty`, badge "Chờ đồng bộ", backoff. |
| **Cookie hết hạn / `401`** | Không khóa app; hỏi lại Mật khẩu sổ để tiếp tục sync. |
| **`429`** | Đếm ngược tới `lockoutUntil`. |
| **`409`** | Xử lý tự động theo §5.4, toast "Có bản sao xung đột". |
| **Giải mã thất bại** | Không xóa dữ liệu; báo sai mật khẩu hoặc dữ liệu hỏng. |
| **`413` / Canvas** | Client nén trước; WebP lỗi → PNG; canvas rỗng (`alpha <= 12`) → chặn lưu sticker. |
| **Bộ nhớ bị trình duyệt dọn** | `navigator.storage.persisted()` = `false` → cảnh báo trong Cài đặt + nhắc xuất `.json` hoặc bật đồng bộ. |

---

## 8. Concurrency & Resource Management

- Canvas `dpr = Math.min(devicePixelRatio || 1, 2)`; Undo lưu `DrawCommand[]`, tối thiểu 30 bước.
- Lazy-load `DrawingStudio` + `perfect-freehand`.
- Tối đa `20` sticker/ghi chú.
- `drive.ts` cache access token (làm mới trước 60s) và `name -> fileId`.
- Mutex `isSyncing`; debounce lưu cục bộ `400ms` tách khỏi debounce sync `2.5s`.
- Vitest/Playwright chạy ít worker trên máy 16 GB.

---

## 9. Dependency Management

- Runtime: `next`, `react`, `react-dom`, `tailwindcss`, `daisyui`, `motion`, `lucide-react`, `dexie`, `zustand`, `perfect-freehand`, `jose`.
- Dev/test: `typescript`, `@types/*`, `eslint` + cấu hình Next, `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `fake-indexeddb`, `@playwright/test`.
- Khóa phiên bản qua `package-lock.json`. Cấm `googleapis`, `excalidraw`, `tldraw`, `next-pwa`/`workbox` (SW viết tay đủ dùng).
- `scripts/setup-google-drive.mjs` chỉ dùng Node built-in.

---

## 10. Security

1. **Mô hình đe dọa (ghi rõ)**: Bảo vệ khỏi (a) người cầm máy mở app — PIN; (b) người đọc được Drive hoặc ổ đĩa — Ngăn Riêng Tư mã hóa bằng Mật khẩu sổ mạnh; (c) người ngoài gọi API — cookie + rate-limit. **Không** bảo vệ ghi chú thường khỏi người đọc được ổ đĩa/Drive (chúng là bản rõ, giống mọi app ghi chú).
2. **PBKDF2-SHA256 600,000 vòng** (theo khuyến nghị OWASP hiện hành), salt 16 byte tách riêng cho KEK và verifier. Mật khẩu sổ >= 10 ký tự, từ chối mật khẩu chỉ gồm số.
3. **AES-256-GCM** IV 12 byte ngẫu nhiên mỗi lần + AAD theo §5.2.
4. **Session**: cookie `ngocnhu_session` HS256, `HttpOnly; Secure; SameSite=Lax`, hạn 30 ngày, gia hạn trượt mỗi lần sync. So sánh verifier bằng `crypto.timingSafeEqual`.
5. **Rate-limit**: mật khẩu sai 5 lần → khóa 5 phút; mã khôi phục sai 5 lần → khóa 15 phút. Trạng thái lưu trong `vault.json.rateLimit` (ghi khi sai). PIN cục bộ sai 5 lần → khóa giao diện 5 phút (`meta.pinLock`).
6. **Validate** mọi `id`, `kind`, `type` trước khi chạm Drive; tên file Drive chỉ ghép từ giá trị đã validate.
7. **Headers**: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`; CSP `script-src 'self' 'nonce-<n>'`, `style-src 'self' 'unsafe-inline'` (cần cho `motion`), `img-src 'self' blob: data:`.
8. **SW** không bao giờ cache `/api/*`.
9. **OAuth**: scope `drive.file` (không nhạy cảm, không cần Google xác minh), Consent Screen chế độ Production để refresh token không hết hạn sau 7 ngày.
10. Không log mật khẩu, proof, token, cookie.

---

## 11. Recovery & Rollback

- **Quên PIN**: nhập Mật khẩu sổ (kiểm offline bằng `vaultSnapshot`) → đặt PIN mới. Thiết bị chưa liên kết (trước B7) → quên PIN thì xóa dữ liệu app hoặc nhập lại từ `.json`.
- **Quên Mật khẩu sổ**: nhập Mã khôi phục → `recover/verify` → đặt mật khẩu mới → `recover/reset`. Giữ 100% dữ liệu khóa. Kèm tùy chọn tạo mã khôi phục mới.
- **Dữ liệu**: Hoàn tác xóa `5s`, thùng rác 30 ngày, bản sao xung đột, xuất/nhập `.json`.
- **Kỹ thuật**: rollback deployment Vercel; `schemaVersion` trong `vault.json`/`index.json` để nâng cấp lược đồ.

---

## 12. Graphify Integration

- Chạy từ B2 trở đi khi `src/` đã có module; cập nhật `graphify-out/` sau mỗi bước.
- Trước khi sửa module dùng chung (`lib/crypto`, `lib/db`, `lib/sync`, `types`) dùng `query` / `impact` / `path`.

---

## 13. Local LLM Manager

**KHÔNG ÁP DỤNG (N/A)** — ứng dụng không dùng AI lúc vận hành. Nếu mở rộng sau MVP: quản lý tập trung qua `Local LLM Manager`, thư mục `/Users/phuthanh/LLMLocalAI`, tối đa 1 worker, giải phóng toàn bộ tài nguyên khi đóng.

---

## 14. Nhật Ký Quyết Định (Rà soát 2026-11-26)

| # | Vấn đề ở v1.0 | Quyết định v2.0 |
|---|---|---|
| D1 | KEK sinh từ PIN 4–6 số; `vaultSnapshot` trên máy cho phép thử hết 10⁶ PIN offline trong vài phút bằng GPU. | PIN chỉ là khóa giao diện; khóa mật mã dùng Mật khẩu sổ >= 10 ký tự + PBKDF2 600k. |
| D2 | 2 câu hỏi bảo mật entropy thấp, `dekByRecovery` có thể bị đoán offline. | Mã khôi phục ngẫu nhiên 128-bit. |
| D3 | Thiết bị mới không lấy được `saltVerifier` để tính proof (status không trả salt). | `status` trả `passwordSaltVerifier`/`recoverySaltVerifier` công khai. |
| D4 | AAD = `noteId` → nhân bản xung đột ghi chú khóa cần DEK, mà SyncEngine chạy nền không có DEK. | AAD = `contentId` cố định, bản sao giữ nguyên ciphertext. |
| D5 | So sánh `updatedAt`/`lastSyncedAt` phụ thuộc giờ máy; client `PUT` cả `index.json` → ghi đè lẫn nhau. | `rev` do server cấp + `baseRev`; server tự merge index theo từng mục. |
| D6 | `TreeState.xp = max()` làm mất XP cộng song song ở 2 máy. | XP tính từ dữ liệu; tưới là mục bất biến theo ngày. |
| D7 | `IndexKey` + `encryptedTitle` thêm 1 tầng khóa chỉ để hiện tiêu đề. | Bỏ; thẻ khóa hiện "Ghi chú riêng tư". |
| D8 | Thiếu `DELETE` asset cho dọn rác 30 ngày. | Thêm `DELETE` asset + `/api/sync/purge` phía server. |
| D9 | iOS Safari có thể xóa IndexedDB nếu không cài PWA. | `InstallGate` + `navigator.storage.persist()` + cảnh báo. |
| D10 | CSP tĩnh làm hỏng script inline của Next; SW không precache được chunk có hash. | CSP nonce qua `middleware.ts`; SW runtime cache `/_next/static/*`. |
| D11 | Danh sách gói thiếu công cụ test component/IndexedDB. | Bổ sung `jsdom`, `@testing-library/react`, `fake-indexeddb`, `@vitejs/plugin-react`. |
| D12 | Rate-limit không rõ nơi lưu trên serverless. | Lưu trong `vault.json.rateLimit`. |
