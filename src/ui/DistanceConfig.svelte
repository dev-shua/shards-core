<script lang="ts">
  import { getSetting, setSetting, SETTINGS_KEYS } from "@core/settings";

  let unit = getSetting<string>(SETTINGS_KEYS.DISTANCE_MESURER_UNIT);

  async function handleUnitChange(value: string) {
    unit = value;
    await setSetting(SETTINGS_KEYS.DISTANCE_MESURER_UNIT, value);
  }
</script>

<div class="sc-distance-config">
  <div class="sc-config-section">
    <div class="sc-config-label">{game.i18n.localize("SC.Settings.DistanceMeasurerUnit.Name")}</div>
    <div class="sc-config-hint">{game.i18n.localize("SC.Settings.DistanceMeasurerUnit.Hint")}</div>
    <div class="sc-radio-group">
      <button
        type="button"
        class="sc-radio-btn"
        class:is-active={unit === "units"}
        on:click={() => handleUnitChange("units")}
      >
        <i class="fa-solid fa-ruler"></i>
        {game.i18n.localize("SC.DistanceMeasurer.Unit.Units")}
      </button>
      <button
        type="button"
        class="sc-radio-btn"
        class:is-active={unit === "cells"}
        on:click={() => handleUnitChange("cells")}
      >
        <i class="fa-solid fa-grid"></i>
        {game.i18n.localize("SC.DistanceMeasurer.Unit.Cells")}
      </button>
    </div>
  </div>
</div>

<style>
  .sc-distance-config {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sc-config-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sc-config-label {
    font-size: 0.88em;
    font-weight: 700;
    color: var(--sc-text);
  }

  .sc-config-hint {
    font-size: 0.78em;
    color: var(--sc-text-muted);
    line-height: 1.4;
  }

  .sc-radio-group {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }

  .sc-radio-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: var(--sc-text-muted);
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 600;
    transition: all 120ms;
    height: auto !important;
    min-height: 0 !important;
  }

  .sc-radio-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--sc-text);
  }

  .sc-radio-btn.is-active {
    border-color: var(--sc-primary);
    background: color-mix(in srgb, var(--sc-primary) 15%, transparent);
    color: var(--sc-text);
  }
</style>
