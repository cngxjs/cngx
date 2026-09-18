import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Repo-wide parity guards for the config-cascade convention and the
 * stepper/tabs twin families. Both target the drift class the library
 * audits kept finding: one sibling ships a mechanism surface, the next
 * sibling (often built in a different session) silently does not.
 *
 * (a) Config-cascade triad: every exported `CNGX_*_CONFIG` token comes
 *     with `provide*Config` + `provide*ConfigAt` + `inject*Config` in the
 *     same public-api. Families that deliberately use a different provider
 *     naming live in NAMING_EXCEPTIONS with the symbols they DO promise -
 *     the guard asserts those instead, so an exception entry still guards
 *     something. Genuine gaps live in KNOWN_GAPS; the guard is a ratchet:
 *     once a gap is closed the entry MUST be removed, and a NEW token
 *     missing triad symbols fails here.
 *
 * (b) Twin parity: `common/stepper` and `common/tabs` are deliberate
 *     twins. Each must export the full mechanism set (config triad, i18n
 *     pair, glyphs, commit-handler factory token, provideCngx* pair) and
 *     ship presenter + router-sync directives. A new mechanism added to
 *     one twin extends TWIN_SURFACE, which forces the decision for the
 *     other twin at PR time instead of at the next audit.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECTS = resolve(HERE, '..', '..', 'projects');

/** Token -> the alternate public symbols this family promises instead of
 * the derived triad. Naming is deliberate per family (documented in each
 * lib's README / provider JSDoc); the guard asserts these exact symbols. */
const NAMING_EXCEPTIONS = new Map([
  ['CNGX_AUDIO_CONFIG', ['provideCngxAudio', 'provideCngxAudioAt', 'injectAudioConfig']],
  ['CNGX_POPOVER_PANEL_CONFIG', ['providePopoverPanel']],
  ['CNGX_TREETABLE_CONFIG', ['provideTreetable', 'provideTreetableAt']],
  ['CNGX_FORM_FIELD_CONFIG', ['provideFormField']],
  ['CNGX_FEEDBACK_CONFIG', ['provideFeedback']],
  [
    'CNGX_PAGINATOR_CONFIG',
    ['provideCngxPaginatorConfig', 'provideCngxPaginatorConfigAt', 'injectPaginatorConfig'],
  ],
]);

/** Token -> triad symbols known to be missing on main. Ratchet list: close
 * the gap (or promote the token to NAMING_EXCEPTIONS with a rationale) and
 * remove the entry - a resolved entry left behind fails the guard. */
const KNOWN_GAPS = new Map([
  ['CNGX_NAV_CONFIG', ['provideNavConfigAt']],
  ['CNGX_INPUT_CONFIG', ['provideInputConfigAt', 'injectInputConfig']],
  ['CNGX_REORDERABLE_SELECT_CONFIG', ['injectReorderableSelectConfig']],
  ['CNGX_ACTION_SELECT_CONFIG', ['injectActionSelectConfig']],
]);

function collectPublicApis() {
  const apis = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(dir, entry.name));
      } else if (entry.name === 'public-api.ts') {
        apis.push(join(dir, entry.name));
      }
    }
  })(PROJECTS);
  return apis;
}

function pascalBase(token) {
  return token
    .replace(/^CNGX_/, '')
    .replace(/_CONFIG$/, '')
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
}

function triadFor(token) {
  const base = pascalBase(token);
  return [`provide${base}Config`, `provide${base}ConfigAt`, `inject${base}Config`];
}

describe('config-cascade + twin-family parity guard', () => {
  it('every exported CNGX_*_CONFIG token ships its provide/provideAt/inject triad', () => {
    const violations = [];
    for (const api of collectPublicApis()) {
      const text = readFileSync(api, 'utf8');
      const rel = '/' + relative(PROJECTS, api).replaceAll('\\', '/');
      const tokens = new Set(
        [...text.matchAll(/\bCNGX_[A-Z0-9_]+_CONFIG\b/g)].map((match) => match[0]),
      );
      for (const token of tokens) {
        const expected = NAMING_EXCEPTIONS.get(token) ?? triadFor(token);
        const knownGaps = KNOWN_GAPS.get(token) ?? [];
        const missing = expected.filter(
          (symbol) => !text.includes(symbol) && !knownGaps.includes(symbol),
        );
        if (missing.length > 0) {
          violations.push(`${rel}: ${token} is missing ${missing.join(', ')}`);
        }
        const resolved = knownGaps.filter((symbol) => text.includes(symbol));
        if (resolved.length > 0) {
          violations.push(
            `${rel}: ${token} gap entries ${resolved.join(', ')} are resolved - ` +
              'remove them from KNOWN_GAPS',
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  const TWIN_SURFACE = [
    'CNGX_{F}_CONFIG',
    'provide{F}Config',
    'provide{F}ConfigAt',
    'inject{F}Config',
    'CNGX_{F}_I18N',
    'provide{F}I18n',
    'inject{F}I18n',
    'CNGX_{F}_GLYPHS',
    'CNGX_{F}_COMMIT_HANDLER_FACTORY',
    'provideCngx{F}',
    'provideCngx{F}At',
  ];

  const TWIN_FILES = ['presenter.directive.ts', 'router-sync.directive.ts'];

  const TWINS = [
    { dir: 'common/stepper', pascal: 'Stepper', upper: 'STEPPER' },
    { dir: 'common/tabs', pascal: 'Tabs', upper: 'TABS' },
  ];

  it('the stepper/tabs twins expose the same mechanism surface', () => {
    const violations = [];
    for (const twin of TWINS) {
      const apiPath = join(PROJECTS, twin.dir, 'public-api.ts');
      const text = readFileSync(apiPath, 'utf8');
      for (const template of TWIN_SURFACE) {
        const symbol = template.startsWith('CNGX_')
          ? template.replaceAll('{F}', twin.upper)
          : template.replaceAll('{F}', twin.pascal);
        if (!text.includes(symbol)) {
          violations.push(`${twin.dir}: public-api.ts is missing ${symbol}`);
        }
      }
      const files = readdirSync(join(PROJECTS, twin.dir));
      for (const file of TWIN_FILES) {
        if (!files.includes(file)) {
          violations.push(`${twin.dir}: missing ${file}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
