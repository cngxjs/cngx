// Fixture: `test/fixtures/documentation.v6.sample.json`, trimmed from
// `npm run docs:json` (compodocx 0.9.0, schemaVersion 6) at 34580694c; the
// `CngxSelect` members carry `signalKind` / `alias` / `required` from the 0.10.0
// export. The inline documents below copy its `feature` and `di` shapes.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { projectSchemaV6 } from './schema-v6.js';
import type { DocEntry, DocFunction, DocumentationJson } from './types.js';

const V6_FIXTURE = fileURLToPath(new URL('../../../test/fixtures/documentation.v6.sample.json', import.meta.url));

const entry = (name: string, feature?: DocEntry['feature']): DocEntry => ({ name, feature });

function projectComponents(...components: DocEntry[]): DocEntry[] {
  return projectSchemaV6({ schemaVersion: 6, components }).components ?? [];
}

function projectFunctions(...functions: DocFunction[]): DocFunction[] {
  return projectSchemaV6({ schemaVersion: 6, miscellaneous: { functions } }).miscellaneous?.functions ?? [];
}

describe('projectSchemaV6 category', () => {
  it('appends a non-empty feature key to the entry point', () => {
    const [alert] = projectComponents(entry('CngxAlert', { entryPoint: '@cngx/ui/feedback', key: 'alert' }));

    expect(alert.category).toBe('ui/feedback/alert');
  });

  it('uses the entry point alone for an unkeyed feature', () => {
    const [select] = projectComponents(entry('CngxSelect', { entryPoint: '@cngx/forms/select', key: '' }));

    expect(select.category).toBe('forms/select');
  });

  it('leaves category undefined when the entry has no feature', () => {
    const [body] = projectComponents(entry('CngxFilterBuilderBody'));

    expect(body.category).toBeUndefined();
  });

  it('projects directives and injectables as well as components', () => {
    const feature = { entryPoint: '@cngx/ui/feedback', key: 'alert' };
    const projected = projectSchemaV6({
      schemaVersion: 6,
      directives: [entry('CngxAlertOn', feature)],
      injectables: [entry('CngxToaster', feature)],
    });

    expect(projected.directives?.[0].category).toBe('ui/feedback/alert');
    expect(projected.injectables?.[0].category).toBe('ui/feedback/alert');
  });
});

describe('projectSchemaV6 factoryKind', () => {
  it('maps di.role provider and feature', () => {
    const [provider, feature] = projectFunctions(
      { name: 'provideSelectConfig', di: { role: 'provider' } },
      { name: 'withPanelWidth', di: { role: 'feature' } },
    );

    expect(provider.factoryKind).toBe('provider');
    expect(feature.factoryKind).toBe('feature');
  });

  it('falls back to the name prefix when di is absent', () => {
    const [feature, provider] = projectFunctions({ name: 'withFallback' }, { name: 'providePersistence' });

    expect(feature.factoryKind).toBe('feature');
    expect(provider.factoryKind).toBe('provider');
  });

  it('leaves an inject* function without di undefined', () => {
    const [inject] = projectFunctions({ name: 'injectSelectConfig' });

    expect(inject.factoryKind).toBeUndefined();
  });

  it('does not read a lowercase continuation as a prefix', () => {
    const [fn] = projectFunctions({ name: 'withdraw' });

    expect(fn.factoryKind).toBeUndefined();
  });
});

describe('projectSchemaV6 purity', () => {
  it('does not mutate the input document', () => {
    const raw = JSON.parse(readFileSync(V6_FIXTURE, 'utf8')) as DocumentationJson;
    const before = structuredClone(raw);

    const projected = projectSchemaV6(raw);

    expect(raw).toEqual(before);
    expect(projected).not.toBe(raw);
    expect(projected.components?.[0]).not.toBe(raw.components?.[0]);
  });

  it('projects the trimmed real export', () => {
    const projected = projectSchemaV6(JSON.parse(readFileSync(V6_FIXTURE, 'utf8')) as DocumentationJson);
    const kinds = Object.fromEntries((projected.miscellaneous?.functions ?? []).map((fn) => [fn.name, fn.factoryKind]));

    expect(kinds).toEqual({
      injectSelectConfig: undefined,
      provideSelectConfig: 'provider',
      withFallback: 'feature',
      withPanelWidth: 'feature',
    });
  });
});
