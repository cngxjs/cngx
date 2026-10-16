// Every active error code has a spec that makes it fire and asserts it by
// its code: a code no spec reaches can stop firing, or fire with a broken
// message, and nothing notices.
//
// S1  every active code of `scripts/manifests/error-codes.json` appears in a
//     `*.spec.ts` under its lib (`projects/<lib>/`) in an asserting form:
//     `code: 'CNGXnnnn'` (a thrown `CngxRuntimeError`) or an anchored
//     `^CNGXnnnn` (a regex literal or a `RegExp` source). A bare mention in a
//     comment, a `toContain` or a spy filter that only looks for the code
//     somewhere in the text does not count, and neither does one inside a
//     negated assertion (`.not.` between the last `expect(` or `;` before
//     the mention and the mention itself).
// S2  a code that no spec can reach is listed in SPEC_COVERAGE_EXEMPT with a
//     reason; a row whose code gained a spec, or left the manifest, fails.
//
// Known limits: the scan is textual, so `^CNGXnnnn` in a comment or a string
// that never reaches an assertion also counts. It proves an author anchored
// the code somewhere in the lib's specs, not that the assertion runs. A
// negation it cannot see textually, such as a matcher held in a variable and
// used later under `.not.`, still counts.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { MANIFEST_PATH, REPO_ROOT } from '../error-codes-manifest.mjs';
import { sourceFiles } from '../devtools-prod-strip-check.mjs';

/**
 * Codes no spec can reach. Exact list; every row needs a reason a reviewer
 * can check.
 *
 * @type {{ code: string; reason: string }[]}
 */
const SPEC_COVERAGE_EXEMPT = [
  {
    code: 'CNGX3006',
    reason:
      'default half-wired sink is consumer-replaceable via halfWiredSlotSink; the shipped mat-tabs caller cannot reach it',
  },
];

/** Is the mention at `index` part of a `.not.` assertion? */
function isNegated(text, index) {
  const start = Math.max(text.lastIndexOf('expect(', index), text.lastIndexOf(';', index));
  return text.slice(Math.max(start, 0), index).includes('.not.');
}

/** Does `text` assert `code` in an anchored or structured form, outside a `.not.` assertion? */
export function assertsCode(text, code) {
  for (const needle of [`code: '${code}'`, `^${code}`]) {
    for (let index = text.indexOf(needle); index >= 0; index = text.indexOf(needle, index + 1)) {
      if (!isNegated(text, index)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * The active codes that no spec of their lib asserts.
 *
 * @param {{ code: string; lib: string; status: string }[]} codes manifest rows
 * @param {{ path: string; text: string }[]} specs spec files
 * @returns {string[]}
 */
export function uncoveredCodes(codes, specs) {
  const byLib = new Map();
  for (const spec of specs) {
    const lib = spec.path.split('/')[1];
    byLib.set(lib, [...(byLib.get(lib) ?? []), spec.text]);
  }
  return codes
    .filter((row) => row.status === 'active')
    .filter((row) => !(byLib.get(row.lib) ?? []).some((text) => assertsCode(text, row.code)))
    .map((row) => row.code);
}

describe('error-code spec coverage - scanner', () => {
  const codes = [
    { code: 'CNGX1001', lib: 'common', status: 'active' },
    { code: 'CNGX1002', lib: 'common', status: 'active' },
    { code: 'CNGX1003', lib: 'common', status: 'active' },
    { code: 'CNGX1004', lib: 'common', status: 'active' },
    { code: 'CNGX1005', lib: 'common', status: 'retired' },
  ];

  it('accepts a code field, a regex literal and a RegExp source, under the code lib only', () => {
    const specs = [
      {
        path: 'projects/common/a.spec.ts',
        text: "toThrow(expect.objectContaining({ code: 'CNGX1001' }))",
      },
      { path: 'projects/common/b.spec.ts', text: 'expect(m).toMatch(/^CNGX1002: x/)' },
      { path: 'projects/common/c.spec.ts', text: 'new RegExp(`^CNGX1003: ${id}`)' },
      { path: 'projects/ui/d.spec.ts', text: 'expect(m).toMatch(/^CNGX1004: x/)' },
    ];
    expect(uncoveredCodes(codes, specs)).toEqual(['CNGX1004']);
  });

  it('rejects an unanchored mention', () => {
    const specs = [
      {
        path: 'projects/common/a.spec.ts',
        text: "expect(m).toContain('CNGX1001: x'); // CNGX1002",
      },
      { path: 'projects/common/b.spec.ts', text: "String(c[0]).startsWith('CNGX1003:')" },
    ];
    expect(uncoveredCodes(codes, specs)).toEqual(['CNGX1001', 'CNGX1002', 'CNGX1003', 'CNGX1004']);
  });

  it('rejects a mention inside a negated assertion, also across lines', () => {
    const specs = [
      {
        path: 'projects/common/a.spec.ts',
        text: 'expect(warn).not.toHaveBeenCalledWith(expect.stringMatching(/^CNGX1001: /));',
      },
      {
        path: 'projects/common/b.spec.ts',
        text: "expect(() => f()).not.toThrow(\n  expect.objectContaining({ code: 'CNGX1002' }),\n);",
      },
      {
        path: 'projects/common/c.spec.ts',
        text: "expect(spy).not.toHaveBeenCalled();\nconst coded = expect.objectContaining({ code: 'CNGX1003' });",
      },
    ];
    expect(uncoveredCodes(codes, specs)).toEqual(['CNGX1001', 'CNGX1002', 'CNGX1004']);
  });
});

describe('error-code spec coverage - projects/**', () => {
  let codes;
  let uncovered;
  beforeAll(() => {
    codes = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).codes;
    const specs = sourceFiles('projects', REPO_ROOT)
      .map((path) => path.split('\\').join('/'))
      .filter((path) => path.endsWith('.spec.ts'))
      .map((path) => ({ path, text: readFileSync(resolve(REPO_ROOT, path), 'utf8') }));
    uncovered = uncoveredCodes(codes, specs);
  });

  it('has an asserting firing spec for every active code outside the exemptions', () => {
    const exempt = new Set(SPEC_COVERAGE_EXEMPT.map((row) => row.code));
    expect(
      uncovered.filter((code) => !exempt.has(code)),
      'Codes without a spec asserting them by code: fire each one in a spec under its lib ' +
        "and assert it with code: 'CNGXnnnn' or an anchored /^CNGXnnnn: .../",
    ).toEqual([]);
  });

  it('keeps every exemption reasoned and still needed', () => {
    const active = new Set(codes.filter((row) => row.status === 'active').map((row) => row.code));
    expect(SPEC_COVERAGE_EXEMPT.filter((row) => !row.reason?.trim())).toEqual([]);
    expect(
      SPEC_COVERAGE_EXEMPT.filter((row) => !active.has(row.code) || !uncovered.includes(row.code)),
    ).toEqual([]);
  });
});
