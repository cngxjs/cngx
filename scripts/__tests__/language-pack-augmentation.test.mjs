import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Go / no-go evidence for typing a language pack by module augmentation.
 *
 * Each lib entry adds its section with `declare module '@cngx/core/i18n'`.
 * That only works for consumers if the block survives ng-packagr's d.ts
 * bundling and merges into the core interface when resolved from `dist/`
 * through package `exports`, the way an installed app sees it. Every case
 * compiles a consumer file in its own program against a throwaway
 * `node_modules/@cngx` holding a copy of `dist/`, so one case's augmentation
 * cannot leak into another. A copy, not a symlink: TS resolves a symlinked
 * package from its real path, where `@cngx/core/i18n` is not resolvable, and
 * an unresolved augmentation in a `.d.ts` is dropped without a diagnostic.
 * Needs `npm run build:libs` first (CI restores `dist/` before `test:scripts`).
 *
 * Only a failing case discriminates: against the bare core interface every
 * object literal compiles, so "complete" and "not imported" pass even when the
 * augmentation is lost. The missing-key cases carry the proof.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];
const THIRD_PARTY = ['@angular', '@floating-ui', 'rxjs', 'tslib'];

const COMPILER_OPTIONS = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
};

let workDir;
let caseIndex = 0;

function compile(source, options = {}) {
  const file = join(workDir, `consumer-${caseIndex++}.ts`);
  writeFileSync(file, source);
  const program = ts.createProgram([file], { ...COMPILER_OPTIONS, ...options });
  return ts.getPreEmitDiagnostics(program).map((d) => ({
    code: d.code,
    file: d.file?.fileName,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  }));
}

const COMPLETE_CARD = `{ selected: 'Selected', deselected: 'Deselected', loading: 'Loading', timestamp: '{prefix} {date}' }`;

beforeAll(() => {
  const missing = ['core', 'common', 'ui'].filter(
    (lib) => !existsSync(join(DIST, lib, 'package.json')),
  );
  if (missing.length > 0) {
    throw new Error(`dist/ lacks ${missing.join(', ')} - run \`npm run build:libs\` first`);
  }
  workDir = mkdtempSync(join(tmpdir(), 'cngx-language-pack-'));
  const modules = join(workDir, 'node_modules');
  mkdirSync(join(modules, '@cngx'), { recursive: true });
  for (const lib of LIBS) {
    if (existsSync(join(DIST, lib, 'package.json'))) {
      cpSync(join(DIST, lib), join(modules, '@cngx', lib), { recursive: true });
    }
  }
  for (const pkg of THIRD_PARTY) {
    if (existsSync(join(ROOT, 'node_modules', pkg))) {
      symlinkSync(join(ROOT, 'node_modules', pkg), join(modules, pkg), 'dir');
    }
  }
});

afterAll(() => {
  if (workDir) {
    rmSync(workDir, { recursive: true, force: true });
  }
});

describe('language-pack augmentation against dist/', () => {
  it('rejects a pack that misses a card key', () => {
    const diagnostics = compile(`
      import type { CngxLanguagePack } from '@cngx/core/i18n';
      import type { CngxCardLanguageSection } from '@cngx/common/card';
      export type Section = CngxCardLanguageSection;
      export const pack: CngxLanguagePack = { card: { deselected: 'Deselected', loading: 'Loading', timestamp: '{prefix} {date}' } };
    `);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe(2741);
    expect(diagnostics[0].message).toContain(`'selected'`);
  });

  it('accepts a complete pack', () => {
    const diagnostics = compile(`
      import type { CngxLanguagePack } from '@cngx/core/i18n';
      import type { CngxCardLanguageSection } from '@cngx/common/card';
      export type Section = CngxCardLanguageSection;
      export const pack: CngxLanguagePack = { card: ${COMPLETE_CARD} };
    `);
    expect(diagnostics).toEqual([]);
  });

  it('does not ask for card when the consumer never imports @cngx/common/card', () => {
    const diagnostics = compile(`
      import type { CngxLanguagePack } from '@cngx/core/i18n';
      export const pack: CngxLanguagePack = {};
    `);
    expect(diagnostics).toEqual([]);
  });

  it('merges a second augmentation with card', () => {
    const augmentation = `
      import type { CngxLanguagePack } from '@cngx/core/i18n';
      import type { CngxCardLanguageSection } from '@cngx/common/card';
      export type Section = CngxCardLanguageSection;
      declare module '@cngx/core/i18n' {
        interface CngxLanguagePack {
          readonly app: { readonly title: string };
        }
      }
    `;

    const withoutApp = compile(`${augmentation}
      export const pack: CngxLanguagePack = { card: ${COMPLETE_CARD} };
    `);
    expect(withoutApp.map((d) => d.code)).toEqual([2741]);
    expect(withoutApp[0].message).toContain(`'app'`);

    const withoutCard = compile(`${augmentation}
      export const pack: CngxLanguagePack = { app: { title: 'Shop' } };
    `);
    expect(withoutCard.map((d) => d.code)).toEqual([2741]);
    expect(withoutCard[0].message).toContain(`'card'`);

    const complete = compile(`${augmentation}
      export const pack: CngxLanguagePack = { card: ${COMPLETE_CARD}, app: { title: 'Shop' } };
    `);
    expect(complete).toEqual([]);
  });

  it('requires card transitively once an imported entry loads @cngx/common/card types', () => {
    // @cngx/ui/timeline -> @cngx/common/timeline -> @cngx/common/card: a pack
    // needs the sections of every cngx entry in the consumer's type graph.
    // The graph also reaches other sections (TS2739 lists several missing
    // properties, TS2741 one); the proof is that card is among them.
    const diagnostics = compile(`
      import type { CngxLanguagePack } from '@cngx/core/i18n';
      import { CngxTimeline } from '@cngx/ui/timeline';
      export const timeline = CngxTimeline;
      export const pack: CngxLanguagePack = {};
    `);
    expect(diagnostics).toHaveLength(1);
    expect([2739, 2741]).toContain(diagnostics[0].code);
    expect(diagnostics[0].message).toMatch(/\bcard\b/);
  });

  it('loads the shipped d.ts files without a resolution error', () => {
    // When a cngx d.ts cannot resolve its sibling @cngx imports (e.g. a
    // symlinked dist/), TS reports TS2307 there and drops the augmentation
    // without a diagnostic of its own; skipLibCheck hides even the TS2307,
    // and the pack shrinks to {} and checks nothing.
    const diagnostics = compile(
      `
      import type { CngxLanguagePack } from '@cngx/core/i18n';
      import type { CngxCardLanguageSection } from '@cngx/common/card';
      export type Section = CngxCardLanguageSection;
      export const pack: CngxLanguagePack = { card: ${COMPLETE_CARD} };
    `,
      { skipLibCheck: false },
    );
    expect(diagnostics.filter((d) => d.file?.includes('/types/cngx-'))).toEqual([]);
  });
});
