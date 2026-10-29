// Source: the "Node below the engines floor" row of the plan's process matrix
// and packages/cli/package.json `engines.node`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NODE_FLOOR_MAJOR, checkNodeFloor } from './node-floor.js';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

describe('checkNodeFloor', () => {
  it.each(['18.19.0', 'v16.20.2', '19.9.0'])('rejects %s with a line naming the floor', (version) => {
    const message = checkNodeFloor(version);

    expect(message).toContain(`Node ${NODE_FLOOR_MAJOR} or newer`);
    expect(message).toContain(version);
  });

  it.each(['20.0.0', 'v22.11.0', '24.1.0'])('accepts %s', (version) => {
    expect(checkNodeFloor(version)).toBeNull();
  });

  it('rejects an unparseable version instead of passing it', () => {
    expect(checkNodeFloor('garbage')).not.toBeNull();
  });
});

describe('the floor literal', () => {
  it('equals the engines.node floor in package.json', () => {
    const pkg = JSON.parse(read('../package.json')) as { engines: { node: string } };

    expect(pkg.engines.node).toBe(`>=${NODE_FLOOR_MAJOR}`);
  });

  // The built module is what an old Node evaluates first, so its own text decides.
  it('lives in a built module that loads nothing', () => {
    expect(moduleLoads(read('../dist/node-floor.js'))).toEqual([]);
  });

  it.each([
    "import { x } from './x.js';",
    "import './x.js';",
    "export { x } from './x.js';",
    "export * from './x.js';",
    "const x = await import('./x.js');",
    "const x = require('./x.js');",
  ])('mutation: %s is a load', (statement) => {
    expect(moduleLoads(`export const a = 1;\n${statement}\n`)).not.toEqual([]);
  });
});

/** Every static import, re-export, dynamic import or require in a module's text. */
function moduleLoads(source: string): string[] {
  return source.match(/^\s*import\b.*$|\bexport\b[^;\n]*\bfrom\s*['"]|\bimport\s*\(|\brequire\s*\(/gm) ?? [];
}
