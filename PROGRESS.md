# PROGRESS — Nhật Ký Tiến Độ Dự Án "Ghi Chú Của Ngọc Như"

- **Current milestone**: `S08 — Ngăn Riêng Tư & Nghiệm thu (B8)`
- **Current task**: `B8 + Neon Migration — Hoàn tất triển khai & kiểm thử cục bộ; chờ chủ sở hữu gắn Neon DB trên Vercel và thử nghiệm thực tế`
- **Last verified checkpoint**: `2026-11-26 10:17` — Chuyển backend lưu trữ đám mây mặc định sang **Neon PostgreSQL** (`@neondatabase/serverless`): `npm run typecheck` (`0` lỗi), `npm run lint` (`0` lỗi), `npm run test` (`16` test files, `46/46` Vitest PASS), `npm run build` PASS (`16` pages & `11` `/api/*` routes), `npm run test:e2e` (`8/8` Playwright E2E PASS trên `390×844` & `375×667`).
- **Files changed (từ sau B3 đến B8)**:
  - **B4 (`Studio Vẽ Tay & Sticker Die-cut`)**: `src/lib/drawing/{brushes,shapes,commands,diecut}.ts`, `src/components/draw/{BrushDock,SaveStickerModal,AttachDrawingFlow,DrawingStudio}.tsx`, `src/components/editor/{NoteEditor,StickerTray}.tsx`, `src/components/layout/{AppShell,AppWorkspace}.tsx`, `tests/unit/diecut.test.ts`, `tests/component/drawing-studio.test.tsx`, `tests/e2e/drawing-diecut.spec.ts`.
  - **B5 (`Cây Ước Nguyện`)**: `src/lib/tree/{progression,animal-quotes}.ts`, `src/components/tree/{WishTagLayer,SanctuarySvg,NewWishModal,WishBoxDrawer,WishingTreeScreen}.tsx`, `tests/unit/tree-progression.test.ts`, `tests/component/wishing-tree.test.tsx`, `tests/e2e/wishing-tree.spec.ts`.
  - **B6 (`PWA & Khóa PIN cục bộ`)**: `src/lib/crypto/pin-lock.ts`, `src/stores/useAuthStore.ts`, `src/hooks/useAutoLock.ts`, `src/components/auth/{FirstTimeSetup,LockScreen}.tsx`, `src/components/layout/InstallGate.tsx`, `src/components/home/HomeScreen.tsx`, `src/app/{layout.tsx,manifest.ts,offline/page.tsx}`, `public/sw.js`, `public/icons/{icon-192,icon-512,apple-touch-icon}.png`, `next.config.ts`, `tests/unit/pin-lock.test.ts`, `tests/e2e/{helpers,pwa-pin-offline.spec}.ts`.
  - **B7 (`Google Drive, Vault, Recovery, SyncEngine`)**: `scripts/setup-google-drive.mjs`, `src/lib/crypto/{kdf,aead,vault}.ts`, `src/lib/server/{env,drive,session,rate-limit,index-store}.ts`, `src/app/api/auth/{status,setup,unlock,lock,vault,recover/verify,recover/reset}/route.ts`, `src/app/api/sync/{index,purge,items/[kind]/[id],assets/[type]/[id]}/route.ts`, `src/lib/sync/{conflict,sync-engine}.ts`, `src/stores/useSyncStore.ts`, `src/components/auth/{DeviceLinkScreen,RecoveryModal}.tsx`, `playwright.config.ts`, `tests/unit/{crypto,drive-client,sync-conflict}.test.ts`, `tests/integration/{auth-api,sync-api}.test.ts`, `tests/e2e/sync-two-devices.spec.ts`.
  - **B8 (`Ngăn Riêng Tư & Hoàn thiện Cài đặt`)**: `src/lib/crypto/session-keys.ts`, `src/components/auth/PrivatePassModal.tsx`, `src/components/editor/NoteEditor.tsx`, `src/components/settings/SettingsDrawer.tsx`, `tests/e2e/private-notes.spec.ts`, `TASKS.md`, `PROGRESS.md`.
  - **Neon Storage Migration**: cài `@neondatabase/serverless`, thêm `src/lib/server/neon-storage.ts`, `scripts/check-neon.mjs`, `.env.example`, cập nhật `src/lib/server/{env,drive}.ts`, cập nhật copy UI sang đồng bộ đám mây, `tests/unit/neon-storage.test.ts`, `ARCHITECTURE.md` (§6.2, §9, D13).
- **Tests executed**:
  - `npm run typecheck` (`tsc --noEmit`)
  - `npm run lint` (`eslint .`)
  - `npm run test` (`vitest run`: `16` files)
  - `npm run build` (`next build`)
  - `npm run test:e2e` (`playwright test`: `8` specs trên `390×844` & `375×667`)
- **Test results**:
  - `typecheck`: PASS (`0` lỗi).
  - `lint`: PASS (`0` lỗi).
  - `Vitest`: `16` files, `46/46` tests PASS (`neon-storage.test.ts`: 2/2 test mock SQL & env selection, cùng 15 file test B1–B8).
  - `next build`: PASS (`ƒ /` `80.9 kB`, `First Load JS` `184 kB`, 11 `/api/*` routes Node runtime, `/offline`, `/manifest.webmanifest`, Middleware `34.5 kB`).
  - `Playwright`: `8/8` PASS (`drawing-diecut`, `editor-stickers`, `local-notes` ×2, `pwa-pin-offline`, `sync-two-devices`, `wishing-tree`, `private-notes` — dùng `NGOCNHU_TEST_DRIVE_DIR=/tmp/ngocnhu-pw-drive` giả lập backend).
- **Open issues**:
  - Chưa test trực tiếp trên URL PostgreSQL Neon thật (chủ sở hữu cần nối Neon DB trên Vercel hoặc chạy `scripts/check-neon.mjs` với `DATABASE_URL` thật), chưa deploy Vercel thật và chưa chạy kiểm thử 3 ngày trên iPhone Safari thật.
- **Debug attempts**: `0` chưa giải quyết (các lỗi layout/selector/type trong lúc triển khai B4–B8 đều đã sửa dứt điểm và test lại PASS toàn phần).
- **Blockers**: `Cần chủ sở hữu thực hiện bước ngoài máy: tạo/nối Neon PostgreSQL, thêm APP_SESSION_SECRET trên Vercel, deploy và dùng thử trên iPhone`
- **Next authorized task**: `Chủ sở hữu tạo Neon DB (hoặc bấm Storage → Neon trên Vercel), thêm DATABASE_URL + APP_SESSION_SECRET, deploy và nghiệm thu thực tế trên iPhone`

---

## Bảng Trạng Thái (Khớp `TASKS.md` v2.0)

| Bước | Milestone | Mục tiêu tóm tắt | Model | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|
| `B1` | S01 | Nền tảng, types, CSS kawaii, mẫu giấy, 28 sticker, AppShell | `Orchestrator (Gemini 4 Neon High)` + `Gemini 4 Hydrogen (High)` | `DONE` | `PASS` |
| `B2` | S02 | Dexie, Trang Chủ, Editor, checklist, xóa mềm, xuất/nhập `.json` | `Gemini 4 Neon (Medium)` | `DONE` | `PASS` |
| `B3` | S03 | Sticker kéo thả tự do | `Gemini 4 Neon (Medium)` | `DONE` | `PASS` |
| `B4` | S04 | Studio Vẽ Tay & Sticker Die-cut | `Gemini 4 Neon (High)` | `DONE` | `PASS` (`diecut.test.ts`, `drawing-studio.test.tsx`, `drawing-diecut.spec.ts`) |
| `B5` | S05 | Cây Ước Nguyện (XP từ dữ liệu, 5 giai đoạn, 2 bạn thú) | `Gemini 4 Neon (Medium)` | `DONE` | `PASS` (`tree-progression.test.ts`, `wishing-tree.test.tsx`, `wishing-tree.spec.ts`) |
| `B6` | S06 | PWA, khóa PIN cục bộ, SW offline & `InstallGate` | `Gemini 4 Hydrogen (High)` | `DONE` (local) | `PASS` cục bộ (`pin-lock.test.ts`, `pwa-pin-offline.spec.ts`); chờ chủ sở hữu thử iPhone >= 3 ngày |
| `B7` | S07 | Drive API v3, Vault Password, Mã khôi phục, `SyncEngine` | `Gemini 4 Neon (High/Extra High)` | `DONE` (local/mock) | `PASS` với `NGOCNHU_TEST_DRIVE_DIR` & mock `fetch` (`crypto`, `drive-client`, `sync-conflict`, `auth-api`, `sync-api`, `sync-two-devices.spec.ts`) |
| `B8` | S08 | Ngăn Riêng Tư, RAM DEK, hoàn thiện Cài đặt & kiểm thử | `Gemini 4 Neon (High/Extra High)` | `DONE` (local/mock) | `PASS` (`private-notes.spec.ts` quét 0 bản rõ trên Drive giả lập; đầy đủ `44/44` Vitest + `8/8` Playwright) |

## Kiểm Định Acceptance Criteria (AC-01..AC-09)

| AC | Kết quả thực tế quan sát | Bằng chứng |
|---|---|---|
| **AC-01 (Mật mã)** | `PASS` | `tests/unit/crypto.test.ts` (PBKDF2 600k, AES-GCM + AAD, đổi mật khẩu/khôi phục giữ DEK); `tests/e2e/private-notes.spec.ts` xác nhận `index.json` (`title/snippet = null`) và toàn bộ tệp Drive giả lập chứa `0` bản rõ. |
| **AC-02 (API)** | `PASS` | `tests/integration/{auth-api,sync-api}.test.ts` kiểm tra đủ mã `200`, `201`, `400` (ID sai), `401` (thiếu cookie/token), `404`, `409` (`baseRev` cũ / đã setup), `413` (`> 120 KB` note / `> 60 KB` sticker), `429` (5 lần sai mật khẩu/khôi phục). |
| **AC-03 (Offline & Đồng bộ)** | `PASS` (mock Drive) | `tests/e2e/pwa-pin-offline.spec.ts` (`offline: true` vẫn mở PIN + tạo ghi chú); `tests/e2e/sync-two-devices.spec.ts` (2 browser context sửa song song sinh đúng 1 `(Bản sao xung đột)`); `tests/unit/sync-conflict.test.ts` kiểm tra xung đột ghi chú khóa không cần DEK. |
| **AC-04 (Canvas)** | `PASS` | `tests/unit/diecut.test.ts` (3 bút + tẩy + 6 hình khối, Undo/Redo >= 30 bước, die-cut `alpha > 12`, `pad = 16`, viền 16 hướng, `<= 384px`, `<= 45 KB`); `tests/e2e/drawing-diecut.spec.ts` & `editor-stickers.spec.ts`. |
| **AC-05 (Cây Ước)** | `PASS` | `tests/unit/tree-progression.test.ts` (công thức XP, `w-YYYY-MM-DD` tối đa 1/ngày, streak qua nửa đêm, 5 giai đoạn); `tests/e2e/wishing-tree.spec.ts` (`0` cuộn ngang trên `375×667`). |
| **AC-06 (Giới hạn)** | `PASS` | `tests/component/editor-stickers.test.tsx` (chặn sticker thứ 21); `tests/integration/sync-api.test.ts` (`413` vượt ngưỡng). |
| **AC-07 (Giao diện)** | `PASS` | Mọi spec Playwright kiểm tra `0` cuộn ngang trên `375×667`/`390×844`; vùng chạm `>= 44×44px`; không lỗi console; 100% SVG/Lucide (0 emoji hệ thống). |
| **AC-08 (PWA)** | `PASS` (cục bộ) | `manifest.webmanifest`, `public/sw.js` (không cache `/api/*`), `/offline`, `pwa-pin-offline.spec.ts` mở offline thành công; script `scripts/setup-google-drive.mjs` đã tạo xong (chưa chạy OAuth thực tế ngoài máy). |
| **AC-09 (Sao lưu)** | `PASS` | `tests/unit/db-backup.test.ts` & `tests/e2e/local-notes.spec.ts` (xuất `.json` -> xóa IndexedDB -> nhập `.json` khôi phục đủ dữ liệu). |

## Phản hồi dùng thử (chủ sở hữu điền sau khi deploy)
- _Chưa có (chờ cấu hình `GOOGLE_*` / `APP_SESSION_SECRET`, deploy Vercel và dùng thử trên iPhone >= 3 ngày)_
