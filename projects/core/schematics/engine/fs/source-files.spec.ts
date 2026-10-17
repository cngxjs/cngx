import { describe, expect, it } from 'vitest';

import { isAppSource, isRenameTarget } from './source-files';

describe('isAppSource', () => {
  it('keeps app TypeScript and drops specs, declaration files and templates', () => {
    expect(isAppSource('src/app/app.ts')).toBe(true);
    expect(isAppSource('src/app/app.spec.ts')).toBe(false);
    expect(isAppSource('src/typings.d.ts')).toBe(false);
    expect(isAppSource('src/app/app.html')).toBe(false);
  });
});

describe('isRenameTarget', () => {
  it('keeps templates and TypeScript, specs included, and drops declaration files', () => {
    expect(isRenameTarget('src/app/app.html')).toBe(true);
    expect(isRenameTarget('src/app/app.spec.ts')).toBe(true);
    expect(isRenameTarget('src/typings.d.ts')).toBe(false);
    expect(isRenameTarget('src/styles.scss')).toBe(false);
  });
});
