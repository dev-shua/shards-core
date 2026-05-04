import type { ShardsTheme } from "@theming/types";
import { defaultTheme } from "@theming/themes/default";
import { getSetting, setSetting, SETTINGS_KEYS } from "@core/settings";

const _themes = new Map<string, ShardsTheme>();

export function registerTheme(theme: ShardsTheme): void {
  _themes.set(theme.id, theme);
}

export function getThemes(): ShardsTheme[] {
  return Array.from(_themes.values());
}

export function getActiveTheme(): ShardsTheme {
  const activeId = getSetting<string>(SETTINGS_KEYS.THEME);
  return _themes.get(activeId) ?? defaultTheme;
}

export async function setActiveTheme(id: string): Promise<void> {
  await setSetting(SETTINGS_KEYS.THEME, id);
  applyTheme(getActiveTheme());
}

export function applyTheme(theme: ShardsTheme): void {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--sc-primary",    c.primary);
  root.style.setProperty("--sc-success",    c.success);
  root.style.setProperty("--sc-danger",     c.danger);
  root.style.setProperty("--sc-warning",    c.warning);
  root.style.setProperty("--sc-info",       c.info);
  root.style.setProperty("--sc-muted",      c.muted);
  root.style.setProperty("--sc-bg",         c.bg);
  root.style.setProperty("--sc-bg-title",   c.bgTitle);
  root.style.setProperty("--sc-text",       c.text);
  root.style.setProperty("--sc-text-muted", c.textMuted);
}

export function initTheme(): void {
  registerTheme(defaultTheme);
  applyTheme(getActiveTheme());
}