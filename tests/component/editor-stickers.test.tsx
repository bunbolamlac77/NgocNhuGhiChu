import "fake-indexeddb/auto";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { createLocalNote } from "@/lib/db/notes-repo";
import { db } from "@/lib/db/database";
import { containsSystemEmoji } from "@/lib/validation";
import type { LocalNoteRecord } from "@/types/models";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(() => {
  cleanup();
});

describe("B3 Sticker drag, controls & tray", () => {
  it("chuyển chế độ Sửa chữ <-> Kéo Sticker, thêm sticker từ 4 tab, chỉnh cỡ/xoay/lớp/xóa và chặn sticker thứ 21", async () => {
    const note = await createLocalNote({
      title: "Ghi chú sticker",
      body: "Dán sticker lên giấy",
    });

    const onSave = vi.fn(async (_id: string, patch): Promise<LocalNoteRecord> => ({
      ...note,
      ...patch,
      payload: patch.payload ?? note.payload,
      updatedAt: Date.now(),
      syncStatus: "dirty",
    }));
    const onDelete = vi.fn(async () => {});
    const onBack = vi.fn();

    const { container } = render(
      <NoteEditor
        note={note}
        onSave={onSave}
        onDelete={onDelete}
        onBack={onBack}
      />,
    );

    const layer = container.querySelector('[data-sticker-layer="true"]')!;
    expect(layer.getAttribute("data-interact-mode")).toBe("text");
    expect(layer.className).toContain("pointer-events-none");

    // Kiểm tra đủ 4 tab khay sticker (bao gồm tab Tự vẽ trống cho B4)
    expect(screen.getByRole("tab", { name: "Thú (10)" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Hoa lá (8)" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Đồ ngọt (10)" })).toBeDefined();
    const customTab = screen.getByRole("tab", { name: "Tự vẽ (0)" });
    fireEvent.click(customTab);
    expect(
      screen.getByText(/Chưa có sticker tự vẽ/),
    ).toBeDefined();

    // Quay về tab Thú và dán 1 sticker → tự chuyển sang Kéo Sticker
    fireEvent.click(screen.getByRole("tab", { name: "Thú (10)" }));
    fireEvent.click(screen.getByLabelText("Thêm sticker Thỏ Mochi"));

    expect(layer.getAttribute("data-interact-mode")).toBe("sticker");
    expect(layer.className).toContain("pointer-events-auto");

    let placed = container.querySelectorAll("[data-placed-sticker]");
    expect(placed).toHaveLength(1);
    const firstEl = placed[0]!;
    expect(firstEl.getAttribute("data-scale")).toBe("1");
    expect(firstEl.getAttribute("data-rotation")).toBe("0");

    // Phóng to + kẹp max 2.2
    const zoomInBtn = screen.getByLabelText("Phóng to sticker");
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomInBtn);
    }
    expect(Number(firstEl.getAttribute("data-scale"))).toBe(2.2);

    // Thu nhỏ + kẹp min 0.5
    const zoomOutBtn = screen.getByLabelText("Thu nhỏ sticker");
    for (let i = 0; i < 12; i++) {
      fireEvent.click(zoomOutBtn);
    }
    expect(Number(firstEl.getAttribute("data-scale"))).toBe(0.5);

    // Xoay trái/phải + kẹp -180..180
    const rotRightBtn = screen.getByLabelText("Xoay phải sticker");
    fireEvent.click(rotRightBtn);
    expect(Number(firstEl.getAttribute("data-rotation"))).toBe(15);
    for (let i = 0; i < 15; i++) {
      fireEvent.click(rotRightBtn);
    }
    expect(Number(firstEl.getAttribute("data-rotation"))).toBe(180);

    const rotLeftBtn = screen.getByLabelText("Xoay trái sticker");
    for (let i = 0; i < 30; i++) {
      fireEvent.click(rotLeftBtn);
    }
    expect(Number(firstEl.getAttribute("data-rotation"))).toBe(-180);

    // Kiểm tra kéo thả & kẹp tọa độ 4..96
    vi.spyOn(layer, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const startX = Number(firstEl.getAttribute("data-x-pct")) * 2;
    const startY = Number(firstEl.getAttribute("data-y-pct")) * 2;
    fireEvent.pointerDown(firstEl, {
      clientX: startX,
      clientY: startY,
      pointerId: 1,
    });
    fireEvent.pointerMove(firstEl, {
      clientX: 400,
      clientY: -50,
      pointerId: 1,
    });
    fireEvent.pointerUp(firstEl, { pointerId: 1 });
    expect(Number(firstEl.getAttribute("data-x-pct"))).toBe(96);
    expect(Number(firstEl.getAttribute("data-y-pct"))).toBe(4);

    // Thêm tiếp tới 20 sticker và kiểm tra đưa lên trên + chặn sticker thứ 21
    for (let i = 1; i < 20; i++) {
      fireEvent.click(screen.getByLabelText("Thêm sticker Heo Mũm Mĩm"));
    }
    placed = container.querySelectorAll("[data-placed-sticker]");
    expect(placed).toHaveLength(20);

    // Đưa sticker đầu tiên lên trên cùng
    fireEvent.pointerDown(placed[0]!, { clientX: 192, clientY: 8, pointerId: 2 });
    fireEvent.pointerUp(placed[0]!, { pointerId: 2 });
    const prevZ = Number(placed[0]!.getAttribute("data-z-index"));
    fireEvent.click(screen.getByLabelText("Đưa sticker lên trên"));
    expect(Number(placed[0]!.getAttribute("data-z-index"))).toBeGreaterThanOrEqual(
      prevZ,
    );

    // Cố thêm sticker thứ 21 -> phải bị chặn + hiện thông báo
    fireEvent.click(screen.getByLabelText("Thêm sticker Cún Corgi"));
    expect(container.querySelectorAll("[data-placed-sticker]")).toHaveLength(20);
    expect(
      screen.getByText("Tối đa 20 sticker cho mỗi ghi chú."),
    ).toBeDefined();

    // Xóa 1 sticker
    fireEvent.click(screen.getByLabelText("Xóa sticker"));
    expect(container.querySelectorAll("[data-placed-sticker]")).toHaveLength(19);

    expect(containsSystemEmoji(container.textContent ?? "")).toBe(false);
  });
});
