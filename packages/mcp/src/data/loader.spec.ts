import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createDocsIndex, loadDocsFromFile, SchemaVersionError, SUPPORTED_SCHEMA_VERSION } from './loader.js';
import type { DocumentationJson } from './types.js';

const FIXTURE = fileURLToPath(new URL('../../test/fixtures/documentation.sample.json', import.meta.url));

function readFixture(): DocumentationJson {
  return JSON.parse(readFileSync(FIXTURE, 'utf8')) as DocumentationJson;
}

describe('loadDocsFromFile', () => {
  it('loads the fixture into a typed index with provenance meta', () => {
    const index = loadDocsFromFile(FIXTURE);

    expect(index.meta.schemaVersion).toBe(SUPPORTED_SCHEMA_VERSION);
    expect(index.meta.cngxVersion).toBe('0.1.0-rc.6');
    expect(index.meta.generatedAt).toBe('2026-08-17T11:21:23.588Z');
    expect(index.components.length).toBeGreaterThan(0);
    expect(index.directives.length).toBeGreaterThan(0);
    expect(index.tokens.length).toBeGreaterThan(0);
  });
});

describe('createDocsIndex schema guard', () => {
  it('accepts the supported schemaVersion', () => {
    expect(() => createDocsIndex(readFixture())).not.toThrow();
  });

  it('rejects a snapshot whose schemaVersion the server does not support', () => {
    const mismatched: DocumentationJson = { ...readFixture(), schemaVersion: SUPPORTED_SCHEMA_VERSION + 1 };

    expect(() => createDocsIndex(mismatched)).toThrow(SchemaVersionError);
  });

  it('normalises a missing cngxVersion to null', () => {
    const raw = readFixture();
    delete raw.cngxVersion;

    expect(createDocsIndex(raw).meta.cngxVersion).toBeNull();
  });
});

describe('createDocsIndex functions projection', () => {
  it('projects miscellaneous.functions into docs.functions', () => {
    const raw: DocumentationJson = {
      ...readFixture(),
      miscellaneous: {
        functions: [
          { name: 'provideSelectConfig', file: 'projects/forms/select/shared/config.ts', factoryKind: 'provider' },
          {
            name: 'withPanelWidth',
            file: 'projects/forms/select/shared/config.ts',
            factoryKind: 'feature',
            returnType: 'CngxSelectConfigFeature',
          },
        ],
      },
    };

    const index = createDocsIndex(raw);

    expect(index.functions).toHaveLength(2);
    expect(index.functions.map((fn) => fn.name)).toEqual(['provideSelectConfig', 'withPanelWidth']);
    expect(index.functions[1].returnType).toBe('CngxSelectConfigFeature');
  });

  it('defaults docs.functions to an empty array when miscellaneous is absent', () => {
    const raw = readFixture();
    delete raw.miscellaneous;

    expect(createDocsIndex(raw).functions).toEqual([]);
  });
});
