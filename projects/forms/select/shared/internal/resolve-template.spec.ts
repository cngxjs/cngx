import { describe, expect, it } from 'vitest';

import * as resolveTemplateModule from './resolve-template';

describe('resolve-template module shape', () => {
  it('exports injectResolvedTemplate and no resolveTemplate alias', () => {
    expect('resolveTemplate' in resolveTemplateModule).toBe(false);
    expect('injectResolvedTemplate' in resolveTemplateModule).toBe(true);
  });
});
