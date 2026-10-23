#!/usr/bin/env node
// @cngx/mcp - stdio Model Context Protocol server over a bundled compodocx
// snapshot of the cngx (@cngx/*) public API. Loads the snapshot, reports its
// provenance at connect, and registers the read-only query tools. Nothing writes
// to stdout before the transport connects - stdio is the protocol channel, so
// diagnostics go to stderr only.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadBundledDocs, loadBundledLlmDump } from './data/loader.js';
import { createServer } from './server.js';

async function main(): Promise<void> {
  const server = createServer({ docs: loadBundledDocs(), llmDump: loadBundledLlmDump() });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error('[@cngx/mcp] failed to start:', err instanceof Error ? err.message : err);
  process.exit(1);
});
