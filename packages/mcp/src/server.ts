// Builds the @cngx/mcp server over a loaded snapshot: the provenance-bearing
// instructions plus every tool, resource and prompt registration. Transport-free,
// so the stdio entry and the in-process surface pin build the identical server.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DocsIndex } from './core/data/loader.js';
import { COMMANDS } from './core/registry.js';
import { registerCommands } from './mcp-adapter.js';
import { registerResources } from './resources/register-resources.js';
import { registerPrompts } from './prompts/register-prompts.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
) as { version: string };

export interface CreateServerOptions {
  docs: DocsIndex;
  llmDump: string | null;
}

export function createServer({ docs, llmDump }: CreateServerOptions): McpServer {
  const { cngxVersion, generatedAt, schemaVersion } = docs.meta;

  // The instructions report the snapshot provenance once, at connect, so an
  // agent knows which cngx release these answers ground against - the guard
  // against silently answering for a version the consumer does not have.
  const server = new McpServer(
    { name: '@cngx/mcp', version: pkg.version },
    {
      instructions:
        `Query layer over the cngx (@cngx/*) public API. ` +
        `Answers ground against cngx ${cngxVersion ?? 'unknown'} ` +
        `(snapshot ${generatedAt ?? 'unknown'}, schemaVersion ${schemaVersion}). ` +
        `Confirm the consuming app runs a matching cngx release before relying on an answer, ` +
        `or pass an optional version argument to ground a query against another release. ` +
        `The eight query tools are read-only and answer offline by default; find_component, get_api, ` +
        `get_slots, get_theme_tokens, get_di_tokens, and get_config accept an optional version that - when it differs ` +
        `from the bundled snapshot - fetches that release snapshot via the gh CLI, or over HTTPS when gh is ` +
        `missing or fails (fail-safe: no network or an absent asset returns a typed { ok: false, reason }) and answers as ` +
        `{ ok: true, groundedVersion, result }. migrate_usage additionally answers cross-version deltas over the same fetch. ` +
        `The server also serves resources (browse: cngx://catalog, cngx://tokens, cngx://provenance, ` +
        `the cngx://api/{name} template, the cngx://llms index and the cngx://llms-full API dump) ` +
        `and prompts (wire_component, theme_component, migrate_cngx) - ` +
        `all three MCP surface types over the same offline snapshot.`,
    },
  );

  registerCommands(server, COMMANDS, { bundled: docs });
  registerResources(server, docs, llmDump);
  registerPrompts(server);

  return server;
}
