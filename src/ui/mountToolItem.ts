export function mountToolItem(
  root: HTMLElement,
  item: { icon: string; label: string; subtitle?: string; onClick: () => void },
): void {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sc-module-item";
  btn.innerHTML = `
    <div class="sc-module-item-left">
      <i class="${item.icon}"></i>
      <div class="sc-module-item-text">
        <span class="sc-module-item-label">${item.label}</span>
        ${item.subtitle ? `<span class="sc-module-item-subtitle">${item.subtitle}</span>` : ""}
      </div>
    </div>
    <i class="fa-solid fa-chevron-right sc-module-item-chevron"></i>
  `;
  btn.addEventListener("click", item.onClick);
  root.appendChild(btn);
}
