import { describe, expect, it } from 'vitest';

import { walkSources } from './_i18n-ast.mjs';
import { isToolingRoot } from './source-roots.mjs';

describe('isToolingRoot', () => {
  it('matches every lib schematics folder', () => {
    expect(isToolingRoot('projects/core/schematics')).toBe(true);
    expect(isToolingRoot('projects/ui/schematics')).toBe(true);
  });

  it('leaves library folders and nested schematics paths alone', () => {
    expect(isToolingRoot('projects/core')).toBe(false);
    expect(isToolingRoot('projects/core/i18n')).toBe(false);
    expect(isToolingRoot('projects/core/schematics/ng-add')).toBe(false);
    expect(isToolingRoot('projects/core/theming/schematics')).toBe(false);
  });
});

describe('walkSources over projects/', () => {
  const files = walkSources('projects', /\.ts$/);

  it('skips the tooling roots', () => {
    expect(files.filter((file) => /^projects\/[^/]+\/schematics\//.test(file))).toEqual([]);
  });

  it('still walks the library sources', () => {
    expect(files).toContain('projects/core/public-api.ts');
  });
});
