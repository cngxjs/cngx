import { describe, expect, it } from 'vitest';

import * as resolveTemplateModule from './resolve-template';

describe('resolve-template module shape', () => {
  it('exports injectResolvedTemplate as its only resolver', () => {
    expect(Object.keys(resolveTemplateModule)).toEqual(['injectResolvedTemplate']);
  });
});
