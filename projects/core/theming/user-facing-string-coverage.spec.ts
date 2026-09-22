import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ALREADY_COVERED,
  EXCLUDED,
  RATCHET,
  type StringManifestEntry,
} from './user-facing-string-coverage.fixtures';

// Coverage guard for the EN-default contract: cngx ships English library
// defaults, and every one of them is overridable through the config cascade
// (`architecture-summary.md`, "Configuration cascade"). The type system cannot
// see the second half - a string literal sitting in a directive body compiles
// exactly like one sitting in a `CNGX_*_I18N` default factory, and only the
// second is reachable from a consumer's language file.
//
// The rule: a user-facing string literal lives in an override source, or it is
// on a manifest. Four ways to be covered, all structural:
//
//   1. The file IS the override source - an `i18n/` module, a `*-config.ts` /
//      `*.defaults.ts`, or any file declaring a `Cngx*Config` / `*I18n` /
//      `*Labels` injection token. Its literals are the EN defaults by
//      definition.
//   2. The use-site coalesces off a config read (`config.ariaLabels?.x ?? 'X'`).
//      The literal is dead weight the moment a consumer provides the token.
//   3. The literal is an `input()` default, so the consumer overrides it
//      per instance.
//   4. It is a dev-only message (`console.warn`, `new Error`, an `isDevMode()`
//      block). Never reaches an end user, never translated.
//
// Everything else is a gap and must carry a manifest row. See
// `user-facing-string-coverage.fixtures.ts`.

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

/**
 * Directories whose strings are never library defaults: demo code is
 * consumer-authored, `projects/testing` is not published, and a
 * `__test-helpers` folder holds spec scaffolding that happens not to carry the
 * `.spec.ts` suffix.
 */
const SKIPPED_DIRS = new Set(['examples', 'testing', '__test-helpers']);

/** `event.key` values and the like - code, not copy. */
const KEY_NAMES = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Enter',
  'Escape',
  'PageUp',
  'PageDown',
  'Tab',
  'Backspace',
  'Delete',
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'Space',
]);

/** A single CamelCase word: an injection-token debug name, never a sentence. */
const CAMEL_WORD = /^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/;

/** Basenames that mark a file as the override source for its area. */
const OVERRIDE_SOURCE_FILE = /(?:^|[-.])(?:config|defaults|i18n|token|tokens|labels|messages)\.ts$/;

/** An injection token whose payload is the area's config / label bundle. */
const OVERRIDE_TOKEN = /new InjectionToken<\s*[A-Za-z0-9_]*(?:Config|I18n|Labels|Messages)\b/;

/** Markers of a message that only ever reaches a developer's console. */
const DEV_MARKER = /console\.|new Error|isDevMode|ngDevMode|\bthrow\b|\bwarn[A-Z]/;

/** Reads that make a following `??` / `||` literal a mere fallback. */
const CONFIG_READ = /\b(?:config|cfg|i18n|labels|messages|glyphs|defaults|ariaLabels)\b/i;

export type StringCoverage =
  | 'override-source'
  | 'config-fallback'
  | 'input-default'
  | 'dev-message'
  | 'uncovered';

export interface StringFinding {
  readonly line: number;
  readonly value: string;
  readonly coverage: StringCoverage;
}

/**
 * Strips comments while preserving line count - a JSDoc `@example` block is
 * full of `aria-label="Price range"` prose, and the guard reports line numbers
 * a reviewer has to be able to open.
 */
export function stripComments(source: string): string {
  let out = '';
  let mode: 'code' | 'block' | 'line' = 'code';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (mode === 'code') {
      if (c === '/' && next === '*') {
        mode = 'block';
        i += 2;
        continue;
      }
      if (c === '/' && next === '/') {
        mode = 'line';
        i += 2;
        continue;
      }
      out += c;
      i += 1;
      continue;
    }
    if (mode === 'block') {
      if (c === '*' && next === '/') {
        mode = 'code';
        i += 2;
        continue;
      }
      out += c === '\n' ? '\n' : ' ';
      i += 1;
      continue;
    }
    if (c === '\n') {
      mode = 'code';
      out += '\n';
      i += 1;
      continue;
    }
    out += ' ';
    i += 1;
  }
  return out;
}

/** Does this literal read as copy a user could be shown? */
export function isUserFacingPhrase(value: string): boolean {
  if (value.length < 3 || value.length > 120) {
    return false;
  }
  if (KEY_NAMES.has(value) || CAMEL_WORD.test(value)) {
    return false;
  }
  if (!/^[A-Z]/.test(value) || !/[a-z]/.test(value)) {
    return false;
  }
  // Template fragments, selectors and code snippets.
  return !/[<>{}=_]|\$\{|=>/.test(value);
}

/**
 * Walks back over a `'a' + 'b'` concatenation so a literal on the fifth line of
 * a `console.warn(...)` chain is classified by the head of the chain, not by
 * its own line.
 */
const expressionHead = (lines: readonly string[], index: number): number => {
  let head = index;
  while (head > 0) {
    const previous = lines[head - 1].trimEnd();
    if (!/[+(,]$/.test(previous)) {
      break;
    }
    head -= 1;
  }
  return head;
};

/**
 * Classifies one file's user-facing literals. Exported so the negative
 * fixtures below can prove the scanner is capable of failing - a guard that
 * only ever reports green is indistinguishable from a broken matcher.
 */
export function scanSource(source: string, fileName = 'x.ts'): readonly StringFinding[] {
  const code = stripComments(source);
  const lines = code.split('\n');
  const isOverrideSource =
    OVERRIDE_SOURCE_FILE.test(fileName) || /\/i18n\//.test(fileName) || OVERRIDE_TOKEN.test(code);
  const findings: StringFinding[] = [];

  lines.forEach((line, index) => {
    for (const match of line.matchAll(/'([A-Z][^'\n]{2,119})'/g)) {
      const value = match[1];
      if (!isUserFacingPhrase(value)) {
        continue;
      }
      const before = line.slice(0, match.index);
      // A literal being compared against or searched for is data, not copy.
      if (/(?:===|!==|\.includes\(|\.startsWith\(|\.endsWith\(|indexOf\()\s*$/.test(before)) {
        continue;
      }
      const head = expressionHead(lines, index);
      const context = lines.slice(Math.max(0, head - 2), index + 1).join('\n');
      findings.push({
        line: index + 1,
        value,
        coverage: classify({ before, context, isOverrideSource }),
      });
    }
  });

  return findings;
}

const classify = (input: {
  before: string;
  context: string;
  isOverrideSource: boolean;
}): StringCoverage => {
  if (DEV_MARKER.test(input.context)) {
    return 'dev-message';
  }
  if (input.isOverrideSource) {
    return 'override-source';
  }
  if (/(?:\?\?|\|\|)\s*$/.test(input.before.trimEnd()) && CONFIG_READ.test(input.context)) {
    return 'config-fallback';
  }
  if (/\binput(?:\.required)?\s*(?:<[^>]*>)?\([^'\n]*$/.test(input.before)) {
    return 'input-default';
  }
  return 'uncovered';
};

const walkSources = (relDir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      if (!SKIPPED_DIRS.has(entry)) {
        out.push(...walkSources(rel));
      }
    } else if (
      entry.endsWith('.ts') &&
      !entry.includes('.spec.') &&
      !entry.includes('.fixtures.') &&
      !entry.endsWith('.d.ts')
    ) {
      out.push(rel);
    }
  }
  return out;
};

const SOURCES = walkSources('projects');
const UNCOVERED = SOURCES.flatMap((file) =>
  scanSource(readFileSync(resolve(REPO_ROOT, file), 'utf-8'), file)
    .filter((finding) => finding.coverage === 'uncovered')
    .map((finding) => ({ file, ...finding })),
);

const key = (entry: { file: string; value: string }): string => `${entry.file}\t${entry.value}`;
const manifested = new Set([...RATCHET, ...ALREADY_COVERED, ...EXCLUDED].map(key));
const found = new Set(UNCOVERED.map(key));

const stale = (manifest: readonly StringManifestEntry[]): string[] =>
  manifest.filter((entry) => !found.has(key(entry))).map((entry) => `${entry.file}: ${entry.value}`);

describe('user-facing string coverage', () => {
  it('finds sources to scan', () => {
    expect(SOURCES.length).toBeGreaterThan(300);
  });

  it('routes every user-facing string through an override or a manifest', () => {
    const unmanifested = UNCOVERED.filter((finding) => !manifested.has(key(finding))).map(
      (finding) => `${finding.file}:${finding.line}: ${finding.value}`,
    );
    expect(unmanifested).toEqual([]);
  });
});

describe('user-facing string ratchet', () => {
  it('carries no gap at all - adding one is a conscious edit', () => {
    expect(RATCHET).toEqual([]);
  });

  it('carries no ratchet row that is already fixed', () => {
    expect(stale(RATCHET)).toEqual([]);
  });

  it('carries no allow-list row that no longer exists', () => {
    expect(stale(ALREADY_COVERED)).toEqual([]);
    expect(stale(EXCLUDED)).toEqual([]);
  });

  it('gives every row a reason', () => {
    const unreasoned = [...RATCHET, ...ALREADY_COVERED, ...EXCLUDED]
      .filter((entry) => entry.note.trim().length < 10)
      .map((entry) => `${entry.file}: ${entry.value}`);
    expect(unreasoned).toEqual([]);
  });
});

describe('user-facing string scanner', () => {
  it('reports a hardcoded host aria-label', () => {
    const source = "@Component({ host: { 'aria-label': 'Alerts' } }) class X {}";
    expect(scanSource(source, 'alert-stack.ts')).toEqual([
      { line: 1, value: 'Alerts', coverage: 'uncovered' },
    ]);
  });

  it('treats a literal in an i18n module as the EN default', () => {
    const source = "export const D = { previousStep: 'Previous step' };";
    expect(scanSource(source, 'projects/common/stepper/i18n/stepper-i18n.ts')[0].coverage).toBe(
      'override-source',
    );
  });

  it('treats a config coalesce as covered', () => {
    const source = "const label = this.config.ariaLabels?.clearButton ?? 'Clear selection';";
    expect(scanSource(source, 'select.component.ts')[0].coverage).toBe('config-fallback');
  });

  it('treats an input default as covered', () => {
    const source = "readonly removeAriaLabel = input<string>('Remove');";
    expect(scanSource(source, 'chip.component.ts')[0].coverage).toBe('input-default');
  });

  it('classifies a literal on the fourth line of a console.warn chain as dev copy', () => {
    const source = [
      'console.warn(',
      "  '[cngxMatTabs] aggregator-content slot half-wired - ' +",
      "    'The projector falls back to textContent. ' +",
      "    'Wire both halves on the directive (or neither).',",
      ');',
    ].join('\n');
    expect(scanSource(source, 'half-wired-slot-sink.ts').map((f) => f.coverage)).toEqual([
      'dev-message',
      'dev-message',
    ]);
  });

  it('ignores event-key names and token debug names', () => {
    const source = ["if (event.key === 'ArrowDown') {}", "new InjectionToken('CngxSelectPanelHost');"].join(
      '\n',
    );
    expect(scanSource(source, 'x.ts')).toEqual([]);
  });

  it('ignores a literal that is compared against, not shown', () => {
    const source = "const isMac = navigator.userAgent.includes('Mac');";
    expect(scanSource(source, 'sidenav.ts')).toEqual([]);
  });

  it('ignores strings inside comments', () => {
    const source = "/* host: { 'aria-label': 'Alerts' } */ const x = 1;";
    expect(scanSource(source, 'x.ts')).toEqual([]);
  });
});
