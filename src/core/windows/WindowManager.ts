import { mount, unmount } from "svelte";
import ShardsWindow from "@ui/ShardsWindow.svelte";

export type WindowConfig = {
  id: string;
  title: string;
  icon?: string;
  render: (container: HTMLElement) => (() => void) | void;
  resizable?: boolean;
  initialW?: number;
  initialH?: number;
  onBeforeClose?: () => Promise<boolean>;
};

type WindowInstance = {
  config: WindowConfig;
  instance: ReturnType<typeof mount>;
  el: HTMLElement;
  destroy?: () => void;
};

const _windows = new Map<string, WindowInstance>();

function getNextZ(): number {
  const AppV2 = (globalThis as any).foundry?.applications?.api?.ApplicationV2;
  if (AppV2) {
    AppV2._maxZ = (AppV2._maxZ ?? 100) + 1;
    return AppV2._maxZ;
  }
  const current = (globalThis as any)._maxZ ?? 100;
  (globalThis as any)._maxZ = current + 1;
  return current + 1;
}

export function openWindow(config: WindowConfig): void {
  if (_windows.has(config.id)) {
    focusWindow(config.id);
    return;
  }

  const el = document.createElement("div");
  el.id = `shards-window-${config.id}`;
  document.body.appendChild(el);

  const z = getNextZ();

  const instance = mount(ShardsWindow, {
    target: el,
    props: {
      id: config.id,
      title: config.title,
      icon: config.icon ?? "",
      resizable: config.resizable ?? false,
      initialX: Math.round(window.innerWidth / 2 - (config.initialW ?? 600) / 2),
      initialY: Math.round(window.innerHeight / 2 - (config.initialH ?? 400) / 2),
      initialW: config.initialW ?? 600,
      initialH: config.initialH ?? 400,
      initialZ: z,
      onRender: config.render,
      onFocus: () => focusWindow(config.id),
      onClose: () => closeWindow(config.id),
    } as any,
  });

  _windows.set(config.id, { config, instance, el });
}

export function focusWindow(id: string): void {
  const win = _windows.get(id);
  if (!win) return;
  const z = getNextZ();
  const windowEl = win.el.querySelector(".sc-window") as HTMLElement;
  if (windowEl) windowEl.style.zIndex = String(z);
  (globalThis as any).ui.activeWindow = { bringToTop: () => focusWindow(id) };
}

export async function closeWindow(id: string): Promise<void> {
  const win = _windows.get(id);
  if (!win) return;

  if (win.config.onBeforeClose) {
    const ok = await win.config.onBeforeClose();
    if (!ok) return;
  }

  win.destroy?.();
  unmount(win.instance);
  win.el.remove();
  _windows.delete(id);
}

export function updateWindow(id: string, updates: { title?: string; icon?: string }): void {
  const win = _windows.get(id);
  if (!win) return;
  if (updates.title !== undefined) win.config.title = updates.title;
  if (updates.icon !== undefined) win.config.icon = updates.icon;
  // Met à jour le composant Svelte via les props
  const titleEl = win.el.querySelector(".sc-window-title span");
  if (titleEl && updates.title) titleEl.textContent = updates.title;
}
