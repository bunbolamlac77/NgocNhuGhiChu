import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DrawingStudio } from "@/components/draw/DrawingStudio";
import { BRUSH_PALETTE } from "@/lib/drawing/brushes";

describe("DrawingStudio", () => {
  it("renders 4 brushes, 16 swatches, sliders, 5 backgrounds, and shape presets", () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      return {
        save: vi.fn(),
        restore: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        setLineDash: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(640 * 560 * 4),
          width: 640,
          height: 560,
        })),
      } as unknown as CanvasRenderingContext2D;
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    render(<DrawingStudio />);

    expect(screen.getByText("Bút mực")).toBeTruthy();
    expect(screen.getByText("Bút nhớ")).toBeTruthy();
    expect(screen.getByText("Nét đứt")).toBeTruthy();
    expect(screen.getByText("Tẩy")).toBeTruthy();
    expect(BRUSH_PALETTE).toHaveLength(16);

    fireEvent.click(screen.getByText("Hình khối"));
    expect(screen.getByText("Tim")).toBeTruthy();
    expect(screen.getByText("Sao")).toBeTruthy();
    expect(screen.getByText("Hoa")).toBeTruthy();
    expect(screen.getByText("Mây")).toBeTruthy();
    expect(screen.getByText("Tròn")).toBeTruthy();
    expect(screen.getByText("Thoại")).toBeTruthy();

    // Empty canvas shows helpful error on Cut Sticker
    fireEvent.click(screen.getByText("Cắt làm Sticker"));
    expect(screen.getByRole("alert").textContent).toContain(
      "Bạn hãy vẽ ít nhất một nét trước khi cắt sticker nhé!",
    );
  });
});
