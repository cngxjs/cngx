import { describe, expect, it } from 'vitest';

import { containsStableRelease, resolveDistTag } from '../publish.mjs';

describe('resolveDistTag', () => {
  it('lets an explicit --tag win over every derived rule', () => {
    expect(resolveDistTag({ nextVersion: '1.2.0', explicitTag: 'next', hasStableRelease: true })).toBe(
      'next',
    );
    expect(
      resolveDistTag({ nextVersion: '0.1.0-rc.8', explicitTag: 'beta', hasStableRelease: false }),
    ).toBe('beta');
  });

  it('publishes a stable version to latest', () => {
    expect(resolveDistTag({ nextVersion: '1.0.0', explicitTag: null, hasStableRelease: false })).toBe(
      'latest',
    );
    expect(resolveDistTag({ nextVersion: '1.0.1', explicitTag: null, hasStableRelease: true })).toBe(
      'latest',
    );
  });

  it('publishes a prerelease to latest while no stable release exists', () => {
    expect(
      resolveDistTag({ nextVersion: '0.1.0-rc.8', explicitTag: null, hasStableRelease: false }),
    ).toBe('latest');
  });

  it('keeps a prerelease on next once a stable release exists', () => {
    expect(
      resolveDistTag({ nextVersion: '1.1.0-rc.0', explicitTag: null, hasStableRelease: true }),
    ).toBe('next');
  });
});

describe('containsStableRelease', () => {
  it('is false when only prereleases are published', () => {
    expect(containsStableRelease(['0.1.0-rc.0', '0.1.0-rc.7'])).toBe(false);
  });

  it('is true once any stable version is published', () => {
    expect(containsStableRelease(['0.1.0-rc.7', '0.1.0'])).toBe(true);
  });

  it('is false for an unpublished package', () => {
    expect(containsStableRelease([])).toBe(false);
  });
});
