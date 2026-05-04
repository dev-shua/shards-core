import { MODULE_ID } from "@utils/constants";
import { Z_LEVELS } from "@utils/constants";
import log from "@utils/logger";

const SETTING_KEY = "lootNotifications";
const DISPLAY_DURATION = 2500; // ms avant fadeout
const FADEOUT_DURATION = 400; // ms de fadeout

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

function showNotification(name: string, img: string, quantity: number = 1): void {
  if (!game.settings.get(MODULE_ID, SETTING_KEY)) return;

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

  const text = document.createElement("span");
  text.innerHTML = `<strong>×${quantity} ${name}</strong> ajouté à l'inventaire.`;
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

export function registerLootNotifications(): void {
  Hooks.on("createItem", (...args: unknown[]) => {
    const item = args[0] as any;
    if (item.parent?.documentName !== "Actor") return;

    // Trouve l'utilisateur qui possède cet acteur
    const actor = item.parent;
    const owner = (game as any).users?.find((u: any) => !u.isGM && u.character?.id === actor.id);

    // Si c'est le personnage de l'utilisateur courant, on affiche
    if (!owner || owner.id !== (game as any).user?.id) return;

    const quantity = item.system?.quantity ?? 1;
    showNotification(item.name, item.img, quantity);
  });
}
