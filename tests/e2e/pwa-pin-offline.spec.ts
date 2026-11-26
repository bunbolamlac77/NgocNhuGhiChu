import { expect, test } from "@playwright/test";
import { enterPinDigits, setupLocalPin, unlockLocalPin } from "./helpers";

test.describe("B6 PWA, Local PIN Lock & Offline (390x844)", () => {
  test("đặt PIN lần đầu -> khóa & rung sai PIN -> mở khóa -> kiểm tra manifest/SW -> bật offline & tạo ghi chú", async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });

    // 1. Setup 4-digit PIN on FirstTimeSetup
    await setupLocalPin(page, "2468");
    await expect(page.getByText("Sổ Nhỏ Ngọc Như")).toBeVisible();

    // Verify SettingsDrawer shows persistence status & local PIN disclaimer
    await page.getByLabel("Mở cài đặt").click();
    await expect(page.locator("[data-storage-persisted]")).toBeVisible();
    await expect(
      page.getByText(/PIN chỉ khóa giao diện trên thiết bị này/),
    ).toBeVisible();
    await page.getByLabel("Đóng cài đặt").click();

    // Verify manifest JSON & SW activation before offline toggle
    const manifestResp = await page.request.get("/manifest.webmanifest");
    expect(manifestResp.status()).toBe(200);
    const manifestJson = await manifestResp.json();
    expect(manifestJson.name).toBe("Ghi Chú Của Ngọc Như");
    expect(manifestJson.short_name).toBe("Sổ Ngọc Như");
    expect(manifestJson.display).toBe("standalone");
    expect(manifestJson.background_color).toBe("#FFF5F8");
    expect(manifestJson.theme_color).toBe("#FFE0EC");

    // 2. Lock manually & verify LockScreen + wrong PIN feedback
    await page.locator('[data-lock-now="true"]').click();
    await expect(page.locator('[data-lock-screen="true"]')).toBeVisible();

    await page.screenshot({
      path: "/Users/phuthanh/.gemini/antigravity/brain/c7d26c7e-669d-437f-83f2-26f90574bb69/b6-lock-screen-390x844.png",
      fullPage: true,
    });

    await enterPinDigits(page, "0000");
    await page.locator('[data-pin-submit="true"]').click();
    await expect(page.getByText(/Sai mã PIN/)).toBeVisible();

    // 3. Unlock with right PIN
    await unlockLocalPin(page, "2468");
    await expect(page.getByText("Sổ Nhỏ Ngọc Như")).toBeVisible();

    // 4. Wait briefly for SW registration/control then test full offline reload
    await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.ready;
      }
    });

    // Reload once so SW controls the page, then unlock before switching offline
    await page.reload({ waitUntil: "networkidle" });
    await unlockLocalPin(page, "2468");

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await unlockLocalPin(page, "2468");

    // Create a note while completely offline
    await page.getByRole("button", { name: "Viết ghi chú đầu tiên" }).click();
    await page.getByLabel("Tiêu đề ghi chú").fill("Ghi chú ngoại tuyến B6");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.locator('[data-save-status="saved"]')).toBeVisible();
    await page.getByRole("button", { name: "Quay lại" }).click();
    await expect(page.getByText("Ghi chú ngoại tuyến B6")).toBeVisible();

    await context.setOffline(false);
    expect(errors).toEqual([]);
  });
});
