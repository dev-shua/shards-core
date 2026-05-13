import { MODULE_ID } from "@utils/constants";

export const SETTINGS_KEYS = {
  ENABLED: "dock.enabled",
  OPEN: "dock.open",
  POSITION_Y: "dock.positionY",
  ACTIVE_TOOL: "dock.tool",
  THEME: "theme.active",
  FADE_ACTIVE: "fade.active",
  FADE_DURATION: "fade.duration",
  LOOT_NOTIFICATIONS: "lootNotifications",
  ACTIVE_ROLL_REQUESTS: "activeRollRequests",
  DISTANCE_MESURER_ENABLED: "distanceMeasurerEnabled",
  DISTANCE_MESURER_UNIT: "distanceMeasurerUnit",
  DISTANCE_MESURER_ENABLED_CLIENT: "distanceMeasurerEnabledClient",
  DISTANCE_MESURER_LINE: "distanceMeasurerLine",
} as const;

type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

export function registerSettings(): void {
  game.settings.register(MODULE_ID, SETTINGS_KEYS.ENABLED, {
    name: "SC.Settings.Enabled.Name",
    hint: "SC.Settings.Enabled.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.OPEN, {
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.POSITION_Y, {
    scope: "client",
    config: false,
    type: Number,
    default: 104,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.ACTIVE_TOOL, {
    scope: "client",
    config: false,
    type: String,
    default: "",
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.THEME, {
    name: "SC.Settings.Theme.Name",
    hint: "SC.Settings.Theme.Hint",
    scope: "client",
    config: false,
    type: String,
    default: "shards-default",
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.FADE_ACTIVE, {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.FADE_DURATION, {
    scope: "world",
    config: false,
    type: Number,
    default: 1,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.LOOT_NOTIFICATIONS, {
    name: game.i18n.localize("SC.Settings.LootNotifications.Name"),
    hint: game.i18n.localize("SC.Settings.LootNotifications.Hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.ACTIVE_ROLL_REQUESTS, {
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  game.settings.register(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_ENABLED, {
    name: game.i18n.localize("SC.Settings.DistanceMeasurer.Name"),
    hint: game.i18n.localize("SC.Settings.DistanceMeasurer.Hint"),
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_UNIT, {
    name: game.i18n.localize("SC.Settings.DistanceMeasurerUnit.Name"),
    hint: game.i18n.localize("SC.Settings.DistanceMeasurerUnit.Hint"),
    scope: "world",
    config: false,
    type: String,
    default: "units",
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_ENABLED_CLIENT, {
    name: game.i18n.localize("SC.Settings.DistanceMeasurerClient.Name"),
    hint: game.i18n.localize("SC.Settings.DistanceMeasurerClient.Hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.DISTANCE_MESURER_LINE, {
    name: game.i18n.localize("SC.Settings.DistanceMeasurerLine.Name"),
    hint: game.i18n.localize("SC.Settings.DistanceMeasurerLine.Hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
}

export function getSetting<T>(key: SettingsKey): T {
  return game.settings.get(MODULE_ID, key) as T;
}

export async function setSetting<T>(key: SettingsKey, value: T): Promise<void> {
  await game.settings.set(MODULE_ID, key, value);
}
