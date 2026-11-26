# TASKS — Lộ Trình Thi Công MVP "Ghi Chú Của Ngọc Như" (v2.0 — 8 bước)

Lộ trình **lát dọc**: B1–B6 làm app chạy hoàn toàn cục bộ trên điện thoại (dùng thật được từ cuối B6), B7–B8 mới thêm đồng bộ Drive và mã hóa. Thay thế 18 task `T01–T18` của v1.0 (bảng đối chiếu ở cuối file). Mỗi bước chỉ `DONE` sau khi chạy kiểm thử thực tế đạt Quality Gate và chủ sở hữu duyệt.

---

## Phân Bổ Model Hệ Gemini 4
- **Điều phối & Nền tảng**: `Orchestrator (Gemini 4 Neon High)`
- **UI / Test / Task đặc tả rõ**: `Gemini 4 Hydrogen (Medium/High)` hoặc `Gemini 4 Neon (Medium)`
- **Mật mã / Đồng bộ / Bảo mật / Nghiệm thu**: `Gemini 4 Neon (High/Extra High)`
- **Escalation (3-Strike)**: `Gemini 4 Neon (Extra High)` hoặc `Gemini 4 Carbon (High)`

---

### B1 — Nền tảng dự án & Khung giao diện
- **Task ID**: `B1`
- **Milestone**: `S01`
- **Mục tiêu**: Khởi tạo Next.js (App Router, TS strict), cài gói đã duyệt, Tailwind + daisyUI, security headers + CSP nonce, Vitest/Playwright; toàn bộ types; `kawaii.css` 13 token; `AppShell` + `BottomNav` 4 tab; 6 mẫu giấy; 28 sticker SVG **trích từ `ui-preview-kawaii.html`** (không vẽ lại); `BunnyLockCover`.
- **Dependency**: S00 được duyệt.
- **Phạm vi code**: `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `vitest.config.ts`, `playwright.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx` (khung), `src/types/*`, `src/lib/validation.ts`, `src/lib/ids.ts`, `src/styles/kawaii.css`, `src/components/{layout,papers,stickers,mascots}/*`, `tests/unit/validation.test.ts`.
- **Model**: `Orchestrator (Gemini 4 Neon High)` + `Gemini 4 Hydrogen (High)` cho phần SVG/CSS
- **Trạng thái**: `DONE`
- **Acceptance criteria**: build sạch; `strict: true`; headers + CSP nonce không gây lỗi console; đủ type ở [ARCHITECTURE.md §5.1](ARCHITECTURE.md); validate ID/kích thước/điều ước 140 ký tự; 6 mẫu giấy + 28 sticker hiển thị trên trang `/` tạm; `BottomNav` 4 tab, `safe-area-inset`, vùng chạm `>= 44px`.
- **Test requirements**: `npm run typecheck`, `npm run lint`, `npm run build`; Vitest `validation.test.ts`; 1 test đếm 28 sticker SVG và `0` emoji.
- **Quality Gate**: 0 lỗi typecheck/lint, build sạch, test PASS, ảnh chụp `390×844` khớp tông `ui-preview-kawaii.html`.

### B2 — Ghi chú cục bộ: Trang Chủ & Editor
- **Task ID**: `B2`
- **Milestone**: `S02`
- **Mục tiêu**: Dexie 6 bảng + repo; `useNotesStore`; Trang Chủ lưới 2 cột, lọc 5 pill, tìm kiếm, tick checklist inline; Editor (mẫu giấy, tiêu đề, nội dung, checklist tim, `dateTag`, danh mục), tự lưu `400ms`, xóa mềm + Hoàn tác `5s`; xuất/nhập `.json`.
- **Dependency**: `B1`
- **Phạm vi code**: `src/lib/db/*`, `src/stores/useNotesStore.ts`, `src/components/home/*`, `src/components/editor/{NoteEditor,ChecklistEditor}.tsx`, `src/components/settings/SettingsDrawer.tsx` (mục Sao lưu), `tests/unit/db-backup.test.ts`, `tests/component/home.test.tsx`, `tests/e2e/local-notes.spec.ts`.
- **Model**: `Gemini 4 Neon (Medium)`
- **Trạng thái**: `DONE`
- **Acceptance criteria**: mọi thay đổi đặt `syncStatus = 'dirty'`; lọc đúng 5 nhóm; tìm kiếm toàn văn; reload không mất dữ liệu; xuất rồi nhập vào DB trống khôi phục đủ; mục xóa mềm ẩn khỏi Trang Chủ.
- **Test requirements**: Vitest (`fake-indexeddb`) cho repo + backup; component test lọc/tìm kiếm; Playwright: tạo → sửa → reload → xóa → hoàn tác.
- **Quality Gate**: test PASS, 0 cuộn ngang `375px`.

### B3 — Sticker kéo thả tự do
- **Task ID**: `B3`
- **Milestone**: `S03`
- **Mục tiêu**: Chế độ `Sửa chữ` ↔ `Kéo Sticker`, `StickerTray` 4 tab (tab `Tự vẽ` để trống tới B4), `StickerLayer`, `StickerControlsBar`.
- **Dependency**: `B2`
- **Phạm vi code**: `src/components/editor/{StickerLayer,StickerControlsBar,StickerTray}.tsx`, `tests/component/editor-stickers.test.tsx`.
- **Model**: `Gemini 4 Neon (Medium)`
- **Trạng thái**: `TODO`
- **Acceptance criteria**: `setPointerCapture`; kẹp `xPct/yPct` `4..96`, `scale` `0.5..2.2`, xoay `-180..180`; đưa lên trên; xóa; chặn sticker thứ 21; vị trí giữ nguyên sau reload ở viewport khác.
- **Test requirements**: Vitest kẹp giá trị + giới hạn 20; Playwright kéo 1 sticker trên `390×844`, reload, so tọa độ.
- **Quality Gate**: kéo mượt trên điện thoại thật (chủ sở hữu thử), test PASS.

### B4 — Studio Vẽ Tay & Sticker Die-cut
- **Task ID**: `B4`
- **Milestone**: `S04`
- **Mục tiêu**: Engine `DrawCommand[]` + `perfect-freehand`, bút `ink`/`highlighter`/`dashed` + `eraser`, 6 hình khối, 16 màu + picker, cỡ, độ mờ, 5 nền, Undo/Redo; die-cut; `SaveStickerModal`; `AttachDrawingFlow` (ghi chú thường); lazy-load.
- **Dependency**: `B2`, `B3`
- **Phạm vi code**: `src/lib/drawing/*`, `src/components/draw/*`, `tests/unit/diecut.test.ts`, `tests/component/drawing-studio.test.tsx`, `tests/e2e/drawing-diecut.spec.ts`.
- **Model**: `Gemini 4 Neon (High)`
- **Trạng thái**: `TODO`
- **Acceptance criteria**: `dpr <= 2`; Undo/Redo >= 30 bước; die-cut `alpha > 12`, `pad = 16`, viền 16 hướng `borderR = 8`, `<= 384px`, `<= 45 KB` (tự hạ `256px`); canvas rỗng → chặn; ảnh đính `< 150 KB`, cạnh `<= 1200px`; sticker mới hiện ở tab `Tự vẽ`; Studio nằm ở chunk riêng.
- **Test requirements**: Vitest bounding box, canvas rỗng, ngưỡng kích thước; component test đổi bút/Undo; Playwright vẽ → lưu sticker → dán vào ghi chú.
- **Quality Gate**: test PASS, không giật khi vẽ liên tục trên điện thoại thật.

### B5 — Cây Ước Nguyện
- **Task ID**: `B5`
- **Milestone**: `S05`
- **Mục tiêu**: `progression.ts` (XP tính từ dữ liệu, streak, giai đoạn); màn Khu Vườn bầu trời Sáng, cây 5 giai đoạn, 2 bạn thú (Thỏ hoa, Mèo dâu) có lời chúc; Tưới sương; `NewWishModal` 4 kiểu thẻ; `WishTagLayer` 8 thẻ; `WishBoxDrawer`.
- **Dependency**: `B2`
- **Phạm vi code**: `src/lib/tree/*`, `src/lib/db/wishes-repo.ts` (bổ sung `waterings`), `src/components/tree/*`, `tests/unit/tree-progression.test.ts`, `tests/component/wishing-tree.test.tsx`.
- **Model**: `Gemini 4 Neon (Medium)`
- **Trạng thái**: `TODO`
- **Acceptance criteria**: XP đúng công thức [ARCHITECTURE.md §5.5](ARCHITECTURE.md); tưới tạo `w-YYYY-MM-DD` tối đa 1/ngày; streak đúng qua nửa đêm giờ máy; ngưỡng 5 giai đoạn; hoàn thành ước có Golden Glow + mưa cánh hoa (tắt khi `prefers-reduced-motion`); SVG không tràn `375px`.
- **Test requirements**: Vitest công thức XP, streak, tưới trùng ngày, ngưỡng giai đoạn; component test treo ước/hoàn thành.
- **Quality Gate**: test PASS.

### B6 — PWA, Khóa PIN & Dùng thật
- **Task ID**: `B6`
- **Milestone**: `S06`
- **Mục tiêu**: `pin-lock.ts`, `LockScreen` (bàn phím kẹo, rung, đếm ngược), đặt PIN lần đầu, `useAutoLock` 15 phút; `manifest.ts`, `sw.js`, `/offline`, icon; `InstallGate` + `storage.persist()`; deploy Vercel (chưa cần env Drive).
- **Dependency**: `B2`–`B5`
- **Phạm vi code**: `src/lib/crypto/pin-lock.ts`, `src/stores/useAuthStore.ts`, `src/hooks/useAutoLock.ts`, `src/components/auth/{FirstTimeSetup,LockScreen}.tsx`, `src/components/layout/InstallGate.tsx`, `src/app/{manifest.ts,offline/page.tsx}`, `public/sw.js`, `public/icons/*`.
- **Model**: `Gemini 4 Hydrogen (High)`
- **Trạng thái**: `TODO`
- **Acceptance criteria**: PIN 4–6 số lưu dạng băm có salt; sai 5 lần khóa 5 phút; ẩn > 15 phút → về Bìa Sổ Thỏ; manifest (`"Ghi Chú Của Ngọc Như"`, `short_name: "Sổ Ngọc Như"`, `standalone`, `portrait`, `#FFF5F8`, `#FFE0EC`); SW runtime cache `/_next/static/*`, không cache `/api/*`; mở offline được sau lần tải đầu; Cài đặt hiện trạng thái `persisted`.
- **Test requirements**: `npm run build`; Vitest `pin-lock` + bộ đếm auto-lock; Playwright offline (context `offline: true`) mở app + tạo ghi chú.
- **Quality Gate**: **Ngọc Như cài lên iPhone và dùng thử >= 3 ngày**; ghi lại phản hồi UI vào `PROGRESS.md` trước khi sang B7.

### B7 — Google Drive, Mật khẩu sổ & Đồng bộ
- **Task ID**: `B7`
- **Milestone**: `S07`
- **Mục tiêu**: Script `setup-google-drive.mjs`; `drive.ts`; `kdf.ts`, `aead.ts`, `vault.ts` (DEK + 2 lần bọc); `session.ts`, `rate-limit.ts`, `index-store.ts`; 7 route `/api/auth/*`; route `/api/sync/{index,items,assets,purge}`; `SyncEngine` + `conflict.ts`; luồng Bật đồng bộ (Mật khẩu sổ + Mã khôi phục), `DeviceLinkScreen`, `RecoveryModal`, Quên PIN bằng Mật khẩu sổ.
- **Dependency**: `B6`
- **Phạm vi code**: `scripts/setup-google-drive.mjs`, `src/lib/server/*`, `src/lib/crypto/{kdf,aead,vault}.ts`, `src/app/api/**`, `src/lib/sync/*`, `src/stores/useSyncStore.ts`, `src/components/auth/{DeviceLinkScreen,RecoveryModal}.tsx`, `tests/unit/{crypto,drive-client,sync-conflict}.test.ts`, `tests/integration/{auth-api,sync-api}.test.ts`, `tests/e2e/sync-two-devices.spec.ts`.
- **Model**: `Gemini 4 Neon (High/Extra High)`
- **Trạng thái**: `TODO`
- **Acceptance criteria**: scope chỉ `drive.file`; token cache làm mới trước 60s; tên file Drive chỉ từ giá trị đã validate; `setup` `409` nếu đã có vault; cookie HS256 `HttpOnly; Secure; SameSite=Lax` 30 ngày; `timingSafeEqual`; rate-limit 5/5 phút và 5/15 phút; `recoveryToken` 5 phút; `PUT items` trả `409` khi `baseRev` cũ; server merge `index.json`; `409` note → bản sao giữ nguyên `contentId`; purge 30 ngày xóa cả asset; dữ liệu cục bộ có trước khi bật đồng bộ được đẩy lên đủ.
- **Test requirements**: Vitest crypto (wrap/unwrap bằng mật khẩu & mã khôi phục, đổi mật khẩu giữ DEK); mock `fetch` cho `drive.ts`; integration đủ mã `200/201/400/401/409/413/429`; unit conflict cho note/wish/watering; Playwright 2 browser context cùng sửa 1 ghi chú → đúng 1 bản sao xung đột.
- **Quality Gate**: 100% test PASS; chạy thật với Drive thật trên Vercel Preview; rà soát bảo mật auth/cookie đạt.

### B8 — Ngăn Riêng Tư & Nghiệm thu
- **Task ID**: `B8`
- **Milestone**: `S08`
- **Mục tiêu**: `session-keys.ts` (DEK trong RAM, xóa khi khóa/ẩn 15 phút); bật `Khóa riêng` trong Editor; `PrivatePassModal`; mã hóa `encryptedPayload` + `drawings/<id>.enc`; thẻ khóa "Ghi chú riêng tư"; hoàn thiện `SettingsDrawer` (đổi PIN, đổi Mật khẩu sổ, tạo lại Mã khôi phục, sticker tự vẽ, sync); E2E toàn bộ + nghiệm thu `AC-01..AC-09`.
- **Dependency**: `B7`
- **Phạm vi code**: `src/lib/crypto/session-keys.ts`, `src/components/auth/PrivatePassModal.tsx`, `src/components/editor/NoteEditor.tsx`, `src/components/home/NoteCard.tsx`, `src/components/settings/SettingsDrawer.tsx`, `tests/e2e/private-notes.spec.ts`, báo cáo trong `PROGRESS.md`.
- **Model**: `Gemini 4 Neon (High/Extra High)`
- **Trạng thái**: `TODO`
- **Acceptance criteria**: ghi chú khóa: `payload = null` trong IndexedDB và Drive, `index.json` `title/snippet = null`; AAD sai → giải mã thất bại; tìm kiếm không lộ nội dung khóa; DEK bị xóa sau khóa app; xung đột ghi chú khóa khi không có DEK vẫn tạo bản sao đúng; toàn bộ AC trong [PRD.md §9](PRD.md) PASS.
- **Test requirements**: `npm run typecheck`, `npm run lint`, toàn bộ Vitest, toàn bộ Playwright (`390×844`, `375×667`), Agent Desktop theo kịch bản [DESIGN.md §14](DESIGN.md); quét `grep` file Drive tải về không chứa bản rõ.
- **Quality Gate**: `AC-01..AC-09` PASS thực tế; `PROGRESS.md` có bằng chứng chạy lệnh.

---

## Đối chiếu với lộ trình v1.0

| v2.0 | Gộp từ v1.0 | Thay đổi chính |
|---|---|---|
| B1 | T01, T02, T10 | Sticker lấy từ preview có sẵn; thêm CSP nonce |
| B2 | T04, T12, T13 (chữ) | Không cần backend; thêm nhập `.json` |
| B3 | T13 (sticker) | — |
| B4 | T14, T15 | Bỏ `crayon`, `sparkle` sang GĐ2 |
| B5 | T16 | XP tính từ dữ liệu; 1 bầu trời, 2 bạn thú |
| B6 | T09 (auto-lock), T11 (LockScreen), T17 | PIN chỉ khóa giao diện; `InstallGate`; dùng thật 3 ngày |
| B7 | T03, T05, T06, T07, T08, T11 (recovery) | Mật khẩu sổ + Mã khôi phục; `rev`/`baseRev`; server merge index |
| B8 | T03 (lớp riêng tư), T09, T18 | Bỏ `IndexKey`; AAD `contentId` |
