// Inputs copy the `exampleUrls` shape of a raw `docs:json` export (compodocx
// 0.10.0): absolute links on the build-time base `http://localhost:4200`, a hash
// route after `/#/`.

import { describe, expect, it } from 'vitest';
import { createDocsIndex } from './loader.js';
import { EXAMPLES_BASE_URL, rebaseExampleUrls } from './example-urls.js';
import type { DocEntry } from './types.js';

const LOCAL = 'http://localhost:4200/#/forms/select/single-select/clearable';
const PUBLIC = `${EXAMPLES_BASE_URL}/#/forms/select/single-select/clearable`;

const index = (entries: { components?: DocEntry[]; directives?: DocEntry[]; injectables?: DocEntry[] }) =>
  createDocsIndex({ schemaVersion: 6, ...entries });

describe('rebaseExampleUrls', () => {
  it('moves a localhost URL onto the public base', () => {
    const docs = rebaseExampleUrls(index({ components: [{ name: 'CngxSelect', exampleUrls: [LOCAL] }] }));

    expect(docs.components[0].exampleUrls).toEqual([PUBLIC]);
  });

  it('leaves an already-public URL unchanged', () => {
    const docs = rebaseExampleUrls(index({ components: [{ name: 'CngxSelect', exampleUrls: [PUBLIC] }] }));

    expect(docs.components[0].exampleUrls).toEqual([PUBLIC]);
  });

  it('leaves a URL without a hash route unchanged', () => {
    const docs = rebaseExampleUrls(index({ components: [{ name: 'CngxSelect', exampleUrls: ['http://localhost:4200/plain'] }] }));

    expect(docs.components[0].exampleUrls).toEqual(['http://localhost:4200/plain']);
  });

  it('covers directives and injectables', () => {
    const docs = rebaseExampleUrls(
      index({
        directives: [{ name: 'CngxRipple', exampleUrls: [LOCAL] }],
        injectables: [{ name: 'CngxToaster', exampleUrls: [LOCAL] }],
      }),
    );

    expect(docs.directives[0].exampleUrls).toEqual([PUBLIC]);
    expect(docs.injectables[0].exampleUrls).toEqual([PUBLIC]);
  });

  it('takes an explicit base and drops its trailing slash', () => {
    const docs = rebaseExampleUrls(index({ components: [{ name: 'CngxSelect', exampleUrls: [LOCAL] }] }), 'https://x.test/ex/');

    expect(docs.components[0].exampleUrls).toEqual(['https://x.test/ex/#/forms/select/single-select/clearable']);
  });

  it('does not mutate the input', () => {
    const docs = index({ injectables: [{ name: 'CngxToaster', exampleUrls: [LOCAL] }] });
    const before = structuredClone(docs);

    rebaseExampleUrls(docs);

    expect(docs).toEqual(before);
  });
});
