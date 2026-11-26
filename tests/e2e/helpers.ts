import type { Page } from "@playwright/test";

export async function enterPinDigits(page: Page, pin: string): Promise<void> {
  for (const ch of pin) {
    await page.locator(`[data-pin-digit="${ch}"]`).click();
  }
}

export async function setupLocalPin(page: Page, pin = "1234"): Promise<void> {
  const setupScreen = page.locator('[data-first-time-setup="true"]');
  await setupScreen.waitFor({ state: "visible" });
  await enterPinDigits(page, pin);
  await page.locator('[data-pin-submit="true"]').click();
  await enterPinDigits(page, pin);
  await page.locator('[data-pin-submit="true"]').click();
  await page.locator('[data-first-time-setup="true"]').waitFor({ state: "hidden" });
}

export async function unlockLocalPin(page: Page, pin = "1234"): Promise<void> {
  const lockScreen = page.locator('[data-lock-screen="true"]');
  await lockScreen.waitFor({ state: "visible" });
  await enterPinDigits(page, pin);
  await page.locator('[data-pin-submit="true"]').click();
  await lockScreen.waitFor({ state: "hidden" });
}
