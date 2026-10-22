import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AI_TOOLS,
  CNGX_LIBS,
  createEmptyEntryError,
  createInvalidAnswerError,
  isBoolean,
  isListOf,
  isOneOf,
  LANGUAGES,
  NG_ADD_PRESETS,
  type NgAddFlags,
  parseNgAddOptions,
  readDryRunFlag,
  readPromptFlags,
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

  it('leaves the preset without a schema default, so the rule can tell a flag from no answer', () => {
    expect(SCHEMA.properties['preset'].default).toBeUndefined();
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
      '"emacs", "zed" is not a valid answer for --ai-tools. Expected one of: claude, cursor, vscode.',
    );
  });

  it('reads the same for a single scalar flag', () => {
    expect(createInvalidAnswerError('theme', ['dark'], THEME_CHOICES).message).toBe(
      '"dark" is not a valid answer for --theme. Expected one of: cngx, material, none.',
    );
  });
});

describe('parseNgAddOptions', () => {
  it('reads the pins a shim hands over as @cngx package names only', () => {
    expect(parseNgAddOptions({ pins: ['@cngx/core', '@cngx/forms'] }).pins).toEqual(['@cngx/core', '@cngx/forms']);
    expect(parseNgAddOptions({ pins: '@cngx/core,@cngx/forms' }).pins).toEqual(['@cngx/core', '@cngx/forms']);
    expect(parseNgAddOptions({ pins: ['@cngx/core', 'lodash', 7] as unknown as readonly string[] }).pins).toEqual(['@cngx/core']);
    expect(parseNgAddOptions({ pins: 7 as unknown as string }).pins).toBeUndefined();
    expect(parseNgAddOptions({ pins: { 0: '@cngx/core' } as unknown as string }).pins).toBeUndefined();
  });

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
      '"emacs" is not a valid answer for --ai-tools. Expected one of: claude, cursor, vscode.',
    );
    expect(() => parseNgAddOptions({ libs: ['charts'] })).toThrow('"charts" is not a valid answer for --libs.');
  });

  it('rejects an empty list entry', () => {
    expect(() => parseNgAddOptions({ libs: 'core,,ui' })).toThrow(
      '--libs has an empty entry. Separate the values with single commas, for example --libs utils,core.',
    );
    expect(() => parseNgAddOptions({ libs: 'core,' })).toThrow('--libs has an empty entry.');
    expect(() => parseNgAddOptions({ aiTools: '' })).toThrow('--ai-tools has an empty entry.');
  });

  it('rejects a repeated list entry, as the array branch does with uniqueItems', () => {
    expect(() => parseNgAddOptions({ aiTools: 'claude,claude' })).toThrow('"claude" is given more than once for --ai-tools.');
    expect(() => parseNgAddOptions({ libs: 'core,ui,core,ui,core' })).toThrow('"core", "ui" are given more than once for --libs.');
  });

  it('maps the pre-install boolean strings and passes real booleans through', () => {
    expect(parseNgAddOptions({ lint: 'false', yes: 'true', quiet: false, prompts: true })).toMatchObject({
      lint: false,
      yes: true,
      quiet: false,
      prompts: true,
    });
  });

  it('reads the starter flag in its pre-install and installed forms', () => {
    expect(parseNgAddOptions({ starter: 'false' }).starter).toBe(false);
    expect(parseNgAddOptions({ starter: 'true' }).starter).toBe(true);
    expect(parseNgAddOptions({ starter: false }).starter).toBe(false);
    expect(parseNgAddOptions({}).starter).toBeUndefined();
    expect(() => parseNgAddOptions({ starter: 'off' } as unknown as NgAddFlags)).toThrow(
      '"off" is not a valid answer for --starter. Expected one of: true, false.',
    );
  });

  it('rejects a boolean flag that reads like neither', () => {
    expect(() => parseNgAddOptions({ lint: 'no' } as unknown as NgAddFlags)).toThrow(
      '"no" is not a valid answer for --lint. Expected one of: true, false.',
    );
  });

  it('names an unknown theme or language', () => {
    expect(() => parseNgAddOptions({ theme: 'dark' })).toThrow(
      '"dark" is not a valid answer for --theme. Expected one of: cngx, material, none.',
    );
    expect(() => parseNgAddOptions({ i18n: 'fr' })).toThrow('"fr" is not a valid answer for --i18n.');
  });

  it('reads an undefined or empty list as not given', () => {
    expect(parseNgAddOptions({ libs: [], aiTools: undefined })).toMatchObject({ libs: undefined, aiTools: undefined });
  });

  it('keeps project and preset as given', () => {
    expect(parseNgAddOptions({ project: 'app', preset: 'full' })).toMatchObject({ project: 'app', preset: 'full' });
  });

  it('names an unknown preset instead of falling back to recommended', () => {
    expect(() => parseNgAddOptions({ preset: 'everything' })).toThrow(
      '"everything" is not a valid answer for --preset. Expected one of: minimal, recommended, full.',
    );
  });
});

describe('createRepeatedAnswerError', () => {
  it('names the repeated entry without calling it invalid', () => {
    expect(createRepeatedAnswerError('aiTools', ['claude']).message).toBe('"claude" is given more than once for --ai-tools.');
  });
});

describe('createEmptyEntryError', () => {
  it('names the flag and shows the comma form', () => {
    expect(createEmptyEntryError('aiTools', AI_TOOLS).message).toBe(
      '--ai-tools has an empty entry. Separate the values with single commas, for example --ai-tools claude,cursor.',
    );
  });
});

describe('readDryRunFlag', () => {
  const argv = (...flags: string[]) => ['node', 'ng', 'add', '@cngx/core', ...flags];

  it.each([['--dry-run'], ['-d'], ['--dry-run=true'], ['--dry-run', 'true']])('reads %s as a dry run', (...flags) => {
    expect(readDryRunFlag(argv(...flags))).toBe(true);
  });

  it.each([[], ['--dry-run=false'], ['--dry-run', 'false'], ['--defaults']])('reads %s as a real run', (...flags) => {
    expect(readDryRunFlag(argv(...flags))).toBe(false);
  });

  // The CLI's yargs keeps the last of a repeated boolean flag.
  it('reads --no-dry-run as a real run, also after --dry-run', () => {
    expect(readDryRunFlag(argv('--no-dry-run'))).toBe(false);
    expect(readDryRunFlag(argv('--dry-run', '--no-dry-run'))).toBe(false);
  });

  it('reads -d after --no-dry-run as a dry run', () => {
    expect(readDryRunFlag(argv('--no-dry-run', '-d'))).toBe(true);
  });

  it('reads -d with a false value as a real run', () => {
    expect(readDryRunFlag(argv('-d', 'false'))).toBe(false);
    expect(readDryRunFlag(argv('-d=false'))).toBe(false);
  });

  it('reads --dry-run=true after --dry-run=false as a dry run', () => {
    expect(readDryRunFlag(argv('--dry-run=false', '--dry-run=true'))).toBe(true);
  });

  // @angular/cli 21.2 parses with camel-case-expansion off and strict, so
  // `--dryRun` stops with "Unknown argument: dryRun" before any rule runs.
  it('never reads --dryRun, which the CLI refuses before the rule runs', () => {
    expect(readDryRunFlag(argv('--dryRun'))).toBe(false);
  });
});

describe('readPromptFlags', () => {
  const argv = (...flags: string[]) => ['node', 'ng', 'add', '@cngx/core', ...flags];

  it('names the flag that turns prompts off, the way it was typed', () => {
    expect(readPromptFlags(argv('--interactive=false'))).toBe('--interactive=false');
    expect(readPromptFlags(argv('--interactive', 'false'))).toBe('--interactive=false');
    expect(readPromptFlags(argv('--no-interactive'))).toBe('--no-interactive');
    expect(readPromptFlags(argv('--defaults'))).toBe('--defaults');
    expect(readPromptFlags(argv('--defaults=true'))).toBe('--defaults=true');
    expect(readPromptFlags(argv('--defaults', 'true', '--libs', 'core'))).toBe('--defaults=true');
  });

  it('finds none when the flags leave prompts on', () => {
    expect(readPromptFlags(argv())).toBeUndefined();
    expect(readPromptFlags(argv('--interactive'))).toBeUndefined();
    expect(readPromptFlags(argv('--interactive=true', '--defaults=false'))).toBeUndefined();
    expect(readPromptFlags(argv('--defaults', 'false'))).toBeUndefined();
    expect(readPromptFlags(argv('--libs', 'defaults'))).toBeUndefined();
  });
});
