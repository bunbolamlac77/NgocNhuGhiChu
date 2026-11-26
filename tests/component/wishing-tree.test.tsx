import "fake-indexeddb/auto";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { WishingTreeScreen } from "@/components/tree/WishingTreeScreen";
import { db } from "@/lib/db/database";

describe("WishingTreeScreen", () => {
  beforeEach(async () => {
    await db.notes.clear();
    await db.wishes.clear();
    await db.waterings.clear();
  });

  it("shows Bunny/Kitty quotes, waters once/day, creates/completes/deletes wishes with XP updates", async () => {
    render(<WishingTreeScreen />);

    await waitFor(() => {
      expect(screen.getByText("0 XP")).toBeTruthy();
    });

    // Tap Thỏ Hoa & Mèo Dâu
    fireEvent.click(screen.getByLabelText("Trò chuyện với Thỏ Hoa"));
    expect(screen.getByText(/Thỏ Hoa:/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Trò chuyện với Mèo Dâu"));
    expect(screen.getByText(/Mèo Dâu:/)).toBeTruthy();

    // Water dew (+5 XP, once/day)
    fireEvent.click(screen.getByText("Tưới sương"));
    await waitFor(() => {
      expect(screen.getByText("5 XP")).toBeTruthy();
      expect(screen.getByText("Đã tưới")).toBeTruthy();
    });

    // Hang a new wish (+5 XP => 10 XP)
    fireEvent.click(screen.getByText("Treo ước mới"));
    fireEvent.change(screen.getByLabelText("Nội dung điều ước"), {
      target: { value: "Học piano mỗi cuối tuần" },
    });
    fireEvent.click(screen.getByLabelText("Nội dung điều ước").closest("form")!.querySelector('[type="submit"]')!);

    await waitFor(() => {
      expect(screen.getByText("10 XP")).toBeTruthy();
      expect(screen.getByLabelText("Điều ước: Học piano mỗi cuối tuần")).toBeTruthy();
    });

    // Complete wish inside WishBoxDrawer (+25 XP => 35 XP, stage 2 Cây non)
    fireEvent.click(screen.getByText("Hộp (1)"));
    fireEvent.click(screen.getByLabelText("Đánh dấu hoàn thành: Học piano mỗi cuối tuần"));

    await waitFor(() => {
      expect(screen.getByText("35 XP")).toBeTruthy();
      expect(screen.getByText("GĐ 2/5 · Cây non")).toBeTruthy();
    });

    // Soft-delete wish from box (XP drops back cleanly)
    fireEvent.click(screen.getByLabelText("Xóa điều ước: Học piano mỗi cuối tuần"));
    await waitFor(() => {
      expect(screen.getByText("5 XP")).toBeTruthy();
    });
  });
});
