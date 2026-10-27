// The schema-2 export (compodocx 0.8, `test/fixtures/documentation.sample.json`)
// has no `alias` key; an aliased signal input reads
// `"defaultValue": "false, { alias: 'disabled' }"`. The inline inputs below copy that shape.

import { describe, expect, it } from 'vitest';
import { projectSchemaV2 } from './schema-v2.js';
import type { DocInput, DocumentationJson } from './types.js';

function projectInputs(...inputsClass: DocInput[]): DocInput[] {
  return projectSchemaV2({ schemaVersion: 2, components: [{ name: 'CngxSelect', inputsClass }] }).components?.[0]
    .inputsClass ?? [];
}

describe('projectSchemaV2', () => {
  it('lifts the alias out of the default and keeps the bare default', () => {
    const [disabled] = projectInputs({ name: 'disabledInput', defaultValue: "false, { alias: 'disabled' }" });

    expect(disabled).toMatchObject({ name: 'disabledInput', alias: 'disabled', defaultValue: 'false' });
  });

  it('reads a double-quoted alias', () => {
    const [id] = projectInputs({ name: 'idInput', defaultValue: 'null, { alias: "id" }' });

    expect(id).toMatchObject({ alias: 'id', defaultValue: 'null' });
  });

  it('drops the default when the options object is all there is', () => {
    const [value] = projectInputs({ name: 'valueInput', defaultValue: "{ alias: 'value' }" });

    expect(value.alias).toBe('value');
    expect(value.defaultValue).toBeUndefined();
  });

  it('reads the alias next to a transform', () => {
    const [announce] = projectInputs({ name: 'announceInput', defaultValue: "false, { alias: 'announce', transform: booleanAttribute }" });

    expect(announce).toMatchObject({ alias: 'announce', defaultValue: 'false' });
  });

  it('reads the alias after a transform arrow with parentheses and commas', () => {
    const [state] = projectInputs({
      name: 'stateInput',
      defaultValue: "undefined, {\n  transform: (v) => (typeof v === 'string' ? undefined : v),\n  alias: 'cngxState',\n}",
    });

    expect(state).toMatchObject({ alias: 'cngxState', defaultValue: 'undefined' });
  });

  it('reads a multi-line options object followed by a trailing comma', () => {
    const [density] = projectInputs({
      name: 'density',
      defaultValue: "undefined,\n    {\n      alias: 'cngxDensity',\n      transform: (value) => (value === '' ? undefined : value),\n    },\n  ",
    });

    expect(density).toMatchObject({ alias: 'cngxDensity', defaultValue: 'undefined' });
  });

  it('keeps an object or array default in front of the options', () => {
    const [config, list] = projectInputs(
      { name: 'configInput', defaultValue: "{ a: 1, b: 'x, y' }, { alias: 'config' }" },
      { name: 'listInput', defaultValue: "[1, 2], { alias: 'list' }" },
    );

    expect(config).toMatchObject({ alias: 'config', defaultValue: "{ a: 1, b: 'x, y' }" });
    expect(list).toMatchObject({ alias: 'list', defaultValue: '[1, 2]' });
  });

  it('leaves a default without options unchanged', () => {
    const input: DocInput = { name: 'label', defaultValue: "''" };

    expect(projectInputs(input)).toEqual([input]);
  });

  it('leaves an object default without an alias unchanged', () => {
    const input: DocInput = { name: 'policy', defaultValue: "{ kind: 'verbose', severity: 'assertive' }" };

    expect(projectInputs(input)).toEqual([input]);
  });

  it('projects directives as well as components', () => {
    const projected = projectSchemaV2({
      schemaVersion: 2,
      directives: [{ name: 'CngxSort', inputsClass: [{ name: 'activeInput', defaultValue: "undefined, { alias: 'cngxSortActive' }" }] }],
    });

    expect(projected.directives?.[0].inputsClass?.[0].alias).toBe('cngxSortActive');
  });

  it('does not mutate the input document', () => {
    const doc: DocumentationJson = {
      schemaVersion: 2,
      components: [{ name: 'CngxSelect', inputsClass: [{ name: 'disabledInput', defaultValue: "false, { alias: 'disabled' }" }] }],
    };
    const before = structuredClone(doc);

    projectSchemaV2(doc);

    expect(doc).toEqual(before);
  });
});
