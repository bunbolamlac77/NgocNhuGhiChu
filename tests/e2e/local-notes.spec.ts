import { expect, test } from "@playwright/test";

test.describe("B2 Local Notes E2E", () => {
  test("tạo, sửa, reload giữ dữ liệu, tick checklist, xóa mềm và hoàn tác trên 390×844", async ({
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

    // 1. Tạo ghi chú đầu tiên
    await page.getByRole("button", { name: "Viết ghi chú đầu tiên" }).click();

    await page.locator('[data-select-template="piggy-plaid"]').click();
    await page.getByLabel("Tiêu đề ghi chú").fill("Chiều uống trà dâu");
    await page
      .getByLabel("Nội dung ghi chú")
      .fill("Mua bánh kem gấu và đi dạo công viên");

    await page.getByRole("button", { name: "Thêm mục" }).click();
    await page.getByLabel("Nội dung mục checklist 1").fill("Uống đủ 2L nước");
    await page.getByRole("button", { name: "Thêm mục" }).click();
    await page.getByLabel("Nội dung mục checklist 2").fill("Đọc 10 trang sách");
    await page.getByLabel("Đánh dấu mục 1").click();

    // Đợi autosave 400ms hoàn tất
    await expect(page.locator('[data-save-status="saved"]')).toBeVisible({
      timeout: 3000,
    });

    await page.getByRole("button", { name: "Quay lại" }).click();

    // 2. Xác nhận thẻ hiển thị trên Trang Chủ & reload giữ nguyên từ IndexedDB
    await expect(page.locator("[data-note-card]")).toHaveCount(1);
    await expect(page.getByText("Chiều uống trà dâu")).toBeVisible();
    await expect(page.getByText("1/2 trái tim")).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("[data-note-card]")).toHaveCount(1);
    await expect(page.getByText("Chiều uống trà dâu")).toBeVisible();
    await expect(page.getByText("1/2 trái tim")).toBeVisible();

    // 3. Tick checklist trực tiếp trên thẻ ở Trang Chủ
    await page.getByRole("button", { name: "Đọc 10 trang sách" }).click();
    await expect(page.getByText("2/2 trái tim")).toBeVisible();

    // 4. Tìm kiếm toàn văn
    const search = page.getByLabel("Tìm kiếm ghi chú");
    await search.fill("tra dau");
    await expect(page.locator("[data-note-card]")).toHaveCount(1);
    await search.fill("khong ton tai");
    await expect(page.getByText("Không tìm thấy ghi chú phù hợp")).toBeVisible();
    await page.getByLabel("Xóa từ khóa tìm kiếm").click();

    // 5. Mở lại, xóa mềm và Hoàn tác trong 5 giây
    await page.getByText("Chiều uống trà dâu").click();
    await page.getByRole("button", { name: "Xóa ghi chú" }).click();
    await expect(page.locator('[data-undo-toast="true"]')).toBeVisible();
    await expect(page.locator("[data-note-card]")).toHaveCount(0);

    await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
    await expect(page.locator("[data-note-card]")).toHaveCount(1);
    await expect(page.getByText("Chiều uống trà dâu")).toBeVisible();
    await page.screenshot({
      path: "/Users/phuthanh/.gemini/antigravity/brain/c7d26c7e-669d-437f-83f2-26f90574bb69/b2-home-390x844.png",
    });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(overflow).toBe(true);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("viewport 375×667 không cuộn ngang và xuất/nhập sao lưu .json trong SettingsDrawer", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "networkidle" });

    // Tạo 1 ghi chú mẫu rồi xuất .json
    await page.getByRole("button", { name: "Viết ghi chú đầu tiên" }).click();
    await page.getByLabel("Tiêu đề ghi chú").fill("Ghi chú xuất sao lưu");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.locator('[data-save-status="saved"]')).toBeVisible();
    await page.getByRole("button", { name: "Quay lại" }).click();

    await page.getByRole("button", { name: "Mở cài đặt" }).click();
    await expect(page.getByRole("dialog", { name: "Cài đặt sổ" })).toBeVisible();

    const exportBtn = page.getByRole("button", { name: "Xuất sao lưu .json" });
    await expect
      .poll(async () => Math.round((await exportBtn.boundingBox())?.height ?? 0))
      .toBeGreaterThanOrEqual(44);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^so-ngoc-nhu-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    await expect(
      page.getByText("Đã xuất tệp sao lưu .json thành công."),
    ).toBeVisible();

    const noHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noHorizontalOverflow).toBe(true);

    // Xóa sạch IndexedDB rồi nhập lại file sao lưu vừa xuất
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const req = indexedDB.deleteDatabase("ghi-chu-ngoc-nhu-db");
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(true);
          req.onblocked = () => resolve(true);
        }),
    );
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("[data-note-card]")).toHaveCount(0);

    await page.getByRole("button", { name: "Mở cài đặt" }).click();
    await page
      .getByLabel("Chọn tệp sao lưu JSON")
      .setInputFiles(downloadPath!);
    await expect(page.getByText(/Đã khôi phục 1 ghi chú/)).toBeVisible();
    await page.getByRole("button", { name: "Đóng cài đặt" }).click();

    await expect(page.locator("[data-note-card]")).toHaveCount(1);
    await expect(page.getByText("Ghi chú xuất sao lưu")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
