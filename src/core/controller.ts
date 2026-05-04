import { getSetting, setSetting, SETTINGS_KEYS } from "@core/settings";
import { setDockTop, RAIL_ID } from "@core/layout";
import { renderDock, setDockOpen } from "@core/view";
import { getTools } from "@core/registry";
import { refreshRail } from "@core/app";

export class DockController {
  private isOpen = false;
  private isAnimating = false;
  private currentTool: string | null = null;

  async init(): Promise<void> {
    try {
      this.isOpen = !!getSetting<boolean>(SETTINGS_KEYS.OPEN);
      this.currentTool = getSetting<string>(SETTINGS_KEYS.ACTIVE_TOOL) || null;
    } catch {
      this.isOpen = false;
      this.currentTool = null;
    }

    // Si pas d'outil actif, prend le premier disponible
    if (!this.currentTool) {
      this.currentTool = getTools()[0]?.id ?? null;
    }

    if (this.currentTool) {
      await renderDock(this.currentTool);
    }
    setDockOpen(this.isOpen);

    const rail = document.getElementById(RAIL_ID);
    if (!rail) return;

    // Clicks sur les outils
    rail.addEventListener("click", async (ev) => {
      const btn = (ev.target as HTMLElement)?.closest<HTMLButtonElement>(".dock-tool");
      if (!btn) return;
      const tool = btn.dataset.tool ?? null;
      if (!tool) return;

      if (tool !== this.currentTool) {
        this.currentTool = tool;
        await setSetting(SETTINGS_KEYS.ACTIVE_TOOL, tool);
        rail.querySelectorAll(".dock-tool").forEach((b) => {
          const el = b as HTMLButtonElement;
          const active = el.dataset.tool === tool;
          el.classList.toggle("is-active", active);
          el.setAttribute("aria-pressed", active ? "true" : "false");
        });
        await renderDock(this.currentTool);
        await this.open();
      } else {
        this.toggle();
      }
    });

    this.wireDragHandle(rail);

    // Re-render rail quand un tool est enregistré tardivement
    Hooks.on("shards-core:toolRegistered", () => {
      refreshRail();
      // Si pas d'outil actif, active le premier
      if (!this.currentTool) {
        this.currentTool = getTools()[0]?.id ?? null;
        if (this.currentTool) void renderDock(this.currentTool);
      }
    });
  }

  private wireDragHandle(rail: HTMLElement): void {
    const handle = rail.querySelector<HTMLButtonElement>(".dock-drag");
    if (!handle) return;

    let dragging = false;
    let startY = 0;
    let startTop = 0;

    const getTop = () => parseInt((rail.style.top || "0").replace("px", ""), 10) || 0;
    const clamp = (v: number) => {
      const h = window.innerHeight;
      const railH = rail.offsetHeight || 48;
      const min = 8;
      const max = Math.max(min, h - railH - 8);
      return Math.min(max, Math.max(min, v));
    };

    handle.addEventListener("pointerdown", (ev) => {
      dragging = true;
      startY = ev.clientY;
      startTop = getTop();
      handle.setPointerCapture?.(ev.pointerId);
    });

    handle.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      const dy = ev.clientY - startY;
      const top = clamp(startTop + dy);
      setDockTop(top);
    });

    const endDrag = async (ev: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      handle.releasePointerCapture?.(ev.pointerId);
      const top = getTop();
      await setSetting(SETTINGS_KEYS.POSITION_Y, top);
    };

    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
  }

  async open(): Promise<void> {
    if (this.isOpen || this.isAnimating) return;
    this.isAnimating = true;
    await new Promise((r) => requestAnimationFrame(r));
    setDockOpen(true);
    this.isOpen = true;
    await setSetting(SETTINGS_KEYS.OPEN, true);
    if (this.currentTool) await renderDock(this.currentTool);
    this.isAnimating = false;
  }

  async close(): Promise<void> {
    if (!this.isOpen || this.isAnimating) return;
    this.isAnimating = true;
    setDockOpen(false);
    await new Promise((r) => setTimeout(r, 150));
    this.isOpen = false;
    await setSetting(SETTINGS_KEYS.OPEN, false);
    this.isAnimating = false;
  }

  toggle(): void {
    this.isOpen ? void this.close() : void this.open();
  }
}

export const dockController = new DockController();