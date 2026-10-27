import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  assertNoCliTarball,
  cliAppSteps,
  sdkInTree,
  selectCliTarballs,
  missingRecordedLibs,
  newestListed,
  packument,
  parseAngularSpec,
  peerInstallSpecs,
  pinAngularDeps,
  renderAppSource,
  renderMatcherSpec,
  onboardingAddArgs,
  onboardingSteps,
  companionMismatch,
  INTERACTIVE_SMOKE,
  presetPlan,
  budgetWarnings,
  STARTER_SMOKE,
  PRESETS,
  schematicsSteps,
  staleCoreAddArgs,
  STALE_UPDATE_LIBS,
  staleUpdateSteps,
  answerMismatches,
  ONBOARDING_PACKAGES,
  plainTerminalText,
  terminalEnv,
  terminalLegs,
  usageText,
  VARIANTS,
  variantPlan,
} from '../consumer-fixture.mjs';
import { changedInputs } from '../schematics-consumer-inputs.mjs';

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

  it('runs the onboarding variant on a fresh app through ng add alone', () => {
    expect(variantPlan('onboarding')).toMatchObject({ onboarding: true, schematics: true, optionalPeers: false, smoke: true });
    expect(variantPlan('schematics').onboarding).toBe(false);
    expect(onboardingAddArgs('0.1.0', 'full').slice(0, 3)).toEqual(['ng', 'add', '@cngx/core@0.1.0']);
    expect(onboardingAddArgs('0.1.0', 'full')).toContain('full');
  });

  it('onboards an ng new NgModule app with routing, every other variant standalone without routing', () => {
    expect(variantPlan('ngmodule')).toMatchObject({
      standalone: false,
      routing: true,
      zoneless: true,
      onboarding: true,
      schematics: true,
      optionalPeers: false,
      smoke: true,
      matcherSpec: false,
    });
    expect(VARIANTS.filter((variant) => !variantPlan(variant).standalone)).toEqual(['ngmodule']);
    expect(VARIANTS.filter((variant) => variantPlan(variant).routing)).toEqual(['ngmodule']);
  });

  it('runs the onboarding ng add twice, the second changing nothing', () => {
    const [first, again] = onboardingSteps('0.1.0', 'full');

    expect(first).toEqual({ label: 'ng add @cngx/core', args: onboardingAddArgs('0.1.0', 'full'), commit: true });
    expect(again).toEqual({
      label: 'ng add @cngx/core again',
      args: onboardingAddArgs('0.1.0', 'full'),
      expect: 'cngx is already set up; nothing changed.',
      clean: true,
    });
  });

  it('accepts a CDK only on the major of the app Angular', () => {
    expect(companionMismatch('21.2.25', '21.2.14')).toBeUndefined();
    expect(companionMismatch('22.2.3', '22.2.3')).toBeUndefined();
    expect(companionMismatch('21.2.25', '22.2.3')).toBe('@angular/cdk 22.2.3 is installed for @angular/core 21.2.25');
    expect(companionMismatch('21.2.25', undefined)).toBe('no @angular/cdk was installed next to @angular/core 21.2.25');
  });

  it('rejects an unknown variant', () => {
    expect(() => variantPlan('nope')).toThrow(/Unknown variant/);
  });

  it('runs the cli variant on the minimal plan, the only one that installs the cli', () => {
    const { cli, variant, ...shape } = variantPlan('cli');
    const { cli: minimalCli, variant: _minimal, ...minimalShape } = variantPlan('minimal');

    expect(cli).toBe(true);
    expect(minimalCli).toBe(false);
    expect(shape).toEqual(minimalShape);
    expect(VARIANTS.filter((name) => variantPlan(name).cli)).toEqual(['cli']);
  });
});

describe('cli tarballs', () => {
  const LIBS = ['/t/cngx-core-0.1.0-rc.9.tgz', '/t/cngx-ui-0.1.0-rc.9.tgz'];

  it('lets a lib tarball directory without a cli tarball through', () => {
    expect(() => assertNoCliTarball(LIBS)).not.toThrow();
  });

  it('mutation: fails a cngx-cli tarball among the lib tarballs, naming it and pack:cli', () => {
    expect(() => assertNoCliTarball([...LIBS, '/t/cngx-cli-0.1.0.tgz'])).toThrow(/cngx-cli-0\.1\.0\.tgz.*pack:cli/);
  });

  it('mutation: catches a Windows path too', () => {
    expect(() => assertNoCliTarball(['C:\\t\\cngx-cli-0.1.0.tgz'])).toThrow(/cngx-cli-0\.1\.0\.tgz/);
  });

  it('does not mistake another cngx package for the cli', () => {
    expect(() => assertNoCliTarball(['/t/cngx-common-0.1.0.tgz', '/t/cngx-doctor-0.2.1.tgz'])).not.toThrow();
  });

  it('picks the cli and doctor tarballs', () => {
    expect(selectCliTarballs(['/c/cngx-doctor-0.2.1.tgz', '/c/cngx-cli-0.1.0.tgz'])).toEqual({
      cli: '/c/cngx-cli-0.1.0.tgz',
      doctor: '/c/cngx-doctor-0.2.1.tgz',
    });
  });

  it('names npm run pack:cli when a tarball is missing or ambiguous', () => {
    expect(() => selectCliTarballs([])).toThrow(/npm run pack:cli/);
    expect(() => selectCliTarballs(['/c/cngx-cli-0.1.0.tgz'])).toThrow(/@cngx\/doctor.*pack:cli/);
    expect(() => selectCliTarballs(['/c/cngx-cli-0.1.0.tgz', '/c/cngx-cli-0.0.9.tgz', '/c/cngx-doctor-0.2.1.tgz'])).toThrow(/found 2/);
  });
});

describe('cliAppSteps', () => {
  const steps = cliAppSteps('0.1.0');
  const step = (...args) => steps.find((candidate) => candidate.args.join(' ') === args.join(' '));

  it('runs version, a known and an unknown symbol, a bad flag and JSON output with their exit codes', () => {
    expect(steps.map(({ args, exit }) => [args.join(' '), exit])).toEqual([
      ['--version', 0],
      ['api CngxSelect', 0],
      ['api NoSuchThing', 1],
      ['api --bogus', 2],
      ['list --format=json', 0],
    ]);
  });

  it('checks the version against the packed cli', () => {
    expect(step('--version').stdout('0.1.0\n')).toBe(true);
    expect(step('--version').stdout('0.0.9\n')).toBe('expected 0.1.0');
  });

  it('requires the list to be a non-empty JSON array', () => {
    expect(step('list', '--format=json').stdout('[{"name":"CngxSelect"}]')).toBe(true);
    expect(step('list', '--format=json').stdout('[]')).toBe('not a non-empty JSON array');
    expect(step('list', '--format=json').stdout('# CngxSelect')).toMatch(/^not JSON/);
  });
});

describe('sdkInTree', () => {
  it('reads an empty npm ls tree as no SDK', () => {
    expect(sdkInTree('{"version":"0.0.0","name":"fixture"}')).toEqual([]);
    expect(sdkInTree('')).toEqual([]);
  });

  // Shape captured from an Angular 21.2.28 fixture app (npm ls, 2026-10-27): the CLI's own MCP server needs the SDK.
  it('allows the SDK the Angular CLI brings', () => {
    const tree = JSON.stringify({
      dependencies: { '@angular/cli': { dependencies: { '@modelcontextprotocol/sdk': { version: '1.32.1' } } } },
    });

    expect(sdkInTree(tree)).toEqual([]);
  });

  it('mutation: reports the SDK reached through @cngx/cli', () => {
    const tree = JSON.stringify({
      dependencies: {
        '@angular/cli': { dependencies: { '@modelcontextprotocol/sdk': { version: '1.32.1' } } },
        '@cngx/cli': { dependencies: { '@modelcontextprotocol/sdk': { version: '1.30.0', deduped: true } } },
      },
    });

    expect(sdkInTree(tree)).toEqual(['@cngx/cli']);
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
    expect(presetPlan('full', { standalone: false })).toEqual({ ...presetPlan('full'), starter: undefined });
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

describe('staleUpdateSteps', () => {
  const [update, again] = staleUpdateSteps('0.2.0');

  it('runs a real ng update: no --migrate-only, no --from, the release read from the registry', () => {
    expect(update.args).toEqual(['ng', 'update', '@cngx/core']);
    expect(again.args).toEqual(update.args);
  });

  it('expects the migration of the packed release and every installed member moved to it', () => {
    expect(update).toMatchObject({ expect: 'cngx 0.2.0 migration', pins: STALE_UPDATE_LIBS, commit: true });
    expect(STALE_UPDATE_LIBS).toEqual(['utils', 'core', 'common', 'forms']);
  });

  it('finds nothing on the second run and leaves the tree clean', () => {
    expect(again).toMatchObject({ expect: "Package '@cngx/core' is already up to date.", clean: true });
  });
});

describe('terminalLegs', () => {
  const [typed, ci] = terminalLegs('0.2.0');

  it('runs both legs without a cngx flag, only the CLI install confirmation skipped', () => {
    expect(typed.args).toEqual(['ng', 'add', '@cngx/core@0.2.0', '--skip-confirmation']);
    expect(ci.args).toEqual(typed.args);
  });

  it('types an answer to every question in the order the schematic asks them', () => {
    expect(typed.script.map((step) => step.prompt)).toEqual([
      'Which cngx setup do you want?',
      'Which cngx packages do you want?',
      'Which language should cngx speak?',
      'Provide toasts, alerts and banners at the root?',
      'Which editors should get the cngx MCP server?',
    ]);
    expect(typed.answers).toEqual({ preset: 'full', libs: ['utils', 'core', 'common', 'interop', 'forms', 'ui'] });
  });

  it('runs the typed leg outside CI and fails the CI leg on any question', () => {
    expect(typed.env).toEqual({ CI: undefined });
    expect(ci.env).toEqual({ CI: 'true' });
    expect(ci.script).toEqual([]);
    expect(ci.forbid).toEqual(typed.script.map((step) => step.prompt));
    expect(ci.answers.preset).toBe('recommended');
  });
});

describe('terminalEnv', () => {
  it('turns the CLI analytics question off and drops an undefined override', () => {
    expect(terminalEnv({ CI: 'true', PATH: '/bin' }, { CI: undefined })).toEqual({ PATH: '/bin', NG_CLI_ANALYTICS: 'false' });
    expect(terminalEnv({ PATH: '/bin' }, { CI: 'true' })).toEqual({ PATH: '/bin', NG_CLI_ANALYTICS: 'false', CI: 'true' });
  });
});

describe('plainTerminalText', () => {
  it('drops colour and cursor sequences', () => {
    expect(plainTerminalText('\u001b[1mWhich cngx setup\u001b[22m\u001b[?25l do you want?')).toBe('Which cngx setup do you want?');
  });
});

describe('answerMismatches', () => {
  const manifest = { projects: { fixture: { answers: { preset: 'full', libs: ['core', 'ui'] } } } };

  it('names every recorded answer that differs', () => {
    expect(answerMismatches(manifest, 'fixture', { preset: 'full', libs: ['core', 'ui'] })).toEqual([]);
    expect(answerMismatches(manifest, 'fixture', { preset: 'recommended' })).toEqual(['preset is "full", expected "recommended"']);
    expect(answerMismatches({}, 'fixture', { preset: 'full' })).toEqual(['preset is undefined, expected "full"']);
  });
});

describe('onboardingSteps with --add', () => {
  it('runs the shim ng add of the named package twice', () => {
    const [first, again] = onboardingSteps('0.2.0', 'full', 'ui');

    expect(ONBOARDING_PACKAGES).toEqual(['core', 'ui']);
    expect(first.label).toBe('ng add @cngx/ui');
    expect(first.args.slice(0, 3)).toEqual(['ng', 'add', '@cngx/ui@0.2.0']);
    expect(again).toMatchObject({ args: first.args, clean: true });
    expect(onboardingSteps('0.2.0')[0].args[2]).toBe('@cngx/core@0.2.0');
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

  it('runs on a pull request that touches the schematics or what builds them, not on the demo app', () => {
    expect(workflow).toContain('--workflow consumer-compat');
    expect(changedInputs(['projects/core/schematics/ng-add/index.ts'], 'consumer-compat')).toHaveLength(1);
    expect(changedInputs(['scripts/build-schematics.mjs'], 'consumer-compat')).toHaveLength(1);
    expect(changedInputs(['examples/stories/forms/select/single-select/clearable.story.ts'], 'consumer-compat')).toEqual([]);
  });

  // The fixture rows are required checks: a path filter on the trigger, or a
  // skipped matrix job, would leave them pending on an unrelated pull request.
  it('reports every fixture row on every pull request', () => {
    expect(workflow).not.toMatch(/pull_request:\s*\n\s*paths:/);
    expect(workflow).toContain("needs.pack.result != 'failure'");
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

  it('proves the fresh-app onboarding on both majors on the full preset', () => {
    expect(workflow).toContain("- { angular: '21', variant: onboarding, args: '--preset full' }");
    expect(workflow).toContain("- { angular: '22', variant: onboarding, args: '--preset full' }");
  });

  it('proves the shim ng add @cngx/ui the docs name, on the major where the CDK must come first', () => {
    expect(workflow).toContain("- { angular: '21', variant: onboarding, add: ui, args: '--add ui --preset full' }");
  });

  // Branch protection gates a required check by name; two rows under one
  // name would let a red row hide behind a green one.
  it('gives every fixture row its own check name', () => {
    const rows = [...workflow.matchAll(/^\s*- \{ angular: '([^']+)', variant: (\w+)(?:, add: (\w+))?/gm)];
    const names = rows.map(([, angular, variant, add]) => `angular-${angular}-${variant}${add ? `-${add}` : ''}`);

    expect(rows.length).toBeGreaterThan(10);
    expect(workflow).toContain("name: angular-${{ matrix.angular }}-${{ matrix.variant }}${{ matrix.add && format('-{0}', matrix.add) || '' }}");
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
  });

  it('fails every row when the changes job did not decide, instead of leaving it pending', () => {
    expect(workflow).toContain("if: ${{ !cancelled() && needs.pack.result != 'failure' }}");
    expect(workflow).toContain("if: needs.changes.result != 'success'");
  });

  it('runs the stale core and stale update legs on the full preset on both majors', () => {
    for (const major of ['21', '22']) {
      expect(workflow).toContain(`- { angular: '${major}', variant: schematics, args: '--stale-core previous --preset full' }`);
    }
  });

  it('keeps the required schematics-consumer job on the default preset', () => {
    const required = readFileSync(join(root, '.github', 'workflows', 'schematics-consumer.yml'), 'utf8');

    expect(required).not.toContain('--preset');
  });
});
