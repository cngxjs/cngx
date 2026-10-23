// Pins the MCP tool surface (instructions + per-tool name, title, description,
// inputSchema) against `__fixtures__/tool-surface.json`.
//
// Fixture source: first captured from `createServer` at commit
// "refactor(mcp): build the MCP server through a factory", recaptured at
// "docs(mcp): describe the gh-or-https snapshot fetch everywhere it is named"
// (version and migrate_usage descriptions, instructions), built over the fixed
// fixtures `test/fixtures/documentation.sample.json` and
// `test/fixtures/llm-context.sample.md` - never the bundled snapshot, whose
// cngxVersion and generatedAt change on every `npm run mcp:snapshot`.
// Capture command (only in a commit whose subject names the surface change):
//   CNGX_MCP_CAPTURE_SURFACE=1 npx vitest run --config packages/mcp/vitest.config.mjs src/tool-surface.spec.ts

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadDocsFromFile, loadLlmDumpFromFile } from './core/data/loader.js';
import { createServer } from './server.js';
import { diffSurface, type ToolSurface } from './testing/tool-surface.js';

const DOCS_FIXTURE = fileURLToPath(new URL('../test/fixtures/documentation.sample.json', import.meta.url));
const LLM_FIXTURE = fileURLToPath(new URL('../test/fixtures/llm-context.sample.md', import.meta.url));
const SURFACE_FIXTURE = fileURLToPath(new URL('./__fixtures__/tool-surface.json', import.meta.url));

async function readLiveSurface(): Promise<ToolSurface> {
  const server = createServer({
    docs: loadDocsFromFile(DOCS_FIXTURE),
    llmDump: loadLlmDumpFromFile(LLM_FIXTURE),
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'tool-surface-pin', version: '0.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const { tools } = await client.listTools();
  const surface: ToolSurface = {
    instructions: client.getInstructions(),
    tools: tools.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema })),
  };
  await client.close();
  return surface;
}

function clone(surface: ToolSurface): ToolSurface {
  return JSON.parse(JSON.stringify(surface)) as ToolSurface;
}

describe('MCP tool surface pin', () => {
  let live: ToolSurface;
  let pinned: ToolSurface;

  beforeAll(async () => {
    live = await readLiveSurface();
    if (process.env['CNGX_MCP_CAPTURE_SURFACE'] === '1') {
      writeFileSync(SURFACE_FIXTURE, `${JSON.stringify(live, null, 2)}\n`);
    }
    pinned = JSON.parse(readFileSync(SURFACE_FIXTURE, 'utf8')) as ToolSurface;
  });

  it('matches the pinned fixture exactly', () => {
    expect(diffSurface(live, pinned)).toEqual([]);
  });

  it('pins nine tools', () => {
    expect(pinned.tools).toHaveLength(9);
  });

  it('reports a renamed tool', () => {
    const mutated = clone(live);
    mutated.tools[0]!.name = 'renamed_tool';

    expect(diffSurface(mutated, pinned)).toEqual(
      expect.arrayContaining([`tool ${live.tools[0]!.name} missing`, 'tool renamed_tool not pinned']),
    );
  });

  it('reports a changed description', () => {
    const mutated = clone(live);
    mutated.tools[1]!.description = `${mutated.tools[1]!.description ?? ''} (changed)`;

    expect(diffSurface(mutated, pinned)).toEqual([`tool ${live.tools[1]!.name}: description changed`]);
  });

  it('reports a dropped input field', () => {
    const mutated = clone(live);
    const target = mutated.tools.find(
      (tool) => Object.keys((tool.inputSchema as { properties?: object }).properties ?? {}).length > 0,
    )!;
    const properties = (target.inputSchema as { properties: Record<string, unknown> }).properties;
    delete properties[Object.keys(properties)[0]!];

    expect(diffSurface(mutated, pinned)).toEqual([`tool ${target.name}: inputSchema changed`]);
  });

  it('reports changed instructions', () => {
    const mutated = clone(live);
    mutated.instructions = `${mutated.instructions ?? ''} extra`;

    expect(diffSurface(mutated, pinned)).toEqual(['instructions changed']);
  });

  it('reports a reordered tool list', () => {
    const mutated = clone(live);
    mutated.tools.reverse();

    expect(diffSurface(mutated, pinned)).toEqual(['tool order changed']);
  });
});
