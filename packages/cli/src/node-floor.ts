// The Node version floor, checked before anything else loads. This module
// imports nothing, so an older Node evaluates only this literal and the check;
// the adapter, zod and the core load after it passes. Keep `engines.node` in
// package.json equal to `>=` plus this number (node-floor.spec.ts pins it).

export const NODE_FLOOR_MAJOR = 20;

/** The stderr line for a Node below the floor, or `null` when `version` (e.g. `18.19.0` or `v22.1.0`) is supported. */
export function checkNodeFloor(version: string): string | null {
  const major = Number.parseInt(version.replace(/^v/, ''), 10);
  if (Number.isFinite(major) && major >= NODE_FLOOR_MAJOR) {
    return null;
  }
  return `cngx: Node ${NODE_FLOOR_MAJOR} or newer is required (running ${version}).`;
}
