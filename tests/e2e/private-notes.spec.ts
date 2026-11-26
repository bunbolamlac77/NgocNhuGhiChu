import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { setupLocalPin, unlockLocalPin } from "./helpers";

const PW_DRIVE_DIR = "/tmp/ngocnhu-pw-drive";

function readAllFilesRecursively(dir: string): Array<{ rel: string; text: string }> {
  const out: Array<{ rel: string; text: string }> = [];
  function walk(curr: string) {
    for (const entry of fs.readdirSync(curr, { withFileTypes: true })) {
      const full = path.join(curr, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        out.push({
          rel: path.relative(dir, full),
          text: fs.readFileSync(full, "utf8"),
        });
      }
    }
  }
  walk(dir);
  return out;
}

test.describe("B8 Ngăn Riêng Tư & Zero-Plaintext Verification", () => {
  test.beforeEach(() => {
    fs.rmSync(PW_DRIVE_DIR, { recursive: true, force: true });
    fs.mkdirSync(PW_DRIVE_DIR, { recursive: true });
  });

  test("khóa riêng -> đồng bộ Drive không lộ bản rõ -> khóa app xóa DEK -> mở lại bằng Mật khẩu sổ & kiểm tra AAD", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    const vaultPass = "NgocNhuPrivate2026!";
    const secretTitle = "Nhật Ký Mật 2026";
    const secretBody = "BiMatNgocNhu2026_TuyetDoiAnToan";

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await setupLocalPin(page, "1234");

    // Enable Drive sync first so vault exists cleanly
    await page.getByLabel("Mở cài đặt").click();
    await page.locator('[data-open-sync-link="true"]').click();
    await page.getByLabel("Mật khẩu sổ mới").fill(vaultPass);
    await page.getByLabel("Xác nhận Mật khẩu sổ").fill(vaultPass);
    await page.getByRole("button", { name: /Tạo Mật khẩu sổ/ }).click();
    await page.getByText("Tôi đã lưu Mã khôi phục ở nơi an toàn").click();
    await page.locator('[data-finish-vault-setup="true"]').click();
    await expect(page.locator('[data-sync-badge="idle"]')).toBeVisible({
      timeout: 15000,
    });

    // Create a note and toggle Khóa riêng ON
    await page.getByRole("button", { name: "Viết ghi chú đầu tiên" }).click();
    await page.getByLabel("Tiêu đề ghi chú").fill(secretTitle);
    await page.getByLabel("Nội dung ghi chú").fill(secretBody);
    await page.locator('[data-toggle-private="true"]').click();
    await expect(page.locator('[data-toggle-private="true"]')).toHaveAttribute(
      "data-private-locked",
      "true",
    );

    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.locator('[data-save-status="saved"]')).toBeVisible();
    await page.getByRole("button", { name: "Quay lại" }).click();

    // HomeScreen must show only locked placeholder card, never secret text
    await expect(page.locator('[data-note-locked="true"]')).toBeVisible();
    await expect(page.getByText("Ghi chú riêng tư")).toBeVisible();
    await expect(page.getByText(secretTitle)).toBeHidden();

    // Search for secret text returns zero notes
    await page.getByLabel("Tìm kiếm ghi chú").fill("BiMatNgocNhu2026");
    await expect(page.locator("[data-note-card]")).toHaveCount(0);
    await page.getByLabel("Xóa từ khóa tìm kiếm").click();

    // Sync to Drive mock folder and inspect EVERY file on Drive for zero plaintext!
    await page.getByLabel("Mở cài đặt").click();
    await page.locator('[data-sync-now-btn="true"]').click();
    await expect(page.getByText("Đã đồng bộ dữ liệu đám mây thành công.")).toBeVisible({
      timeout: 15000,
    });
    await page.getByLabel("Đóng cài đặt").click();

    const driveFiles = readAllFilesRecursively(PW_DRIVE_DIR);
    expect(driveFiles.length).toBeGreaterThanOrEqual(3); // vault.json, index.json, notes/*.json
    for (const file of driveFiles) {
      expect(file.text).not.toContain(secretTitle);
      expect(file.text).not.toContain(secretBody);
    }
    const indexContent = JSON.parse(
      driveFiles.find((f) => f.rel === "index.json")!.text,
    );
    const indexNotes = Object.values(indexContent.notes) as Array<{
      isLocked: boolean;
      title: string | null;
      snippet: string | null;
    }>;
    expect(indexNotes[0]?.isLocked).toBe(true);
    expect(indexNotes[0]?.title).toBeNull();
    expect(indexNotes[0]?.snippet).toBeNull();

    // Lock app -> DEK must be wiped from RAM -> unlock PIN -> tap locked note -> PrivatePassModal MUST prompt!
    await page.locator('[data-lock-now="true"]').click();
    await unlockLocalPin(page, "1234");
    await page.locator('[data-note-locked="true"] button').click();

    await expect(page.locator('[data-private-pass-modal="true"]')).toBeVisible();
    await page
      .getByLabel("Mật khẩu sổ để mở Ngăn Riêng Tư")
      .fill(vaultPass);
    await page.getByRole("button", { name: "Mở Ngăn Riêng Tư" }).click();

    // Decrypted note opens cleanly!
    await expect(page.getByLabel("Tiêu đề ghi chú")).toHaveValue(secretTitle);
    await expect(page.getByLabel("Nội dung ghi chú")).toHaveValue(secretBody);

    await page.screenshot({
      path: "/Users/phuthanh/.gemini/antigravity/brain/c7d26c7e-669d-437f-83f2-26f90574bb69/b8-private-note-390x844.png",
      fullPage: true,
    });

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    // Check 375x667 overflow & SettingsDrawer Vault Password rotation preserves DEK decryption
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("button", { name: "Quay lại" }).click();
    await page.getByLabel("Mở cài đặt").click();
    await page.getByLabel("Mật khẩu sổ hiện tại").fill(vaultPass);
    const rotatedPass = "NgocNhuRotated2026!";
    await page.getByLabel("Mật khẩu sổ mới trong cài đặt").fill(rotatedPass);
    await page.getByLabel("Nhập lại Mật khẩu sổ mới trong cài đặt").fill(rotatedPass);
    await page.getByRole("button", { name: "Cập nhật khóa Ngăn Riêng Tư" }).click();
    await expect(
      page.getByText("Đã cập nhật Mật khẩu sổ / Mã khôi phục thành công."),
    ).toBeVisible({ timeout: 15000 });
    await page.getByLabel("Đóng cài đặt").click();

    // Lock app -> unlock PIN -> unlock private note using NEW Vault Password -> data still intact!
    await page.locator('[data-lock-now="true"]').click();
    await unlockLocalPin(page, "1234");
    await page.locator('[data-note-locked="true"] button').click();
    await page
      .getByLabel("Mật khẩu sổ để mở Ngăn Riêng Tư")
      .fill(rotatedPass);
    await page.getByRole("button", { name: "Mở Ngăn Riêng Tư" }).click();
    await expect(page.getByLabel("Nội dung ghi chú")).toHaveValue(secretBody);

    const overflowSmall = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflowSmall).toBe(false);
    expect(errors).toEqual([]);
  });
});
