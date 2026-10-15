import { describe, expect, it } from 'vitest';

import * as engine from './index';

describe('engine barrel', () => {
  it.each(['readOwnVersion', 'findElements', 'insertAttribute', 'parseTemplateContent', 'inquirerAdapter'])(
    'does not export %s, which nothing outside the engine reads',
    (name) => {
      expect(Object.keys(engine)).not.toContain(name);
    },
  );

  it('keeps createNodeTree for the CLI', () => {
    expect(Object.keys(engine)).toContain('createNodeTree');
  });
});
