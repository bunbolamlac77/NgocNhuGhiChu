import { getStroke } from "perfect-freehand";
import type { BrushType, CanvasBgId, DrawPoint, StrokeCommand } from "@/types/drawing";

export const BRUSH_PALETTE: readonly string[] = [
  "#4A2C3A",
  "#D63D76",
  "#FF7AA8",
  "#FFB7CE",
  "#F28B66",
  "#F6C85F",
  "#87BFA5",
  "#3E9B77",
  "#6FA9D6",
  "#7B8BE6",
  "#B388EB",
  "#E88DD6",
  "#C292A1",
  "#8C5A6E",
  "#FF9A8B",
  "#FFFFFF",
];

export interface BrushOptionMeta {
  id: BrushType;
  label: string;
}

export const BRUSH_OPTIONS: readonly BrushOptionMeta[] = [
  { id: "ink", label: "Bút mực" },
  { id: "highlighter", label: "Bút nhớ" },
  { id: "dashed", label: "Nét đứt" },
  { id: "eraser", label: "Tẩy" },
];

export interface CanvasBackgroundMeta {
  id: CanvasBgId;
  label: string;
  baseColor: string;
}

export const DRAW_CANVAS_BACKGROUNDS: readonly CanvasBackgroundMeta[] = [
  { id: "transparent", label: "Trong suốt", baseColor: "transparent" },
  { id: "white", label: "Giấy trắng", baseColor: "#FFFFFF" },
  { id: "heart-grid", label: "Chấm hồng", baseColor: "#FFF7FA" },
  { id: "sakura-dashed", label: "Dòng kẻ", baseColor: "#FFF5F8" },
  { id: "piggy-plaid", label: "Ca-rô dâu", baseColor: "#FFFAFC" },
];

function drawSvgPathFromStroke(
  ctx: CanvasRenderingContext2D,
  stroke: number[][],
): void {
  const first = stroke[0];
  if (!first) return;
  const firstX = first[0] ?? 0;
  const firstY = first[1] ?? 0;

  ctx.beginPath();
  ctx.moveTo(firstX, firstY);

  if (stroke.length === 1) {
    ctx.arc(firstX, firstY, 1, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    return;
  }

  for (let i = 0; i < stroke.length; i += 1) {
    const p0 = stroke[i];
    const p1 = stroke[(i + 1) % stroke.length];
    if (!p0 || !p1) continue;
    const x0 = p0[0] ?? 0;
    const y0 = p0[1] ?? 0;
    const x1 = p1[0] ?? x0;
    const y1 = p1[1] ?? y0;
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: DrawPoint[],
): void {
  const first = points[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  if (points.length === 1) {
    ctx.lineTo(first.x + 0.01, first.y + 0.01);
  } else {
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      if (!prev || !curr) continue;
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
    }
    const last = points[points.length - 1];
    if (last) {
      ctx.lineTo(last.x, last.y);
    }
  }
  ctx.stroke();
}

export function renderStrokeCommand(
  ctx: CanvasRenderingContext2D,
  command: StrokeCommand,
): void {
  if (command.points.length === 0) return;

  ctx.save();
  try {
    if (command.brush === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(4, command.size * 1.8);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawPolyline(ctx, command.points);
      return;
    }

    if (command.brush === "dashed") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = Math.max(0.2, Math.min(1, command.alpha));
      ctx.strokeStyle = command.color;
      ctx.lineWidth = command.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const dashLen = Math.max(6, command.size * 1.3);
      const gapLen = Math.max(6, command.size * 1.25);
      ctx.setLineDash([dashLen, gapLen]);
      drawPolyline(ctx, command.points);
      return;
    }

    const inputPoints = command.points.map((pt) => [
      pt.x,
      pt.y,
      pt.pressure ?? 0.5,
    ]);

    if (command.brush === "highlighter") {
      const outline = getStroke(inputPoints, {
        size: Math.max(6, command.size * 2.1),
        thinning: 0.08,
        smoothing: 0.65,
        streamline: 0.6,
        simulatePressure: false,
      });
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = Math.min(command.alpha, 0.42);
      ctx.fillStyle = command.color;
      drawSvgPathFromStroke(ctx, outline);
      return;
    }

    const outline = getStroke(inputPoints, {
      size: command.size,
      thinning: 0.45,
      smoothing: 0.55,
      streamline: 0.5,
      simulatePressure: true,
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.max(0.2, Math.min(1, command.alpha));
    ctx.fillStyle = command.color;
    drawSvgPathFromStroke(ctx, outline);
  } finally {
    ctx.restore();
  }
}
