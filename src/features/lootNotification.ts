import { MODULE_ID } from "@utils/constants";
import { Z_LEVELS } from "@utils/constants";
import log from "@utils/logger";

const SETTING_KEY = "lootNotifications";
const DISPLAY_DURATION = 2500;
const FADEOUT_DURATION = 400;

let container: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement("div");
    container.id = "sc-loot-notifications";
    container.style.cssText = `
      position: fixed;
      bottom: 170px;
      left: 16px;
      z-index: ${Z_LEVELS.OVERLAY};
      display: flex;
      flex-direction: column-reverse;
      gap: 4px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  return container;
}

type NotifType = "add" | "remove";

function showNotification(
  label: string,
  img: string,
  quantity: number,
  type: NotifType,
  actorName?: string,
): void {
  if (!game.settings.get(MODULE_ID, SETTING_KEY)) return;

  console.log("i18n test:", game.i18n.localize("SC.Notification.GMAdded"));
  console.log("i18n langs:", (game.i18n as any).lang);

  const el = document.createElement("div");
  el.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 200ms ease, transform 200ms ease;
    pointer-events: none;
    padding: 6px 20px 6px 8px;
    border-radius: 4px;
    background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 100%);
  `;

  const icon = document.createElement("img");
  icon.src = img || "icons/svg/item-bag.svg";
  icon.style.cssText =
    "width:28px;height:28px;border-radius:4px;object-fit:cover;flex-shrink:0;filter:drop-shadow(0 1px 2px #000);";

  const qtyColor = type === "remove" ? "#ff6b6b" : "#ffffff";

  const text = document.createElement("span");
  let html: string;

  if (actorName) {
    const verb =
      type === "add"
        ? game.i18n.localize("SC.Notification.GMAdded")
        : game.i18n.localize("SC.Notification.GMRemoved");
    html = `<strong>${actorName}</strong> ${verb} <strong style="color:${qtyColor}">×${quantity}</strong> <strong>${label}</strong>`;
  } else {
    const verb =
      type === "add"
        ? game.i18n.localize("SC.Notification.PlayerAdded")
        : game.i18n.localize("SC.Notification.PlayerRemoved");
    html = `<strong style="color:${qtyColor}">×${quantity}</strong> <strong>${label}</strong> ${verb}`;
  }

  text.innerHTML = html;

  text.style.cssText = `
    font-size: 0.88em;
    font-weight: 700;
    color: #fff;
    text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
    white-space: nowrap;
  `;

  el.appendChild(icon);
  el.appendChild(text);
  getContainer().appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    el.style.transition = `opacity ${FADEOUT_DURATION}ms ease, transform ${FADEOUT_DURATION}ms ease`;
    el.style.opacity = "0";
    el.style.transform = "translateY(-8px)";
    setTimeout(() => el.remove(), FADEOUT_DURATION);
  }, DISPLAY_DURATION);
}

function getAssignedPlayer(actor: any): any {
  return (game as any).users?.find((u: any) => !u.isGM && u.character?.id === actor.id) ?? null;
}

const quantityCache = new Map<string, number>();

export function registerLootNotifications(): void {
  Hooks.on("preUpdateItem", (...args: unknown[]) => {
    const [item, diff] = args as [any, any];
    if (diff?.system?.quantity === undefined) return;
    if (item.parent?.documentName !== "Actor") return;
    quantityCache.set(item.id, item.system?.quantity ?? 0);
  });

  Hooks.on("createItem", (...args: unknown[]) => {
    const [item] = args as [any, any, any, string];
    if (item.parent?.documentName !== "Actor") return;

    const actor = item.parent;
    const quantity = item.system?.quantity ?? 1;
    const currentUser = (game as any).user;
    const assignedPlayer = getAssignedPlayer(actor);

    if (currentUser.isGM) {
      const label = `${item.name} → ${actor.name}`;
      showNotification(label, item.img, quantity, "add", actor.name);
    } else if (assignedPlayer && currentUser.id === assignedPlayer.id) {
      showNotification(item.name, item.img, quantity, "add");
    }
  });

  Hooks.on("deleteItem", (...args: unknown[]) => {
    const [item, options] = args as [any, any, string];

    const parent = item.parent ?? options?.parent;
    if (!parent) return;

    const isActor =
      parent.documentName === "Actor" || parent.type === "character" || parent.type === "npc";
    if (!isActor) return;

    const actor = parent;
    const quantity = item.system?.quantity ?? 1;
    const currentUser = (game as any).user;
    const assignedPlayer = getAssignedPlayer(actor);

    if (currentUser.isGM) {
      showNotification(item.name, item.img, quantity, "remove", actor.name);
    } else if (assignedPlayer && currentUser.id === assignedPlayer.id) {
      showNotification(item.name, item.img, quantity, "remove");
    }
  });

  Hooks.on("updateItem", (...args: unknown[]) => {
    const [item, diff] = args as [any, any];
    if (item.parent?.documentName !== "Actor") return;

    const newQty: number | undefined = diff?.system?.quantity;
    if (newQty === undefined) return;

    const oldQty = quantityCache.get(item.id) ?? newQty;
    quantityCache.delete(item.id);

    const delta = newQty - oldQty;
    if (delta === 0) return;

    const actor = item.parent;
    const type: NotifType = delta > 0 ? "add" : "remove";
    const currentUser = (game as any).user;
    const assignedPlayer = getAssignedPlayer(actor);

    if (currentUser.isGM) {
      showNotification(item.name, item.img, Math.abs(delta), type, actor.name);
    } else if (assignedPlayer && currentUser.id === assignedPlayer.id) {
      showNotification(item.name, item.img, Math.abs(delta), type);
    }
  });
}
