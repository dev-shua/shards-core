<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export const id: string = "";
  export let title: string;
  export let icon: string = "";
  export let resizable: boolean = false;
  export let initialX: number = Math.round(window.innerWidth / 2 - 300);
  export let initialY: number = Math.round(window.innerHeight / 2 - 200);
  export let onRender: (container: HTMLElement) => (() => void) | void = () => {};
  export let onFocus: () => void = () => {};
  export let onClose: () => void = () => {};
  export let initialZ: number = 100;

  let windowEl: HTMLElement;
  let contentEl: HTMLElement;
  let minimized = false;
  let destroyInner: (() => void) | void;

  let x = initialX;
  let y = initialY;
  export let initialW: number = 600;
  export let initialH: number = 400;
  let w = initialW;
  let h = initialH;

  onMount(() => {
    windowEl.style.left = `${x}px`;
    windowEl.style.top = `${y}px`;
    windowEl.style.width = `${w}px`;
    windowEl.style.height = `${h}px`;
    windowEl.style.zIndex = String(initialZ);
    destroyInner = onRender(contentEl);
  });

  onDestroy(() => {
    destroyInner?.();
  });

  function applyGeometry() {
    if (!windowEl || minimized) return;
    windowEl.style.width = `${w}px`;
    windowEl.style.height = `${h}px`;
  }

  function onDragStart(ev: PointerEvent) {
    if ((ev.target as HTMLElement).closest("button")) return;
    onFocus();
    const startX = ev.clientX - x;
    const startY = ev.clientY - y;
    function onMove(e: PointerEvent) {
      x = e.clientX - startX;
      y = Math.max(0, e.clientY - startY);
      windowEl.style.left = `${x}px`;
      windowEl.style.top = `${y}px`;
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function toggleMinimize() {
    minimized = !minimized;
    if (!windowEl) return;

    if (minimized) {
      const titleText = windowEl.querySelector(".sc-window-title") as HTMLElement;
      const titleControls = windowEl.querySelector(".sc-window-controls") as HTMLElement;
      const targetW =
        (titleText?.scrollWidth ?? 120) + (titleControls?.offsetWidth ?? 60) + 28 + 16;

      windowEl.style.transition = "none";
      windowEl.getBoundingClientRect();
      windowEl.style.transition = "width 200ms ease, height 200ms ease";
      windowEl.style.width = `${targetW}px`;
      windowEl.style.height = "40px";
    } else {
      windowEl.style.transition = "none";
      windowEl.getBoundingClientRect();
      windowEl.style.transition = "width 200ms ease, height 200ms ease";
      windowEl.style.width = `${w}px`;
      windowEl.style.height = `${h}px`;
    }

    windowEl.addEventListener(
      "transitionend",
      () => {
        windowEl.style.transition = "";
      },
      { once: true },
    );
  }

  function onTitlebarDblClick() {
    toggleMinimize();
  }

  function onResizeStart(ev: PointerEvent) {
    ev.stopPropagation();
    const startX = ev.clientX;
    const startY = ev.clientY;
    const startW = w;
    const startH = h;
    function onMove(e: PointerEvent) {
      w = Math.max(200, startW + (e.clientX - startX));
      h = Math.max(100, startH + (e.clientY - startY));
      applyGeometry();
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function handleClose() {
    await onClose();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="sc-window" class:is-minimized={minimized} bind:this={windowEl} on:pointerdown={onFocus}>
  <header class="sc-window-titlebar" on:pointerdown={onDragStart} on:dblclick={onTitlebarDblClick}>
    <div class="sc-window-title">
      {#if icon}<i class={icon}></i>{/if}
      <span>{title}</span>
    </div>
    <div class="sc-window-controls">
      <button
        class="sc-window-btn"
        title={game.i18n.localize("SC.Window.Minimize")}
        on:click|stopPropagation={toggleMinimize}
      >
        <i class="fa-solid fa-chevron-{minimized ? 'down' : 'up'}"></i>
      </button>
      <button
        class="sc-window-btn sc-window-btn--close"
        title={game.i18n.localize("SC.Window.Close")}
        on:click|stopPropagation={handleClose}
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </header>

  <!-- Toujours dans le DOM, juste caché -->
  <div class="sc-window-content" bind:this={contentEl}></div>

  {#if resizable}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="sc-window-resize" on:pointerdown={onResizeStart}></div>
  {/if}
</div>

<style>
  .sc-window {
    position: fixed;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  }

  .sc-window::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: color-mix(in srgb, var(--sc-bg) 96%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    z-index: -1;
  }

  .sc-window-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px 0 14px;
    height: 40px;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
  }

  .sc-window-titlebar:active {
    cursor: grabbing;
  }

  .sc-window.is-minimized .sc-window-titlebar {
    border-bottom: none;
  }

  .sc-window-title {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 0.85em;
    font-weight: 600;
    color: var(--sc-text);
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .sc-window-title i {
    color: var(--sc-text-muted);
    font-size: 12px;
  }

  .sc-window-controls {
    display: flex;
    gap: 4px;
  }

  .sc-window-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.08);
    color: var(--sc-text-muted);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 10px;
    transition:
      background 120ms,
      color 120ms;
  }

  .sc-window-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--sc-text);
  }

  .sc-window-btn--close:hover {
    background: color-mix(in srgb, var(--sc-danger) 50%, transparent);
    color: var(--sc-text);
  }

  .sc-window-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    color: var(--sc-text);
    border-radius: 0 0 10px 10px;
  }

  .sc-window.is-minimized .sc-window-content {
    display: none;
  }

  .sc-window-resize {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    cursor: se-resize;
    opacity: 0.15;
    background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.5) 50%);
    border-radius: 0 0 10px 0;
  }
</style>
