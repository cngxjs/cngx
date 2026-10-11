import { describe, expect, it } from 'vitest';

import { parseStory } from '../examples-gen/story.mjs';

describe('parseStory', () => {
  it('evaluates the STORY object literal', () => {
    const source = "export const STORY = { title: 'Basic', template: `<b>x</b>` };\n";
    expect(parseStory(source, 'a.story.ts')).toEqual({ title: 'Basic', template: '<b>x</b>' });
  });

  it('drops the import type line and the type annotation', () => {
    const source = [
      "import type { DemoSpec } from '../../dev-tools/demo-spec';",
      "export const STORY: DemoSpec = { title: 'Typed' };",
      '',
    ].join('\n');
    expect(parseStory(source, 'b.story.ts')).toEqual({ title: 'Typed' });
  });

  it('throws with the label when the STORY export is missing', () => {
    expect(() => parseStory('export const OTHER = {};\n', 'c.story.ts')).toThrow(
      'No STORY export in c.story.ts',
    );
  });

  it('throws with the label and the cause when the literal does not evaluate', () => {
    expect(() => parseStory('export const STORY = { title: };\n', 'd.story.ts')).toThrow(
      /^Cannot evaluate STORY in d\.story\.ts: .+/,
    );
  });
});
