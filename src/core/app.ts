import { getSetting, setSetting, SETTINGS_KEYS } from "@core/settings";
import { getTools } from "@core/registry";
import { setDockTop, RAIL_ID, PANEL_ID, ROOT_ID } from "@core/layout";

function baselineTop(): number {
  const nav = document.getElementById("controls");
  if (!nav) return Math.round(window.innerHeight / 2);
  const r = nav.getBoundingClientRect();
  return Math.round(r.bottom + 8);
}

export function initDock(): void {
  if (!getSetting<boolean>(SETTINGS_KEYS.ENABLED)) return;

  // Root
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
  }

  // Rail
  let rail = document.getElementById(RAIL_ID);
  if (!rail) {
    rail = document.createElement("nav");
    rail.id = RAIL_ID;
    rail.className = "shards-core-rail";
    const top = getSetting<number>(SETTINGS_KEYS.POSITION_Y) ?? baselineTop();
    rail.style.top = `${top}px`;
    rail.setAttribute("aria-label", "Dock");

    rail.innerHTML = `
      <button class="dock-drag" aria-label="Move dock" title="Move dock">⋮</button>
      ${buildToolButtons()}
    `;

    root.appendChild(rail);
  }

  // Panel
  if (!document.getElementById(PANEL_ID)) {
    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "shards-core-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Dock panel");
    root.appendChild(panel);
  }

  const top = getSetting<number>(SETTINGS_KEYS.POSITION_Y) ?? baselineTop();
  setDockTop(top);
}

export function buildToolButtons(): string {
  const activeTool = getSetting<string>(SETTINGS_KEYS.ACTIVE_TOOL);
  return getTools()
    .map((t) => {
      const active = t.id === activeTool;
      return `<button 
        class="dock-tool${active ? " is-active" : ""}" 
        data-tool="${t.id}" 
        aria-pressed="${active}" 
        title="${t.title}">
        <i class="${t.icon}"></i>
      </button>`;
    })
    .join("");
}

export function refreshRail(): void {
  const rail = document.getElementById(RAIL_ID);
  if (!rail) return;

  const drag = rail.querySelector(".dock-drag");
  rail.innerHTML = "";
  if (drag) rail.appendChild(drag);
  rail.insertAdjacentHTML("beforeend", buildToolButtons());
}

export function destroyDock(): void {
  document.getElementById(ROOT_ID)?.remove();
}