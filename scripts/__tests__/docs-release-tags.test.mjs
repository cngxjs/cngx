import { describe, expect, it } from 'vitest';

import {
  DOCS_KEEP_VERSIONS,
  DOCS_MIN_VERSION,
  parseReleaseTagOptions,
  selectReleaseTags,
} from '../docs-release-tags.mjs';

describe('selectReleaseTags', () => {
  it('keeps final release tags only, newest first', () => {
    const tags = ['v0.3.0', 'v0.4.0-rc.1', 'v0.3.1', 'latest', 'v0.4', 'v0.4.0', 'v1.0.0-beta.2'];
    expect(selectReleaseTags(tags, { min: '0.3.0', keep: 4 })).toEqual([
      'v0.4.0',
      'v0.3.1',
      'v0.3.0',
    ]);
  });

  it('orders by number, not by text', () => {
    const tags = ['v0.9.0', 'v0.10.0', 'v0.10.2', 'v1.0.0'];
    expect(selectReleaseTags(tags, { min: '0.3.0', keep: 4 })).toEqual([
      'v1.0.0',
      'v0.10.2',
      'v0.10.0',
      'v0.9.0',
    ]);
  });

  it('drops releases below the minimum, the minimum itself included', () => {
    const tags = ['v0.2.9', 'v0.3.0', 'v0.1.0'];
    expect(selectReleaseTags(tags, { min: '0.3.0', keep: 4 })).toEqual(['v0.3.0']);
  });

  it('keeps the newest `keep` releases', () => {
    const tags = ['v0.3.0', 'v0.4.0', 'v0.5.0', 'v0.6.0', 'v0.7.0', 'v0.7.1'];
    expect(selectReleaseTags(tags, { min: '0.3.0', keep: 4 })).toEqual([
      'v0.7.1',
      'v0.7.0',
      'v0.6.0',
      'v0.5.0',
    ]);
  });

  it('answers an empty list before the first release', () => {
    expect(selectReleaseTags(['v0.1.0-rc.9', 'v0.2.0'], { min: '0.3.0', keep: 4 })).toEqual([]);
    expect(selectReleaseTags([], { min: '0.3.0', keep: 4 })).toEqual([]);
  });
});

describe('parseReleaseTagOptions', () => {
  it('defaults to the docs from 0.3.0 on and the newest 4 releases', () => {
    expect(DOCS_MIN_VERSION).toBe('0.3.0');
    expect(DOCS_KEEP_VERSIONS).toBe(4);
    expect(parseReleaseTagOptions({})).toEqual({ min: '0.3.0', keep: 4 });
  });

  it('reads DOCS_MIN_VERSION and DOCS_KEEP_VERSIONS', () => {
    expect(parseReleaseTagOptions({ DOCS_MIN_VERSION: '1.2.0', DOCS_KEEP_VERSIONS: '2' })).toEqual({
      min: '1.2.0',
      keep: 2,
    });
  });

  it('refuses a malformed minimum or count', () => {
    expect(() => parseReleaseTagOptions({ DOCS_MIN_VERSION: '1.2' })).toThrow(
      /DOCS_MIN_VERSION "1.2"/,
    );
    expect(() => parseReleaseTagOptions({ DOCS_MIN_VERSION: '1.2.0-rc.1' })).toThrow(
      /DOCS_MIN_VERSION/,
    );
    expect(() => parseReleaseTagOptions({ DOCS_KEEP_VERSIONS: '0' })).toThrow(
      /DOCS_KEEP_VERSIONS "0"/,
    );
    expect(() => parseReleaseTagOptions({ DOCS_KEEP_VERSIONS: 'four' })).toThrow(
      /DOCS_KEEP_VERSIONS/,
    );
  });
});
