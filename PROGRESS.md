# PROGRESS — Nhật Ký Tiến Độ Dự Án "Ghi Chú Của Ngọc Như"

- **Current milestone**: `S02 — Ghi chú cục bộ: Trang Chủ & Editor (B2)`
- **Current task**: `B2 — Hoàn tất & dừng tại Quality Gate B2`
- **Last verified checkpoint**: `2026-11-26 09:14` — Hoàn tất Bước `B2`: `npm run typecheck`, `npm run lint`, `npm run test` (`4` files, `19/19` PASS gồm unit Dexie/backup + component HomeScreen), `npm run build` PASS và Playwright E2E `2/2` PASS (`390×844` tạo/sửa/reload/tick checklist/tìm kiếm/xóa mềm/Hoàn tác 5s + `375×667` không cuộn ngang, xuất & nhập lại `.json` vào DB trống).
- **Files changed**:
  - Dexie 6 bảng & Repo/Backup: `src/lib/db/database.ts`, `src/lib/db/notes-repo.ts`, `src/lib/db/assets-repo.ts`, `src/lib/db/wishes-repo.ts`, `src/lib/db/meta-repo.ts`, `src/lib/db/backup.ts`.
  - State Store: `src/stores/useNotesStore.ts`.
  - Giao diện Trang Chủ, Editor & Cài đặt: `src/components/home/NoteCard.tsx`, `src/components/home/HomeScreen.tsx`, `src/components/editor/ChecklistEditor.tsx`, `src/components/editor/NoteEditor.tsx`, `src/components/settings/SettingsDrawer.tsx`, `src/components/layout/AppWorkspace.tsx`, `src/app/page.tsx`.
  - Kiểm thử & nhật ký: `tests/unit/db-backup.test.ts`, `tests/component/home.test.tsx`, `tests/e2e/local-notes.spec.ts`, `TASKS.md`, `PROGRESS.md`.
- **Tests executed**:
  - `npm run typecheck` (`tsc --noEmit`)
  - `npm run lint` (`eslint .`)
  - `npm run test` (`vitest run`: `validation.test.ts`, `builtin-stickers.test.tsx`, `db-backup.test.ts`, `home.test.tsx`)
  - `npm run build` (`next build`)
  - `npm run test:e2e` (`playwright test`: `tests/e2e/local-notes.spec.ts`)
- **Test results**:
  - `typecheck`: PASS (`0` lỗi).
  - `lint`: PASS (`0` lỗi).
  - `Vitest`: `4` files, `19/19` tests PASS (`db-backup.test.ts`: 3/3, `home.test.tsx`: 1/1, `validation.test.ts`: 10/10, `builtin-stickers.test.tsx`: 5/5).
  - `next build`: PASS (`ƒ /` `49.3 kB`, First Load JS `152 kB`).
  - `Playwright`: `2/2` PASS trên `390×844` và `375×667` (`scrollWidth <= innerWidth`, `consoleErrors: []`, `pageErrors: []`, hoàn tác 5s & khôi phục `.json` thành công).
- **Open issues**: `Không có`
- **Debug attempts**: `3` (sửa type overload trong `meta-repo.ts`, bật `@vitest-environment node` cho `db-backup.test.ts` do `structuredClone` trên `jsdom` Blob, và chỉnh exact selector / poll chiều cao sau animation trong `local-notes.spec.ts`)
- **Blockers**: `Dừng tại Quality Gate B2 chờ chủ sở hữu duyệt chuyển sang B3`
- **Next authorized task**: `B3 — Sticker kéo thả tự do` (chỉ bắt đầu khi được chủ sở hữu duyệt)

---

## Bảng Trạng Thái (Khớp `TASKS.md` v2.0)

| Bước | Milestone | Mục tiêu tóm tắt | Model | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|
| `B1` | S01 | Nền tảng, types, CSS kawaii, mẫu giấy, 28 sticker, AppShell | `Orchestrator (Gemini 4 Neon High)` + `Gemini 4 Hydrogen (High)` | `DONE` | `PASS (15/15 Vitest, build, Playwright 390×844 & 375×667)` |
| `B2` | S02 | Dexie, Trang Chủ, Editor, checklist, xóa mềm, xuất/nhập `.json` | `Gemini 4 Neon (Medium)` | `DONE` | `PASS (19/19 Vitest, build, 2/2 Playwright E2E)` |
| `B3` | S03 | Sticker kéo thả tự do | `Gemini 4 Neon (Medium)` | `TODO` | `NOT STARTED` |
| `B4` | S04 | Studio Vẽ Tay & Die-cut | `Gemini 4 Neon (High)` | `TODO` | `NOT STARTED` |
| `B5` | S05 | Cây Ước Nguyện (XP từ dữ liệu) | `Gemini 4 Neon (Medium)` | `TODO` | `NOT STARTED` |
| `B6` | S06 | PWA, khóa PIN, dùng thật 3 ngày | `Gemini 4 Hydrogen (High)` | `TODO` | `NOT STARTED` |
| `B7` | S07 | Drive, Mật khẩu sổ, Mã khôi phục, SyncEngine | `Gemini 4 Neon (High/Extra High)` | `TODO` | `NOT STARTED` |
| `B8` | S08 | Ngăn Riêng Tư & Nghiệm thu AC-01..AC-09 | `Gemini 4 Neon (High/Extra High)` | `TODO` | `NOT STARTED` |

## Phản hồi dùng thử (điền ở B6)
- _Chưa có_
