// Source: the plan's entry-ordering decision row: src/index.ts statically
// imports only ./node-floor.js, and loads the adapter with a dynamic import()
// after the floor check, so an older Node never evaluates the adapter.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** Defects in an entry module's load order; empty when correct. */
function checkEntryOrder(source: string): string[] {
  const statics = [...source.matchAll(/^\s*(?:import|export)\b(?!\s*\()[\s\S]*?['"]([^'"]+)['"]\s*;?/gm)].map((m) => m[1]);
  const errors: string[] = [];
  if (statics.length !== 1 || statics[0] !== './node-floor.js') {
    errors.push(`static imports must be exactly ./node-floor.js, found ${JSON.stringify(statics)}`);
  }
  const check = source.indexOf('checkNodeFloor(');
  const adapter = source.search(/\bimport\(\s*['"]\.\/cli-adapter\.js['"]\s*\)/);
  if (adapter === -1) {
    errors.push('the adapter is not loaded with a dynamic import()');
  }
  if (check === -1 || (adapter !== -1 && adapter < check)) {
    errors.push('the adapter import does not follow the floor check');
  }
  return errors;
}

const ENTRY = readFileSync(fileURLToPath(new URL('./index.ts', import.meta.url)), 'utf8');

describe('entry module order', () => {
  it('statically imports only the floor check and loads the adapter after it', () => {
    expect(checkEntryOrder(ENTRY)).toEqual([]);
  });

  it('mutation: a static adapter import fails', () => {
    const planted = ENTRY.replace(
      "import { checkNodeFloor } from './node-floor.js';",
      "import { checkNodeFloor } from './node-floor.js';\nimport { main } from './cli-adapter.js';",
    );

    expect(planted).not.toBe(ENTRY);
    expect(checkEntryOrder(planted)).not.toEqual([]);
  });

  it('mutation: a multi-line static zod import fails', () => {
    const planted = `import {\n  z,\n} from 'zod';\n${ENTRY}`;

    expect(checkEntryOrder(planted)).not.toEqual([]);
  });

  it('mutation: the adapter loaded before the floor check fails', () => {
    const planted = `const early = await import('./cli-adapter.js');\n${ENTRY}`;

    expect(checkEntryOrder(planted)).toContain('the adapter import does not follow the floor check');
  });
});
