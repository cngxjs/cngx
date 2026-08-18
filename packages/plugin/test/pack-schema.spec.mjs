import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const packDir = resolve(here, '../pack');
const readJson = (name) => JSON.parse(readFileSync(resolve(packDir, name), 'utf8'));

const schema = readJson('recipe.schema.json');
const schemaMd = readFileSync(resolve(packDir, 'SCHEMA.md'), 'utf8');
const manifest = readJson('pack-manifest.json');

describe('recipe.schema.json is a well-formed object schema', () => {
  it('declares $schema, an object type, properties and required', () => {
    expect(typeof schema.$schema).toBe('string');
    expect(schema.type).toBe('object');
    expect(schema.properties).toBeTypeOf('object');
    expect(Array.isArray(schema.required)).toBe(true);
  });

  it('lists no required field that is not a declared property', () => {
    for (const field of schema.required) {
      expect(schema.properties, `required "${field}" is undocumented`).toHaveProperty(field);
    }
  });

  it('gives every property a type', () => {
    for (const [name, def] of Object.entries(schema.properties)) {
      expect(def.type, `property "${name}" has no type`).toBeDefined();
    }
  });
});

describe('SCHEMA.md and recipe.schema.json stay in sync', () => {
  it('documents every schema property as a backticked field', () => {
    for (const name of Object.keys(schema.properties)) {
      expect(schemaMd, `SCHEMA.md must document \`${name}\``).toContain(`\`${name}\``);
    }
  });

  it('states the curation criterion', () => {
    expect(schemaMd).toMatch(/curation criterion/i);
  });
});

describe('pack-manifest.json is a valid provenance record', () => {
  it('carries a schema version and a sources array', () => {
    expect(manifest.schemaVersion).toBeTypeOf('string');
    expect(Array.isArray(manifest.sources)).toBe(true);
  });
});
