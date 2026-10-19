import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  collectEntries,
  NAME_PLACEHOLDER,
  OUT,
  renderCatalogModule,
  schematicsVersion,
} from '../generate-scaffold-catalog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = resolve(ROOT, 'projects/core/schematics/testing/fixtures');

function fixture(name, path) {
  return readFileSync(resolve(FIXTURES, name, path), 'utf8');
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

  it('keys every entry by the installed CLI major and fingerprints its body', async () => {
    const major = Number(schematicsVersion().split('.')[0]);
    const entries = await collectEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.major === major)).toBe(true);
    expect(entries.every((entry) => /^sha256:[0-9a-f]{64}$/.test(entry.fingerprint))).toBe(true);
    expect(new Set(entries.map((entry) => entry.fingerprint)).size).toBe(entries.length);
  });

  it('stores bodies with LF line endings and the placeholder instead of a project name', async () => {
    const entries = await collectEntries();

    expect(entries.every((entry) => !entry.body.includes('\r'))).toBe(true);
    expect(entries.every((entry) => entry.body.includes(NAME_PLACEHOLDER))).toBe(true);
  });
});
