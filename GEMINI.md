# GEMINI.md — Điều Phối & Quy Tắc Dự Án "Ghi Chú Của Ngọc Như"

- **Sản phẩm**: Mobile-first PWA ghi chú cá nhân 1 người dùng (Vercel Hobby/Free + Google Drive API v3 `drive.file`).
- **Phạm vi hiện tại**: Giai đoạn S00 — Bộ 6 tài liệu nền tảng v2.0 (rút gọn 2026-11-26; đã gộp bộ quy tắc vào `GEMINI.md`); chưa khởi tạo mã nguồn. Spec gốc trong `docs/superpowers/specs/` mâu thuẫn với v2.0 ở bảo mật/đồng bộ/XP → v2.0 thắng.
- **Tham chiếu chi tiết**: [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md), [TASKS.md](TASKS.md), [PROGRESS.md](PROGRESS.md).

## 1. Role & Priority
- Điều phối & triển khai mặc định: `Orchestrator (Gemini 4 Neon High)`.
- Chỉ sử dụng hệ model **Gemini 4** theo bảng phân bổ Antigravity:

| Nhóm tác vụ | Model chỉ định |
|---|---|
| Điều phối chung & Khởi tạo nền tảng | `Orchestrator (Gemini 4 Neon High)` |
| Code nhanh / UI đặc tả rõ / Viết test | `Gemini 4 Hydrogen (Medium/High)` hoặc `Gemini 4 Neon (Medium)` |
| Kiến trúc / Mật mã / Sync / Review / Bảo mật / Nghiệm thu | `Gemini 4 Neon (High/Extra High)` |
| Escalation sau 3-Strike hoặc bài toán cực phức tạp | `Gemini 4 Neon (Extra High)` hoặc `Gemini 4 Carbon (High)` |

- Thứ tự ưu tiên: Bảo mật & an toàn dữ liệu > Đúng kiến trúc & phạm vi MVP > Xác minh thực tế > Tối ưu token.

## 2. Required Documents
- [PRD.md](PRD.md): Tổng quan, mục tiêu, đối tượng, user journeys, FR/NFR, use cases, AC và out-of-scope.
- [ARCHITECTURE.md](ARCHITECTURE.md): Tech stack, cây thư mục chuẩn, module contracts, API, crypto, sync, storage.
- [DESIGN.md](DESIGN.md): Design system Kawaii V3, tokens `--k-*`, 6 mẫu giấy, 28 SVG, 5 màn hình, a11y, UI scenarios.
- [TASKS.md](TASKS.md): Lộ trình 8 bước lát dọc (`B1`–`B8`, v2.0) với đủ 10 trường kiểm soát và Quality Gate.
- [PROGRESS.md](PROGRESS.md): Nhật ký trạng thái thực tế duy nhất; cấm ghi kết quả PASS chưa kiểm chứng.
- **Quy tắc đọc & Quota**: Dùng tìm kiếm chính xác và đọc tối thiểu theo vùng dòng cần thiết; không quét toàn bộ repository vô cớ; không đọc lại toàn bộ 6 tài liệu ở mỗi bước (chỉ mở phần liên quan của `TASKS.md`, `ARCHITECTURE.md`, `DESIGN.md`, `PROGRESS.md`).

## 3. Hardware Constraints
- **Phần cứng chuẩn**: MacBook Pro M1 Pro, RAM 16 GB, SSD trống ước tính 200 GB.
- Tuyệt đối cấm chạy lệnh quét hoặc kiểm tra dung lượng SSD (`df`, `du`, quét cây thư mục rộng).
- Không chạy đồng thời nhiều worker/model AI nặng, tiến trình build hoặc trình duyệt test nặng gây áp lực swap RAM 16 GB.
- Cấu hình số worker `Vitest` và `Playwright` ở mức gọn nhẹ/tuần tự cho máy 16 GB RAM.
- Giữ app PWA nhẹ: không cài `googleapis`, `dpr <= 2`, Undo vector `< 2 MB`, lazy-load Studio Vẽ Tay, tối đa `20` sticker/ghi chú.

## 4. Graphify Policy
- Chỉ kích hoạt Graphify khi mã nguồn ứng dụng đã hình thành (từ `B2+` trở đi); không chạy ở S00 và không bật cho task thuần cấu hình hoặc hàm logic đơn giản.
- Cập nhật đồ thị `graphify-out/` cho `src/` sau các milestone cấu trúc chính.
- Dùng `query`, `impact`, `path` để xác định đúng tệp liên đới trước khi sửa module dùng chung.
- Không quét toàn bộ repository khi đã định vị được phạm vi qua Graphify.

## 5. RTK Policy
- Chỉ bật RTK khi chạy lệnh CLI đầu ra dài (test log, build log, git diff) có lợi ích nén token rõ ràng.
- Bảo toàn nguyên vẹn thông báo lỗi gốc, mã thoát, tên symbol và đường dẫn tệp.
- Không dùng công cụ dư thừa cho thao tác nhỏ.
- Không chạy lại lệnh kiểm thử hoặc build đã PASS khi mã nguồn chưa thay đổi.

## 6. UI UX Pro Max Policy
- Chỉ kích hoạt trong các bước có giao diện (`B1`–`B6`, `B8`) để kiểm tra spacing, độ tương phản, focus state và micro-interactions.
- Tuân thủ tuyệt đối hệ Kawaii Pastel Stationery V3 đã khóa trong [DESIGN.md](DESIGN.md) và `ui-preview-kawaii.html`.
- Giữ nguyên 13 token `--k-*`, nét viền `#4A2C3A`, 6 mẫu giấy SVG+CSS và bộ 28 sticker SVG tự vẽ.
- Tuyệt đối cấm dùng emoji hệ thống làm icon điều hướng, nút bấm hoặc sticker.

## 7. Agent Desktop Policy
- Chỉ kích hoạt Agent Desktop để kiểm thử GUI thực tế ở các bước giao diện phức tạp (`B3`–`B6`, `B8`); không dùng cho tác vụ đơn giản.
- Xác minh trực quan mở khóa PIN, Ngăn Riêng Tư, kéo thả sticker tự do, Studio Vẽ + die-cut và Cây Ước Nguyện (3 bầu trời).
- Kiểm tra trên viewport `375×667` và `390×844` bảo đảm `0` cuộn ngang và vùng chạm `>= 44×44px`.
- Chạy theo kịch bản tại [DESIGN.md](DESIGN.md), tránh mở nhiều phiên song song tốn RAM.

## 8. Development Workflow
- Triển khai tuần tự từng bước/task trong [TASKS.md](TASKS.md); tại một thời điểm chỉ giữ một task đang thực hiện.
- Chu trình chuẩn: đọc đúng phạm vi → lập kế hoạch ngắn → viết code & test → chạy kiểm chứng → cập nhật [PROGRESS.md](PROGRESS.md).
- **Dependency management**: Chỉ cài gói đã duyệt trong [ARCHITECTURE.md](ARCHITECTURE.md) ở đúng bước khởi tạo (`B1`), khóa phiên bản qua lockfile; cấm `googleapis`, editor canvas nặng hoặc plugin ngoài phạm vi; cấm tự tải model.
- **Git safety**: Cấm tự ý `git push`, `git merge`, `git reset --hard`, force-push khi chưa có yêu cầu trực tiếp; cấm sửa bộ tài liệu đã khóa trong `docs/superpowers/specs/`.
- Không thêm tính năng ngoài phạm vi MVP (báo thức, Web Push, `.ics`, đa người dùng, CRDT).
- Dừng lại tại mỗi Quality Gate / Milestone Gate; không tự chuyển sang giai đoạn tiếp theo khi chưa được duyệt.

## 9. 3-Strike Debugging
- **Bước 1 — Root-Cause**: Đọc đủ log và tìm nguyên nhân gốc trước khi sửa; cấm đoán mò hoặc vá triệu chứng.
- **Bước 2 — Minimal Fix**: Sửa tối thiểu đúng phạm vi gây lỗi, bảo toàn cấu trúc module và comment hợp lệ; không nới lỏng hoặc bỏ qua assertion test.
- **Bước 3 — Verify**: Chạy lại đúng lệnh test/build sau mỗi lần sửa và tăng `Debug attempts` trong [PROGRESS.md](PROGRESS.md).
- **Escalation (3-Strike)**: Sau **3 lần sửa thất bại liên tiếp** cho cùng một lỗi, DỪNG NGAY và escalate sang `Gemini 4 Neon (Extra High)` hoặc `Gemini 4 Carbon (High)`.
- Khi escalate, bàn giao đầy đủ log lỗi, nguyên nhân đã loại trừ, giả thuyết gốc và các thay đổi đã thử để tránh lặp lại sai lầm.

## 10. Local AI Policy
- **Trạng thái MVP**: **KHÔNG ÁP DỤNG (N/A)** — ứng dụng không sử dụng Local AI và không gọi Google AI API lúc vận hành.
- Google AI API chỉ dùng bên ngoài nếu chủ sở hữu yêu cầu riêng và đã xác minh quota/chi phí.
- Adobe Photoshop và DaVinci Resolve Studio trên máy không sử dụng hoặc tham chiếu trong dự án này (100% đồ họa là SVG + Canvas lập trình trực tiếp).
- **Nếu mở rộng Local AI sau MVP**:
  - Nạp, cấp phát và kiểm soát tập trung qua `Local LLM Manager`; dùng đúng thư mục `/Users/phuthanh/LLMLocalAI`, không tự tải hoặc nhân bản file trọng số sang thư mục dự án.
  - Không chạy nhiều model hoặc worker suy luận nặng song song trên RAM 16 GB.
  - Bắt buộc giải phóng toàn bộ bộ nhớ model, context và dừng sạch worker/tiến trình phụ ngay khi đóng ứng dụng hoặc kết thúc tác vụ.

## 11. Coding, Security & Quality
- **Clean Code & Modular Architecture**: Tuân thủ ranh giới module trong [ARCHITECTURE.md](ARCHITECTURE.md); tách rạch ròi UI components, Zustand stores, `src/lib/db/*`, `src/lib/crypto/*`, `src/lib/sync/*`, `src/lib/drawing/*`, `src/lib/server/*`; không nhồi logic nghiệp vụ hoặc truy vấn trực tiếp vào component lớn.
- **Type Safety**: TypeScript `strict` (`noImplicitAny`, `strictNullChecks`), dùng chung `src/types/models.ts`, `src/types/api.ts`, `src/types/drawing.ts`; không dùng `any` tùy tiện hay ép kiểu bỏ qua kiểm tra đầu vào.
- **Error Handling**: Bắt lỗi tường minh mọi lệnh gọi mạng, `IndexedDB`, Web Crypto, Canvas và Drive API; không nuốt lỗi âm thầm; trả mã HTTP đúng ngữ nghĩa (`400`, `401`, `404`, `409`, `413`, `429`) và thông báo tiếng Việt thân thiện trên UI.
- **Mã hóa**: `PBKDF2-SHA256` (`600,000` vòng) trên **Mật khẩu sổ** (`>= 10` ký tự), tách `saltKek` và `saltVerifier`. PIN 4–6 số chỉ là khóa giao diện cục bộ, không dùng làm khóa mật mã.
- **AEAD**: Mọi thao tác `AES-256-GCM` dùng IV 12 byte ngẫu nhiên mới + `AAD` theo `contentId` (xem `ARCHITECTURE.md §5.2`).
- **Ngăn Riêng Tư**: 1 `DEK` bọc bởi Mật khẩu sổ và Mã khôi phục 128-bit; `DEK` chỉ ở RAM, xóa khi khóa app hoặc sau 15 phút ẩn.
- **Zero Plaintext & Logging**: Không gửi PIN, Mật khẩu sổ, Mã khôi phục, `KEK`, `DEK` lên server (chỉ gửi `proof` dẫn xuất); không lưu plain text các giá trị này hay nội dung ghi chú khóa trên `IndexedDB` hoặc Drive; không log bí mật, token, PIN hay cookie trong console hoặc test output.
- **Backend & Session**: Cookie `ngocnhu_session` (`HttpOnly; Secure; SameSite=Lax`, HS256 30 ngày trượt) và `crypto.timingSafeEqual`.
- **Rate-Limit & Validation**: Sai PIN/Mật khẩu sổ 5 lần khóa 5 phút; sai Mã khôi phục 5 lần khóa 15 phút; validate mọi `id` bằng `/^[a-zA-Z0-9_-]{8,64}$/`.
- **Payload Caps**: Giới hạn upload note `<= 120 KB`, sticker `<= 60 KB` (client `<= 45 KB`), drawing `<= 250 KB` (client `< 150 KB`).
- **OAuth & PWA**: Scope hẹp `drive.file` (OAuth Production mode), folder Restricted; SW tuyệt đối không cache `/api/*`; đủ security headers.
- **UI Quality**: Xung đột đồng bộ tạo `(Bản sao xung đột)`; WCAG AA `>= 4.5:1`; hỗ trợ `prefers-reduced-motion`.

## 12. Acceptance & Delivery
- Mọi module logic lõi (crypto, validation, conflict merge, progression, die-cut, API routes) phải có test `Vitest`; luồng người dùng chính có test `Playwright` trên viewport di động (`390×844` / `375×667`).
- Tuyệt đối không đánh dấu `DONE` hoặc `PASS` nếu chưa chạy bộ kiểm thử thực tế trên thay đổi mới nhất và quan sát toàn bộ test liên quan PASS.
- Không bỏ qua unit test bảo mật, kiểm tra biên, typecheck hoặc hạ tiêu chí nghiệm thu để tiết kiệm token.
- Mọi tên tệp, symbol, số dòng, số test và trạng thái báo cáo phải đúng 100% đầu ra công cụ quan sát được.
- Luôn cập nhật [PROGRESS.md](PROGRESS.md) trung thực và kiểm tra chéo tính nhất quán tài liệu khi có thay đổi lớn.
- Khi hoàn thành task hoặc gặp Gate, báo cáo ngắn gọn (chỉ nêu thay đổi, lệnh kiểm tra đã chạy, kết quả thực tế và bước kế tiếp) và dừng chờ xác nhận từ chủ sở hữu.
