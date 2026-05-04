import { applyFade, fadeToBlack, fadeFromBlack } from "@features/fade";
import { MODULE_ID } from "@utils/constants";

const SOCKET_EVENT = `module.${MODULE_ID}`;

const socketHandlers: Array<(payload: unknown) => void> = [];

export function registerSocketHandler(handler: (payload: unknown) => void): void {
  socketHandlers.push(handler);
}

export function registerSocket(): void {
  game.socket?.on(SOCKET_EVENT, (payload: unknown) => {
    const p = payload as any;
    if (p.type === "fade:on") fadeToBlack(p.duration);
    if (p.type === "fade:off") fadeFromBlack(p.duration);
    // Dispatch aux autres handlers
    for (const handler of socketHandlers) handler(payload);
  });
}

export function emitFade(active: boolean, duration?: number): void {
  game.socket?.emit(SOCKET_EVENT, { type: active ? "fade:on" : "fade:off", duration });
  if (active) fadeToBlack(duration);
  else fadeFromBlack(duration);
}
