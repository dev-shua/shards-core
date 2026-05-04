// src/core/view.ts
import { getTool } from "@core/registry";
import { PANEL_ID, ROOT_ID } from "@core/layout";
import { unmount } from "svelte";
import log from "@utils/logger";

let _currentToolId: string | null = null;
let _currentInstance: ReturnType<typeof import("svelte").mount> | null = null;

export async function renderDock(toolId: string): Promise<void> {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;

  // Détruit l'outil actuel proprement
  if (_currentToolId && _currentToolId !== toolId) {
    getTool(_currentToolId)?.destroy?.();
    if (_currentInstance) {
      try { unmount(_currentInstance); } catch {}
      _currentInstance = null;
    }
  }

  const tool = getTool(toolId);
  if (!tool) {
    log.warn(`Tool "${toolId}" not found in registry`);
    return;
  }

  _currentToolId = toolId;
  panel.innerHTML = "";
  
  // Capture l'instance si render retourne quelque chose
  const result = tool.render(panel);
  if (result && typeof result === "object") {
    _currentInstance = result as any;
  }
}

export function setDockOpen(open: boolean): void {
  const root = document.getElementById(ROOT_ID);
  const panel = document.getElementById(PANEL_ID);
  if (!root || !panel) return;
  panel.classList.toggle("is-open", open);
  root.setAttribute("aria-hidden", open ? "false" : "true");
}

export function getCurrentToolId(): string | null {
  return _currentToolId;
}