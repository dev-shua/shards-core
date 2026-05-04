<script lang="ts">
  import { isFadeActive, toggleFade } from "@features/fade";
  import { getSetting, setSetting, SETTINGS_KEYS } from "@core/settings";
  import { onMount } from "svelte";

  let fadeActive = isFadeActive();
  let fadeDuration = getSetting<number>(SETTINGS_KEYS.FADE_DURATION);

  async function handleFadeToggle() {
    await toggleFade();
    fadeActive = isFadeActive();
  }

  async function handleDurationChange(e: Event) {
    fadeDuration = Number((e.target as HTMLInputElement).value);
    await setSetting(SETTINGS_KEYS.FADE_DURATION, fadeDuration);
  }
</script>

<div class="sc-tools-panel">
  <div class="sc-header">
    <span class="sc-title">
      {game.i18n.localize("SC.Tool.Tools.Title") ?? "Tools"}
    </span>
  </div>

  <div class="sc-tools-section-title">{game.i18n.localize("SC.Tools.Section.Actions")}</div>

  <div class="sc-tools-section">
    <div class="sc-action-row">
      <div class="sc-action-left">
        <i class="fa-solid fa-circle-half-stroke"></i>
        <span class="sc-action-label">{game.i18n.localize("SC.Tools.Fade.Label")}</span>
      </div>
      <div class="sc-action-right">
        <input
          type="range"
          min="0.2"
          max="15"
          step="0.1"
          value={fadeDuration}
          on:input={handleDurationChange}
          class="sc-slider"
        />
        <input
          type="number"
          min="0.2"
          max="15"
          step="0.1"
          value={fadeDuration}
          on:change={handleDurationChange}
          class="sc-duration-input"
        />
        <span class="sc-duration-unit">s</span>
        <button
          type="button"
          class="sc-toggle"
          class:is-active={fadeActive}
          on:click={handleFadeToggle}
          aria-pressed={fadeActive}
          aria-label={"activate fading"}
        >
          <span class="sc-toggle-thumb"></span>
        </button>
      </div>
    </div>
  </div>

  <div class="sc-tools-section-title sc-tools-section-title--modules">
    {game.i18n.localize("SC.Tools.Section.Modules")}
  </div>

  <div class="sc-tools-section sc-tools-modules" id="sc-tools-modules-list"></div>
</div>

<style>
  .sc-tools-panel {
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 4px;
  }

  .sc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sc-title {
    font-weight: 700;
    font-size: 0.95em;
  }

  .sc-tools-section-title {
    font-size: 0.72em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--sc-text-muted);
    padding: 6px 4px 4px;
  }

  .sc-tools-section-title--modules {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sc-tools-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sc-tools-modules {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sc-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    gap: 10px;
  }

  .sc-action-left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--sc-text-muted);
    font-size: 0.85em;
  }

  .sc-action-left i {
    font-size: 13px;
  }

  .sc-action-label {
    font-weight: 600;
    color: var(--sc-text);
  }

  .sc-action-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .sc-slider {
    width: 80px;
    accent-color: var(--sc-primary);
    cursor: pointer;
  }

  .sc-duration-input {
    width: 40px;
    padding: 2px 4px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.2);
    color: inherit;
    font-size: 0.78em;
    text-align: right;
  }

  .sc-duration-unit {
    font-size: 0.78em;
    color: var(--sc-text-muted);
  }

  .sc-toggle {
    width: 28px;
    height: 16px !important;
    min-height: 0 !important;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    padding: 0;
    position: relative;
    transition: all 150ms;
    flex-shrink: 0;
    overflow: hidden;
  }

  .sc-toggle.is-active {
    background: var(--sc-primary);
    border-color: var(--sc-primary);
  }

  .sc-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transition:
      transform 150ms,
      background 150ms;
  }

  .sc-toggle.is-active .sc-toggle-thumb {
    transform: translateX(12px);
    background: #fff;
  }
</style>
