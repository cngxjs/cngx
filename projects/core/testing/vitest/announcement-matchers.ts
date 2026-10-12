// Brings Vitest's declarations into the program; without it the
// `declare module 'vitest'` augmentation below cannot resolve the module.
import type {} from 'vitest';

import type { CngxAnnouncementCapture } from '@cngx/core/testing';
import {
  resolveUnheardReason,
  type CngxAnnouncementSuppression,
  type CngxRecordedAnnouncement,
} from '@cngx/core/utils';

type TextPattern = string | RegExp;

const SUPPRESSION_WORDS: Record<CngxAnnouncementSuppression, string> = {
  hidden: 'inside a hidden element',
  'aria-hidden': 'inside an aria-hidden="true" element',
  inert: 'inside an inert element',
  'aria-modal': 'outside the open aria-modal="true" element',
};

function describeValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  return typeof value;
}

function assertCapture(
  received: unknown,
  matcher: string,
): asserts received is CngxAnnouncementCapture {
  const candidate = received as Partial<CngxAnnouncementCapture> | null;
  const isCapture =
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.heard === 'function' &&
    typeof candidate.entries === 'function';
  if (!isCapture) {
    throw new TypeError(
      `${matcher} expects the capture returned by createAnnouncementCapture(), received ${describeValue(received)}`,
    );
  }
}

function assertPattern(pattern: unknown, matcher: string): asserts pattern is TextPattern {
  if (typeof pattern !== 'string' && !(pattern instanceof RegExp)) {
    throw new TypeError(
      `${matcher} expects a string or a RegExp, received ${describeValue(pattern)}`,
    );
  }
}

function assertPatternList(
  patterns: unknown,
  matcher: string,
): asserts patterns is readonly TextPattern[] {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    throw new TypeError(
      `${matcher} expects a non-empty array of strings or RegExps, received ${describeValue(patterns)}`,
    );
  }
  for (const pattern of patterns as readonly unknown[]) {
    assertPattern(pattern, matcher);
  }
}

/** Exact text for a string; `search` for a RegExp, so a `g` flag's `lastIndex` never leaks between calls. */
function matches(text: string, pattern: TextPattern): boolean {
  return typeof pattern === 'string' ? text === pattern : text.search(pattern) !== -1;
}

function show(pattern: TextPattern): string {
  return typeof pattern === 'string' ? JSON.stringify(pattern) : String(pattern);
}

function showHeard(heard: readonly string[]): string {
  return `heard: ${heard.length === 0 ? 'nothing' : heard.map(show).join(', ')}`;
}

function regionWords(entry: CngxRecordedAnnouncement): string {
  return entry.role === null ? 'aria-live region' : `role="${entry.role}" region`;
}

/**
 * Why the entry is not heard, in words. The rule is `resolveUnheardReason`;
 * this only phrases its answer.
 */
function unheardWords(entry: CngxRecordedAnnouncement): string {
  const reason = resolveUnheardReason(entry);
  // The null check only narrows the type: 'suppressed' implies a suppressedBy.
  if (reason === 'suppressed' && entry.suppressedBy !== null) {
    return `suppressed, ${SUPPRESSION_WORDS[entry.suppressedBy]}`;
  }
  if (reason === 'busy') {
    // The recorder's flip replays exactly the busy entries the judgement would
    // hear without busy; both read one rule in @cngx/core/utils.
    const replayed = resolveUnheardReason({ ...entry, busy: false }) === null;
    return replayed
      ? 'written under aria-busy="true"; it counts as heard only through a later busy-cleared entry'
      : `${regionWords(entry)} appeared with its content under aria-busy="true", which clearing busy does not replay`;
  }
  const appeared =
    entry.origin === 'became-live'
      ? 'made live while already holding its text'
      : 'inserted with its content';
  return `${regionWords(entry)} ${appeared}; only role="alert" is announced reliably when it appears`;
}

/** One line per recorded, unheard entry whose text matches one of the patterns. */
function unheardLines(
  capture: CngxAnnouncementCapture,
  patterns: readonly TextPattern[],
): string[] {
  const lines = capture
    .entries()
    .filter((entry) => resolveUnheardReason(entry) !== null)
    .filter((entry) => patterns.some((pattern) => matches(entry.text, pattern)))
    .map((entry) => `${show(entry.text)} was recorded but not heard: ${unheardWords(entry)}`);
  return [...new Set(lines)];
}

function nothingRecorded(pattern: TextPattern): string {
  return `nothing matching ${show(pattern)} was recorded`;
}

function withFallback(lines: string[], expected: TextPattern): string[] {
  return lines.length > 0 ? lines : [nothingRecorded(expected)];
}

/**
 * Why an in-order text is missing beyond its unheard entries: heard, but out
 * of order; or never recorded at all, phrased as `toHaveHeard` phrases it.
 */
function missingNote(
  capture: CngxAnnouncementCapture,
  heard: readonly string[],
  missing: TextPattern,
  after: string,
): string[] {
  if (heard.some((text) => matches(text, missing))) {
    return [`${show(missing)} was heard, but not${after}`];
  }
  if (unheardLines(capture, [missing]).length > 0) {
    return [];
  }
  return [nothingRecorded(missing)];
}

/**
 * Optional Vitest matchers over {@link CngxAnnouncementCapture}. Each failure
 * message lists what was heard and, for every recorded entry matching the
 * expectation that was not heard, the reason `resolveUnheardReason` gives, in
 * words:
 *
 * ```text
 * expected the capture to have heard "Saved"
 * heard: "Save failed"
 * "Saved" was recorded but not heard: role="status" region inserted with its content; only role="alert" is announced reliably when it appears
 * ```
 *
 * - `toHaveHeard(expected)` passes when one heard text equals `expected`, or
 *   matches it when it is a RegExp.
 * - `toHaveHeardInOrder(expected)` passes when the heard texts contain the
 *   expected ones in this order; other texts may come between them.
 *
 * Importing this entry registers nothing (`@cngx/core` is side-effect free).
 * Register the matchers once in the Vitest setup file. That import also
 * brings the entry's `declare module 'vitest'` augmentation into the
 * TypeScript program, so specs compiled together with the setup file
 * type-check the matcher calls:
 *
 * ```ts
 * // vitest setup file
 * import { expect } from 'vitest';
 * import { cngxAnnouncementMatchers } from '@cngx/core/testing/vitest';
 *
 * expect.extend(cngxAnnouncementMatchers);
 *
 * // in a spec
 * expect(capture).toHaveHeard('Saved');
 * expect(capture).toHaveHeardInOrder(['Loading', /^\d+ results$/]);
 * expect(capture).not.toHaveHeard('Upload failed');
 * ```
 *
 * A received value that is not a capture, an expected value that is neither
 * a string nor a RegExp, and an empty `toHaveHeardInOrder` list throw a
 * `TypeError`, with and without `.not`. The entry needs `vitest` (an
 * optional peer of `@cngx/core`) for its types only; it loads nothing from
 * it at runtime. Under Jasmine or Jest, assert on `capture.heard()` instead.
 *
 * @category core/testing
 * @since 0.1.0
 * @relatedTo createAnnouncementCapture, resolveUnheardReason
 */
export const cngxAnnouncementMatchers = {
  /** Asserts one heard text equals the string, or matches the RegExp. */
  toHaveHeard(
    received: unknown,
    expected: string | RegExp,
  ): { pass: boolean; message: () => string } {
    assertCapture(received, 'toHaveHeard');
    assertPattern(expected, 'toHaveHeard');
    const heard = received.heard();
    const pass = heard.some((text) => matches(text, expected));
    return {
      pass,
      message: () =>
        pass
          ? [`expected the capture not to have heard ${show(expected)}`, showHeard(heard)].join(
              '\n',
            )
          : [
              `expected the capture to have heard ${show(expected)}`,
              showHeard(heard),
              ...withFallback(unheardLines(received, [expected]), expected),
            ].join('\n'),
    };
  },

  /** Asserts the heard texts contain the expected ones in this order, other texts allowed between. */
  toHaveHeardInOrder(
    received: unknown,
    expected: readonly (string | RegExp)[],
  ): { pass: boolean; message: () => string } {
    assertCapture(received, 'toHaveHeardInOrder');
    assertPatternList(expected, 'toHaveHeardInOrder');
    const heard = received.heard();
    let found = 0;
    for (const text of heard) {
      if (found < expected.length && matches(text, expected[found])) {
        found++;
      }
    }
    const pass = found === expected.length;
    const list = expected.map(show).join(', ');
    return {
      pass,
      message: () => {
        if (pass) {
          return [
            `expected the capture not to have heard in order: ${list}`,
            showHeard(heard),
          ].join('\n');
        }
        const missing = expected[found];
        const after = found === 0 ? '' : ` after ${show(expected[found - 1])}`;
        return [
          `expected the capture to have heard in order: ${list}`,
          showHeard(heard),
          `missing${after}: ${show(missing)}`,
          ...missingNote(received, heard, missing, after),
          ...unheardLines(received, expected.slice(found)),
        ].join('\n');
      },
    };
  },
};

declare module 'vitest' {
  interface Matchers<T> {
    /** Asserts one heard text equals the string, or matches the RegExp. See `cngxAnnouncementMatchers`. */
    toHaveHeard(expected: string | RegExp): T;
    /** Asserts the heard texts contain the expected ones in this order. See `cngxAnnouncementMatchers`. */
    toHaveHeardInOrder(expected: readonly (string | RegExp)[]): T;
  }
}
