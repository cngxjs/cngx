import { describe, expect, it } from 'vitest';

import {
  parseAngularSpec,
  peerInstallSpecs,
  pinAngularDeps,
  renderAppSource,
  variantPlan,
} from '../consumer-fixture.mjs';

describe('parseAngularSpec', () => {
  it('treats a major or minor as a range and a full version as a pin', () => {
    expect(parseAngularSpec('21')).toEqual({ cliSpec: '21', exact: false });
    expect(parseAngularSpec('21.2')).toEqual({ cliSpec: '21.2', exact: false });
    expect(parseAngularSpec('21.2.0')).toEqual({ cliSpec: '21.2.0', exact: true });
  });

  it('rejects anything else', () => {
    expect(() => parseAngularSpec('latest')).toThrow(/Unsupported/);
    expect(() => parseAngularSpec('^21')).toThrow(/Unsupported/);
  });
});

describe('variantPlan', () => {
  it('derives the app shape from the variant', () => {
    expect(variantPlan('full')).toMatchObject({ zoneless: true, ssr: false, optionalPeers: true, smoke: true });
    expect(variantPlan('zone')).toMatchObject({ zoneless: false });
    expect(variantPlan('ssr')).toMatchObject({ ssr: true, smoke: false });
    expect(variantPlan('minimal')).toMatchObject({ optionalPeers: false });
  });

  it('rejects an unknown variant', () => {
    expect(() => variantPlan('nope')).toThrow(/Unknown variant/);
  });
});

describe('pinAngularDeps', () => {
  it('pins Angular packages and leaves the rest alone', () => {
    const pinned = pinAngularDeps(
      {
        dependencies: { '@angular/core': '^21.2.4', rxjs: '~7.8.0' },
        devDependencies: { '@angular/cli': '^21.2.2', typescript: '~5.9.2' },
      },
      '21.2.0',
    );
    expect(pinned.dependencies).toEqual({ '@angular/core': '21.2.0', rxjs: '~7.8.0' });
    expect(pinned.devDependencies).toEqual({ '@angular/cli': '21.2.0', typescript: '~5.9.2' });
  });
});

describe('peerInstallSpecs', () => {
  it('installs only the cdk for the minimal plan', () => {
    expect(peerInstallSpecs(variantPlan('minimal'), '21.2.25')).toEqual(['@angular/cdk@^21.0.0']);
  });

  it('adds Material and the optional peers otherwise', () => {
    const specs = peerInstallSpecs(variantPlan('full'), '22.1.3');
    expect(specs).toContain('@angular/material@^22.0.0');
    expect(specs).toContain('@ngrx/signals@^22');
    expect(specs.some((spec) => spec.startsWith('@ngrx/signals'))).toBe(true);
  });
});

describe('peerInstallSpecs with an exact pin', () => {
  it('names the pinned version for cdk and Material', () => {
    expect(peerInstallSpecs(variantPlan('full'), '21.2.0', '21.2.0').slice(0, 2)).toEqual([
      '@angular/cdk@21.2.0',
      '@angular/material@21.2.0',
    ]);
  });
});

describe('renderAppSource', () => {
  it('imports the optional-peer entry only when its peer is installed', () => {
    expect(renderAppSource(variantPlan('full'))).toContain('@cngx/interop/signals');
    expect(renderAppSource(variantPlan('minimal'))).not.toContain('@cngx/interop/signals');
  });

  it('touches every lib', () => {
    const source = renderAppSource(variantPlan('minimal'));
    for (const lib of ['utils', 'core', 'common', 'forms', 'data-display', 'ui', 'interop']) {
      expect(source).toContain(`@cngx/${lib === 'utils' ? 'utils' : `${lib}/`}`);
    }
  });
});
