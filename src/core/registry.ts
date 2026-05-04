export type DockTool = {
  id: string;
  icon: string;
  title: string;
  order?: number;
  render: (container: HTMLElement) => unknown;
  destroy?: () => void;
};

let _dockReady = false;
const _registry = new Map<string, DockTool>();

export function registerTool(tool: DockTool): void {
  _registry.set(tool.id, tool);
  if (_dockReady) {
    Hooks.callAll("shards-core:toolRegistered", tool);
  }
}

export function setDockReady(): void {
  _dockReady = true;
}

export function isDockReady(): boolean {
  return _dockReady;
}

export function getTools(): DockTool[] {
  return Array.from(_registry.values())
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getTool(id: string): DockTool | undefined {
  return _registry.get(id);
}

export function unregisterTool(id: string): void {
  const tool = _registry.get(id);
  tool?.destroy?.();
  _registry.delete(id);
}