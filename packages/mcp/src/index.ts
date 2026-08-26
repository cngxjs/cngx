#!/usr/bin/env node
// @cngx/mcp - stdio Model Context Protocol server over a bundled compodocx
// snapshot of the cngx (@cngx/*) public API. Loads the snapshot, reports its
// provenance at connect, and registers the read-only query tools. Nothing writes
// to stdout before the transport connects - stdio is the protocol channel, so
// diagnostics go to stderr only.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBundledDocs } from './data/loader.js';
import { registerFindComponent } from './tools/find-component.js';
import { registerListComponents } from './tools/list-components.js';
import { registerGetApi } from './tools/get-api.js';
import { registerGetSlots } from './tools/get-slots.js';
import { registerGetThemeTokens } from './tools/get-theme-tokens.js';
import { registerGetDiTokens } from './tools/get-di-tokens.js';
import { registerGetConfig } from './tools/get-config.js';
import { registerGetStoryExample } from './tools/get-story-example.js';
import { registerMigrateUsage } from './tools/migrate-usage.js';
import { registerResources } from './resources/register-resources.js';
import { registerPrompts } from './prompts/register-prompts.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
) as { version: string };

async function main(): Promise<void> {
  const docs = loadBundledDocs();
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
        `from the bundled snapshot - fetches that release snapshot via the gh CLI (fail-safe: a missing gh, ` +
        `no network, or an absent asset returns a typed { ok: false, reason }) and reports the groundedVersion ` +
        `it resolved. migrate_usage additionally answers cross-version deltas over the same fetch. ` +
        `The server also serves resources (browse: cngx://catalog, cngx://tokens, cngx://provenance, ` +
        `and the cngx://api/{name} template) and prompts (wire_component, theme_component, migrate_cngx) - ` +
        `all three MCP surface types over the same offline snapshot.`,
    },
  );

  registerFindComponent(server, docs);
  registerListComponents(server, docs);
  registerGetApi(server, docs);
  registerGetSlots(server, docs);
  registerGetThemeTokens(server, docs);
  registerGetDiTokens(server, docs);
  registerGetConfig(server, docs);
  registerGetStoryExample(server, docs);
  registerMigrateUsage(server, docs);

  registerResources(server, docs);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error('[@cngx/mcp] failed to start:', err instanceof Error ? err.message : err);
  process.exit(1);
});
