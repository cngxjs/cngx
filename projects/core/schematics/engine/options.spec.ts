import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AI_TOOLS,
  CNGX_LIBS,
  createInvalidAnswerError,
  isBoolean,
  isListOf,
  isOneOf,
  LANGUAGES,
  NG_ADD_PRESETS,
  type NgAddFlags,
  parseNgAddOptions,
  createRepeatedAnswerError,
  THEME_CHOICES,
} from './options';

interface SchemaBranch {
  readonly type?: string;
  readonly enum?: readonly string[];
  readonly items?: { readonly enum?: readonly string[] };
  readonly uniqueItems?: boolean;
}

interface SchemaProperty extends SchemaBranch {
  readonly default?: unknown;
  readonly oneOf?: readonly SchemaBranch[];
}

const SCHEMA = JSON.parse(readFileSync(join(__dirname, '..', 'ng-add', 'schema.json'), 'utf8')) as {
  properties: Record<string, SchemaProperty>;
};

// A list property takes a comma string or an array; the vocabulary sits on the array branch.
function arrayBranch(key: string): SchemaBranch | undefined {
  return SCHEMA.properties[key].oneOf?.find((branch) => branch.type === 'array');
}

const VOCABULARY = [
  ['preset', NG_ADD_PRESETS, SCHEMA.properties['preset'].enum],
  ['libs', CNGX_LIBS, arrayBranch('libs')?.items?.enum],
  ['theme', THEME_CHOICES, SCHEMA.properties['theme'].enum],
  ['i18n', LANGUAGES, SCHEMA.properties['i18n'].enum],
  ['aiTools', AI_TOOLS, arrayBranch('aiTools')?.items?.enum],
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
    expect(arrayBranch('libs')?.uniqueItems).toBe(true);
    expect(arrayBranch('aiTools')?.uniqueItems).toBe(true);
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

describe('createInvalidAnswerError', () => {
  it('names every rejected entry and the allowed answers', () => {
    expect(createInvalidAnswerError('aiTools', ['emacs', 'zed'], AI_TOOLS).message).toBe(
      '"emacs", "zed" is not a valid answer for aiTools. Expected one of: claude, cursor, vscode.',
    );
  });

  it('reads the same for a single scalar flag', () => {
    expect(createInvalidAnswerError('theme', ['dark'], THEME_CHOICES).message).toBe(
      '"dark" is not a valid answer for theme. Expected one of: cngx, material, none.',
    );
  });
});

describe('parseNgAddOptions', () => {
  it('splits a comma list and trims each entry', () => {
    expect(parseNgAddOptions({ aiTools: 'claude,vscode' }).aiTools).toEqual(['claude', 'vscode']);
    expect(parseNgAddOptions({ libs: 'core, forms , ui' }).libs).toEqual(['core', 'forms', 'ui']);
  });

  it('reads a single entry as a one-entry list', () => {
    expect(parseNgAddOptions({ aiTools: 'claude' }).aiTools).toEqual(['claude']);
  });

  it('takes an array as it is', () => {
    expect(parseNgAddOptions({ libs: ['core', 'ui'] }).libs).toEqual(['core', 'ui']);
  });

  it('names an unknown list entry', () => {
    expect(() => parseNgAddOptions({ aiTools: 'claude,emacs' })).toThrow(
      '"emacs" is not a valid answer for aiTools. Expected one of: claude, cursor, vscode.',
    );
    expect(() => parseNgAddOptions({ libs: ['charts'] })).toThrow('"charts" is not a valid answer for libs.');
  });

  it('rejects an empty list entry', () => {
    expect(() => parseNgAddOptions({ libs: 'core,,ui' })).toThrow('"" is not a valid answer for libs.');
    expect(() => parseNgAddOptions({ aiTools: '' })).toThrow('"" is not a valid answer for aiTools.');
  });

  it('rejects a repeated list entry, as the array branch does with uniqueItems', () => {
    expect(() => parseNgAddOptions({ aiTools: 'claude,claude' })).toThrow('"claude" is given more than once for aiTools.');
    expect(() => parseNgAddOptions({ libs: 'core,ui,core,ui,core' })).toThrow('"core", "ui" are given more than once for libs.');
  });

  it('maps the pre-install boolean strings and passes real booleans through', () => {
    expect(parseNgAddOptions({ lint: 'false', yes: 'true', quiet: false, prompts: true })).toMatchObject({
      lint: false,
      yes: true,
      quiet: false,
      prompts: true,
    });
  });

  it('rejects a boolean flag that reads like neither', () => {
    expect(() => parseNgAddOptions({ lint: 'no' } as unknown as NgAddFlags)).toThrow(
      '"no" is not a valid answer for lint. Expected one of: true, false.',
    );
  });

  it('names an unknown theme or language', () => {
    expect(() => parseNgAddOptions({ theme: 'dark' })).toThrow(
      '"dark" is not a valid answer for theme. Expected one of: cngx, material, none.',
    );
    expect(() => parseNgAddOptions({ i18n: 'fr' })).toThrow('"fr" is not a valid answer for i18n.');
  });

  it('reads an undefined or empty list as not given', () => {
    expect(parseNgAddOptions({ libs: [], aiTools: undefined })).toMatchObject({ libs: undefined, aiTools: undefined });
  });

  it('keeps project and preset as given', () => {
    expect(parseNgAddOptions({ project: 'app', preset: 'full' })).toMatchObject({ project: 'app', preset: 'full' });
  });
});

describe('createRepeatedAnswerError', () => {
  it('names the repeated entry without calling it invalid', () => {
    expect(createRepeatedAnswerError('aiTools', ['claude']).message).toBe('"claude" is given more than once for aiTools.');
  });
});
