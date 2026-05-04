import { getSetting, setSetting, SETTINGS_KEYS } from "@core/settings";
import { emitFade } from "@core/socket";
import { Z_LEVELS } from "@utils/constants";

const FADE_ID = "shards-core-fade";
const DEFAULT_DURATION = 1000;

export function fadeToBlack(duration: number = DEFAULT_DURATION): void {
  let el = document.getElementById(FADE_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = FADE_ID;
    el.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: ${Z_LEVELS.FADE};
      background: #000;
      opacity: 0;
      pointer-events: none;
      transition: opacity ${duration}ms ease;
    `;
    document.body.appendChild(el);
  } else {
    el.style.transition = `opacity ${duration}ms ease`;
  }
  el.getBoundingClientRect();
  el.style.opacity = "1";
  el.style.pointerEvents = "auto";
}

export function fadeFromBlack(duration: number = DEFAULT_DURATION): void {
  const el = document.getElementById(FADE_ID);
  if (!el) return;
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
}

export function isFadeActive(): boolean {
  return getSetting<boolean>(SETTINGS_KEYS.FADE_ACTIVE);
}

export async function toggleFade(): Promise<void> {
  const next = !isFadeActive();
  await setSetting(SETTINGS_KEYS.FADE_ACTIVE, next);
  emitFade(next);
}

export function getFadeDuration(): number {
  return getSetting<number>(SETTINGS_KEYS.FADE_DURATION) * 1000;
}

export function applyFade(active: boolean): void {
  if (active) fadeToBlack(getFadeDuration());
  else fadeFromBlack(getFadeDuration());
}
