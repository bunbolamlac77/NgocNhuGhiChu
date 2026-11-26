import { expect, test } from "@playwright/test";
import { setupLocalPin, unlockLocalPin } from "./helpers";

test.describe("B4 Studio Vẽ Tay & Sticker Die-cut (390x844)", () => {
  test("vẽ nét -> undo/redo -> cắt sticker viền trắng -> đính kèm ghi chú -> dán vào tab Tự vẽ -> reload", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await setupLocalPin(page);

    // 1. Open Drawing Studio tab
    await page.locator('[data-bnav="draw"]').click();
    await expect(page.locator('[data-drawing-studio="true"]')).toBeVisible();

    const canvas = page.locator('[data-draw-canvas="true"]');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Draw stroke 1
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.4, {
      steps: 10,
    });
    await page.mouse.up();

    // Draw stroke 2 with highlighter
    await page.locator('[data-brush="highlighter"]').click();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.65, {
      steps: 10,
    });
    await page.mouse.up();

    // Test Undo & Redo
    await page.locator('[data-draw-undo="true"]').click();
    await expect(page.locator('[data-draw-redo="true"]')).toBeEnabled();
    await page.locator('[data-draw-redo="true"]').click();

    // Switch to Shape mode and stamp a heart
    await page.locator('[data-tool-shapes="true"]').click();
    await page.locator('[data-shape="heart"]').click();
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.45);

    // Verify 0 horizontal overflow on Drawing Studio
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    // Screenshot for visual inspection
    await page.screenshot({
      path: "/Users/phuthanh/.gemini/antigravity/brain/c7d26c7e-669d-437f-83f2-26f90574bb69/b4-drawing-studio-390x844.png",
      fullPage: true,
    });

    // 2. Cut as white-bordered die-cut sticker
    await page.locator('[data-open-save-sticker="true"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByAltText("Xem trước sticker viền trắng"),
    ).toBeVisible();
    await page.getByLabel("Tên sticker tự vẽ").fill("Tim Mèo B4");
    await page.locator('[data-save-sticker-confirm="true"]').click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // 3. Attach flat drawing to a new draw note
    await page.locator('[data-open-attach-drawing="true"]').click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator('[data-attach-option="__new__"]').click();
    await page
      .getByLabel("Tiêu đề ghi chú mới cho tranh vẽ")
      .fill("Tranh Vẽ B4");
    await page.locator('[data-attach-confirm="true"]').click();

    // Landed inside NoteEditor with attached drawing visible
    await expect(page.locator('[data-attached-drawings="true"]')).toBeVisible();

    // 4. Open StickerTray "Tự vẽ" tab and stick the custom sticker onto note paper
    await page.locator('[data-sticker-tab="custom"]').click();
    const customBtn = page.getByRole("button", { name: "Thêm sticker Tim Mèo B4" });
    await expect(customBtn).toBeVisible();
    await customBtn.click();
    await expect(page.locator("[data-placed-sticker]")).toHaveCount(1);
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.locator('[data-save-status="saved"]')).toBeVisible();

    // 5. Reload and verify persistence of both custom sticker & attached drawing
    await page.reload({ waitUntil: "networkidle" });
    await unlockLocalPin(page);
    await page.getByRole("button", { name: "Tranh Vẽ B4" }).click();
    await expect(page.locator('[data-attached-drawings="true"]')).toBeVisible();
    await expect(page.locator("[data-placed-sticker]")).toHaveCount(1);

    expect(errors).toEqual([]);
  });
});
