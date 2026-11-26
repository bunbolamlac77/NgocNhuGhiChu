// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  clearDrawingHistory,
  createDrawingHistory,
  MAX_UNDO_HISTORY,
  pushDrawCommand,
  redoDrawing,
  undoDrawing,
} from "@/lib/drawing/commands";
import {
  computeScaledDimensions,
  exportDieCutSticker,
  exportFlatDrawing,
  findAlphaBoundingBox,
  type CanvasFactory,
} from "@/lib/drawing/diecut";
import type { StrokeCommand } from "@/types/drawing";

function makeFakeCanvas(
  width: number,
  height: number,
  alphaPixels: Array<{ x: number; y: number; a: number }> = [],
  blobSizeBytes = 6400,
) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (const px of alphaPixels) {
    const idx = (px.y * width + px.x) * 4;
    rgba[idx] = 214;
    rgba[idx + 1] = 61;
    rgba[idx + 2] = 118;
    rgba[idx + 3] = px.a;
  }
  const drawCalls: Array<{ op: string; args: unknown[] }> = [];
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    setLineDash: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn((...args: unknown[]) => {
      drawCalls.push({ op: "drawImage", args });
    }),
    getImageData: vi.fn(() => ({ data: rgba, width, height })),
    globalCompositeOperation: "source-over",
    globalAlpha: 1,
    fillStyle: "#FFFFFF",
    strokeStyle: "#000000",
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetY: 0,
  };

  const canvas = {
    width,
    height,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn(
      (cb: (blob: Blob | null) => void, mime = "image/webp") => {
        cb(
          new Blob([new Uint8Array(new ArrayBuffer(blobSizeBytes))], {
            type: mime,
          }),
        );
      },
    ),
    _ctx: ctx,
    _drawCalls: drawCalls,
  };

  return canvas as unknown as HTMLCanvasElement & {
    _ctx: typeof ctx;
    _drawCalls: typeof drawCalls;
  };
}

describe("Die-cut & Drawing History Engine", () => {
  it("ignores transparent pixels with alpha <= 12 and crops exact bounding box", () => {
    const width = 40;
    const height = 30;
    const rgba = new Uint8ClampedArray(width * height * 4);

    // Faint shadow alpha=10 must be ignored
    rgba[(2 * width + 3) * 4 + 3] = 10;
    // Ink pixels from (10, 8) to (25, 19)
    rgba[(8 * width + 10) * 4 + 3] = 255;
    rgba[(19 * width + 25) * 4 + 3] = 200;

    const bbox = findAlphaBoundingBox(rgba, width, height, 12);
    expect(bbox).toEqual({
      minX: 10,
      minY: 8,
      maxX: 25,
      maxY: 19,
      width: 16,
      height: 12,
    });

    const empty = findAlphaBoundingBox(new Uint8ClampedArray(40 * 30 * 4), 40, 30, 12);
    expect(empty).toBeNull();
  });

  it("computes scaled dimensions respecting maxDimension", () => {
    expect(computeScaledDimensions(100, 50, 384)).toEqual({
      width: 100,
      height: 50,
      scale: 1,
    });
    expect(computeScaledDimensions(768, 384, 384)).toEqual({
      width: 384,
      height: 192,
      scale: 0.5,
    });
  });

  it("exports die-cut sticker <= 384px and <= 45 KB with 16-angle white border dilation", async () => {
    const source = makeFakeCanvas(600, 500, [
      { x: 100, y: 120, a: 255 },
      { x: 220, y: 200, a: 255 },
    ]);
    const created: Array<ReturnType<typeof makeFakeCanvas>> = [];
    const factory: CanvasFactory = {
      createCanvas(w, h) {
        const c = makeFakeCanvas(w, h, [], 5120);
        created.push(c);
        return c;
      },
    };

    const res = await exportDieCutSticker(
      source,
      { borderEnabled: true, shadowEnabled: true },
      factory,
    );

    expect(res.mime).toBe("image/webp");
    expect(res.width).toBeLessThanOrEqual(384);
    expect(res.height).toBeLessThanOrEqual(384);
    expect(res.sizeBytes).toBeLessThanOrEqual(45 * 1024);
    // silhouetteCanvas receives 16 radial offset draws + 1 center draw = 17 drawImage calls
    const silhouetteCanvas = created[3];
    expect(silhouetteCanvas).toBeDefined();
    expect(silhouetteCanvas!._ctx.drawImage).toHaveBeenCalledTimes(17);
  });

  it("rejects empty canvas when cutting sticker or exporting drawing", async () => {
    const emptyCanvas = makeFakeCanvas(300, 300, []);
    await expect(
      exportDieCutSticker(emptyCanvas, { borderEnabled: true, shadowEnabled: true }),
    ).rejects.toThrow("vẽ ít nhất một nét");
    await expect(
      exportFlatDrawing(emptyCanvas, "white"),
    ).rejects.toThrow("vẽ ít nhất một nét");
  });

  it("scales flat drawing to <= 1200px and < 150 KB", async () => {
    const bigCanvas = makeFakeCanvas(2400, 1600, [{ x: 100, y: 100, a: 255 }]);
    const factory: CanvasFactory = {
      createCanvas: (w, h) => makeFakeCanvas(w, h, [], 18_000),
    };

    const res = await exportFlatDrawing(bigCanvas, "heart-grid", 1200, factory);
    expect(res.width).toBe(1200);
    expect(res.height).toBe(800);
    expect(res.sizeBytes).toBeLessThan(150 * 1024);
  });

  it("supports >= 30 undo/redo steps cleanly within MAX_UNDO_HISTORY", () => {
    expect(MAX_UNDO_HISTORY).toBeGreaterThanOrEqual(30);
    let hist = createDrawingHistory([]);
    for (let i = 0; i < 35; i += 1) {
      const cmd: StrokeCommand = {
        kind: "stroke",
        id: `s-${i}`,
        brush: "ink",
        color: "#D63D76",
        size: 8,
        alpha: 1,
        points: [{ x: i, y: i }],
      };
      hist = pushDrawCommand(hist, cmd);
    }
    expect(hist.present).toHaveLength(35);

    for (let i = 0; i < 35; i += 1) {
      hist = undoDrawing(hist);
    }
    expect(hist.present).toHaveLength(0);
    expect(hist.future).toHaveLength(35);

    for (let i = 0; i < 10; i += 1) {
      hist = redoDrawing(hist);
    }
    expect(hist.present).toHaveLength(10);

    hist = clearDrawingHistory(hist);
    expect(hist.present).toHaveLength(0);
    hist = undoDrawing(hist);
    expect(hist.present).toHaveLength(10);
  });
});
