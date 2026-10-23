import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  collectPrompts,
  collectResources,
  collectTools,
  COMMAND_REGISTRY,
  OUT,
  readRegistry,
  registryCoverage,
  renderCapabilityModule,
} from '../schematics-mcp-capabilities.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EM_DASH = String.fromCodePoint(0x2014);

const TOOL = `
  export const example = 'Which select fits?';
  export const findThingCommand = defineCommand({
    name: 'find_thing',
    title: 'Find a thing',
    description: 'Searches things ' + "${EM_DASH} fast.",
    input: {},
    run: () => null,
  });
`;

const REGISTRY = {
  path: 'src/core/registry.ts',
  text: `
    import { findThingCommand } from './commands/find-thing.js';
    import { getThingCommand } from './commands/get-thing.js';
    export const COMMANDS = [findThingCommand, getThingCommand];
  `,
};

const definitionFile = (file, name) => ({
  path: `src/core/commands/${file}.ts`,
  text: `export const ${name} = defineCommand({ name: 'x', title: 'X', description: 'X.', input: {}, run: () => null });`,
});

describe('schematics mcp capabilities', () => {
  it('keeps the generated module in sync with the mcp registry', () => {
    expect(readFileSync(resolve(ROOT, OUT), 'utf8')).toBe(renderCapabilityModule(readRegistry()));
  });

  it('keeps the module when a tool changes only its logic', () => {
    const files = readRegistry();
    const touched = files.map((file) =>
      file.path.endsWith('/find-component.ts')
        ? { ...file, text: `${file.text}\nexport const unrelated = 1;\n` }
        : file,
    );

    expect(renderCapabilityModule(touched)).toBe(renderCapabilityModule(files));
  });

  it('lists every command the registry holds, each with an example question', () => {
    const files = readRegistry();
    const commandFiles = files.filter(({ path }) => path.includes('/core/commands/'));
    const registry = {
      path: COMMAND_REGISTRY,
      text: readFileSync(resolve(ROOT, COMMAND_REGISTRY), 'utf8'),
    };
    const tools = collectTools(commandFiles);

    expect(registryCoverage(registry, commandFiles)).toEqual([]);
    expect(tools).toHaveLength(9);
    expect(tools.every((tool) => tool.example.endsWith('?') || tool.example.endsWith('.'))).toBe(
      true,
    );
  });

  it('accepts a registry and definition files that agree', () => {
    expect(
      registryCoverage(REGISTRY, [
        definitionFile('find-thing', 'findThingCommand'),
        definitionFile('get-thing', 'getThingCommand'),
      ]),
    ).toEqual([]);
  });

  it('fails a definition file the registry does not list', () => {
    expect(
      registryCoverage(REGISTRY, [
        definitionFile('find-thing', 'findThingCommand'),
        definitionFile('get-thing', 'getThingCommand'),
        definitionFile('drop-thing', 'dropThingCommand'),
      ]),
    ).toEqual([
      'src/core/commands/drop-thing.ts defines dropThingCommand but COMMANDS does not list it',
    ]);
  });

  it('fails a registry entry without a definition file', () => {
    expect(registryCoverage(REGISTRY, [definitionFile('find-thing', 'findThingCommand')])).toEqual([
      'COMMANDS lists getThingCommand but no definition file exports it',
    ]);
  });

  it('reads a tool registration, joins concatenated strings and replaces dashes', () => {
    expect(collectTools([{ path: 'core/commands/find-thing.ts', text: TOOL }])).toEqual([
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
    expect(() => collectTools([{ path: 'core/commands/find-thing.ts', text }])).toThrow(
      'core/commands/find-thing.ts: the exported `example` is not a string literal',
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
