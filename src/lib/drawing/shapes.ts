import type { ShapeCommand, ShapeType } from "@/types/drawing";

export interface ShapeOptionMeta {
  id: ShapeType;
  label: string;
}

export const SHAPE_OPTIONS: readonly ShapeOptionMeta[] = [
  { id: "heart", label: "Tim" },
  { id: "star", label: "Sao" },
  { id: "flower", label: "Hoa" },
  { id: "cloud", label: "Mây" },
  { id: "circle", label: "Tròn" },
  { id: "speech-bubble", label: "Thoại" },
];

export function traceShapePath(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  cx: number,
  cy: number,
  radius: number,
): void {
  const r = Math.max(8, radius);
  ctx.beginPath();

  switch (shape) {
    case "circle": {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      return;
    }
    case "heart": {
      const top = cy - r * 0.25;
      ctx.moveTo(cx, cy + r * 0.85);
      ctx.bezierCurveTo(
        cx - r * 1.25,
        cy + r * 0.15,
        cx - r * 0.95,
        cy - r * 0.95,
        cx,
        top,
      );
      ctx.bezierCurveTo(
        cx + r * 0.95,
        cy - r * 0.95,
        cx + r * 1.25,
        cy + r * 0.15,
        cx,
        cy + r * 0.85,
      );
      ctx.closePath();
      return;
    }
    case "star": {
      const spikes = 5;
      const outer = r;
      const inner = r * 0.48;
      for (let i = 0; i < spikes * 2; i += 1) {
        const rad = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      return;
    }
    case "flower": {
      const petals = 5;
      const petalR = r * 0.45;
      const orbit = r * 0.52;
      for (let i = 0; i < petals; i += 1) {
        const angle = (i * 2 * Math.PI) / petals - Math.PI / 2;
        const px = cx + Math.cos(angle) * orbit;
        const py = cy + Math.sin(angle) * orbit;
        ctx.moveTo(px + petalR, py);
        ctx.arc(px, py, petalR, 0, Math.PI * 2);
      }
      return;
    }
    case "cloud": {
      const w = r * 0.95;
      const h = r * 0.58;
      ctx.moveTo(cx - w * 0.55, cy + h * 0.5);
      ctx.arc(cx - w * 0.45, cy + h * 0.08, r * 0.42, Math.PI * 0.65, Math.PI * 1.72);
      ctx.arc(cx - w * 0.05, cy - h * 0.25, r * 0.48, Math.PI * 1.05, Math.PI * 1.92);
      ctx.arc(cx + w * 0.42, cy - h * 0.02, r * 0.4, Math.PI * 1.35, Math.PI * 0.45);
      ctx.lineTo(cx - w * 0.55, cy + h * 0.5);
      ctx.closePath();
      return;
    }
    case "speech-bubble": {
      const w = r * 1.05;
      const h = r * 0.72;
      const left = cx - w;
      const top = cy - h;
      const right = cx + w;
      const bottom = cy + h * 0.7;
      const corner = Math.min(r * 0.35, 14);
      ctx.moveTo(left + corner, top);
      ctx.lineTo(right - corner, top);
      ctx.quadraticCurveTo(right, top, right, top + corner);
      ctx.lineTo(right, bottom - corner);
      ctx.quadraticCurveTo(right, bottom, right - corner, bottom);
      ctx.lineTo(cx + r * 0.1, bottom);
      ctx.lineTo(cx - r * 0.35, cy + h * 1.05);
      ctx.lineTo(cx - r * 0.22, bottom);
      ctx.lineTo(left + corner, bottom);
      ctx.quadraticCurveTo(left, bottom, left, bottom - corner);
      ctx.lineTo(left, top + corner);
      ctx.quadraticCurveTo(left, top, left + corner, top);
      ctx.closePath();
      return;
    }
  }
}

export function renderShapeCommand(
  ctx: CanvasRenderingContext2D,
  command: ShapeCommand,
): void {
  ctx.save();
  try {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.max(0.2, Math.min(1, command.alpha));
    ctx.fillStyle = command.color;
    ctx.strokeStyle = "#4A2C3A";
    ctx.lineWidth = Math.max(2, Math.min(3.5, command.radius * 0.08));
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    traceShapePath(ctx, command.shape, command.cx, command.cy, command.radius);
    ctx.fill();
    ctx.stroke();

    if (command.shape === "flower") {
      ctx.beginPath();
      ctx.fillStyle = "#F6C85F";
      ctx.arc(command.cx, command.cy, command.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } finally {
    ctx.restore();
  }
}
