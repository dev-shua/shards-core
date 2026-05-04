import { MODULE_ID } from "@utils/constants";
import { registerSocketHandler } from "@core/socket";
import log from "@utils/logger";
import { closeWindow, openWindow } from "@core/windows/WindowManager";

export type RollAdvantage = "normal" | "advantage" | "disadvantage";
export type RollTarget = "all" | string[];

export type SkillChoice = {
  skill: string; // "nat", "sur", etc.
  label: string; // "Nature", "Survie"
  dcModifier?: number; // modificateur au DC (ex: +2 pour Survie)
};

export type DiceRequestConfig = {
  requestId?: string;
  targets: RollTarget;
  label: string;
  flavor?: string;
  whisper?: boolean;
  formula?: string;
  bonus?: number;
  advantage?: RollAdvantage;
  skillChoices?: SkillChoice[];
  onResult?: (userId: string, total: number, dcModifier?: number, diceResult?: number) => void;
  onAllResults?: (results: Record<string, number>) => void;
  onTimeout?: (pendingUserIds: string[]) => void;
  timeout?: number;
  gmConfig?: {
    show: boolean;
    title?: string;
    allowBonus?: boolean;
    allowAdvantage?: boolean;
  };
};

type PendingRequest = {
  config: DiceRequestConfig;
  pending: Set<string>;
  results: Record<string, number>;
  timeoutHandle?: number;
};

const pendingRequests = new Map<string, PendingRequest>();

// Stocke les requestIds actifs dans un setting world pour survivre au F5
const ACTIVE_REQUESTS_KEY = "activeRollRequests";

async function saveActiveRequestId(requestId: string): Promise<void> {
  try {
    const current: string[] = (game as any).settings.get(MODULE_ID, ACTIVE_REQUESTS_KEY) ?? [];
    if (!current.includes(requestId)) {
      await (game as any).settings.set(MODULE_ID, ACTIVE_REQUESTS_KEY, [...current, requestId]);
    }
  } catch {}
}

async function removeActiveRequestId(requestId: string): Promise<void> {
  try {
    const current: string[] = (game as any).settings.get(MODULE_ID, ACTIVE_REQUESTS_KEY) ?? [];
    await (game as any).settings.set(
      MODULE_ID,
      ACTIVE_REQUESTS_KEY,
      current.filter((id) => id !== requestId),
    );
  } catch {}
}

function isRequestActive(requestId: string): boolean {
  try {
    const active: string[] = (game as any).settings.get(MODULE_ID, ACTIVE_REQUESTS_KEY) ?? [];
    return active.includes(requestId);
  } catch {
    return false;
  }
}

export function registerDiceRequestSettings(): void {
  (game as any).settings.register(MODULE_ID, ACTIVE_REQUESTS_KEY, {
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });
}

export function registerDiceRequestSocket(): void {
  registerSocketHandler((payload: unknown) => {
    const p = payload as any;
    if (p.type === "diceRequest:show") handleShowRequest(p);
    if (p.type === "diceRequest:result") handleResult(p);
  });
}

async function handleShowRequest(payload: {
  requestId: string;
  label: string;
  flavor?: string;
  whisper: boolean;
  formula: string;
  bonus: number;
  advantage: RollAdvantage;
  targetUserId: string;
  skillChoices?: SkillChoice[];
}): Promise<void> {
  if (payload.targetUserId !== (game as any).user?.id) return;

  const advantageText =
    payload.advantage === "advantage"
      ? ` <em>(${game.i18n.localize("SC.DiceRequest.Advantage")})</em>`
      : payload.advantage === "disadvantage"
        ? ` <em>(${game.i18n.localize("SC.DiceRequest.Disadvantage")})</em>`
        : "";

  let buttonsHtml: string;

  if (payload.skillChoices?.length) {
    // Boutons par compétence
    buttonsHtml = `
      <div class="sc-skill-choices">
        ${payload.skillChoices
          .map(
            (sc) => `
          <button type="button" class="sc-dice-skill-btn"
            data-request-id="${payload.requestId}"
            data-skill="${sc.skill}"
            data-dc-modifier="${sc.dcModifier ?? 0}"
            data-advantage="${payload.advantage}"
          >
            <i class="fa-solid fa-dice-d20"></i>
            ${sc.label}${sc.dcModifier ? ` <span style="opacity:0.6;font-size:0.85em;">(DC ${sc.dcModifier > 0 ? "+" : ""}${sc.dcModifier})</span>` : ""}
          </button>
        `,
          )
          .join("")}
      </div>
    `;
  } else {
    const bonusText = payload.bonus !== 0 ? `${payload.bonus > 0 ? "+" : ""}${payload.bonus}` : "";
    buttonsHtml = `
      <button type="button" class="sc-dice-roll-btn"
        data-request-id="${payload.requestId}"
        data-formula="${payload.formula}"
        data-bonus="${payload.bonus}"
        data-advantage="${payload.advantage}"
      >
        <i class="fa-solid fa-dice-d20"></i>
        ${game.i18n.localize("SC.DiceRequest.Roll")}${bonusText ? ` (${bonusText})` : ""}
      </button>
    `;
  }

  const content = `
    <div class="sc-dice-request">
      <p><strong>${payload.label}</strong>${advantageText}</p>
      ${payload.flavor ? `<p style="opacity:0.7;font-size:0.88em;">${payload.flavor}</p>` : ""}
      ${buttonsHtml}
    </div>
  `;

  await (ChatMessage as any).create({
    content,
    whisper: payload.whisper ? [(game as any).user?.id] : [],
    speaker: (ChatMessage as any).getSpeaker({ user: (game as any).user }),
  });
}

function handleResult(payload: {
  requestId: string;
  userId: string;
  total: number;
  dcModifier?: number;
  diceResult?: number;
}): void {
  if (!(game as any).user?.isGM) return;

  const req = pendingRequests.get(payload.requestId);
  if (!req) return;

  req.results[payload.userId] = payload.total;
  req.pending.delete(payload.userId);
  req.config.onResult?.(payload.userId, payload.total, payload.dcModifier, payload.diceResult);

  if (req.pending.size === 0) {
    if (req.timeoutHandle) window.clearTimeout(req.timeoutHandle);
    req.config.onAllResults?.(req.results);
    pendingRequests.delete(payload.requestId);
    void removeActiveRequestId(payload.requestId);
  }
}

export function initDiceRequestChatListener(): void {
  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    // Bouton générique 1d20
    const genericBtn = target.closest<HTMLElement>(".sc-dice-roll-btn");
    if (genericBtn) {
      const requestId = genericBtn.dataset.requestId!;

      // Vérifie que la request est encore active
      if (!isRequestActive(requestId)) {
        genericBtn.setAttribute("disabled", "true");
        genericBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> ${game.i18n.localize("SC.DiceRequest.Expired")}`;
        return;
      }

      genericBtn.setAttribute("disabled", "true");
      genericBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${game.i18n.localize("SC.DiceRequest.Rolling")}`;

      const formula = genericBtn.dataset.formula ?? "1d20";
      const bonus = parseInt(genericBtn.dataset.bonus ?? "0");
      const advantage = (genericBtn.dataset.advantage ?? "normal") as RollAdvantage;

      let rollFormula = formula;
      if (advantage === "advantage") rollFormula = `2${formula.replace("1", "")}kh`;
      else if (advantage === "disadvantage") rollFormula = `2${formula.replace("1", "")}kl`;
      if (bonus !== 0) rollFormula += bonus > 0 ? `+${bonus}` : `${bonus}`;

      const roll = new (Roll as any)(rollFormula);
      await roll.evaluate();
      await roll.toMessage({ rollMode: "roll" });

      game.socket?.emit(`module.${MODULE_ID}`, {
        type: "diceRequest:result",
        requestId,
        userId: (game as any).user?.id,
        total: roll.total,
      });

      genericBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${game.i18n.localize("SC.DiceRequest.Done")} (${roll.total})`;
      return;
    }

    // Bouton compétence (rollSkill)
    const skillBtn = target.closest<HTMLElement>(".sc-dice-skill-btn");
    if (skillBtn) {
      const requestId = skillBtn.dataset.requestId!;

      // Vérifie que la request est encore active
      if (!isRequestActive(requestId)) {
        skillBtn.setAttribute("disabled", "true");
        skillBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> ${game.i18n.localize("SC.DiceRequest.Expired")}`;
        return;
      }

      const skill = skillBtn.dataset.skill!;
      const dcModifier = parseInt(skillBtn.dataset.dcModifier ?? "0");
      const advantage = (skillBtn.dataset.advantage ?? "normal") as RollAdvantage;

      // Désactive tous les boutons du groupe
      const container = skillBtn.closest(".sc-skill-choices");
      container?.querySelectorAll<HTMLButtonElement>(".sc-dice-skill-btn").forEach((b) => {
        b.setAttribute("disabled", "true");
      });
      skillBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${game.i18n.localize("SC.DiceRequest.Rolling")}`;

      // Utilise le système de roll de D&D5e pour inclure les bonus du perso
      const actor = (game as any).user?.character;
      if (!actor) {
        log.warn("No character found for skill roll");
        return;
      }

      const advantageMode = advantage === "advantage" ? 1 : advantage === "disadvantage" ? -1 : 0;

      // rollSkill retourne une Promise<Roll>
      const roll = await actor.rollSkill(skill, {
        advantage: advantageMode === 1,
        disadvantage: advantageMode === -1,
        chatMessage: true,
      });

      if (!roll) return;
      const diceResult = roll.dice[0]?.results[0]?.result ?? roll.total;

      game.socket?.emit(`module.${MODULE_ID}`, {
        type: "diceRequest:result",
        requestId,
        userId: (game as any).user?.id,
        total: roll.total,
        dcModifier,
        diceResult,
      });

      skillBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${game.i18n.localize("SC.DiceRequest.Done")} (${roll.total})`;
    }
  });
}

export async function requestRoll(config: DiceRequestConfig): Promise<void> {
  if (!(game as any).user?.isGM) return;

  if (config.gmConfig?.show) {
    await openGmConfigPopup(config);
    return;
  }

  await sendRequest(config);
}

async function openGmConfigPopup(config: DiceRequestConfig): Promise<void> {
  const windowId = `sc-dice-config-${Date.now()}`;

  openWindow({
    id: windowId,
    title: config.gmConfig?.title ?? game.i18n.localize("SC.DiceRequest.ConfigTitle"),
    icon: "fa-solid fa-dice-d20",
    initialW: 300,
    initialH: 220,
    render: (container: HTMLElement) => {
      container.innerHTML = `
        <div style="padding:14px;display:flex;flex-direction:column;gap:12px;">
          <p style="font-size:0.88em;opacity:0.7;margin:0;">${config.label}</p>

          ${
            config.gmConfig?.allowBonus !== false
              ? `
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:0.78em;opacity:0.55;">${game.i18n.localize("SC.DiceRequest.Bonus")}</label>
              <input type="number" class="sc-dc-bonus" value="0"
                style="padding:5px 8px;border-radius:7px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.2);color:inherit;font-size:0.85em;width:100%;box-sizing:border-box;"
              />
            </div>
          `
              : ""
          }

          ${
            config.gmConfig?.allowAdvantage !== false
              ? `
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:0.78em;opacity:0.55;">${game.i18n.localize("SC.DiceRequest.AdvantageLabel")}</label>
              <div style="display:flex;gap:4px;">
                ${(["normal", "advantage", "disadvantage"] as RollAdvantage[])
                  .map(
                    (a) => `
                  <button type="button" class="sc-dc-adv-btn" data-value="${a}"
                    style="flex:1;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:${a === "normal" ? "rgba(255,255,255,0.1)" : "transparent"};color:inherit;cursor:pointer;font-size:0.75em;transition:all 120ms;"
                  >
                    ${game.i18n.localize(`SC.DiceRequest.${a.charAt(0).toUpperCase() + a.slice(1)}`)}
                  </button>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button type="button" class="sc-dc-cancel"
              style="padding:0 12px;height:30px;border-radius:7px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:inherit;cursor:pointer;font-size:0.82em;">
              ${game.i18n.localize("SC.Form.Cancel")}
            </button>
            <button type="button" class="sc-dc-send"
              style="padding:0 14px;height:30px;border-radius:7px;border:1px solid color-mix(in srgb,var(--sc-primary) 40%,transparent);background:color-mix(in srgb,var(--sc-primary) 15%,transparent);color:inherit;cursor:pointer;font-weight:600;font-size:0.82em;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-paper-plane"></i>
              ${game.i18n.localize("SC.DiceRequest.Send")}
            </button>
          </div>
        </div>
      `;

      let selectedAdvantage: RollAdvantage = "normal";

      container.querySelectorAll<HTMLButtonElement>(".sc-dc-adv-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedAdvantage = btn.dataset.value as RollAdvantage;
          container.querySelectorAll<HTMLButtonElement>(".sc-dc-adv-btn").forEach((b) => {
            b.style.background =
              b.dataset.value === selectedAdvantage ? "rgba(255,255,255,0.1)" : "transparent";
          });
        });
      });

      container
        .querySelector(".sc-dc-cancel")
        ?.addEventListener("click", () => closeWindow(windowId));

      container.querySelector(".sc-dc-send")?.addEventListener("click", async () => {
        const bonus =
          parseInt(container.querySelector<HTMLInputElement>(".sc-dc-bonus")?.value ?? "0") || 0;
        closeWindow(windowId);
        await sendRequest({ ...config, bonus, advantage: selectedAdvantage });
      });

      return () => {};
    },
  });
}

async function sendRequest(config: DiceRequestConfig): Promise<void> {
  const requestId =
    config.requestId ?? `sc-roll-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const formula = config.formula ?? "1d20";
  const bonus = config.bonus ?? 0;
  const advantage = config.advantage ?? "normal";
  const whisper = config.whisper ?? true;

  const users = (game as any).users?.contents ?? [];
  const targetUserIds: string[] =
    config.targets === "all"
      ? users.filter((u: any) => !u.isGM && u.active).map((u: any) => u.id)
      : config.targets;

  if (!targetUserIds.length) {
    log.warn("requestRoll: no targets found");
    return;
  }

  const req: PendingRequest = {
    config,
    pending: new Set(targetUserIds),
    results: {},
  };

  if (config.timeout && config.timeout > 0) {
    req.timeoutHandle = window.setTimeout(() => {
      const pending = [...req.pending];
      config.onTimeout?.(pending);
      pendingRequests.delete(requestId);
      void removeActiveRequestId(requestId);
    }, config.timeout);
  }

  pendingRequests.set(requestId, req);
  await saveActiveRequestId(requestId);

  for (const userId of targetUserIds) {
    game.socket?.emit(`module.${MODULE_ID}`, {
      type: "diceRequest:show",
      requestId,
      label: config.label,
      flavor: config.flavor,
      whisper,
      formula,
      bonus,
      advantage,
      targetUserId: userId,
      skillChoices: config.skillChoices,
    });

    if (userId === (game as any).user?.id) {
      await handleShowRequest({
        requestId,
        label: config.label,
        flavor: config.flavor,
        whisper,
        formula,
        bonus,
        advantage,
        targetUserId: userId,
        skillChoices: config.skillChoices,
      });
    }
  }
}

export function cancelRollRequest(requestId: string): void {
  const req = pendingRequests.get(requestId);
  if (!req) return;
  if (req.timeoutHandle) window.clearTimeout(req.timeoutHandle);
  pendingRequests.delete(requestId);
  void removeActiveRequestId(requestId);
}
