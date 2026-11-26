import {
  MAX_DRAWING_CLIENT_BYTES,
  MAX_STICKER_CLIENT_BYTES,
} from "@/lib/validation";
import type { CanvasBgId, DieCutOptions, DieCutResult } from "@/types/drawing";
import { paintCanvasBackground } from "./commands";

export interface AlphaBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface CanvasFactory {
  createCanvas(width: number, height: number): HTMLCanvasElement;
}

const defaultCanvasFactory: CanvasFactory = {
  createCanvas(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },
};

export function findAlphaBoundingBox(
  rgbaData: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold = 12,
): AlphaBoundingBox | null {
  if (width <= 0 || height <= 0 || rgbaData.length < width * height * 4) {
    return null;
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const alpha = rgbaData[rowOffset + x * 4 + 3] ?? 0;
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function computeScaledDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number; scale: number } {
  const longest = Math.max(width, height, 1);
  if (longest <= maxDimension) {
    return { width: Math.max(1, width), height: Math.max(1, height), scale: 1 };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

function encodeCanvasToBlob(
  canvas: HTMLCanvasElement,
  mime: "image/webp" | "image/png",
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

async function encodeCompressedBlob(
  canvas: HTMLCanvasElement,
  maxBytes: number,
  allowResizeDown: (dim: number) => HTMLCanvasElement,
  startMaxDim: number,
  fallbackMaxDim: number,
): Promise<{
  blob: Blob;
  mime: "image/webp" | "image/png";
  width: number;
  height: number;
}> {
  const attempts: Array<{ targetCanvas: HTMLCanvasElement; mime: "image/webp" | "image/png"; quality: number }> = [
    { targetCanvas: canvas, mime: "image/webp", quality: 0.9 },
    { targetCanvas: canvas, mime: "image/webp", quality: 0.78 },
    { targetCanvas: canvas, mime: "image/webp", quality: 0.65 },
  ];

  for (const attempt of attempts) {
    const blob = await encodeCanvasToBlob(
      attempt.targetCanvas,
      attempt.mime,
      attempt.quality,
    );
    if (blob && blob.type === "image/webp" && blob.size <= maxBytes) {
      return {
        blob,
        mime: "image/webp",
        width: attempt.targetCanvas.width,
        height: attempt.targetCanvas.height,
      };
    }
  }

  if (fallbackMaxDim < startMaxDim) {
    const smaller = allowResizeDown(fallbackMaxDim);
    for (const quality of [0.85, 0.72, 0.58]) {
      const blob = await encodeCanvasToBlob(smaller, "image/webp", quality);
      if (blob && blob.type === "image/webp" && blob.size <= maxBytes) {
        return {
          blob,
          mime: "image/webp",
          width: smaller.width,
          height: smaller.height,
        };
      }
    }
    const pngSmall = await encodeCanvasToBlob(smaller, "image/png");
    if (pngSmall && pngSmall.size <= maxBytes) {
      return {
        blob: pngSmall,
        mime: "image/png",
        width: smaller.width,
        height: smaller.height,
      };
    }
  }

  const pngFallback = await encodeCanvasToBlob(canvas, "image/png");
  if (!pngFallback) {
    throw new Error("Trình duyệt không hỗ trợ xuất ảnh từ bảng vẽ.");
  }
  return {
    blob: pngFallback,
    mime: pngFallback.type === "image/webp" ? "image/webp" : "image/png",
    width: canvas.width,
    height: canvas.height,
  };
}

function renderDieCutCanvas(
  sourceCanvas: HTMLCanvasElement,
  bbox: AlphaBoundingBox,
  options: Required<DieCutOptions>,
  factory: CanvasFactory,
): HTMLCanvasElement {
  const borderR = options.borderEnabled ? options.borderRadius : 0;
  const pad = options.padding;
  const rawW = bbox.width + (pad + borderR) * 2;
  const rawH = bbox.height + (pad + borderR) * 2;
  const scaled = computeScaledDimensions(rawW, rawH, options.maxDimension);

  const outCanvas = factory.createCanvas(scaled.width, scaled.height);
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) {
    throw new Error("Không khởi tạo được canvas cắt sticker.");
  }

  const cropScaledW = Math.max(1, Math.round(bbox.width * scaled.scale));
  const cropScaledH = Math.max(1, Math.round(bbox.height * scaled.scale));
  const offsetX = Math.round((scaled.width - cropScaledW) / 2);
  const offsetY = Math.round((scaled.height - cropScaledH) / 2);
  const scaledBorderR = Math.max(0, borderR * scaled.scale);

  const cropCanvas = factory.createCanvas(cropScaledW, cropScaledH);
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) {
    throw new Error("Không xử lý được vùng cắt sticker.");
  }
  cropCtx.drawImage(
    sourceCanvas,
    bbox.minX,
    bbox.minY,
    bbox.width,
    bbox.height,
    0,
    0,
    cropScaledW,
    cropScaledH,
  );

  if (options.borderEnabled && scaledBorderR > 0) {
    const whiteMaskCanvas = factory.createCanvas(cropScaledW, cropScaledH);
    const whiteCtx = whiteMaskCanvas.getContext("2d");
    if (whiteCtx) {
      whiteCtx.drawImage(cropCanvas, 0, 0);
      whiteCtx.globalCompositeOperation = "source-in";
      whiteCtx.fillStyle = "#FFFFFF";
      whiteCtx.fillRect(0, 0, cropScaledW, cropScaledH);

      const silhouetteCanvas = factory.createCanvas(scaled.width, scaled.height);
      const silCtx = silhouetteCanvas.getContext("2d");
      if (silCtx) {
        const steps = 16;
        for (let i = 0; i < steps; i += 1) {
          const angle = (i * 2 * Math.PI) / steps;
          const dx = Math.cos(angle) * scaledBorderR;
          const dy = Math.sin(angle) * scaledBorderR;
          silCtx.drawImage(whiteMaskCanvas, offsetX + dx, offsetY + dy);
        }
        silCtx.drawImage(whiteMaskCanvas, offsetX, offsetY);

        outCtx.save();
        if (options.shadowEnabled) {
          outCtx.shadowColor = "rgba(74, 44, 58, 0.24)";
          outCtx.shadowBlur = Math.max(2, Math.round(4 * scaled.scale));
          outCtx.shadowOffsetY = Math.max(1, Math.round(2 * scaled.scale));
        }
        outCtx.drawImage(silhouetteCanvas, 0, 0);
        outCtx.restore();
      }
    }
  } else if (options.shadowEnabled) {
    outCtx.save();
    outCtx.shadowColor = "rgba(74, 44, 58, 0.24)";
    outCtx.shadowBlur = Math.max(2, Math.round(4 * scaled.scale));
    outCtx.shadowOffsetY = Math.max(1, Math.round(2 * scaled.scale));
    outCtx.drawImage(cropCanvas, offsetX, offsetY);
    outCtx.restore();
    return outCanvas;
  }

  outCtx.drawImage(cropCanvas, offsetX, offsetY);
  return outCanvas;
}

export async function exportDieCutSticker(
  sourceCanvas: HTMLCanvasElement,
  options: DieCutOptions,
  factory: CanvasFactory = defaultCanvasFactory,
): Promise<DieCutResult> {
  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không đọc được dữ liệu nét vẽ trên canvas.");
  }

  const imageData = ctx.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  const bbox = findAlphaBoundingBox(
    imageData.data,
    sourceCanvas.width,
    sourceCanvas.height,
    12,
  );
  if (!bbox) {
    throw new Error("Bạn hãy vẽ ít nhất một nét trước khi cắt sticker nhé!");
  }

  const maxDimension = options.maxDimension ?? 384;
  const resolved: Required<DieCutOptions> = {
    borderEnabled: options.borderEnabled,
    shadowEnabled: options.shadowEnabled,
    maxDimension,
    padding: options.padding ?? 16,
    borderRadius: options.borderRadius ?? 8,
  };

  const primaryCanvas = renderDieCutCanvas(sourceCanvas, bbox, resolved, factory);
  const encoded = await encodeCompressedBlob(
    primaryCanvas,
    MAX_STICKER_CLIENT_BYTES,
    (nextMaxDim) =>
      renderDieCutCanvas(
        sourceCanvas,
        bbox,
        { ...resolved, maxDimension: nextMaxDim },
        factory,
      ),
    maxDimension,
    Math.min(256, maxDimension),
  );

  if (encoded.blob.size > MAX_STICKER_CLIENT_BYTES) {
    throw new Error(
      "Sticker có quá nhiều chi tiết phức tạp (> 45 KB). Hãy vẽ gọn lại một chút nhé!",
    );
  }

  return {
    blob: encoded.blob,
    mime: encoded.mime,
    width: encoded.width,
    height: encoded.height,
    sizeBytes: encoded.blob.size,
  };
}

export async function exportFlatDrawing(
  sourceCanvas: HTMLCanvasElement,
  bgId: CanvasBgId,
  maxDimension = 1200,
  factory: CanvasFactory = defaultCanvasFactory,
): Promise<{
  blob: Blob;
  mime: "image/webp" | "image/png";
  width: number;
  height: number;
  sizeBytes: number;
}> {
  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không đọc được dữ liệu từ bảng vẽ.");
  }

  const imageData = ctx.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  const bbox = findAlphaBoundingBox(
    imageData.data,
    sourceCanvas.width,
    sourceCanvas.height,
    8,
  );
  if (!bbox) {
    throw new Error("Bạn hãy vẽ ít nhất một nét trước khi lưu ảnh vẽ nhé!");
  }

  const renderAtDim = (dim: number) => {
    const scaled = computeScaledDimensions(
      sourceCanvas.width,
      sourceCanvas.height,
      dim,
    );
    const out = factory.createCanvas(scaled.width, scaled.height);
    const outCtx = out.getContext("2d");
    if (!outCtx) {
      throw new Error("Không khởi tạo được canvas xuất ảnh vẽ.");
    }
    paintCanvasBackground(outCtx, scaled.width, scaled.height, bgId);
    outCtx.drawImage(sourceCanvas, 0, 0, scaled.width, scaled.height);
    return out;
  };

  const primary = renderAtDim(maxDimension);
  const encoded = await encodeCompressedBlob(
    primary,
    MAX_DRAWING_CLIENT_BYTES,
    renderAtDim,
    maxDimension,
    Math.min(840, maxDimension),
  );

  if (encoded.blob.size > MAX_DRAWING_CLIENT_BYTES) {
    throw new Error(
      "Ảnh vẽ vượt quá giới hạn 150 KB. Hãy giảm bớt nét hoặc chọn nền gọn hơn nhé!",
    );
  }

  return {
    blob: encoded.blob,
    mime: encoded.mime,
    width: encoded.width,
    height: encoded.height,
    sizeBytes: encoded.blob.size,
  };
}
