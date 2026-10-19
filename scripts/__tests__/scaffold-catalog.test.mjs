import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  collectEntries,
  holdsPlaceholder,
  NAME_PLACEHOLDER,
  OUT,
  renderCatalogModule,
  schematicsVersion,
  SELECTOR_PLACEHOLDER,
  TITLE_PLACEHOLDER,
} from '../generate-scaffold-catalog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = resolve(ROOT, 'projects/core/schematics/testing/fixtures');

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

  it('renders the spec templates byte for byte as ng new wrote the fixtures', async () => {
    const entries = await collectEntries();
    const raw = (variant) =>
      entries.find((entry) => entry.file === 'app.spec.ts' && entry.variant === variant && entry.form === 'raw');

    expect(raw('zoneless').body.split(NAME_PLACEHOLDER).join('fixture-app')).toBe(
      fixture('scaffold-21', 'src/app/app.spec.ts'),
    );
    expect(raw('zone').body.split(NAME_PLACEHOLDER).join('fixture-app')).toBe(
      fixture('scaffold-21-zone', 'src/app/app.spec.ts'),
    );
  });

  it.each([
    ['scaffold-21', 'src/app/app.ts', 'app.ts', 'routing-css'],
    ['scaffold-21-routing-off', 'src/app/app.ts', 'app.ts', 'no-routing-css'],
    ['scaffold-21-scss', 'src/app/app.ts', 'app.ts', 'routing-scss'],
    ['scaffold-21', 'src/app/app.html', 'app.html', 'routing'],
    ['scaffold-21-routing-off', 'src/app/app.html', 'app.html', 'no-routing'],
    ['scaffold-21', 'src/app/app.css', 'app.css', 'css'],
    ['scaffold-21-scss', 'src/app/app.scss', 'app.scss', 'scss'],
    ['scaffold-21', 'src/index.html', 'index.html', 'default'],
  ])('renders %s %s byte for byte as ng new wrote it', async (name, path, file, variant) => {
    const entries = await collectEntries();
    const raw = entries.find((entry) => entry.file === file && entry.variant === variant && entry.form === 'raw');

    expect(named(raw.body)).toBe(fixture(name, path));
  });

  it('has an entry for every supported component variant and none for inline or Sass and Less styles', async () => {
    const entries = await collectEntries();
    const variants = (file) => [...new Set(entries.filter((entry) => entry.file === file).map((entry) => entry.variant))];

    expect(variants('app.ts')).toEqual(['routing-css', 'routing-scss', 'no-routing-css', 'no-routing-scss']);
    expect(variants('app.html')).toEqual(['routing', 'no-routing']);
    expect(entries.map((entry) => entry.file).filter((file) => /\.(sass|less)$/.test(file))).toEqual([]);
  });

  it('keys every entry by the installed CLI major and fingerprints its body', async () => {
    const major = Number(schematicsVersion().split('.')[0]);
    const entries = await collectEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.major === major)).toBe(true);
    expect(entries.every((entry) => /^sha256:[0-9a-f]{64}$/.test(entry.fingerprint))).toBe(true);
    for (const file of new Set(entries.map((entry) => entry.file))) {
      const own = entries.filter((entry) => entry.file === file);
      expect({ file, unique: new Set(own.map((entry) => entry.fingerprint)).size }).toEqual({ file, unique: own.length });
    }
  });

  it('ships a body only where a name has to be put in, the welcome page by fingerprint alone', async () => {
    const module = readFileSync(resolve(ROOT, OUT), 'utf8');
    const entries = await collectEntries();
    const kept = (file) => entries.filter((entry) => entry.file === file).every((entry) => holdsPlaceholder(entry.body));

    expect(kept('app.spec.ts') && kept('app.ts') && kept('index.html')).toBe(true);
    expect(entries.filter((entry) => entry.file === 'app.html').some((entry) => holdsPlaceholder(entry.body))).toBe(false);
    expect(module).not.toContain('End of Placeholder');
  });

  it('stores bodies with LF line endings and placeholders instead of the names', async () => {
    const entries = await collectEntries();
    const holds = (file, placeholder) => entries.filter((entry) => entry.file === file).every((entry) => entry.body.includes(placeholder));

    expect(entries.every((entry) => !entry.body.includes('\r'))).toBe(true);
    expect(holds('app.spec.ts', NAME_PLACEHOLDER)).toBe(true);
    expect(holds('app.ts', NAME_PLACEHOLDER) && holds('app.ts', SELECTOR_PLACEHOLDER)).toBe(true);
    expect(holds('index.html', TITLE_PLACEHOLDER) && holds('index.html', SELECTOR_PLACEHOLDER)).toBe(true);
  });
});
