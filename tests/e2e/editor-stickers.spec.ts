import { expect, test } from "@playwright/test";
import { setupLocalPin, unlockLocalPin } from "./helpers";

test.describe("B3 Draggable Stickers E2E", () => {
  test("kéo sticker trên 390×844, phóng to/xoay, lưu, reload và đối chiếu tọa độ trên 375×667", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await setupLocalPin(page);

    // Tạo ghi chú mới
    await page.getByRole("button", { name: "Viết ghi chú đầu tiên" }).click();
    await page.getByLabel("Tiêu đề ghi chú").fill("Trang trí sticker");

    // Thêm sticker Thỏ Mochi từ khay -> tự chuyển sang chế độ Kéo Sticker
    await page.getByLabel("Thêm sticker Thỏ Mochi").click();
    const sticker = page.locator("[data-placed-sticker]").first();
    await expect(sticker).toBeVisible();
    await expect(
      page.locator('[data-sticker-layer="true"]'),
    ).toHaveAttribute("data-interact-mode", "sticker");

    // Kiểm tra kích thước vùng chạm >= 44x44 cho cụm điều khiển sticker
    const zoomInBtn = page.getByLabel("Phóng to sticker");
    const zoomBox = await zoomInBtn.boundingBox();
    expect(zoomBox?.width).toBeGreaterThanOrEqual(44);
    expect(zoomBox?.height).toBeGreaterThanOrEqual(44);

    // Kéo sticker đến vị trí khác trên tờ giấy
    const initialX = Number(await sticker.getAttribute("data-x-pct"));
    const initialY = Number(await sticker.getAttribute("data-y-pct"));
    const layerBox = await page
      .locator('[data-sticker-layer="true"]')
      .boundingBox();
    const stickerBox = await sticker.boundingBox();
    expect(layerBox).toBeTruthy();
    expect(stickerBox).toBeTruthy();

    const startX = stickerBox!.x + stickerBox!.width / 2;
    const startY = stickerBox!.y + stickerBox!.height / 2;
    const targetX = layerBox!.x + layerBox!.width * 0.78;
    const targetY = layerBox!.y + layerBox!.height * 0.72;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 10 });
    await page.mouse.up();

    // Chỉnh phóng to & xoay phải
    await zoomInBtn.click();
    await page.getByLabel("Xoay phải sticker").click();

    const movedX = Number(await sticker.getAttribute("data-x-pct"));
    const movedY = Number(await sticker.getAttribute("data-y-pct"));
    const movedScale = await sticker.getAttribute("data-scale");
    const movedRot = await sticker.getAttribute("data-rotation");

    expect(movedX).not.toBe(initialX);
    expect(movedY).not.toBe(initialY);
    expect(movedScale).toBe("1.18");
    expect(movedRot).toBe("15");

    // Lưu và chụp ảnh kiểm tra trên 390×844
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.locator('[data-save-status="saved"]')).toBeVisible();
    await page.screenshot({
      path: "/Users/phuthanh/.gemini/antigravity/brain/c7d26c7e-669d-437f-83f2-26f90574bb69/b3-editor-stickers-390x844.png",
    });

    // Quay lại Trang Chủ, kiểm tra badge 1 sticker và reload ở viewport 375×667
    await page.getByRole("button", { name: "Quay lại" }).click();
    await expect(page.getByText("1 sticker")).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: "networkidle" });
    await unlockLocalPin(page);
    await page.getByText("Trang trí sticker").click();

    const reloadedSticker = page.locator("[data-placed-sticker]").first();
    await expect(reloadedSticker).toBeVisible();
    expect(Number(await reloadedSticker.getAttribute("data-x-pct"))).toBe(
      movedX,
    );
    expect(Number(await reloadedSticker.getAttribute("data-y-pct"))).toBe(
      movedY,
    );
    expect(await reloadedSticker.getAttribute("data-scale")).toBe("1.18");
    expect(await reloadedSticker.getAttribute("data-rotation")).toBe("15");

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noOverflow).toBe(true);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
