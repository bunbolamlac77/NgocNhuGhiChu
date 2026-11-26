import { expect, test } from "@playwright/test";
import { setupLocalPin, unlockLocalPin } from "./helpers";

test.describe("B5 Cây Ước Nguyện (390x844 & 375x667)", () => {
  test("tưới sương, treo 2 điều ước, hoàn thành ước +25 XP, chạm bạn thú, không tràn ngang", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await setupLocalPin(page);

    // Open Wishing Tree tab
    await page.locator('[data-bnav="tree"]').click();
    await expect(page.locator('[data-wishing-tree-screen="true"]')).toBeVisible();

    // Tap bunny animal quote
    await page.getByLabel("Trò chuyện với Thỏ Hoa").click();
    await expect(page.locator('[data-animal-quote="true"]')).toContainText("Thỏ Hoa:");

    // Water dew
    await page.locator('[data-water-dew="true"]').click();
    await expect(page.locator('[data-tree-xp="true"]')).toHaveText("5 XP");

    // Hang star wish + complete it (+5 + 25 = 35 XP => stage 2)
    await page.locator('[data-new-wish-btn="true"]').click();
    await page.getByLabel("Nội dung điều ước").fill("Đi Đà Lạt ngắm hoa dã quỳ");
    await page.locator('[data-wish-style="star"]').click();
    await page.getByRole("button", { name: "Treo lên cây (+5 XP)" }).click();

    const tag = page.getByLabel("Điều ước: Đi Đà Lạt ngắm hoa dã quỳ");
    await expect(tag).toBeVisible();
    await tag.click({ force: true });
    await page.getByRole("button", { name: /Thành hiện thực/ }).click();
    await expect(page.locator('[data-tree-xp="true"]')).toHaveText("35 XP");
    await expect(page.locator('[data-tree-stage-label="true"]')).toContainText("GĐ 2/5");
    await page.getByLabel("Đóng chi tiết điều ước").click();

    await page.screenshot({
      path: "/Users/phuthanh/.gemini/antigravity/brain/c7d26c7e-669d-437f-83f2-26f90574bb69/b5-wishing-tree-390x844.png",
      fullPage: true,
    });

    // Check zero overflow on 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    // Reload persistence
    await page.reload({ waitUntil: "networkidle" });
    await unlockLocalPin(page);
    await page.locator('[data-bnav="tree"]').click();
    await expect(page.locator('[data-tree-xp="true"]')).toHaveText("35 XP");

    expect(errors).toEqual([]);
  });
});
