// get_config - the configuration-cascade surface. Given a CNGX_<X>_CONFIG token
// name, a config stem, or (best-effort) a component/directive name, it returns
// the config token, its co-located config providers, the with* feature functions,
// the static resolution-priority ordering, and how the input resolved.
//
// The correlation anchors on the token's own `file`, never a reconstructed
// provider name: 6 of 29 config surfaces deviate from the provide<Stem>Config
// shape (provideCngxPaginatorConfig, provideFeedback, provideFormField, ...), so
// a name-reconstruction join returns null for them. Reading the co-located
// functions instead survives every naming deviation and the shared
// forms/select/shared/ directory (each surface owns its own token file).

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocFunction, DocToken } from '../data/types.js';
import { resolveEntry } from '../query.js';

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
function resolveConfigToken(docs: DocsIndex, name: string): { token: DocToken; via: ConfigResolvedVia } | null {
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
  if (byComponent) {
    return { token: byComponent, via: 'component' };
  }

  return null;
}

// Best-effort priority-3: map a component/directive to the config token whose
// feature directory is the nearest ancestor of the component's file. Deepest
// match wins; the shortest token name breaks a tie so the select family's shared
// directory (three tokens, one feature root) resolves to the generic
// CNGX_SELECT_CONFIG rather than its action/reorderable neighbours. Absence of
// any ancestor config token returns null - this never forces a wrong cascade.
function resolveComponentToken(docs: DocsIndex, tokens: DocToken[], name: string): DocToken | null {
  const match = resolveEntry(docs, name);
  if (!match?.entry.file) {
    return null;
  }
  const componentDir = dirOf(match.entry.file);
  const candidates = tokens
    .filter((token) => token.file !== undefined)
    .map((token) => ({ token, root: featureDir(token.file!) }))
    .filter(({ root }) => root !== '' && isAncestorOrEqual(root, componentDir))
    .sort((a, b) => b.root.length - a.root.length || a.token.name.length - b.token.name.length);
  return candidates[0]?.token ?? null;
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

/** Pure query behind the tool - returns `null` when no config token resolves. */
export function getConfig(docs: DocsIndex, name: string): ConfigResult | null {
  const resolved = resolveConfigToken(docs, name);
  if (!resolved) {
    return null;
  }
  const { token, via } = resolved;
  const tokenFile = token.file ?? '';

  const providers = collectByKind(docs, tokenFile, 'provider').map((fn) => fn.name);

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
  // throwing (2 of 603 functions carry none; neither is a config feature).
  const features: ConfigFeature[] = collectByKind(docs, tokenFile, 'feature')
    .filter((fn): fn is DocFunction & { returnType: string } => fn.returnType !== undefined)
    .map((fn) => ({ name: fn.name, returnType: fn.returnType }));

  return {
    token: token.name,
    providers,
    features,
    resolutionPriority: [...RESOLUTION_PRIORITY],
    resolvedVia: via,
  };
}

export function registerGetConfig(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'get_config',
    {
      title: 'Get a cngx configuration cascade',
      description:
        'Return a config surface: the CNGX_<X>_CONFIG token, its co-located provider functions, the ' +
        'with* feature functions, and the resolution-priority ordering. Accepts a config token name ' +
        '(CNGX_SELECT_CONFIG), a config stem (select), or best-effort a component/directive name ' +
        '(CngxCombobox -> CNGX_SELECT_CONFIG). Returns null when the input maps to no config token.',
      inputSchema: {
        name: z
          .string()
          .describe('A config token (CNGX_SELECT_CONFIG), a stem (select), or a component name (CngxSelect).'),
      },
    },
    ({ name }) => jsonResult(getConfig(docs, name)),
  );
}
