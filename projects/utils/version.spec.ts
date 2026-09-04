import { describe, expect, it } from 'vitest';
import { makeVersion } from './version';

describe('makeVersion', () => {
  it('parses a plain release', () => {
    expect(makeVersion('1.2.3')).toEqual({
      full: '1.2.3',
      major: '1',
      minor: '2',
      patch: '3',
      prerelease: '',
    });
  });

  it('splits the pre-release tag off the patch segment', () => {
    const v = makeVersion('0.2.0-rc.2');
    expect(v.patch).toBe('0');
    expect(v.prerelease).toBe('rc.2');
    expect(v.full).toBe('0.2.0-rc.2');
  });

  it('drops build metadata from the segments but keeps it in full', () => {
    const v = makeVersion('1.0.0-beta.1+build.5');
    expect(v.patch).toBe('0');
    expect(v.prerelease).toBe('beta.1');
    expect(v.full).toBe('1.0.0-beta.1+build.5');
  });

  it('handles a hyphenated pre-release with its own dashes', () => {
    expect(makeVersion('1.0.0-alpha-2').prerelease).toBe('alpha-2');
  });

  it('defaults missing segments to 0', () => {
    expect(makeVersion('2')).toEqual({
      full: '2',
      major: '2',
      minor: '0',
      patch: '0',
      prerelease: '',
    });
  });

  it('parses the publish placeholder shape', () => {
    const v = makeVersion('0.0.0-PLACEHOLDER');
    expect(v.patch).toBe('0');
    expect(v.prerelease).toBe('PLACEHOLDER');
  });
});
