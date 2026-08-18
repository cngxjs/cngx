import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  demonstratesAsync,
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

  it('returns null when no cngx symbol resolves', () => {
    expect(storyToRecipe({ title: 'plain', template: '<div></div>' })).toBeNull();
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

describe('renderRecipe', () => {
  it('leaks no maintainer-internal reference or localhost', () => {
    const md = renderRecipe(storyToRecipe(ASYNC_STORY));
    const forbidden = [`cngx-${'guru'}`, `cngx-${'designer'}`, `.intern${'al'}/`, 'localhost'];
    for (const token of forbidden) {
      expect(md, `recipe leaks "${token}"`).not.toContain(token);
    }
  });
});
