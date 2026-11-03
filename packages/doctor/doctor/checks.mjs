/**
 * The three project-level checks the `@cngx/doctor` CLI runs, as pure functions
 * `(snapshot) => Finding[]`. Each reads its record from `metadata.mjs` so a
 * finding is explainable identically to a lint finding; the Track-B check also
 * reads the committed `track-b-symbols.mjs` list.
 *
 * @typedef {import('./scan.mjs').Snapshot} Snapshot
 * @typedef {object} Finding
 * @property {string} id
 * @property {string} message
 * @property {string} fixHint
 * @property {'error' | 'warn' | 'off'} severity
 * @property {string} [file]
 */

import { DOCTOR_CHECK_METADATA } from './metadata.mjs';
import { TRACK_B_SYMBOLS } from './track-b-symbols.mjs';

// A source "imports" a symbol from @cngx when a runtime import statement pulling
// from a '@cngx/...' module names it. A type-only import (`import type { X }` or
// an inline `type X` specifier) is discarded - it emits no runtime code, so it
// must not trip a wiring check. An optional default import before the braces is
// tolerated so `import Foo, { CngxToaster } from '...'` still matches.
function importsCngxSymbol(text, symbol) {
  const importRe = /import\s+(type\s+)?(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*['"]@cngx\/[^'"]+['"]/g;
  let match;
  while ((match = importRe.exec(text)) !== null) {
    if (match[1]) {
      continue;
    }
    const named = match[2]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('type '))
      .map((s) => s.split(/\s+as\s+/)[0].trim());
    if (named.includes(symbol)) {
      return true;
    }
  }
  return false;
}

function findSourceImporting(sources, symbol) {
  for (const [path, text] of Object.entries(sources)) {
    if (importsCngxSymbol(strippedSource(sources, path, text), symbol)) {
      return path;
    }
  }
  return null;
}

// Both scans read sources with comments stripped, so a commented-out import
// does not count as usage and a commented-out `withToasts()` does not count as
// an opt-in. `stripTsComments` is a port of `stripComments` in
// packages/cli/src/from-file.ts (doctor cannot import the CLI);
// packages/cli/src/comment-strip-parity.spec.ts pins the two equal.

// A `/` after one of these (or a keyword below) starts a regex literal, not a division.
const REGEX_AFTER_CHAR = new Set([...'(,=:[!&|?{};+-*%<>~^']);
const REGEX_AFTER_WORD = /\b(?:return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

/** The end (exclusive) of the regex literal starting at `start`, or -1 when it is not one. */
function regexLiteralEnd(source, start) {
  let inClass = false;
  for (let j = start + 1; j < source.length; j++) {
    const char = source[j];
    if (char === '\n') {
      return -1;
    }
    if (char === '\\') {
      j++;
    } else if (char === '[') {
      inClass = true;
    } else if (char === ']') {
      inClass = false;
    } else if (char === '/' && !inClass) {
      return j + 1;
    }
  }
  return -1;
}

/**
 * `source` with every comment replaced by a space, string, template and regex
 * literals kept, so a `/*` or `//` inside a string, URL or regex does not eat
 * the code after it.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripTsComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        i++;
      }
      out += ' ';
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      out += ' ';
      continue;
    }
    if (char === '/') {
      const before = out.trimEnd();
      const startsRegex = before === '' || REGEX_AFTER_CHAR.has(before[before.length - 1]) || REGEX_AFTER_WORD.test(before);
      const end = startsRegex ? regexLiteralEnd(source, i) : -1;
      if (end !== -1) {
        out += source.slice(i, end);
        i = end;
        continue;
      }
    }
    if (char === "'" || char === '"' || char === '`') {
      let j = i + 1;
      while (j < source.length && source[j] !== char) {
        j += source[j] === '\\' ? 2 : 1;
      }
      out += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    out += char;
    i++;
  }
  return out;
}

/**
 * `source` with every `<!-- -->` comment replaced by a space. HTML has no `//`,
 * and an apostrophe in prose must not open a literal, so only HTML comments go.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?(?:-->|$)/g, ' ');
}

/**
 * @param {string} path  picks the comment syntax by extension
 * @param {string} text
 * @returns {string}
 */
export function stripComments(path, text) {
  return path.endsWith('.html') ? stripHtmlComments(text) : stripTsComments(text);
}

// Each check asks per symbol, so one run would strip every source about 25
// times. The cache lives as long as the snapshot's sources object; an entry is
// reused only while its text is the same string.
/** @type {WeakMap<Record<string, string>, Map<string, { text: string, stripped: string }>>} */
const strippedCache = new WeakMap();

function strippedSource(sources, path, text) {
  let byPath = strippedCache.get(sources);
  if (!byPath) {
    byPath = new Map();
    strippedCache.set(sources, byPath);
  }
  const hit = byPath.get(path);
  if (hit && hit.text === text) {
    return hit.stripped;
  }
  const stripped = stripComments(path, text);
  byPath.set(path, { text, stripped });
  return stripped;
}

function anySourceContainsCode(sources, needle) {
  return Object.entries(sources).some(([path, text]) => strippedSource(sources, path, text).includes(needle));
}

// A Track-B directive is styled either by the single-import bundle or by the
// documented by-hand assembly that pulls the individual component partials from
// `@cngx/common/theming/components/`. Either marker means the consumer opted in.
const TRACK_B_STYLE_MARKERS = ['@cngx/themes/cngx.css', '@cngx/common/theming/components/'];

const FEEDBACK_FAMILIES = [
  { symbols: ['CngxToaster', 'CngxToastOn'], optIn: 'withToasts(', messageId: 'toastsUsedWithoutOptIn' },
  { symbols: ['CngxAlerter', 'CngxAlertOn'], optIn: 'withAlerts(', messageId: 'alertsUsedWithoutOptIn' },
  { symbols: ['CngxBanner', 'CngxBannerOn'], optIn: 'withBanners(', messageId: 'bannersUsedWithoutOptIn' },
];

/**
 * @param {Snapshot} snapshot
 * @returns {Finding[]}
 */
export function toasterCheck(snapshot) {
  const meta = DOCTOR_CHECK_METADATA['toaster-without-withtoasts'];
  /** @type {Finding[]} */
  const findings = [];
  for (const family of FEEDBACK_FAMILIES) {
    let usedIn = null;
    for (const symbol of family.symbols) {
      usedIn = usedIn ?? findSourceImporting(snapshot.sources, symbol);
    }
    if (!usedIn) {
      continue;
    }
    if (anySourceContainsCode(snapshot.sources, family.optIn)) {
      continue;
    }
    findings.push({
      id: meta.id,
      message: meta.messages[family.messageId],
      fixHint: meta.fixHint,
      severity: meta.recommendedSeverity,
      file: usedIn,
    });
  }
  return findings;
}

/**
 * @param {Snapshot} snapshot
 * @returns {Finding[]}
 */
export function trackBCheck(snapshot) {
  const meta = DOCTOR_CHECK_METADATA['track-b-css-not-imported'];
  let usedIn = null;
  for (const symbol of TRACK_B_SYMBOLS) {
    usedIn = usedIn ?? findSourceImporting(snapshot.sources, symbol);
  }
  if (!usedIn) {
    return [];
  }
  // Match the marker in the entry's TEXT (an @import in the consumer's own
  // stylesheet) or its PATH (the published css listed directly in a build
  // `styles` array, e.g. node_modules/@cngx/themes/cngx.css) - the path form
  // must not depend on the shipped file's own comments carrying its name.
  const stylesheetImported = snapshot.styleEntries.some((e) =>
    TRACK_B_STYLE_MARKERS.some((marker) => e.text.includes(marker) || e.path.includes(marker)),
  );
  if (stylesheetImported) {
    return [];
  }
  return [
    {
      id: meta.id,
      message: meta.messages.trackBStylesheetMissing,
      fixHint: meta.fixHint,
      severity: meta.recommendedSeverity,
      file: usedIn,
    },
  ];
}

/**
 * @param {Snapshot} snapshot
 * @returns {Finding[]}
 */
export function floatingFallbackCheck(snapshot) {
  const meta = DOCTOR_CHECK_METADATA['floating-fallback-missing'];
  if (!('@floating-ui/dom' in snapshot.dependencies)) {
    return [];
  }
  if (anySourceContainsCode(snapshot.sources, 'provideFloatingFallback(')) {
    return [];
  }
  return [
    {
      id: meta.id,
      message: meta.messages.floatingFallbackMissing,
      fixHint: meta.fixHint,
      severity: meta.recommendedSeverity,
    },
  ];
}

/**
 * @param {Snapshot} snapshot
 * @returns {Finding[]}
 */
export function runChecks(snapshot) {
  return [...toasterCheck(snapshot), ...trackBCheck(snapshot), ...floatingFallbackCheck(snapshot)];
}
