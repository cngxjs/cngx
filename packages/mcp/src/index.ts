#!/usr/bin/env node
// @cngx/mcp - stdio Model Context Protocol server over a bundled compodocx
// snapshot of the cngx (@cngx/*) public API. Loads the snapshot, reports its
// provenance at connect, and registers the read-only query tools. Nothing writes
// to stdout before the transport connects - stdio is the protocol channel, so
// diagnostics go to stderr only.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'node:url';
import { loadBundledDocs, loadBundledLlmDump } from './core/data/loader.js';
import { createServer } from './server.js';

// `src/index.ts` and `dist/index.js` both sit one level below the package root.
const DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url));

async function main(): Promise<void> {
  const server = createServer({
    docs: loadBundledDocs(DATA_DIR),
    llmDump: loadBundledLlmDump(DATA_DIR),
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error('[@cngx/mcp] failed to start:', err instanceof Error ? err.message : err);
  process.exit(1);
});
