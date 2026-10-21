import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  collectAllEntries,
  holdsPlaceholder,
  NAME_PLACEHOLDER,
  OUT,
  renderCatalogModule,
  schematicsRoots,
  schematicsVersion,
  SELECTOR_PLACEHOLDER,
  TITLE_PLACEHOLDER,
} from '../generate-scaffold-catalog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = resolve(ROOT, 'projects/core/schematics/testing/fixtures');
const require = createRequire(import.meta.url);

// Every CLI major the catalog holds, each with its `ng new` fixtures.
const MAJORS = [21, 22];

function fixture(name, path) {
  return readFileSync(resolve(FIXTURES, name, path), 'utf8');
}

// A body with the names `ng new fixture-app` rendered it with.
function named(body) {
  return body
    .split(NAME_PLACEHOLDER)
    .join('fixture-app')
    .split(TITLE_PLACEHOLDER)
    .join('FixtureApp')
    .split(SELECTOR_PLACEHOLDER)
    .join('app-root');
}

describe('scaffold catalog', () => {
  it('keeps the generated module in sync with the installed @schematics/angular templates', async () => {
    expect(readFileSync(resolve(ROOT, OUT), 'utf8')).toBe(await renderCatalogModule());
  });

  it('renders the toolchain package and every alias, one per CLI major', () => {
    expect(schematicsRoots().map((root) => Number(schematicsVersion(root).split('.')[0]))).toEqual(MAJORS);
  });

  it('keeps the toolchain on its own TypeScript and devkit next to the aliases', () => {
    const { devDependencies } = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
    const version = (name) => require(`${name}/package.json`).version;

    expect(version('@angular-devkit/core')).toBe(version('@schematics/angular'));
    expect(version('typescript').split('.').slice(0, 2).join('.')).toBe(devDependencies.typescript.replace(/^~/, '').split('.').slice(0, 2).join('.'));
  });

  it('lets only the catalog generator reach the alias packages and what they pull in', () => {
    const tracked = execFileSync('git', ['ls-files', '*.ts', '*.mjs', '*.js', '*.cjs'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    const reaching = tracked.filter((file) => {
      const text = readFileSync(resolve(ROOT, file), 'utf8');
      return /['"`](?:@schematics\/angular-\d+|oxc-parser)['"`/]/.test(text);
    });

    expect(reaching).toEqual([]);
  });

  it.each(MAJORS)('renders the CLI %i spec templates byte for byte as ng new wrote the fixtures', async (major) => {
    const entries = await collectAllEntries();
    const raw = (variant) =>
      entries.find((entry) => entry.major === major && entry.file === 'app.spec.ts' && entry.variant === variant && entry.form === 'raw');

    expect(raw('zoneless').body.split(NAME_PLACEHOLDER).join('fixture-app')).toBe(
      fixture(`scaffold-${major}`, 'src/app/app.spec.ts'),
    );
    expect(raw('zone').body.split(NAME_PLACEHOLDER).join('fixture-app')).toBe(
      fixture(`scaffold-${major}-zone`, 'src/app/app.spec.ts'),
    );
  });

  it.each(MAJORS)('renders the CLI %i NgModule spec templates byte for byte as ng new --standalone=false wrote the fixtures', async (major) => {
    const entries = await collectAllEntries();
    const raw = (variant) =>
      entries.find((entry) => entry.major === major && entry.file === 'app.spec.ts' && entry.variant === variant && entry.form === 'raw');

    for (const [suffix, variant] of [
      ['', 'ngmodule-routing-zoneless'],
      ['-zone', 'ngmodule-routing-zone'],
      ['-routing-off', 'ngmodule-no-routing-zoneless'],
      ['-routing-off-zone', 'ngmodule-no-routing-zone'],
    ]) {
      expect({ variant, body: named(raw(variant).body) }).toEqual({
        variant,
        body: fixture(`scaffold-${major}-ngmodule${suffix}`, 'src/app/app.spec.ts'),
      });
    }
  });

  it.each(
    MAJORS.flatMap((major) =>
      [
        ['', 'src/app/app.ts', 'app.ts', 'routing-css'],
        ['-routing-off', 'src/app/app.ts', 'app.ts', 'no-routing-css'],
        ['-scss', 'src/app/app.ts', 'app.ts', 'routing-scss'],
        ['', 'src/app/app.html', 'app.html', 'routing'],
        ['-routing-off', 'src/app/app.html', 'app.html', 'no-routing'],
        ['', 'src/app/app.css', 'app.css', 'css'],
        ['-scss', 'src/app/app.scss', 'app.scss', 'scss'],
        ['', 'src/index.html', 'index.html', 'default'],
        ['', 'src/styles.css', 'styles.css', 'css'],
        ['-scss', 'src/styles.scss', 'styles.scss', 'scss'],
      ].map(([suffix, path, file, variant]) => [`scaffold-${major}${suffix}`, path, major, file, variant]),
    ),
  )('renders %s %s byte for byte as ng new wrote it', async (name, path, major, file, variant) => {
    const entries = await collectAllEntries();
    const raw = entries.find((entry) => entry.major === major && entry.file === file && entry.variant === variant && entry.form === 'raw');

    expect(named(raw.body)).toBe(fixture(name, path));
  });

  it.each(MAJORS)('has an entry for every supported CLI %i component variant and none for inline or Sass and Less styles', async (major) => {
    const entries = (await collectAllEntries()).filter((entry) => entry.major === major);
    const variants = (file) => [...new Set(entries.filter((entry) => entry.file === file).map((entry) => entry.variant))];

    expect(variants('app.ts')).toEqual(['routing-css', 'routing-scss', 'no-routing-css', 'no-routing-scss']);
    expect(variants('app.html')).toEqual(['routing', 'no-routing']);
    expect(variants('app.spec.ts')).toEqual([
      'zoneless',
      'zone',
      'ngmodule-routing-zoneless',
      'ngmodule-routing-zone',
      'ngmodule-no-routing-zoneless',
      'ngmodule-no-routing-zone',
    ]);
    expect(entries.map((entry) => entry.file).filter((file) => /\.(sass|less)$/.test(file))).toEqual([]);
  });

  it('marks exactly the NgModule spec entries as the ng-module app', async () => {
    const entries = await collectAllEntries();

    expect(entries.filter((entry) => entry.app === 'ng-module').every((entry) => entry.file === 'app.spec.ts' && entry.variant.startsWith('ngmodule-'))).toBe(true);
    expect(entries.filter((entry) => entry.variant.startsWith('ngmodule-')).every((entry) => entry.app === 'ng-module')).toBe(true);
    expect(entries.filter((entry) => entry.app === 'ng-module')).toHaveLength(16);
  });

  it('keys every entry by its CLI major and fingerprints its body once per major', async () => {
    const entries = await collectAllEntries();

    expect([...new Set(entries.map((entry) => entry.major))]).toEqual(MAJORS);
    expect(entries.every((entry) => /^sha256:[0-9a-f]{64}$/.test(entry.fingerprint))).toBe(true);
    for (const major of MAJORS) {
      for (const file of new Set(entries.map((entry) => entry.file))) {
        const own = entries.filter((entry) => entry.major === major && entry.file === file);
        expect({ major, file, unique: new Set(own.map((entry) => entry.fingerprint)).size }).toEqual({ major, file, unique: own.length });
      }
    }
  });

  it('ships a body only where a name has to be put in, the welcome page by fingerprint alone', async () => {
    const module = readFileSync(resolve(ROOT, OUT), 'utf8');
    const entries = await collectAllEntries();
    const kept = (file) => entries.filter((entry) => entry.file === file).every((entry) => holdsPlaceholder(entry.body));

    expect(kept('app.spec.ts') && kept('app.ts') && kept('index.html')).toBe(true);
    expect(entries.filter((entry) => entry.file === 'app.html').some((entry) => holdsPlaceholder(entry.body))).toBe(false);
    expect(module).not.toContain('End of Placeholder');
  });

  it('stores bodies with LF line endings and placeholders instead of the names', async () => {
    const entries = await collectAllEntries();
    const holds = (file, placeholder) => entries.filter((entry) => entry.file === file).every((entry) => entry.body.includes(placeholder));

    expect(entries.every((entry) => !entry.body.includes('\r'))).toBe(true);
    expect(holds('app.spec.ts', NAME_PLACEHOLDER)).toBe(true);
    expect(holds('app.ts', NAME_PLACEHOLDER) && holds('app.ts', SELECTOR_PLACEHOLDER)).toBe(true);
    expect(holds('index.html', TITLE_PLACEHOLDER) && holds('index.html', SELECTOR_PLACEHOLDER)).toBe(true);
  });
});
