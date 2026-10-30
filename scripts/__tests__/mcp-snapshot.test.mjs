import { describe, expect, it } from 'vitest';

import { rebaseExampleUrls, rebaseUrl } from '../mcp-snapshot.mjs';

const BASE = 'https://cngxjs.github.io/cngx/examples';
const LOCAL = 'http://localhost:4200/#/ui/feedback/toast/basic';

describe('rebaseUrl', () => {
  it('swaps everything before the hash route for the base', () => {
    expect(rebaseUrl(LOCAL, BASE)).toBe(`${BASE}/#/ui/feedback/toast/basic`);
  });

  it('puts a relative hash route under the base', () => {
    expect(rebaseUrl('/#/ui/feedback/toast/basic', BASE)).toBe(`${BASE}/#/ui/feedback/toast/basic`);
  });

  it('leaves a URL without a hash route alone', () => {
    expect(rebaseUrl('http://localhost:4200/plain', BASE)).toBe('http://localhost:4200/plain');
  });
});

describe('rebaseExampleUrls', () => {
  it('rebases components, directives and injectables and counts the changes', () => {
    const doc = {
      components: [{ name: 'CngxSelect', exampleUrls: [LOCAL] }],
      directives: [{ name: 'CngxRipple', exampleUrls: [`${BASE}/#/already`] }],
      injectables: [{ name: 'CngxToaster', exampleUrls: [LOCAL] }],
    };

    expect(rebaseExampleUrls(doc, BASE)).toBe(2);
    expect(doc.injectables[0].exampleUrls).toEqual([`${BASE}/#/ui/feedback/toast/basic`]);
    expect(doc.components[0].exampleUrls).toEqual([`${BASE}/#/ui/feedback/toast/basic`]);
  });
});
