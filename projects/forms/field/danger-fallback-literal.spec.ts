import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Every danger colour a forms stylesheet paints without a theme resolves to
// the registered system danger default: the `var(--cngx-color-danger, ...)`
// fallbacks and the registered initial-value of every token that delegates
// to `--cngx-color-danger`. Two literals would paint two reds whenever the
// system token is missing, and siblings (label marker, required marker,
// form-error summary, char-count) would drift apart. Scoped to the field
// family; the filter-builder organism carries its own palette.

const ROOTS = ['field', 'input', 'theming', 'select'].map((dir) =>
  resolve(process.cwd(), 'projects/forms', dir),
);

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return cssFiles(path);
    }
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

const SYSTEM = readFileSync(
  resolve(process.cwd(), 'projects/core/theming/system-tokens.css'),
  'utf8',
);
const DANGER_DEFAULT = /@property --cngx-color-danger \{[^}]*initial-value: ([^;]+);/.exec(
  SYSTEM,
)?.[1];

describe('field family danger fallback literal', () => {
  it('reads the registered system danger default', () => {
    expect(DANGER_DEFAULT).toBe('oklch(0.6 0.18 25)');
  });

  it('uses the system danger default for every fallback and delegating initial-value', () => {
    const found = new Map<string, string>();
    for (const file of ROOTS.flatMap(cssFiles)) {
      const source = readFileSync(file, 'utf8');
      for (const m of source.matchAll(/--cngx-color-danger, (oklch\([^)]*\))/g)) {
        found.set(`${file} fallback ${m.index}`, m[1]);
      }
      for (const m of source.matchAll(/(--cngx-[\w-]+): var\(--cngx-color-danger\);/g)) {
        const initial = new RegExp(`@property ${m[1]} \\{[^}]*initial-value: ([^;]+);`).exec(
          source,
        )?.[1];
        if (initial) {
          found.set(`${file} ${m[1]}`, initial);
        }
      }
    }
    const offenders = [...found].filter(([, literal]) => literal !== DANGER_DEFAULT);
    expect(found.size).toBeGreaterThan(8);
    expect(offenders).toEqual([]);
  });
});
