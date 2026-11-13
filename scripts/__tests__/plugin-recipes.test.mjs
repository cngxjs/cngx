import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  collectStoryEntries,
  demonstratesAsync,
  expectedRecipes,
  recipeFiles,
  renderRecipe,
  selectRecipeStories,
  storyToRecipe,
} from '../plugin-recipes.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  readFileSync(resolve(here, '../../packages/plugin/pack/recipe.schema.json'), 'utf8'),
);

// Structural conformance against recipe.schema.json (no meta-schema validator
// dependency): required present, declared types respected, no extra keys.
function schemaViolations(recipe) {
  const errors = [];
  for (const key of schema.required) {
    if (!(key in recipe)) {
      errors.push(`missing ${key}`);
    }
  }
  for (const [key, def] of Object.entries(schema.properties)) {
    if (!(key in recipe)) {
      continue;
    }
    const value = recipe[key];
    if (def.type === 'string' && typeof value !== 'string') {
      errors.push(`${key} not string`);
    }
    if (def.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${key} not array`);
      } else if (def.minItems && value.length < def.minItems) {
        errors.push(`${key} below minItems`);
      }
    }
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(recipe)) {
      if (!(key in schema.properties)) {
        errors.push(`extra ${key}`);
      }
    }
  }
  return errors;
}

const ASYNC_STORY = {
  title: 'CngxSelect: async state consumer',
  description: 'Drive the select panel from a <code>CngxAsyncState</code>.',
  apiComponents: ['CngxSelect'],
  moduleImports: ["import { CngxSelect } from '@cngx/forms/select';"],
  setup: 'readonly state = createAsyncState(() => fetchCities());',
  template: '<cngx-select [items]="state.value()" [busy]="state.loading()"></cngx-select>',
};

const STATIC_STORY = {
  title: 'CngxTag: density',
  apiComponents: ['CngxTag'],
  template: '<cngx-tag>Label</cngx-tag>',
};

describe('demonstratesAsync', () => {
  it('includes stories that touch the async state machine', () => {
    expect(demonstratesAsync(ASYNC_STORY)).toBe(true);
  });

  it('excludes static stories', () => {
    expect(demonstratesAsync(STATIC_STORY)).toBe(false);
  });
});

describe('storyToRecipe', () => {
  it('emits a recipe.schema.json-conformant object with the html stripped', () => {
    const recipe = storyToRecipe(ASYNC_STORY);
    expect(schemaViolations(recipe)).toEqual([]);
    expect(recipe.symbols).toContain('CngxSelect');
    expect(recipe.whenToUse).not.toContain('<code>');
  });

  it('takes the template as wiring and carries the class setup alongside', () => {
    const recipe = storyToRecipe(ASYNC_STORY);
    expect(recipe.wiring).toBe(ASYNC_STORY.template);
    expect(recipe.setup).toBe(ASYNC_STORY.setup);
  });

  it('omits setup when the story has only a template', () => {
    const recipe = storyToRecipe({ ...ASYNC_STORY, setup: undefined });
    expect(recipe.wiring).toBe(ASYNC_STORY.template);
    expect(recipe).not.toHaveProperty('setup');
  });

  it('renders a flush-first-line template at the column of line 1', () => {
    const template =
      '<cngx-select [items]="state.value()">\n      <span>x</span>\n    </cngx-select>';
    expect(storyToRecipe({ ...ASYNC_STORY, template }).wiring).toBe(
      '<cngx-select [items]="state.value()">\n  <span>x</span>\n</cngx-select>',
    );
  });

  it('drops a button-row chrome div from the wiring', () => {
    const template = [
      '<cngx-select [items]="state.value()"></cngx-select>',
      '<div class="button-row">',
      '  <button type="button" (click)="reload()">Reload</button>',
      '</div>',
    ].join('\n');
    expect(storyToRecipe({ ...ASYNC_STORY, template }).wiring).toBe(
      '<cngx-select [items]="state.value()"></cngx-select>',
    );
  });

  it('renders a flush-first-line setup with its members at column 0', () => {
    const setup = 'readonly state = createAsyncState(load);\n  readonly open = signal(false);';
    expect(storyToRecipe({ ...ASYNC_STORY, setup }).setup).toBe(
      'readonly state = createAsyncState(load);\nreadonly open = signal(false);',
    );
  });

  it('returns null when no cngx symbol resolves', () => {
    expect(storyToRecipe({ title: 'plain', template: '<div></div>' })).toBeNull();
  });
});

describe('recipeFiles', () => {
  const HOST_STORY = {
    ...ASYNC_STORY,
    imports: ['ChipButton'],
    template: '<button chipButton [cngxAsyncClick]="save">Save</button>',
    moduleImports: [
      "import { ChipButton } from './_chip-button.component';",
      "import { failNext } from './_fail-flag';",
      "import { mirrorScreenReader } from '../../../../fixtures';",
    ],
    setupChrome:
      'protected readonly fail = failNext; protected readonly sr = mirrorScreenReader();',
  };
  const storyPath = 'examples/stories/common/button/composition/custom-host.story.ts';
  const disk = {
    'examples/stories/common/button/composition/_chip-button.component.ts':
      'export class ChipButton {}\n',
    'examples/stories/common/button/composition/_fail-flag.ts': 'export const failNext = true;\n',
  };
  const read = (path) => disk[path] ?? null;

  it('reads the story-local file the artifact imports and nothing the chrome imports', () => {
    expect(recipeFiles(HOST_STORY, storyPath, read)).toEqual([
      { path: '_chip-button.component.ts', source: 'export class ChipButton {}' },
    ]);
  });

  it('renders the file after the wiring and stays schema-conformant', () => {
    const recipe = storyToRecipe(HOST_STORY, recipeFiles(HOST_STORY, storyPath, read));
    expect(schemaViolations(recipe)).toEqual([]);
    const md = renderRecipe(recipe);
    expect(md.indexOf('## File `_chip-button.component.ts`')).toBeGreaterThan(
      md.indexOf('## Wiring'),
    );
    expect(md).toContain('export class ChipButton {}');
    expect(md).not.toContain('failNext = true');
  });

  it('throws when a story-local file the artifact imports is missing', () => {
    expect(() => recipeFiles(HOST_STORY, storyPath, () => null)).toThrow(
      /custom-host\.story\.ts: no file for \.\/_chip-button\.component at .*_chip-button\.component\.ts/,
    );
  });

  it('drops a story-local component only the chrome template uses, given its selector', () => {
    const selectorMap = new Map([['ChipButton', ['button[appChipButton]']]]);
    const story = { ...HOST_STORY, templateChrome: '<button appChipButton>Chrome</button>' };
    expect(recipeFiles(story, storyPath, read, selectorMap)).toEqual([]);
  });

  it('adds no files key when the artifact imports no story-local file', () => {
    expect(
      storyToRecipe(ASYNC_STORY, recipeFiles(ASYNC_STORY, storyPath, read)),
    ).not.toHaveProperty('files');
  });
});

describe('selectRecipeStories', () => {
  it('keeps one async representative per folder, preferring a basic slug', () => {
    const entries = [
      {
        path: 'examples/stories/common/interactive/async-click/success-and-error-feedback.story.ts',
        story: { ...ASYNC_STORY, title: 'CngxAsyncClick: success and error feedback' },
      },
      {
        path: 'examples/stories/common/interactive/async-click/basic-happy-path.story.ts',
        story: { ...ASYNC_STORY, title: 'CngxAsyncClick: basic happy path' },
      },
      { path: 'examples/stories/common/display/tag/density.story.ts', story: STATIC_STORY },
    ];
    const selected = selectRecipeStories(entries);
    expect(selected).toHaveLength(1);
    expect(selected[0].slug).toBe('basic-happy-path');
  });
});

describe('expectedRecipes', () => {
  it('skips a folder whose representative yields no recipe', () => {
    const entries = [
      {
        path: 'examples/stories/common/interactive/async-click/basic-happy-path.story.ts',
        story: ASYNC_STORY,
      },
      {
        path: 'examples/stories/common/data/async/basic.story.ts',
        story: { title: 'plain', setup: 'readonly s = createAsyncState(load);' },
      },
    ];
    expect(expectedRecipes(entries)).toEqual([
      {
        artifact: 'pack/recipes/common-interactive-async-click.md',
        source: entries[0].path,
        body: renderRecipe(storyToRecipe(ASYNC_STORY)),
      },
    ]);
  });
});

describe('collectStoryEntries', () => {
  it('parses every committed story without an onError call', () => {
    const errors = [];
    const entries = collectStoryEntries((path, err) => errors.push(`${path}: ${err.message}`));
    expect(errors).toEqual([]);
    const storyFiles = readdirSync(resolve(here, '../../examples/stories'), {
      recursive: true,
    }).filter((file) => file.endsWith('.story.ts'));
    expect(storyFiles.length).toBeGreaterThan(800);
    expect(entries).toHaveLength(storyFiles.length);
  });
});

describe('renderRecipe', () => {
  const md = renderRecipe(storyToRecipe(ASYNC_STORY));

  it('renders both the setup block and the template wiring', () => {
    expect(md).toContain('## Setup');
    expect(md).toContain('```ts');
    expect(md).toContain(ASYNC_STORY.setup);
    expect(md).toContain('## Wiring');
    expect(md).toContain('```html');
    expect(md).toContain(ASYNC_STORY.template);
  });

  it('leaks no maintainer-internal reference or localhost', () => {
    const forbidden = [`cngx-${'guru'}`, `cngx-${'designer'}`, `.intern${'al'}/`, 'localhost'];
    for (const token of forbidden) {
      expect(md, `recipe leaks "${token}"`).not.toContain(token);
    }
  });
});
