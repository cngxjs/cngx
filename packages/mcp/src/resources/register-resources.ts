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

/**
 * `cngx://catalog` body - the full component + directive catalog. Reuses
 * `listComponents` verbatim so the resource and the `list_components` tool share
 * one enumeration and one `lib` derivation (via `entryLib`); the catalog is that
 * tool served as a browseable resource, not a re-projection.
 */
export function readCatalog(docs: DocsIndex, uri: URL | string = 'cngx://catalog'): ReadResourceResult {
  return jsonResource(uri, listComponents(docs));
}

/** `cngx://tokens` body - the top-level DI token list, reusing `getDiTokens`. */
export function readTokens(docs: DocsIndex, uri: URL | string = 'cngx://tokens'): ReadResourceResult {
  return jsonResource(uri, getDiTokens(docs));
}

/** `cngx://provenance` body - the snapshot meta (cngx version, generatedAt, schemaVersion). */
export function readProvenance(docs: DocsIndex, uri: URL | string = 'cngx://provenance'): ReadResourceResult {
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
}
