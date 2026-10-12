import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  collectPrompts,
  collectResources,
  collectTools,
  MCP_REGISTRY_ROOT,
  OUT,
  readRegistry,
  renderCapabilityModule,
} from '../schematics-mcp-capabilities.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EM_DASH = String.fromCodePoint(0x2014);

const TOOL = `
  export const example = 'Which select fits?';
  export function registerFindThing(server) {
    server.registerTool(
      'find_thing',
      {
        title: 'Find a thing',
        description: 'Searches things ' + "${EM_DASH} fast.",
        inputSchema: {},
      },
      () => null,
    );
  }
`;

describe('schematics mcp capabilities', () => {
  it('keeps the generated module in sync with the mcp registry', () => {
    expect(readFileSync(resolve(ROOT, OUT), 'utf8')).toBe(renderCapabilityModule(readRegistry()));
  });

  it('lists every tool the server registers, each with an example question', () => {
    const index = readFileSync(resolve(ROOT, MCP_REGISTRY_ROOT, 'index.ts'), 'utf8');
    const registered = [...index.matchAll(/^\s*(register\w+)\(server, docs\);/gm)].map(
      (match) => match[1],
    );
    const tools = collectTools(readRegistry().filter(({ path }) => path.includes('/tools/')));

    expect(tools).toHaveLength(registered.length);
    expect(tools.every((tool) => tool.example.endsWith('?') || tool.example.endsWith('.'))).toBe(
      true,
    );
  });

  it('reads a tool registration, joins concatenated strings and replaces dashes', () => {
    expect(collectTools([{ path: 'tools/find-thing.ts', text: TOOL }])).toEqual([
      {
        name: 'find_thing',
        title: 'Find a thing',
        description: 'Searches things - fast.',
        example: 'Which select fits?',
      },
    ]);
  });

  it('fails a tool without an exported example instead of listing it silently', () => {
    const text = TOOL.replace("export const example = 'Which select fits?';", '');
    expect(() => collectTools([{ path: 'tools/find-thing.ts', text }])).toThrow(
      'tools/find-thing.ts: the exported `example` is not a string literal',
    );
  });

  it('reads literal and template resource uris and prompt registrations', () => {
    const resources = `
      server.registerResource('catalog', 'cngx://catalog', { title: 'Catalog', description: 'All entries.' }, read);
      server.registerResource('api', new ResourceTemplate('cngx://api/{name}', {}), { title: 'API', description: 'One entry.' }, read);
    `;
    const prompts = `server.registerPrompt('wire', { title: 'Wire', description: 'Wire one.', argsSchema: {} }, wire);`;

    expect(collectResources({ path: 'r.ts', text: resources })).toEqual([
      { name: 'catalog', uri: 'cngx://catalog', title: 'Catalog', description: 'All entries.' },
      { name: 'api', uri: 'cngx://api/{name}', title: 'API', description: 'One entry.' },
    ]);
    expect(collectPrompts({ path: 'p.ts', text: prompts })).toEqual([
      { name: 'wire', title: 'Wire', description: 'Wire one.' },
    ]);
  });
});
