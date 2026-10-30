import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { VersionedAnswer } from '../data/docs-resolver.js';
import { createDocsResolver } from '../data/docs-resolver.js';
import { loadBundledDocs, loadDocsFromFile } from '../data/loader.js';
import type { StoryExampleResult } from './get-story-example.js';
import { getStoryExample as getStoryExampleAnswer, getStoryExampleCommand } from './get-story-example.js';
import { isAmbiguous } from '../query.js';

/** The query answer for a name that must not be ambiguous. */
function getStoryExample(...args: Parameters<typeof getStoryExampleAnswer>): StoryExampleResult | null {
  const answer = getStoryExampleAnswer(...args);
  if (isAmbiguous(answer)) {
    throw new Error(`unexpected ambiguity for ${args[1]}`);
  }
  return answer;
}

const FIXTURE = fileURLToPath(new URL('../../../test/fixtures/documentation.sample.json', import.meta.url));
const docs = loadDocsFromFile(FIXTURE);

describe('getStoryExample', () => {
  it('returns example URLs, a null StackBlitz URL, and labelled source references', () => {
    const result = getStoryExample(docs, 'CngxSelect');

    expect(result).toMatchObject({ name: 'CngxSelect', kind: 'component', stackblitzUrl: null });
    expect(result?.exampleUrls).toEqual(['https://cngxjs.github.io/cngx/examples/#/forms/select/single-select/clearable']);
    expect(result?.sourceReferences).toEqual([
      { title: 'Material theme', fileRef: './examples/material-theme/material-theme.component.ts', line: 0 },
    ]);
  });

  it('returns only public example URLs - no localhost leaks through', () => {
    for (const url of getStoryExample(docs, 'CngxSelect')?.exampleUrls ?? []) {
      expect(url).not.toContain('localhost');
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  it('returns null for an unknown name', () => {
    expect(getStoryExample(docs, 'CngxDoesNotExist')).toBeNull();
  });
});

describe('get_story_example run', () => {
  const bundled = loadBundledDocs(fileURLToPath(new URL('../../../data/', import.meta.url)));
  const run = (name: string) => getStoryExampleCommand.run({ bundled, resolve: createDocsResolver(bundled) }, { name });

  it('answers an ambiguous selector inside the versioned envelope', async () => {
    expect(await run('cngxRouterSync')).toEqual({
      ok: true,
      groundedVersion: bundled.meta.cngxVersion,
      result: {
        ambiguous: true,
        candidates: [
          expect.objectContaining({ name: 'CngxBreadcrumbRouterSync' }),
          expect.objectContaining({ name: 'CngxBreadcrumbSiblingsRouterSync' }),
        ],
      },
    });
  });

  it('answers an unknown name with a null result', async () => {
    expect(await run('CngxDoesNotExist')).toEqual({ ok: true, groundedVersion: bundled.meta.cngxVersion, result: null });
  });

  it('answers CngxTreeSelect with its example URLs under result', async () => {
    const answer = (await run('CngxTreeSelect')) as VersionedAnswer<StoryExampleResult>;

    expect(answer).toMatchObject({ ok: true, groundedVersion: bundled.meta.cngxVersion, result: { name: 'CngxTreeSelect', kind: 'component' } });
    expect(answer.ok && answer.result.exampleUrls.length).toBeGreaterThan(0);
  });
});

describe('get_story_example input schema', () => {
  const schema = z.object(getStoryExampleCommand.input);

  it('rejects a blank name as invalid input', () => {
    expect(schema.safeParse({ name: ' ' }).success).toBe(false);
    expect(schema.safeParse({ name: '\t' }).success).toBe(false);
  });

  it('trims a padded name before the query sees it', () => {
    expect(schema.parse({ name: ' CngxSelect ' }).name).toBe('CngxSelect');
  });
});
