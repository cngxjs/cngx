import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readStarterTemplates, STARTER_TEMPLATE_FILES } from './starter-templates';

const SOURCE = join(__dirname, '..', 'files', 'starter');

describe('readStarterTemplates', () => {
  it('reads every starter file from the folder that ships next to the ng-add entry', () => {
    const templates = readStarterTemplates(SOURCE);

    expect(readdirSync(SOURCE).sort()).toEqual(Object.values(STARTER_TEMPLATE_FILES).sort());
    expect(templates.component).toContain("protected readonly title = signal('{{project}}');");
    expect(templates.template).toContain('<h1 id="hero-title">');
    expect(templates.stylesheet).toContain('--cngx-gradient-brand');
    expect(templates.favicon).toContain('<title>cngx</title>');
  });

  it('names a missing file as an incomplete package', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cngx-starter-'));
    try {
      writeFileSync(join(dir, 'app.ts.tpl'), '');

      expect(() => readStarterTemplates(dir)).toThrow(`${join(dir, 'app.html.tpl')} is missing; reinstall @cngx/core, its package is incomplete.`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
