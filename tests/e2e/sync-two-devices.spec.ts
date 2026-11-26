import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { setupLocalPin } from "./helpers";

const PW_DRIVE_DIR = "/tmp/ngocnhu-pw-drive";

test.describe("B7 Two-Device Sync & Conflict Copy E2E", () => {
  test.beforeEach(() => {
    fs.rmSync(PW_DRIVE_DIR, { recursive: true, force: true });
    fs.mkdirSync(PW_DRIVE_DIR, { recursive: true });
  });

  test("thiết bị A tạo vault & ghi chú -> thiết bị B liên kết kéo về -> sửa song song tạo đúng 1 bản sao xung đột", async ({
    browser,
  }) => {
    const errors: string[] = [];
    const contextA = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const contextB = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    pageA.on("pageerror", (e) => errors.push(e.message));
    pageB.on("pageerror", (e) => errors.push(e.message));

    const vaultPass = "NgocNhuVault2026!";

    // Device A: setup PIN, create note first (local-first!), then enable Drive Sync
    await pageA.goto("/", { waitUntil: "networkidle" });
    await setupLocalPin(pageA, "1234");

    await pageA.getByRole("button", { name: "Viết ghi chú đầu tiên" }).click();
    await pageA.getByLabel("Tiêu đề ghi chú").fill("Kế hoạch cuối tuần");
    await pageA.getByLabel("Nội dung ghi chú").fill("Nội dung gốc từ A");
    await pageA.getByRole("button", { name: "Lưu" }).click();
    await expect(pageA.locator('[data-save-status="saved"]')).toBeVisible();
    await pageA.getByRole("button", { name: "Quay lại" }).click();

    await pageA.getByLabel("Mở cài đặt").click();
    await pageA.locator('[data-open-sync-link="true"]').click();
    await pageA.getByLabel("Mật khẩu sổ mới").fill(vaultPass);
    await pageA.getByLabel("Xác nhận Mật khẩu sổ").fill(vaultPass);
    await pageA
      .getByRole("button", { name: /Tạo Mật khẩu sổ/ })
      .click();

    await expect(
      pageA.locator('[data-recovery-code-display="true"]'),
    ).toBeVisible();
    await pageA.getByText("Tôi đã lưu Mã khôi phục ở nơi an toàn").click();
    await pageA.locator('[data-finish-vault-setup="true"]').click();
    await expect(pageA.locator('[data-sync-badge="idle"]')).toBeVisible({
      timeout: 15000,
    });

    // Device B: setup different PIN, link with same Vault Password & pull note
    await pageB.goto("/", { waitUntil: "networkidle" });
    await setupLocalPin(pageB, "5678");
    await pageB.getByLabel("Mở cài đặt").click();
    await pageB.locator('[data-open-sync-link="true"]').click();
    await pageB.getByLabel("Mật khẩu sổ").fill(vaultPass);
    await pageB.getByRole("button", { name: /Liên kết & đồng bộ/ }).click();

    await expect(pageB.getByText("Kế hoạch cuối tuần")).toBeVisible({
      timeout: 15000,
    });

    // Simulate concurrent offline edits on BOTH A and B to the same note
    await contextA.setOffline(true);
    await contextB.setOffline(true);

    await pageA.getByText("Kế hoạch cuối tuần").click();
    await pageA.getByLabel("Nội dung ghi chú").fill("Chỉnh sửa trên máy A");
    await pageA.getByRole("button", { name: "Lưu" }).click();
    await expect(pageA.locator('[data-save-status="saved"]')).toBeVisible();
    await pageA.getByRole("button", { name: "Quay lại" }).click();

    await pageB.getByText("Kế hoạch cuối tuần").click();
    await pageB.getByLabel("Nội dung ghi chú").fill("Chỉnh sửa trên máy B");
    await pageB.getByRole("button", { name: "Lưu" }).click();
    await expect(pageB.locator('[data-save-status="saved"]')).toBeVisible();
    await pageB.getByRole("button", { name: "Quay lại" }).click();

    // Device A comes online and syncs first (rev -> 2)
    await contextA.setOffline(false);
    await pageA.getByLabel("Mở cài đặt").click();
    await pageA.locator('[data-sync-now-btn="true"]').click();
    await expect(pageA.getByText("Đã đồng bộ dữ liệu đám mây thành công.")).toBeVisible({
      timeout: 15000,
    });
    await pageA.getByLabel("Đóng cài đặt").click();

    // Device B comes online and syncs -> triggers 409 conflict copy!
    await contextB.setOffline(false);
    await pageB.getByLabel("Mở cài đặt").click();
    await pageB.locator('[data-sync-now-btn="true"]').click();
    await expect(pageB.getByText("Đã đồng bộ dữ liệu đám mây thành công.")).toBeVisible({
      timeout: 15000,
    });
    await pageB.getByLabel("Đóng cài đặt").click();

    await expect(pageB.locator("[data-note-card]")).toHaveCount(2);
    await expect(
      pageB.getByText("Kế hoạch cuối tuần (Bản sao xung đột)"),
    ).toBeVisible();

    // Sync Device A again -> pulls conflict copy too so both have exact 2 cards
    await pageA.getByLabel("Mở cài đặt").click();
    await pageA.locator('[data-sync-now-btn="true"]').click();
    await expect(pageA.getByText("Đã đồng bộ dữ liệu đám mây thành công.")).toBeVisible({
      timeout: 15000,
    });
    await pageA.getByLabel("Đóng cài đặt").click();
    await expect(pageA.locator("[data-note-card]")).toHaveCount(2);

    await contextA.close();
    await contextB.close();
    expect(errors).toEqual([]);
  });
});
