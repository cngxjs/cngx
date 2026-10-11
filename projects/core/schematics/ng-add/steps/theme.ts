import { posix } from 'node:path';

import {
  type Change,
  createProvenanceStamp,
  hasProvenanceMarker,
  type Provenance,
  skipChange,
  type StepResult,
  withProvenanceMarker,
} from '../../engine';
import { CNGX_STYLESHEET, type ProjectFacts } from '../detect/detect';
import { missingThemePeers, selectedLibs } from './dependencies';
import { type OnboardingAnswers, type Versions } from './model';
import { BASE_TOKENS, type BaseToken } from './theme-tokens.generated';

const STYLESHEET_IMPORT = `@import '${CNGX_STYLESHEET}';`;
const BRIDGE_USE = "@use '@cngx/themes/material/theme' as cngx-material;";
const BRIDGE_MARKER = 'theme:bridge';
const SOURCE = 'ng-add theme';
const COMMENT_WIDTH = 96;

// Comment text wrapped to whole words; a word longer than the width keeps
// its own line.
function wrap(text: string, width: number): readonly string[] {
  return text.split(/\s+/).reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= width) {
      return [...lines.slice(0, -1), `${last} ${word}`];
    }
    return [...lines, word];
  }, []);
}

function tokenComment(token: BaseToken): readonly string[] {
  const placement = token.inherits ? 'Inherits.' : 'Does not inherit: set it on the element that reads it.';
  // A `*/` in the description would end the comment early.
  const text = `${token.description.replaceAll('*/', '* /')} Accepts ${token.syntax}. Default ${token.initialValue}. ${placement}`;
  return [
    '    /*',
    ...wrap(text, COMMENT_WIDTH - 7).map((line) => `     * ${line}`),
    '     */',
    `    /* ${token.name}: ${token.initialValue}; */`,
  ];
}

/** The cngx default theme file: every system token, commented out at its default. */
export function renderDefaultTheme(version: string): string {
  const groups = [...new Set(BASE_TOKENS.map((token) => token.group))];
  const body = groups.flatMap((group, index) => [
    ...(index === 0 ? [] : ['']),
    `    /* ${group === '' ? 'Other' : group} */`,
    '',
    ...BASE_TOKENS.filter((token) => token.group === group).flatMap((token) => [...tokenComment(token), '']).slice(0, -1),
  ]);
  return [
    createProvenanceStamp(SOURCE, version).trimEnd(),
    '/*',
    ' * Your cngx theme. Uncomment a token and change its value to override the',
    ' * default; a token left commented keeps it. The overrides sit in the',
    ' * cngx.theme layer, above every cngx default and below your own unlayered',
    ' * rules.',
    ' */',
    '@layer cngx.theme {',
    '  :root {',
    ...body,
    '  }',
    '}',
    '',
  ].join('\n');
}

function renderMaterialTheme(version: string, density: number, themePath: string): string {
  return [
    createProvenanceStamp(SOURCE, version).trimEnd(),
    '// The Angular Material bridge: every cngx token follows the `mat.theme()`',
    `// map in ${themePath}. Keep the density below in step with its \`density\`.`,
    BRIDGE_USE,
    '',
    'html {',
    `  @include cngx-material.theme-system(${density});`,
    '}',
    '',
  ].join('\n');
}

function appendBridge(variable: string): (content: string) => string {
  return (content) => {
    if (hasProvenanceMarker(content, BRIDGE_MARKER)) {
      return content;
    }
    const include = withProvenanceMarker(`  @include cngx-material.theme($${variable});`, BRIDGE_MARKER);
    return `${content.replace(/\n*$/, '\n')}\nhtml {\n${include}\n}\n`;
  };
}

type Bridge =
  | { readonly kind: 'map-api'; readonly themePath: string; readonly density: number }
  | { readonly kind: 'object'; readonly themePath: string; readonly variable: string }
  | { readonly kind: 'none'; readonly reason: string };

function materialBridge(facts: ProjectFacts): Bridge {
  const { present, themeShape, themePath, themeVariable, density } = facts.material;
  if (!present) {
    return { kind: 'none', reason: 'Angular Material is not installed' };
  }
  if (themeShape === 'map-api' && themePath !== undefined) {
    return { kind: 'map-api', themePath, density };
  }
  const isObject = themeShape === 'define-theme' || themeShape === 'm2';
  if (isObject && themePath?.endsWith('.scss') === true && themeVariable !== undefined) {
    return { kind: 'object', themePath, variable: themeVariable };
  }
  return { kind: 'none', reason: `no Material theme map or object to bridge (${themeShape})` };
}

function result(planned: readonly Change[], wired: string | undefined, reason: string): StepResult {
  if (wired === undefined) {
    return { changes: planned, skipped: [] };
  }
  return { changes: [], skipped: planned.map((change) => skipChange(change, reason)) };
}

/**
 * Loads `@cngx/themes/cngx.css` ahead of everything cngx and adds a theme:
 * the cngx default (every system token, commented, with what it controls)
 * or the Angular Material bridge. A `mat.theme()` map gets its own
 * `cngx-theme.scss`; a `define-theme` or M2 object is bridged in the file
 * that defines it, since a separate file cannot see the variable. Every
 * global entry it adds follows the stylesheet that imports `cngx.css`, so
 * the layer order `cngx.css` declares is in place before any cngx layer.
 */
export function planTheme(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  const installable = missingThemePeers(selectedLibs(answers.libs)).length === 0;
  if (answers.theme === 'none' || !installable) {
    return { changes: [], skipped: [] };
  }
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  const bridge = answers.theme === 'material' ? materialBridge(facts) : undefined;

  // A bridged object lives in Material's own file, which comes first in the
  // build; cngx.css must load before it.
  const stylesheetTarget = bridge?.kind === 'object' ? bridge.themePath : facts.stylesPath;
  const stylesheet: Change =
    stylesheetTarget === undefined
      ? {
          kind: 'add-style-entry',
          id: 'theme:stylesheet',
          label: `Load ${CNGX_STYLESHEET}`,
          reason: 'the build lists no global stylesheet to import it from',
          provenance,
          project: facts.project,
          path: CNGX_STYLESHEET,
        }
      : {
          kind: 'add-style-import',
          id: 'theme:stylesheet',
          label: `Import ${CNGX_STYLESHEET} in ${stylesheetTarget}`,
          reason: 'cngx tokens, layers and directive styles',
          provenance,
          path: stylesheetTarget,
          statement: STYLESHEET_IMPORT,
        };
  const stylesheetStep = facts.cngxStylesheet
    ? { changes: [], skipped: [skipChange(stylesheet, 'already imported')] }
    : { changes: [stylesheet], skipped: [] };

  const fallbackNote: readonly Change[] =
    bridge?.kind === 'none'
      ? [
          {
            kind: 'note',
            id: 'theme:material',
            label: 'Use the cngx default theme',
            reason: `${bridge.reason}; the Material bridge needs one`,
            provenance,
          },
        ]
      : [];

  const after = facts.stylesPath ?? CNGX_STYLESHEET;
  const wiredReason = `already wired in ${facts.cngxThemePath ?? ''}`;
  const themeSteps: StepResult =
    bridge?.kind === 'object'
      ? result(
          [
            {
              kind: 'add-style-import',
              id: 'theme:bridge-import',
              label: `Load the Material bridge in ${bridge.themePath}`,
              reason: `\`$${bridge.variable}\` is defined there`,
              provenance,
              path: bridge.themePath,
              statement: BRIDGE_USE,
            },
            {
              kind: 'edit-file',
              id: 'theme:bridge',
              label: `Bridge $${bridge.variable} to the cngx tokens`,
              reason: 'every cngx component follows the Material theme',
              provenance,
              path: bridge.themePath,
              edit: appendBridge(bridge.variable),
            },
          ],
          facts.cngxThemePath,
          wiredReason,
        )
      : themeFile(facts, bridge, after, provenance, versions.cngx, wiredReason);

  return {
    changes: [...stylesheetStep.changes, ...fallbackNote, ...themeSteps.changes],
    skipped: [...stylesheetStep.skipped, ...themeSteps.skipped],
  };
}

function themeFile(
  facts: ProjectFacts,
  bridge: Bridge | undefined,
  after: string,
  provenance: Provenance,
  version: string,
  wiredReason: string,
): StepResult {
  const isMapApi = bridge?.kind === 'map-api';
  const path = posix.join(facts.sourceRoot, isMapApi ? 'cngx-theme.scss' : 'cngx-theme.css');
  const content = isMapApi
    ? renderMaterialTheme(version, bridge.density, bridge.themePath)
    : renderDefaultTheme(version);
  return result(
    [
      {
        kind: 'create-file',
        id: 'theme:file',
        label: `Create ${path}`,
        reason: isMapApi ? 'bridges the Material theme to the cngx tokens' : 'every system token, ready to override',
        provenance,
        path,
        content,
      },
      {
        kind: 'add-style-entry',
        id: 'theme:entry',
        label: `Add ${path} to the build styles`,
        reason: `after ${after}, so the cngx layer order is set first`,
        provenance,
        project: facts.project,
        path,
        after,
      },
    ],
    facts.cngxThemePath,
    wiredReason,
  );
}
