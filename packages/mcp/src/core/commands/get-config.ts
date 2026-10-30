// get_config - the configuration-cascade surface. Given a CNGX_<X>_CONFIG token
// name, a config stem, or (best-effort) a component/directive name, it returns
// the config token, its co-located config providers, the with* feature functions,
// the static resolution-priority ordering, and how the input resolved.
//
// The correlation anchors on the token's own `file`, never a reconstructed
// provider name: several config surfaces deviate from the provide<Stem>Config
// shape (provideCngxPaginatorConfig, provideFeedback, provideFormField, ...), so
// a name-reconstruction join returns null for them. Reading the co-located
// functions instead survives every naming deviation and the shared
// forms/select/shared/ directory (each surface owns its own token file).

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import { byCodePoint } from '../data/order.js';
import type { DocFunction, DocToken } from '../data/types.js';
import type { AmbiguousMatch } from '../query.js';
import { allEntries, foundUnlessAmbiguous, isAmbiguous, resolveEntry } from '../query.js';
import { ambiguousMarkdown, blocks, bullets, code, section, table } from './markdown.js';

/** How the input mapped to the resolved config token. */
export type ConfigResolvedVia = 'token' | 'stem' | 'component';

export interface ConfigFeature {
  name: string;
  returnType: string;
}

export interface ConfigResult {
  token: string;
  providers: string[];
  features: ConfigFeature[];
  resolutionPriority: string[];
  resolvedVia: ConfigResolvedVia;
}

// The resolution order any config setting follows, from the architecture's
// "Configuration cascade": per-instance input wins, then component-scope
// providers, then root providers, then the library default.
const RESOLUTION_PRIORITY: readonly string[] = [
  'Per-instance input (e.g. [panelWidth])',
  'provide<X>ConfigAt(...) in viewProviders (component scope)',
  'provide<X>Config(...) at app root',
  'Library default (CNGX_<X>_DEFAULTS)',
];

const CONFIG_TOKEN = /^CNGX_.*_CONFIG$/;

/** The directory a file sits in, or '' when the path carries no directory. */
function dirOf(file: string): string {
  const slash = file.lastIndexOf('/');
  return slash === -1 ? '' : file.slice(0, slash);
}

// The feature directory a config token belongs to. Config tokens live either
// directly in their feature directory (menu-config.ts) or in a `shared`/`config`
// subdirectory (the select family's shared/, the 7 config/*.defaults.ts splits).
// Stripping that trailing segment yields the feature root, so a component sitting
// in a sibling directory (combobox/ next to shared/) resolves to its token.
function featureDir(file: string): string {
  const dir = dirOf(file);
  const base = dir.slice(dir.lastIndexOf('/') + 1);
  if (base === 'shared' || base === 'config') {
    return dirOf(dir);
  }
  return dir;
}

function isAncestorOrEqual(ancestor: string, target: string): boolean {
  return target === ancestor || target.startsWith(`${ancestor}/`);
}

/** `CNGX_ACTION_SELECT_CONFIG` -> `action-select`; the stem used for lookup. */
function tokenStem(name: string): string {
  return name.slice('CNGX_'.length, -'_CONFIG'.length).toLowerCase().replace(/_/g, '-');
}

/** `CNGX_ACTION_SELECT_CONFIG` -> `ActionSelect`; the aggregator's Pascal stem. */
function pascalStem(name: string): string {
  return name
    .slice('CNGX_'.length, -'_CONFIG'.length)
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join('');
}

function configTokens(docs: DocsIndex): DocToken[] {
  return docs.tokens.filter((token) => CONFIG_TOKEN.test(token.name));
}

/** Resolve the input to a config token, priority: exact name -> stem -> component. */
function resolveConfigToken(
  docs: DocsIndex,
  name: string,
): { token: DocToken; via: ConfigResolvedVia } | AmbiguousMatch | null {
  const needle = name.trim().toLowerCase();
  if (needle === '') {
    return null;
  }
  const tokens = configTokens(docs);

  const byName = tokens.find((token) => token.name.toLowerCase() === needle);
  if (byName) {
    return { token: byName, via: 'token' };
  }

  const stem = needle.replace(/_/g, '-');
  const byStem = tokens.find((token) => tokenStem(token.name) === stem);
  if (byStem) {
    return { token: byStem, via: 'stem' };
  }

  const byComponent = resolveComponentToken(docs, tokens, name);
  if (isAmbiguous(byComponent)) {
    return byComponent;
  }
  if (byComponent) {
    return { token: byComponent, via: 'component' };
  }

  return null;
}

// Best-effort priority-3: map a component/directive to the config token whose
// feature directory is the nearest ancestor of the component's file. Deepest
// match wins; the shortest token name breaks a tie so the select family's shared
// directory (three tokens, one feature root) resolves to the generic
// CNGX_SELECT_CONFIG rather than its action/reorderable neighbours, and code-point
// order breaks a tie of equal-length names so token order never decides. Absence
// of any ancestor config token returns null - this never forces a wrong cascade.
function nearestConfigToken(tokens: DocToken[], file: string): DocToken | null {
  const componentDir = dirOf(file);
  const candidates = tokens
    .filter((token): token is DocToken & { file: string } => token.file !== undefined)
    .map((token) => ({ token, root: featureDir(token.file) }))
    .filter(({ root }) => root !== '' && isAncestorOrEqual(root, componentDir))
    .sort(
      (a, b) =>
        b.root.length - a.root.length || a.token.name.length - b.token.name.length || byCodePoint(a.token.name, b.token.name),
    );
  return candidates[0]?.token ?? null;
}

// An ambiguous selector still has one answer when every candidate maps to the
// same config token (both breadcrumb sync directives sit under the breadcrumb
// config); only candidates that disagree, or one without a token, keep the ambiguity
// so the caller can list them.
function resolveComponentToken(docs: DocsIndex, tokens: DocToken[], name: string): DocToken | AmbiguousMatch | null {
  const match = resolveEntry(docs, name);
  if (isAmbiguous(match)) {
    const entries = allEntries(docs);
    const mapped = match.candidates.map((candidate) => {
      const file = entries.find(({ entry, kind }) => entry.name === candidate.name && kind === candidate.kind)?.entry.file;
      return file ? nearestConfigToken(tokens, file) : null;
    });
    const [first] = mapped;
    if (first && mapped.every((token) => token?.name === first.name)) {
      return first;
    }
    return match;
  }
  if (!match?.entry.file) {
    return null;
  }
  return nearestConfigToken(tokens, match.entry.file);
}

/** Providers/features co-located with the token's file, falling back to its directory. */
function collectByKind(docs: DocsIndex, tokenFile: string, kind: DocFunction['factoryKind']): DocFunction[] {
  // A token with no file has nothing to anchor on. Return empty rather than let
  // dirOf('') === '' capture every function whose file carries no directory.
  if (tokenFile === '') {
    return [];
  }
  const inFile = docs.functions.filter((fn) => fn.factoryKind === kind && fn.file === tokenFile);
  if (inFile.length > 0) {
    return inFile;
  }
  const tokenDir = dirOf(tokenFile);
  return docs.functions.filter((fn) => fn.factoryKind === kind && fn.file !== undefined && dirOf(fn.file) === tokenDir);
}

/** Pure query behind the tool - `null` when no config token resolves, the ambiguity when a component selector matches several entries. */
export function getConfig(docs: DocsIndex, name: string): ConfigResult | AmbiguousMatch | null {
  const resolved = resolveConfigToken(docs, name);
  if (!resolved || isAmbiguous(resolved)) {
    return resolved;
  }
  const { token, via } = resolved;
  const tokenFile = token.file ?? '';

  // Code-point order, so the answer never follows the snapshot's `functions` order.
  const providers = collectByKind(docs, tokenFile, 'provider')
    .map((fn) => fn.name)
    .sort(byCodePoint);

  // The convenience aggregator (provideCngxSelect) lives in its own file, so the
  // file anchor never reaches it. Append it by exact-name lookup when present -
  // the one name-based lookup, and non-load-bearing: its absence never changes
  // resolution, so no cascade returns null because an aggregator name failed.
  const aggregator = `provideCngx${pascalStem(token.name)}`;
  if (docs.functions.some((fn) => fn.name === aggregator) && !providers.includes(aggregator)) {
    providers.push(aggregator);
  }

  // Features carry exactly one config-feature returnType, read from the
  // co-located functions. Skip functions whose returnType is absent rather than
  // throwing (a few non-config functions carry none).
  const features: ConfigFeature[] = collectByKind(docs, tokenFile, 'feature')
    .filter((fn): fn is DocFunction & { returnType: string } => fn.returnType !== undefined)
    .map((fn) => ({ name: fn.name, returnType: fn.returnType }))
    .sort((a, b) => byCodePoint(a.name, b.name));

  return {
    token: token.name,
    providers,
    features,
    resolutionPriority: [...RESOLUTION_PRIORITY],
    resolvedVia: via,
  };
}

/** The cascade: token, providers, features and the resolution order. */
export function configMarkdown(config: ConfigResult | AmbiguousMatch | null): string {
  if (!config) {
    return 'No config token for that name.\n';
  }
  if (isAmbiguous(config)) {
    return ambiguousMarkdown(config);
  }
  const features = config.features.map((f) => [code(f.name), code(f.returnType)]);
  return blocks(
    `# ${config.token}`,
    `Resolved via: ${config.resolvedVia}`,
    section('Providers', bullets(config.providers.map((p) => code(p))), 'None.'),
    section('Features', features.length ? table(['Function', 'Returns'], features) : '', 'None.'),
    section('Resolution priority', config.resolutionPriority.map((step, i) => `${i + 1}. ${step}`).join('\n'), 'None.'),
  );
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'How do I set app-wide defaults for CngxSelect?';

export const getConfigCommand = defineCommand({
  name: 'get_config',
  title: 'Get a cngx configuration cascade',
  description:
    'Return a config surface: the CNGX_<X>_CONFIG token, its co-located provider functions, the ' +
    'with* feature functions, and the resolution-priority ordering. Accepts a config token name ' +
    '(CNGX_SELECT_CONFIG), a config stem (select), or best-effort a component/directive name ' +
    '(CngxCombobox -> CNGX_SELECT_CONFIG). `result` is null when the input maps to no config token, and ' +
    '`{ ambiguous: true, candidates }` when a component selector matches several entries.',
  cliSummary:
    'Print a config surface: the CNGX_<X>_CONFIG token, its provider functions, the with* features and the resolution order. Takes a token name (CNGX_SELECT_CONFIG), a stem (select) or a component name (CngxCombobox). Exits 1 when nothing maps to a config token or a selector matches several entries.',
  cliName: 'config',
  input: {
    name: z
      .string()
      .trim()
      .min(1)
      .describe('A config token (CNGX_SELECT_CONFIG), a stem (select), or a component name (CngxSelect).'),
    version: versionInput,
  },
  positional: 'name',
  cliFlags: { version: 'cngx-version' },
  run: (ctx, { name, version }) => answerVersioned(ctx.resolve, version, (resolved) => getConfig(resolved, name)),
  found: foundUnlessAmbiguous,
  toMarkdown: (config: ConfigResult | AmbiguousMatch | null) => configMarkdown(config),
});
