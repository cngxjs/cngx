// Source of every expected value: packages/mcp/test/fixtures/documentation.sample.json
// (schema 2, cngxVersion 0.1.0-rc.6) for the eight query commands, and the
// documentation.v-old.sample.json -> documentation.v-new.sample.json pair (0.1.0
// -> 0.2.0) for migrate. Never the regenerated bundled snapshot: its content
// moves with every `mcp:snapshot`. The CLI names (`find`, `api`, ...) and the
// `--cngx-version` flag come from the plan's locked command list.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { CngxCommand, CommandContext } from '../registry.js';
import { COMMANDS, defaultFound, isFound, unwrapAnswer } from '../registry.js';
import { createDocsResolver } from '../data/docs-resolver.js';
import { loadDocsFromFile } from '../data/loader.js';
import { cell, table, toPlainText } from './markdown.js';
import type { ApiResult } from './get-api.js';
import { apiMarkdown, getApi } from './get-api.js';

const fixture = (name: string) => fileURLToPath(new URL(`../../../test/fixtures/${name}`, import.meta.url));
const bundled = loadDocsFromFile(fixture('documentation.sample.json'));
const ctx: CommandContext = { bundled, resolve: createDocsResolver(bundled) };

const byCli = (cliName: string): CngxCommand => {
  const def = COMMANDS.find((command) => command.cliName === cliName);
  if (!def) {
    throw new Error(`no command ${cliName}`);
  }
  return def;
};

async function render(cliName: string, input: Record<string, unknown>, context: CommandContext = ctx) {
  const def = byCli(cliName);
  const answer = unwrapAnswer(await def.run(context, input as never));
  if (!answer.ok) {
    throw new Error(answer.message);
  }
  return { markdown: def.toMarkdown(answer.payload, {}), found: isFound(def, answer.payload) };
}

const VERSIONED = ['find', 'api', 'slots', 'theme', 'di', 'config'];

describe('command definitions carry their CLI surface', () => {
  it('names the nine CLI subcommands, each once', () => {
    expect(COMMANDS.map((def) => def.cliName)).toEqual([
      'find',
      'list',
      'api',
      'slots',
      'theme',
      'di',
      'config',
      'example',
      'migrate',
    ]);
  });

  it.each(COMMANDS.map((def) => [def.cliName, def] as const))('%s: positional and cliFlags name input fields', (_, def) => {
    const fields = Object.keys(def.input);
    if (def.positional !== undefined) {
      expect(fields).toContain(def.positional);
    }
    for (const field of Object.keys(def.cliFlags ?? {})) {
      expect(fields).toContain(field);
    }
  });

  it('maps version to --cngx-version on exactly the six version-scoped commands', () => {
    const flagged = COMMANDS.filter((def) => def.cliFlags?.['version'] === 'cngx-version').map((def) => def.cliName);

    expect(flagged.sort()).toEqual([...VERSIONED].sort());
    for (const def of COMMANDS) {
      expect('version' in def.input).toBe(VERSIONED.includes(def.cliName));
    }
  });

  const NAMED = ['find', 'api', 'slots', 'theme', 'config', 'example'];

  it.each(NAMED)('%s rejects an empty name through its schema', (cliName) => {
    const def = COMMANDS.find((command) => command.cliName === cliName)!;

    expect(z.object(def.input).safeParse({ [def.positional!]: '' }).success).toBe(false);
    expect(z.object(def.input).safeParse({ [def.positional!]: 'x' }).success).toBe(true);
  });

  it.each([[''], ['  ']])('migrate rejects a blank from and to %j through its schema', (blank) => {
    const schema = z.object(COMMANDS.find((command) => command.cliName === 'migrate')!.input);

    expect(schema.safeParse({ from: blank }).success).toBe(false);
    expect(schema.safeParse({ from: '0.1.0', to: blank }).success).toBe(false);
    expect(schema.safeParse({ from: '0.1.0' }).success).toBe(true);
    expect(schema.safeParse({ from: '0.1.0', to: '0.2.0' }).success).toBe(true);
  });
});

describe('found', () => {
  it.each(COMMANDS.map((def) => [def.cliName, def] as const))('%s: false for null and for an empty array', (_, def) => {
    expect(isFound(def, null)).toBe(false);
    expect(isFound(def, [])).toBe(false);
  });

  const NAME_COMMANDS = ['api', 'slots', 'theme', 'config', 'example'];

  it.each(NAME_COMMANDS)('%s: false for an ambiguous selector', (cliName) => {
    const def = COMMANDS.find((command) => command.cliName === cliName)!;

    expect(isFound(def, { ambiguous: true, candidates: [] })).toBe(false);
  });

  it('defaults to true for an object and a non-empty array', () => {
    expect(defaultFound({})).toBe(true);
    expect(defaultFound([1])).toBe(true);
    expect(defaultFound(undefined)).toBe(false);
  });
});

describe('toMarkdown over the sample fixture', () => {
  it('find: one table row per match', async () => {
    const { markdown, found } = await render('find', { query: 'select' });

    expect(found).toBe(true);
    expect(markdown).toBe(
      '|Name|Kind|Selector|Category|File|\n|-|-|-|-|-|\n' +
        '|`CngxSelect`|component|`cngx-select`|forms/select/single-select|projects/forms/select/single-select/select.component.ts|\n',
    );
  });

  it('list: the sorted catalog', async () => {
    const { markdown } = await render('list', {});

    expect(markdown.split('\n').slice(2, 6).map((row) => row.split('|')[1])).toEqual([
      '`CngxAccordionItem`',
      '`CngxRipple`',
      '`CngxSelect`',
      '`CngxToaster`',
    ]);
  });

  it('list: an unmatched filter renders a no-match line and is not found', async () => {
    const { markdown, found } = await render('list', { lib: 'nope' });

    expect(found).toBe(false);
    expect(markdown).toBe('No component, directive, or service matches the filter.\n');
  });

  it('api: heading, summary, member tables and lists', async () => {
    const { markdown } = await render('api', { name: 'CngxSelect' });

    expect(markdown).toContain('# CngxSelect\n\nKind: component | Selector: `cngx-select` | Signal-based: yes\n');
    expect(markdown).toContain('Native-feeling single-select dropdown.');
    expect(markdown).toContain('|`value`|`T`|`undefined`|The selected value.|');
    expect(markdown).toContain('|`disabled`|`boolean`|`false`|Disables the control.|');
    expect(markdown).toContain('## Outputs\n\n|Name|Type|Description|\n|-|-|-|\n|`valueChange`|`EventEmitter<T>`|Emits on selection.|');
    expect(markdown).toContain('## Host bindings\n\n- `id`');
    expect(markdown).toContain('## Methods\n\n- `open`: `void`\n');
  });

  it('api: an injectable without inputs says None', async () => {
    const { markdown } = await render('api', { name: 'CngxToaster' });

    expect(markdown).toContain('## Inputs\n\nNone.');
    expect(markdown).toContain('- `show`: `CngxToastRef`');
  });

  it('api: an unknown name renders a not-found line and is not found', async () => {
    const { markdown, found } = await render('api', { name: 'CngxDoesNotExist' });

    expect(found).toBe(false);
    expect(markdown).toBe('No component, directive, or service by that name.\n');
  });

  it('slots: one row per slot', async () => {
    const { markdown } = await render('slots', { name: 'CngxSelect' });

    expect(markdown).toBe(
      '# CngxSelect slots\n\n|Slot|Description|\n|-|-|\n' +
        '|`cngxSelectCaret`|Replaces the trigger caret glyph.|\n' +
        '|`cngxSelectEmpty`|Rendered when no options match.|\n',
    );
  });

  it('theme: overview and token table', async () => {
    const { markdown } = await render('theme', { name: 'CngxSelect' });

    expect(markdown).toContain('Structural styles shared across the CngxSelect family.');
    expect(markdown).toContain(
      '|`--cngx-select-panel-border`|css-at-property|`*`|`1px solid oklch(0.85 0.01 250)`|Border shorthand of the dropdown panel.|',
    );
  });

  it('di: one row per token', async () => {
    const { markdown } = await render('di', { query: 'SELECT' });

    expect(markdown).toBe(
      '|Token|File|Description|\n|-|-|-|\n' +
        '|`CNGX_SELECT_CONFIG`|projects/forms/select/shared/select-config.ts|DI override for select-family defaults.|\n',
    );
  });

  it('config: token, sections and the numbered resolution order', async () => {
    const { markdown } = await render('config', { name: 'CNGX_SELECT_CONFIG' });

    expect(markdown).toContain('# CNGX_SELECT_CONFIG\n\nResolved via: token\n');
    expect(markdown).toContain('## Resolution priority\n\n1. Per-instance input (e.g. [panelWidth])\n2. ');
    expect(markdown).toContain('4. Library default (CNGX_<X>_DEFAULTS)\n');
  });

  it('example: openable links apart from repo-internal references', async () => {
    const { markdown } = await render('example', { name: 'CngxSelect' });

    expect(markdown).toContain('## Examples\n\n- https://cngxjs.github.io/cngx/examples/#/forms/select/single-select/clearable');
    expect(markdown).toContain('## Source references (repo-internal, not openable links)');
  });

  it('migrate: one table per changed category between 0.1.0 and 0.2.0', async () => {
    const bundledNew = loadDocsFromFile(fixture('documentation.v-new.sample.json'));
    const resolve = createDocsResolver(bundledNew, {
      fetchSnapshot: async () => ({ ok: true, path: fixture('documentation.v-old.sample.json') }),
      loadDocs: loadDocsFromFile,
    });

    const { markdown, found } = await render('migrate', { from: '0.1.0' }, { bundled: bundledNew, resolve });

    expect(found).toBe(true);
    expect(markdown).toContain('# Migrating 0.1.0 -> 0.2.0');
    expect(markdown).toContain('|renamed (inferred)|`CngxOldPanel`|`CngxNewPanel`|');
    expect(markdown).toContain('|removed|`CngxSelect.legacyMode`|-|');
  });

  it('migrate: identical releases say so', async () => {
    const { markdown } = await render('migrate', { from: '0.1.0-rc.6' });

    expect(markdown).toContain('No removed, renamed or signature-changed API between these releases.');
  });
});

describe('toMarkdown over compodoc HTML', () => {
  const v6 = loadDocsFromFile(fixture('documentation.v6.sample.json'));
  const v6ctx: CommandContext = { bundled: v6, resolve: createDocsResolver(v6) };
  const COMPODOC_HTML = /<\/?(?:p|code|strong|em|a|example-url)[\s>]|&#?[a-z0-9]+;/i;

  it.each([
    ['api', { name: 'CngxSelect' }],
    ['theme', { name: 'CngxSelect' }],
    ['slots', { name: 'CngxSelect' }],
    ['di', { query: 'SELECT' }],
    ['config', { name: 'CNGX_SELECT_CONFIG' }],
  ])('%s renders no compodoc tag and no entity', async (cliName, input) => {
    const { markdown } = await render(cliName, input, v6ctx);

    expect(markdown).not.toMatch(COMPODOC_HTML);
  });

  it('api: drops example-url anchors and keeps paragraph breaks', () => {
    const description =
      '<p>First paragraph.</p>\n<p>Second paragraph.</p>\n' +
      '<p><example-url><a href="http://localhost:4200/#/forms/select">http://localhost:4200/#/forms/select</a></example-url></p>';

    const markdown = apiMarkdown({ ...getApi(bundled, 'CngxSelect')!, description });

    expect(markdown).not.toContain('localhost:4200');
    expect(markdown).toContain('First paragraph.\n\nSecond paragraph.');
  });

  it('api: caps a 1000-character input description', () => {
    const api = getApi(bundled, 'CngxSelect') as ApiResult;
    const long = `<p>${'x'.repeat(1000)}</p>`;

    const markdown = apiMarkdown({ ...api, inputs: [{ ...api.inputs[0], description: long }] });
    const row = markdown.split('\n').find((line) => line.startsWith('|`value`|'));

    expect(row).toContain(`${'x'.repeat(200)}...|`);
    expect(row).not.toContain('x'.repeat(201));
  });
});

describe('unwrapAnswer', () => {
  it('opens a version envelope', () => {
    expect(unwrapAnswer({ ok: true, groundedVersion: '0.2.0', result: null })).toEqual({
      ok: true,
      payload: null,
      groundedVersion: '0.2.0',
    });
  });

  it('passes a plain payload through', () => {
    expect(unwrapAnswer([])).toEqual({ ok: true, payload: [] });
    expect(unwrapAnswer(null)).toEqual({ ok: true, payload: null });
  });

  it('keeps a migration delta whole', () => {
    const delta = { ok: true, meta: { from: 'a', to: 'b' }, components: {} };

    expect(unwrapAnswer(delta)).toEqual({ ok: true, payload: delta });
  });

  it('reports a failure with its reason and message', () => {
    expect(unwrapAnswer({ ok: false, reason: 'network', message: 'offline', meta: {} })).toEqual({
      ok: false,
      reason: 'network',
      message: 'offline',
    });
  });
});

describe('markdown helpers', () => {
  it('collapse newlines and escape pipes inside a cell', () => {
    expect(cell('a |\n  b')).toBe('a \\| b');
    expect(cell(null)).toBe('-');
  });

  it('build a table with the minimal separator', () => {
    expect(table(['A', 'B'], [['1', '2']])).toBe('|A|B|\n|-|-|\n|1|2|');
  });
  it('keep a numeric entity outside the Unicode range as its literal text', () => {
    expect(toPlainText('a &#99999999; b')).toBe('a &#99999999; b');
    expect(toPlainText('a &#x110000; b')).toBe('a &#x110000; b');
    expect(toPlainText('a &#xD800; b')).toBe('a &#xD800; b');
    expect(toPlainText('a &#x41; &#66; b')).toBe('a A B b');
  });
});
