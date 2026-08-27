// MCP resources over the bundled snapshot - the browse surface that complements
// the imperative query tools. Each resource body reuses an existing pure query
// (listComponents / getDiTokens / getApi) or reads docs.meta directly, so the
// resource layer is registration plumbing, not a second projection of the data.

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import type { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import type { DocsIndex } from '../data/loader.js';
import { allEntries } from '../query.js';
import { listComponents } from '../tools/list-components.js';
import { getDiTokens } from '../tools/get-di-tokens.js';
import { getApi } from '../tools/get-api.js';

const JSON_MIME = 'application/json';

function jsonResource(uri: URL | string, value: unknown): ReadResourceResult {
  const href = typeof uri === 'string' ? uri : uri.href;
  return { contents: [{ uri: href, mimeType: JSON_MIME, text: JSON.stringify(value, null, 2) }] };
}

const MARKDOWN_MIME = 'text/markdown';

function textResource(uri: URL | string, mimeType: string, text: string): ReadResourceResult {
  const href = typeof uri === 'string' ? uri : uri.href;
  return { contents: [{ uri: href, mimeType, text }] };
}

// The base for the `cngx://llms` pointer links - the same production GH Pages
// root `scripts/llms-publish.mjs` writes into its `llms.txt`, kept in sync by hand
// (the published script's `DEFAULT_BASE_URL`). No trailing slash.
const DOCS_BASE_URL = 'https://cngxjs.github.io/cngx';

// The one part of the index with no runtime source: the published package list.
// Seven stable `@cngx/*` names; a new lib adds one line here, tracked like the
// other per-lib registration touchpoints. Pinned non-empty + `@cngx/*` by spec.
const CNGX_PACKAGES: readonly { name: string; description: string }[] = [
  { name: '@cngx/utils', description: 'Framework-agnostic utilities and tree helpers.' },
  { name: '@cngx/core', description: 'DI tokens, coercion, selection and async-state primitives.' },
  {
    name: '@cngx/common',
    description: 'Signal-native atoms and molecules: a11y, interactive, display, data.',
  },
  {
    name: '@cngx/forms',
    description: 'Signal-Forms controls, validators, field bridges and the select family.',
  },
  {
    name: '@cngx/data-display',
    description: 'Data-display organisms including the CDK treetable.',
  },
  {
    name: '@cngx/ui',
    description: 'Composed UI organisms with opt-in Material and overlay layers.',
  },
  { name: '@cngx/themes', description: 'Material bridge mixins and theming tokens.' },
];

/**
 * `cngx://catalog` body - the full component + directive catalog. Reuses
 * `listComponents` verbatim so the resource and the `list_components` tool share
 * one enumeration and one `lib` derivation (via `entryLib`); the catalog is that
 * tool served as a browseable resource, not a re-projection.
 */
export function readCatalog(
  docs: DocsIndex,
  uri: URL | string = 'cngx://catalog',
): ReadResourceResult {
  return jsonResource(uri, listComponents(docs));
}

/** `cngx://tokens` body - the top-level DI token list, reusing `getDiTokens`. */
export function readTokens(
  docs: DocsIndex,
  uri: URL | string = 'cngx://tokens',
): ReadResourceResult {
  return jsonResource(uri, getDiTokens(docs));
}

/** `cngx://provenance` body - the snapshot meta (cngx version, generatedAt, schemaVersion). */
export function readProvenance(
  docs: DocsIndex,
  uri: URL | string = 'cngx://provenance',
): ReadResourceResult {
  return jsonResource(uri, docs.meta);
}

/**
 * `cngx://api/{name}` body - one symbol's API via `getApi`. A name that resolves
 * to nothing yields an empty resource (`contents: []`), the read-side mirror of
 * the tool returning `null`: "no such symbol", not an error.
 */
export function readApi(docs: DocsIndex, name: string, uri: URL | string): ReadResourceResult {
  const api = getApi(docs, name);
  if (api === null) {
    return { contents: [] };
  }
  return jsonResource(uri, api);
}

/**
 * Autocomplete candidates for the `{name}` variable of `cngx://api/{name}` -
 * component/directive class names matching the partial the client has typed
 * (case-insensitive substring), sorted. An empty partial offers the whole
 * surface. Capped at the MCP 100-item completion ceiling.
 */
export function completeApiName(docs: DocsIndex, value: string): string[] {
  const needle = value.trim().toLowerCase();
  return allEntries(docs)
    .map(({ entry }) => entry.name)
    .filter((name) => needle === '' || name.toLowerCase().includes(needle))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 100);
}

/**
 * `cngx://llms` body - the `llms.txt`-equivalent index composed at read-time from
 * the bundled `DocsIndex`: title + tagline, the per-kind documented-exports count,
 * the API-reference pointer links against {@link DOCS_BASE_URL}, and the package
 * list. Conceptually aligned with `buildIndex` in `scripts/llms-publish.mjs` but
 * grounded against the runtime snapshot (`docs.<kind>.length`) instead of the
 * build-time llm-md dump, so the index is offline and version-pinned rather than
 * a live GitHub Pages fetch.
 */
export function readLlms(docs: DocsIndex, uri: URL | string = 'cngx://llms'): ReadResourceResult {
  const counts = [
    { kind: 'components', count: docs.components.length },
    { kind: 'directives', count: docs.directives.length },
    { kind: 'tokens', count: docs.tokens.length },
    { kind: 'functions', count: docs.functions.length },
  ];
  const total = counts.reduce((sum, entry) => sum + entry.count, 0);
  const breakdown = counts.map((entry) => `${entry.count} ${entry.kind}`).join(', ');
  const body = [
    '# cngx',
    '',
    '> Signal-native Angular component library: atoms, molecules and organisms',
    '> composed on plain Angular Signals and modern DOM. CDK and Material are',
    '> opt-in primitives, not foundations. A11y is part of the computed() graph.',
    '',
    `${total} documented exports (${breakdown}).`,
    '',
    '## API Reference',
    '',
    `- [Full API dump, llm-md format](${DOCS_BASE_URL}/llms-full.txt): every exported artifact with selector, inputs, outputs, description and live-example URLs`,
    `- [Documentation site](${DOCS_BASE_URL}/): rendered docs including core concepts and per-component theming tokens`,
    `- [Live examples](${DOCS_BASE_URL}/examples/): runnable demos, one route per example`,
    '',
    '## Packages',
    '',
    ...CNGX_PACKAGES.map(
      (pkg) => `- [${pkg.name}](https://www.npmjs.com/package/${pkg.name}): ${pkg.description}`,
    ),
    '',
  ].join('\n');
  return textResource(uri, MARKDOWN_MIME, body);
}

// A single URI-template variable resolves to a string, but the SDK types it as
// `string | string[]`; take the first when an array slips through.
function firstValue(value: Variables[string]): string {
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

export function registerResources(server: McpServer, docs: DocsIndex): void {
  server.registerResource(
    'catalog',
    'cngx://catalog',
    {
      title: 'cngx component catalog',
      description:
        'Every cngx component and directive as { name, kind, selector, category, lib }, ' +
        'sorted by name. The browse view of list_components.',
      mimeType: JSON_MIME,
    },
    (uri) => readCatalog(docs, uri),
  );

  server.registerResource(
    'tokens',
    'cngx://tokens',
    {
      title: 'cngx DI tokens',
      description: 'The top-level DI injection tokens as { name, file, description }.',
      mimeType: JSON_MIME,
    },
    (uri) => readTokens(docs, uri),
  );

  server.registerResource(
    'provenance',
    'cngx://provenance',
    {
      title: 'cngx snapshot provenance',
      description: 'Snapshot meta: cngx version, generatedAt, schemaVersion, compodocx version.',
      mimeType: JSON_MIME,
    },
    (uri) => readProvenance(docs, uri),
  );

  server.registerResource(
    'api',
    new ResourceTemplate('cngx://api/{name}', {
      list: undefined,
      complete: { name: (value) => completeApiName(docs, value) },
    }),
    {
      title: 'cngx component API',
      description:
        "One component or directive's API surface (inputs, outputs, signal flag, host bindings, " +
        'methods) by class name or selector. An unknown name yields an empty resource.',
      mimeType: JSON_MIME,
    },
    (uri, variables) => readApi(docs, firstValue(variables.name), uri),
  );

  server.registerResource(
    'llms',
    'cngx://llms',
    {
      title: 'cngx llms.txt index',
      description:
        'The llms.txt-equivalent entry index - documented-exports counts, API-reference ' +
        'pointer links and the package list - composed offline from the bundled snapshot.',
      mimeType: MARKDOWN_MIME,
    },
    (uri) => readLlms(docs, uri),
  );
}
