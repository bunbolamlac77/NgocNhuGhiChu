import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import {
  BUILTIN_STICKERS,
  STICKER_CATEGORIES,
} from "@/components/stickers/builtin-stickers";
import { PAPER_TEMPLATES } from "@/components/papers/paper-templates";
import { PaperCanvas } from "@/components/papers/PaperCanvas";
import { BunnyLockCover } from "@/components/mascots/BunnyLockCover";
import { BottomNav } from "@/components/layout/BottomNav";
import { B1FoundationPreview } from "@/components/layout/B1FoundationPreview";
import { containsSystemEmoji } from "@/lib/validation";

afterEach(cleanup);

describe("B1 Kawaii Assets & Layout", () => {
  it("đủ 28 sticker SVG (10 thú, 8 hoa lá, 10 đồ ngọt & nhật ký) nét #4A2C3A và 0 emoji", () => {
    expect(BUILTIN_STICKERS).toHaveLength(28);
    expect(BUILTIN_STICKERS.filter((s) => s.cat === "animals")).toHaveLength(10);
    expect(BUILTIN_STICKERS.filter((s) => s.cat === "nature")).toHaveLength(8);
    expect(BUILTIN_STICKERS.filter((s) => s.cat === "sweets")).toHaveLength(10);

    const uniqueIds = new Set(BUILTIN_STICKERS.map((s) => s.id));
    expect(uniqueIds.size).toBe(28);

    for (const sticker of BUILTIN_STICKERS) {
      expect(containsSystemEmoji(sticker.name)).toBe(false);
      const { container, unmount } = render(sticker.renderSvg("w-10 h-10"));
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(container.innerHTML).toContain("#4A2C3A");
      expect(containsSystemEmoji(container.textContent ?? "")).toBe(false);
      unmount();
    }

    for (const cat of STICKER_CATEGORIES) {
      expect(containsSystemEmoji(cat.label)).toBe(false);
    }
  });

  it("đủ 6 mẫu giấy nâng cấp và render hợp lệ không chứa emoji", () => {
    expect(PAPER_TEMPLATES).toHaveLength(6);
    for (const tpl of PAPER_TEMPLATES) {
      expect(containsSystemEmoji(tpl.name)).toBe(false);
      expect(containsSystemEmoji(tpl.description)).toBe(false);
      const { container, unmount } = render(
        <PaperCanvas templateId={tpl.id}>
          <p>{tpl.shortName}</p>
        </PaperCanvas>,
      );
      expect(
        container.querySelector(`[data-paper-template="${tpl.id}"]`),
      ).not.toBeNull();
      expect(container.querySelector("svg")).not.toBeNull();
      unmount();
    }
  });

  it("hiển thị BunnyLockCover và BottomNav 4 tab đạt vùng chạm >= 44px, 0 emoji", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <>
        <BunnyLockCover />
        <BottomNav activeTab="home" onSelectTab={onSelect} />
      </>,
    );

    expect(
      screen.getByRole("img", { name: "Bìa sổ Thỏ Mochi khóa tim vàng" }),
    ).toBeDefined();

    const buttons = container.querySelectorAll("nav button[data-bnav]");
    expect(buttons).toHaveLength(4);
    for (const btn of buttons) {
      expect(btn.className).toContain("min-h-[44px]");
      expect(btn.className).toContain("min-w-[64px]");
      expect(btn.querySelector("svg")).not.toBeNull();
      expect(containsSystemEmoji(btn.textContent ?? "")).toBe(false);
    }
  });

  it("trang B1FoundationPreview render đủ 6 mẫu giấy, 28 sticker và 0 emoji hệ thống", () => {
    const { container } = render(<B1FoundationPreview />);
    expect(container.querySelectorAll("[data-paper-template]")).toHaveLength(6);
    expect(container.querySelectorAll("[data-sticker-id]")).toHaveLength(28);
    expect(containsSystemEmoji(container.textContent ?? "")).toBe(false);
  });

  it("kawaii.css chứa đủ 13 token --k-* đã khóa trong DESIGN.md", () => {
    const css = fs.readFileSync(
      path.resolve(process.cwd(), "src/styles/kawaii.css"),
      "utf8",
    );
    const expectedTokens = [
      "--k-bg: #FFF5F8",
      "--k-surface: #FFFFFF",
      "--k-pink-soft: #FFE4EE",
      "--k-pink-plush: #FFB7CE",
      "--k-pink-ribbon: #FF8FB8",
      "--k-berry: #D63D76",
      "--k-berry-dark: #B52A5E",
      "--k-ink: #4A2C3A",
      "--k-muted: #8C5A6E",
      "--k-cream: #FFF4D6",
      "--k-gold: #FFE07D",
      "--k-mint: #C6EBD1",
      "--k-sky: #DFF2FF",
    ];
    for (const token of expectedTokens) {
      expect(css).toContain(token);
    }
  });
});
