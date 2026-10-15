import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AI_TOOLS,
  CNGX_LIBS,
  isBoolean,
  isListOf,
  isOneOf,
  LANGUAGES,
  NG_ADD_PRESETS,
  THEME_CHOICES,
} from './options';

interface SchemaProperty {
  readonly enum?: readonly string[];
  readonly default?: unknown;
  readonly items?: { readonly enum?: readonly string[] };
  readonly uniqueItems?: boolean;
}

const SCHEMA = JSON.parse(readFileSync(join(__dirname, '..', 'ng-add', 'schema.json'), 'utf8')) as {
  properties: Record<string, SchemaProperty>;
};

const VOCABULARY = [
  ['preset', NG_ADD_PRESETS, SCHEMA.properties['preset'].enum],
  ['libs', CNGX_LIBS, SCHEMA.properties['libs'].items?.enum],
  ['theme', THEME_CHOICES, SCHEMA.properties['theme'].enum],
  ['i18n', LANGUAGES, SCHEMA.properties['i18n'].enum],
  ['aiTools', AI_TOOLS, SCHEMA.properties['aiTools'].items?.enum],
] as const;

describe('the ng-add answer vocabulary', () => {
  it.each(VOCABULARY)('lists each %s answer once, in the order the schema offers it', (_name, values, schemaEnum) => {
    expect(new Set(values).size).toBe(values.length);
    expect(schemaEnum).toEqual(values);
  });

  it('defaults the preset to one it lists', () => {
    expect(NG_ADD_PRESETS).toContain(SCHEMA.properties['preset'].default);
  });

  it('keeps @cngx/themes out of the selectable packages; the theme answer brings it', () => {
    expect(CNGX_LIBS).not.toContain('themes');
  });

  it('declares the array answers unique, so a repeated flag cannot select twice', () => {
    expect(SCHEMA.properties['libs'].uniqueItems).toBe(true);
    expect(SCHEMA.properties['aiTools'].uniqueItems).toBe(true);
  });
});

describe('the answer guards', () => {
  it('accepts an entry of the vocabulary and rejects anything else', () => {
    expect(isOneOf(THEME_CHOICES, 'material')).toBe(true);
    expect(isOneOf(THEME_CHOICES, 'bootstrap')).toBe(false);
    expect(isOneOf(THEME_CHOICES, undefined)).toBe(false);
    expect(isOneOf(LANGUAGES, ['en'])).toBe(false);
  });

  it('accepts a list only when every entry is in the vocabulary', () => {
    expect(isListOf(CNGX_LIBS, ['core', 'ui'])).toBe(true);
    expect(isListOf(CNGX_LIBS, [])).toBe(true);
    expect(isListOf(CNGX_LIBS, ['core', 'themes'])).toBe(false);
    expect(isListOf(AI_TOOLS, 'claude')).toBe(false);
  });

  it('accepts a boolean and nothing that only reads like one', () => {
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean('true')).toBe(false);
    expect(isBoolean(0)).toBe(false);
  });
});
