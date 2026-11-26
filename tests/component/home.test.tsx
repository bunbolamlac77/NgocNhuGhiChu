import "fake-indexeddb/auto";
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppWorkspace } from "@/components/layout/AppWorkspace";
import { db } from "@/lib/db/database";
import { createLocalNote, softDeleteNote } from "@/lib/db/notes-repo";
import { containsSystemEmoji } from "@/lib/validation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotesStore } from "@/stores/useNotesStore";

beforeEach(async () => {
  useNotesStore.getState().resetStore();
  useAuthStore.setState({
    hydrated: true,
    hasPin: true,
    unlocked: true,
    lockoutUntil: null,
    remainingAttempts: 5,
  });
  await db.delete();
  await db.open();
});

afterEach(() => {
  cleanup();
  useNotesStore.getState().resetStore();
  useAuthStore.setState({
    hydrated: false,
    hasPin: false,
    unlocked: false,
    lockoutUntil: null,
    remainingAttempts: 5,
  });
});

describe("HomeScreen & NoteCard integration", () => {
  it("hiển thị ghi chú, ẩn ghi chú đã xóa mềm, lọc 5 danh mục, tìm kiếm & không lộ thẻ khóa", async () => {
    await createLocalNote({
      title: "Chiều uống trà dâu",
      body: "Đi dạo công viên hoa giấy",
      category: "diary",
    });
    const chkNote = await createLocalNote({
      title: "Việc nhỏ hôm nay",
      category: "checklist",
      checklist: [
        { id: "c1", text: "Uống đủ 2L nước", checked: false },
        { id: "c2", text: "Tưới sen đá", checked: true },
      ],
    });
    await createLocalNote({
      title: "Tranh thỏ dễ thương",
      category: "draw",
    });
    await createLocalNote({
      title: "Bí mật Đà Lạt",
      isLocked: true,
      category: "private",
      encryptedPayload: {
        v: 1,
        alg: "AES-256-GCM",
        iv: "iv-1",
        ct: "ct-1",
      },
    });
    const deletedNote = await createLocalNote({
      title: "Ghi chú đã bỏ",
      category: "diary",
    });
    await softDeleteNote(deletedNote.id);

    const { container } = render(<AppWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("Chiều uống trà dâu")).toBeDefined();
    });

    expect(screen.queryByText("Ghi chú đã bỏ")).toBeNull();
    expect(screen.getByText("Việc nhỏ hôm nay")).toBeDefined();
    expect(screen.getByText("1/2 trái tim")).toBeDefined();
    expect(screen.getByText("Ghi chú riêng tư")).toBeDefined();
    expect(screen.queryByText("Bí mật Đà Lạt")).toBeNull();
    expect(containsSystemEmoji(container.textContent ?? "")).toBe(false);

    // Tick checklist trực tiếp trên thẻ ở Trang Chủ
    fireEvent.click(screen.getByText("Uống đủ 2L nước"));
    await waitFor(() => {
      expect(screen.getByText("2/2 trái tim")).toBeDefined();
    });
    const updatedInDb = await db.notes.get(chkNote.id);
    expect(updatedInDb?.syncStatus).toBe("dirty");

    // Lọc danh mục
    fireEvent.click(screen.getByRole("tab", { name: "Vẽ tay" }));
    expect(screen.getByText("Tranh thỏ dễ thương")).toBeDefined();
    expect(screen.queryByText("Chiều uống trà dâu")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Riêng tư" }));
    expect(screen.getByText("Ghi chú riêng tư")).toBeDefined();
    expect(screen.queryByText("Tranh thỏ dễ thương")).toBeNull();

    // Quay về Tất cả & Tìm kiếm
    fireEvent.click(screen.getByRole("tab", { name: /Tất cả/ }));
    const searchInput = screen.getByLabelText("Tìm kiếm ghi chú");
    fireEvent.change(searchInput, { target: { value: "hoa giay" } });
    expect(screen.getByText("Chiều uống trà dâu")).toBeDefined();
    expect(screen.queryByText("Ghi chú riêng tư")).toBeNull();
  });
});
