import { SETTINGS_KEYS } from "@core/settings";
import { MODULE_ID } from "@utils/constants";

let mouseWorldPos: { x: number; y: number } = { x: 0, y: 0 };
let altActive = false;
let mouseMoveHandler: (() => void) | null = null;

function isActive(): boolean {
  return (
    !!game.settings.get(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_ENABLED) &&
    !!game.settings.get(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_ENABLED_CLIENT)
  );
}

function getSourceToken(): any | null {
  const controlled = canvas?.tokens?.controlled ?? [];
  if (controlled.length === 1) return controlled[0];
  return null;
}

function measureDistance(from: any, to: any): number {
  const fromSquares = getTokenSquares(from);
  const toSquares = getTokenSquares(to);
  let minDistance = Infinity;
  for (const a of fromSquares) {
    for (const b of toSquares) {
      const path = (canvas!.grid as any).measurePath([a, b]);
      const dist = path?.distance ?? 0;
      if (dist < minDistance) minDistance = dist;
    }
  }
  return minDistance;
}

function measureDistanceToPoint(from: any, toPoint: { x: number; y: number }): number {
  const fromSquares = getTokenSquares(from);
  let minDistance = Infinity;
  for (const a of fromSquares) {
    const path = (canvas!.grid as any).measurePath([a, toPoint]);
    const dist = path?.distance ?? 0;
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

function getTokenSquares(token: any): { x: number; y: number }[] {
  const squares: { x: number; y: number }[] = [];
  const size = (canvas!.grid as any).size;
  const w = token.document.width ?? 1;
  const h = token.document.height ?? 1;
  for (let col = 0; col < w; col++) {
    for (let row = 0; row < h; row++) {
      squares.push({
        x: token.x + col * size + size / 2,
        y: token.y + row * size + size / 2,
      });
    }
  }
  return squares;
}

function getNearestSquareToMouse(token: any): { x: number; y: number } {
  const squares = getTokenSquares(token);
  let nearest = squares[0];
  let minDist = Infinity;
  for (const sq of squares) {
    const dx = sq.x - mouseWorldPos.x;
    const dy = sq.y - mouseWorldPos.y;
    const d = dx * dx + dy * dy;
    if (d < minDist) {
      minDist = d;
      nearest = sq;
    }
  }
  return nearest;
}

function formatDistance(dist: number): string {
  const gridType = (canvas!.scene as any)?.grid?.type ?? 0;
  if (gridType === 0) return "";
  const unit = game.settings.get(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_UNIT) as string;
  const mapUnits = (canvas!.scene as any)?.grid?.units ?? "";
  if (unit === "cells") {
    const cellSize = (canvas!.scene as any)?.grid?.distance ?? 1;
    return `${Math.round(dist / cellSize)} cases`;
  }
  const rounded = Math.round(dist * 100) / 100;
  return `${rounded}${mapUnits ? ` ${mapUnits}` : ""}`.trim();
}

let tooltipEl: HTMLElement | null = null;

function showTooltip(token: any, text: string): void {
  removeTooltip();
  if (!canvas?.stage) return;
  tooltipEl = document.createElement("div");
  tooltipEl.id = "sc-distance-tooltip";
  tooltipEl.textContent = text;
  tooltipEl.style.cssText = `
    position: fixed;
    background: rgba(0,0,0,0.75);
    color: #fff;
    font-size: 0.82em;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 99999;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000;
  `;
  const size = (canvas!.grid as any).size;
  const w = token.document.width ?? 1;
  const worldX = token.x + (w * size) / 2;
  const worldY = token.y;
  const screen = canvas!.stage.toGlobal({ x: worldX, y: worldY });
  tooltipEl.style.left = `${screen.x}px`;
  tooltipEl.style.top = `${screen.y - 28}px`;
  tooltipEl.style.transform = "translateX(-50%)";
  document.body.appendChild(tooltipEl);
}

function removeTooltip(): void {
  tooltipEl?.remove();
  tooltipEl = null;
}

let lineGraphics: any = null;

function drawLineToPoint(
  fromCenter: { x: number; y: number },
  toPoint: { x: number; y: number },
): void {
  removeLine();
  if (!game.settings.get(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_LINE)) return;
  if (!canvas?.stage) return;

  const zoom = canvas!.stage.scale.x;
  const dx = toPoint.x - fromCenter.x;
  const dy = toPoint.y - fromCenter.y;
  const totalLen = Math.sqrt(dx * dx + dy * dy);
  if (totalLen === 0) return;
  const nx = dx / totalLen;
  const ny = dy / totalLen;
  const dashLen = 12 / zoom;
  const gapLen = 8 / zoom;

  lineGraphics = new PIXI.Graphics();
  lineGraphics.lineStyle(2 / zoom, 0xffffff, 0.45);

  let pos = 0;
  let drawing = true;
  while (pos < totalLen) {
    const segLen = drawing ? dashLen : gapLen;
    const end = Math.min(pos + segLen, totalLen);
    if (drawing) {
      lineGraphics.moveTo(fromCenter.x + nx * pos, fromCenter.y + ny * pos);
      lineGraphics.lineTo(fromCenter.x + nx * end, fromCenter.y + ny * end);
    }
    pos = end;
    drawing = !drawing;
  }
  canvas!.controls!.addChild(lineGraphics);
}

function removeLine(): void {
  if (lineGraphics) {
    lineGraphics.destroy();
    lineGraphics = null;
  }
}

function getTokenCenter(token: any): { x: number; y: number } {
  const size = (canvas!.grid as any).size;
  const w = token.document.width ?? 1;
  const h = token.document.height ?? 1;
  return {
    x: token.x + (w * size) / 2,
    y: token.y + (h * size) / 2,
  };
}

function refresh(source: any, token: any): void {
  if (altActive) {
    const targetSquare = getNearestSquareToMouse(token);
    const dist = measureDistanceToPoint(source, targetSquare);
    const label = formatDistance(dist);
    if (!label) return;
    showTooltip(token, label);
    drawLineToPoint(getTokenCenter(source), targetSquare);
  } else {
    const dist = measureDistance(source, token);
    const label = formatDistance(dist);
    if (!label) return;
    showTooltip(token, label);
    drawLineToPoint(getTokenCenter(source), getTokenCenter(token));
  }
}

export function registerDistanceMeasurer(): void {
  if (!canvas?.stage) return;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Alt") altActive = true;
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Alt") altActive = false;
  });

  canvas!.stage.on("mousemove", (e: any) => {
    const pos = e.getLocalPosition(canvas!.stage);
    mouseWorldPos = { x: pos.x, y: pos.y };
  });

  Hooks.on("hoverToken", (...args: unknown[]) => {
    const [token, hovered] = args as [any, boolean];
    if (!canvas?.stage) return;

    if (!hovered) {
      if (mouseMoveHandler) {
        canvas!.stage.off("mousemove", mouseMoveHandler);
        mouseMoveHandler = null;
      }
      removeTooltip();
      removeLine();
      return;
    }

    if (!isActive()) return;

    const source = getSourceToken();
    if (!source || source === token) return;

    refresh(source, token);

    mouseMoveHandler = () => refresh(source, token);
    canvas!.stage.on("mousemove", mouseMoveHandler);
  });
}
