// Types Foundry manquants / overrides
declare global {
  const Hooks: {
    once(event: string, fn: (...args: unknown[]) => void): void;
    on(event: string, fn: (...args: unknown[]) => void): void;
    callAll(event: string, ...args: unknown[]): void;
    off(event: string, fn: (...args: unknown[]) => void): void;
  };

  const game: {
    modules: Map<string, { active: boolean }>;
    user?: { id: string; isGM: boolean };
    users?: {
      contents: Array<{
        isGM: boolean;
        active: boolean;
        character?: {
          id: string;
          name: string;
          img: string;
        };
      }>;
    };
    i18n: { localize: (key: string) => string };
    actors?: {
      get(id: string): unknown;
    };
    settings: {
      register(module: string, key: string, data: Record<string, unknown>): void;
      get(module: string, key: string): unknown;
      set(module: string, key: string, value: unknown): Promise<unknown>;
    };
    socket?: {
      on(event: string, fn: (payload: unknown) => void): void;
      emit(event: string, payload: unknown): void;
      off(event: string, fn: (payload: unknown) => void): void;
    };
    scenes?: {
      contents: Array<{
        id: string;
        name: string;
        thumb: string | null;
        active: boolean;
        preload(): Promise<void>;
        activate(): Promise<void>;
      }>;
      get(id: string):
        | {
            name: string;
            thumb: string | null;
            active: boolean;
            preload(): Promise<void>;
            activate(): Promise<void>;
          }
        | undefined;
    };
    folders?: {
      contents: Array<{
        id: string;
        name: string;
        type: string;
        folder: { id: string } | null; // dossier parent
      }>;
    };
  };
}

declare const _maxZ: number;
declare const ui: {
  activeWindow: { bringToTop: () => void } | null;
  [key: string]: unknown;
};

const foundry: {
  audio: {
    AudioHelper: {
      play(
        options: {
          src: string;
          volume?: number;
          autoplay?: boolean;
          loop?: boolean;
        },
        push?: boolean,
      ): void;
    };
  };
};

export {};
