import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  missingRecordedLibs,
  newestListed,
  packument,
  parseAngularSpec,
  peerInstallSpecs,
  pinAngularDeps,
  renderAppSource,
  renderMatcherSpec,
  INTERACTIVE_SMOKE,
  presetPlan,
  budgetWarnings,
  STARTER_SMOKE,
  PRESETS,
  schematicsSteps,
  staleCoreAddArgs,
  usageText,
  VARIANTS,
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
    expect(variantPlan('minimal')).toMatchObject({ optionalPeers: false, schematics: false });
    expect(variantPlan('schematics')).toMatchObject({ zoneless: true, ssr: false, optionalPeers: false, smoke: true, schematics: true });
  });

  it('runs ng test with the cngx Vitest matchers on the full variant only', () => {
    expect(VARIANTS.filter((variant) => variantPlan(variant).matcherSpec)).toEqual(['full']);
    const spec = renderMatcherSpec();
    expect(spec).toContain("from '@cngx/core/testing/vitest'");
    expect(spec).toContain('expect.extend(cngxAnnouncementMatchers)');
    expect(spec).toContain("toHaveHeard('Saved')");
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

  it('renders the select shell, the combobox and a signal forms field with min and max on every variant', () => {
    for (const variant of ['full', 'zone', 'ssr', 'minimal']) {
      const source = renderAppSource(variantPlan(variant));
      expect(source).toContain('<cngx-select-shell');
      expect(source).toContain('<cngx-select-search');
      expect(source).toContain('<cngx-combobox');
      expect(source).toContain('<cngx-form-field [field]="booking.seats">');
      expect(source).toContain('[formField]="booking.seats"');
      expect(source).toMatch(/min\(root\.seats, 1/);
      expect(source).toContain(`max(root.seats, 10, { message: '${INTERACTIVE_SMOKE.seats.error}' })`);
    }
  });

  it('lists the options the smoke picks', () => {
    const source = renderAppSource(variantPlan('minimal'));
    expect(source).toContain(`'${INTERACTIVE_SMOKE.shell.option}'`);
    expect(source).toContain(`label: '${INTERACTIVE_SMOKE.combobox.option}'`);
  });
});

describe('usageText', () => {
  it('names --angular, --stale-core, --preset and every variant', () => {
    const text = usageText();

    expect(text).toContain('--angular');
    expect(text).toContain('--stale-core');
    expect(text).toContain('--preset <minimal | recommended | full>');
    for (const variant of VARIANTS) {
      expect(text).toContain(variant);
    }
  });
});

describe('schematicsSteps', () => {
  const steps = schematicsSteps('0.2.0');

  it('runs ng add twice, the shim once and ng update twice, in that order', () => {
    expect(steps.map((step) => step.args.slice(0, 3).join(' '))).toEqual([
      'ng add @cngx/core@0.2.0',
      'ng add @cngx/core@0.2.0',
      'ng add @cngx/forms@0.2.0',
      'ng update @cngx/core',
      'ng update @cngx/core',
    ]);
  });

  it('asks every ng add for no prompt and no confirmation', () => {
    for (const step of steps.filter((entry) => entry.args[1] === 'add')) {
      expect(step.args).toEqual(expect.arrayContaining(['--skip-confirmation', '--no-prompts', '--yes']));
    }
  });

  it('requires the second ng add and the second ng update to change nothing', () => {
    expect(steps[1]).toMatchObject({ expect: 'cngx is already set up; nothing changed.', clean: true });
    expect(steps[4]).toMatchObject({ expect: 'found nothing to change', clean: true });
  });

  it('checks the exact pins after the package shim', () => {
    expect(steps[2].pins).toEqual(['utils', 'core', 'common', 'forms']);
  });

  it('checks that the package shim keeps every recorded lib of the first ng add', () => {
    expect(steps[2].recordedLibs).toEqual(['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui']);
  });

  it('migrates from below every release up to the packed one', () => {
    expect(steps[3].args).toEqual(expect.arrayContaining(['--migrate-only', '--from', '0.0.1', '--to', '0.2.0']));
  });
});

describe('schematicsSteps with a preset', () => {
  it('passes no preset flag on the default path, so its commands stay as they were', () => {
    expect(schematicsSteps('0.2.0', 'recommended')).toEqual(schematicsSteps('0.2.0'));
    expect(schematicsSteps('0.2.0').flatMap((step) => step.args)).not.toContain('--preset');
  });

  it('passes the preset to both core ng add runs and leaves the shim on the recorded one', () => {
    const steps = schematicsSteps('0.2.0', 'full');

    expect(steps[0].args.slice(-2)).toEqual(['--preset', 'full']);
    expect(steps[1].args.slice(-2)).toEqual(['--preset', 'full']);
    expect(steps[2].args).not.toContain('--preset');
  });
});

describe('presetPlan', () => {
  it('runs ng test and expects both outlets only with the full preset', () => {
    expect(presetPlan('full')).toEqual({
      preset: 'full',
      ngTest: true,
      outlets: ['cngx-banner-outlet', 'cngx-toast-outlet'],
      starter: STARTER_SMOKE,
      noBudgetWarnings: true,
    });
    expect(presetPlan()).toEqual({ preset: 'recommended', ngTest: false, outlets: [], starter: undefined, noBudgetWarnings: false });
    expect(presetPlan('minimal')).toEqual({ preset: 'minimal', ngTest: false, outlets: [], starter: undefined, noBudgetWarnings: false });
  });

  it('reads the budget warnings ng build prints', () => {
    const output = [
      'Application bundle generation complete.',
      '▲ [WARNING] src/app/app.css exceeded maximum budget. Budget 4.00 kB was not met by 1.52 kB with a total of 5.52 kB.',
      'Output location: dist/fixture',
    ].join('\n');

    expect(budgetWarnings(output)).toEqual([
      '▲ [WARNING] src/app/app.css exceeded maximum budget. Budget 4.00 kB was not met by 1.52 kB with a total of 5.52 kB.',
    ]);
    expect(budgetWarnings('Application bundle generation complete.')).toEqual([]);
  });

  it('smokes the starter heading, the toast and banner it shows and its icon link', () => {
    expect(STARTER_SMOKE.heading).toBe('Hello, fixture.');
    expect(STARTER_SMOKE.shows.map(({ button, outlet }) => [button, outlet])).toEqual([
      ['Toast', 'cngx-toast-outlet'],
      ['Banner', 'cngx-banner-outlet'],
    ]);
    expect(STARTER_SMOKE.icon).toBe('favicon.svg');
  });

  it('rejects an unknown preset', () => {
    expect(PRESETS).toEqual(['minimal', 'recommended', 'full']);
    expect(() => presetPlan('everything')).toThrow('Unknown preset "everything"');
  });
});

describe('staleCoreAddArgs', () => {
  it('passes the preset of the run on to the stale core leg', () => {
    expect(staleCoreAddArgs('0.2.0', 'full')).toEqual(expect.arrayContaining(['ng', 'add', '@cngx/forms@0.2.0', '--preset', 'full']));
    expect(staleCoreAddArgs('0.2.0')).not.toContain('--preset');
  });
});

describe('missingRecordedLibs', () => {
  const record = (libs) => ({ projects: { fixture: { answers: { libs } } } });

  it('names every expected lib the install record of the project lacks', () => {
    expect(missingRecordedLibs(record(['core', 'forms']), 'fixture', ['utils', 'core', 'forms'])).toEqual(['utils']);
    expect(missingRecordedLibs(record(['utils', 'core', 'forms']), 'fixture', ['core', 'forms'])).toEqual([]);
  });

  it('names every expected lib when the project or its answers are missing', () => {
    expect(missingRecordedLibs({ projects: {} }, 'fixture', ['core'])).toEqual(['core']);
    expect(missingRecordedLibs({}, 'fixture', ['core'])).toEqual(['core']);
    expect(missingRecordedLibs(record(undefined), 'fixture', ['core'])).toEqual(['core']);
  });
});

describe('packument', () => {
  it('lists the tarball as the only release, with its integrity', () => {
    const tarball = Buffer.from('tarball');
    const document = packument({ name: '@cngx/core', version: '0.2.0' }, 'http://127.0.0.1/-/@cngx/core.tgz', tarball);

    expect(document['dist-tags']).toEqual({ latest: '0.2.0' });
    expect(document.versions['0.2.0'].dist).toEqual({
      tarball: 'http://127.0.0.1/-/@cngx/core.tgz',
      integrity: `sha512-${createHash('sha512').update(tarball).digest('base64')}`,
      shasum: createHash('sha1').update(tarball).digest('hex'),
    });
  });
});

describe('newestListed', () => {
  it('reads a list, a single version and nothing', () => {
    expect(newestListed('["0.1.0-rc.6","0.1.0-rc.7"]')).toBe('0.1.0-rc.7');
    expect(newestListed('"0.1.0-rc.7"')).toBe('0.1.0-rc.7');
    expect(newestListed('')).toBeUndefined();
  });
});

describe('the consumer-compat workflow', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const workflow = readFileSync(join(root, '.github', 'workflows', 'consumer-compat.yml'), 'utf8');

  it('runs on a pull request that touches the schematics', () => {
    const paths = /pull_request:\s*\n\s*paths:\n((?:\s*- .+\n)+)/.exec(workflow)?.[1] ?? '';
    expect(paths).toContain("- 'projects/*/schematics/**'");
  });

  it('runs every row strictly against the declared peers', () => {
    expect(workflow).not.toContain('--ignore-peers');
    expect(workflow).not.toContain('continue-on-error');
  });

  it('covers the floor and the highest major of the peer range the libs declare', () => {
    const core = JSON.parse(readFileSync(join(root, 'projects', 'core', 'package.json'), 'utf8'));
    const [, floor, ceiling] = /^>=(\d+\.\d+\.\d+) <(\d+)\.0\.0$/.exec(core.peerDependencies['@angular/core']) ?? [];
    const highest = String(Number(ceiling) - 1);

    expect(workflow).toContain(`- { angular: '${floor}', variant: minimal }`);
    for (const variant of ['full', 'minimal']) {
      expect(workflow).toContain(`- { angular: '${highest}', variant: ${variant} }`);
    }
  });

  it('runs the stale-core leg on the full preset in its schematics row', () => {
    expect(workflow).toMatch(/variant: schematics, args: '--stale-core previous --preset full'/);
  });

  it('keeps the required schematics-consumer job on the default preset', () => {
    const required = readFileSync(join(root, '.github', 'workflows', 'schematics-consumer.yml'), 'utf8');

    expect(required).not.toContain('--preset');
  });
});
