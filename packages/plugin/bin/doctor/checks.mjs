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
    if (importsCngxSymbol(text, symbol)) {
      return path;
    }
  }
  return null;
}

// Strip comments before an opt-in scan so a commented-out `// withToasts()`
// (or one inside a block comment) does not falsely suppress a finding.
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function anySourceContainsCode(sources, needle) {
  return Object.values(sources).some((text) => stripComments(text).includes(needle));
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
  const stylesheetImported = snapshot.styleEntries.some((e) =>
    TRACK_B_STYLE_MARKERS.some((marker) => e.text.includes(marker)),
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
