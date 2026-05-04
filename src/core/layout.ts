const RAIL_ID   = "shards-core-rail";
const PANEL_ID  = "shards-core-panel";
const ROOT_ID   = "shards-core-root";

export { RAIL_ID, PANEL_ID, ROOT_ID };

export function setDockTop(topPx: number): void {
  const rail  = document.getElementById(RAIL_ID);
  const panel = document.getElementById(PANEL_ID);
  if (rail)  rail.style.top = `${topPx}px`;
  if (panel) {
    panel.style.top       = `${topPx}px`;
    panel.style.maxHeight = `${window.innerHeight - topPx - 16}px`;
  }
}