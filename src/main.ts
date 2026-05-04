import { registerSettings } from "@core/settings";
import { initDock } from "@core/app";
import { dockController } from "@core/controller";
import { registerTool, setDockReady } from "@core/registry";
import log from "@utils/logger";
import ToolButton from "@ui/ToolButton.svelte";
import { closeWindow, openWindow, updateWindow } from "@core/windows/WindowManager";
import { initTheme, registerTheme, setActiveTheme, getThemes } from "@theming/ThemeRegistry";
import { mountToolItem } from "@ui/mountToolItem";
import { applyFade, isFadeActive, toggleFade, fadeToBlack, fadeFromBlack } from "@features/fade";
import { emitFade, registerSocket } from "@core/socket";
import { mount } from "svelte";
import ToolsPanel from "@ui/ToolsPanel.svelte";
import { Z_LEVELS } from "@utils/constants";
import { registerLootNotifications } from "@features/lootNotification";
import {
  cancelRollRequest,
  initDiceRequestChatListener,
  registerDiceRequestSettings,
  registerDiceRequestSocket,
  requestRoll,
} from "@features/diceRequest";

export type { WindowConfig } from "@core/windows/WindowManager";
export { registerTool, ToolButton };

Hooks.once("init", () => {
  log.i`init`;
  registerSettings();
  registerDiceRequestSettings();

  initTheme();

  (game as any).shardsCore = {
    registerTool,
    openWindow,
    closeWindow,
    updateWindow,
    registerTheme,
    setActiveTheme,
    getThemes,
    mountToolItem,
    fadeToBlack,
    fadeFromBlack,
    Z_LEVELS,
    emitFade,
    requestRoll,
    cancelRollRequest,
  };
});

Hooks.once("ready", async () => {
  log.i`ready`;

  registerSocket();
  registerDiceRequestSocket();
  initDiceRequestChatListener();
  applyFade(isFadeActive());
  registerLootNotifications();
  if (!game.user?.isGM) return;

  registerTool({
    id: "tools",
    icon: "fa-solid fa-screwdriver-wrench",
    title: game.i18n.localize("SC.Tool.Tools.Title"),
    order: 99,
    render: (container: HTMLElement) => {
      const instance = mount(ToolsPanel, { target: container });
      // Les modules s'enregistrent dans #sc-tools-modules-list
      requestAnimationFrame(() => {
        const modulesList = document.getElementById("sc-tools-modules-list");
        if (modulesList) Hooks.callAll("shards-core:tools:mount", modulesList);
      });
      return instance;
    },
  });

  setDockReady();
  Hooks.callAll("shards-core:ready");
  initDock();
  await dockController.init();
});
