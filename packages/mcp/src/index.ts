#!/usr/bin/env node
// @cngx/mcp - stdio Model Context Protocol server over a bundled compodocx
// snapshot of the cngx (@cngx/*) public API. Phase 1: the server starts cleanly
// and registers no tools; the five query tools land in Phase 2. Nothing writes
// to stdout before the transport connects - stdio is the protocol channel, so
// diagnostics go to stderr only.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBundledDocs } from './data/loader.js';
import { registerFindComponent } from './tools/find-component.js';
import { registerGetApi } from './tools/get-api.js';
import { registerGetSlots } from './tools/get-slots.js';
import { registerGetTokens } from './tools/get-tokens.js';
import { registerGetStoryExample } from './tools/get-story-example.js';

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
        `Read-only query layer over the cngx (@cngx/*) public API. ` +
        `Answers ground against cngx ${cngxVersion ?? 'unknown'} ` +
        `(snapshot ${generatedAt ?? 'unknown'}, schemaVersion ${schemaVersion}). ` +
        `Confirm the consuming app runs a matching cngx release before relying on an answer.`,
    },
  );

  registerFindComponent(server, docs);
  registerGetApi(server, docs);
  registerGetSlots(server, docs);
  registerGetTokens(server, docs);
  registerGetStoryExample(server, docs);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error('[@cngx/mcp] failed to start:', err instanceof Error ? err.message : err);
  process.exit(1);
});
