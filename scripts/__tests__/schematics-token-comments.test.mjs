import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { collectBaseTokens, OUT, renderTokenModule, SOURCE } from '../schematics-token-comments.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EM_DASH = String.fromCodePoint(0x2014);

describe('schematics token comments', () => {
  it('keeps the generated module in sync with the system token registrations', () => {
    const css = readFileSync(resolve(ROOT, SOURCE), 'utf8');
    expect(readFileSync(resolve(ROOT, OUT), 'utf8')).toBe(renderTokenModule(css));
  });

  it('reads the doc block, syntax, default and inheritance of a registration', () => {
    const css = `
      /**
       * Surface color ${EM_DASH} page background.
       * Swapped under dark mode.
       * @group Surface
       */
      @property --cngx-color-surface {
        syntax: '<color>';
        inherits: true;
        initial-value: oklch(1 0 0);
      }

      @property --undocumented {
        syntax: '<length>';
        inherits: false;
        initial-value: 0px;
      }
    `;
    expect(collectBaseTokens(css)).toEqual([
      {
        name: '--cngx-color-surface',
        group: 'Surface',
        description: 'Surface color - page background. Swapped under dark mode.',
        syntax: '<color>',
        initialValue: 'oklch(1 0 0)',
        inherits: true,
      },
    ]);
  });

  it('covers every documented registration of the source', () => {
    const css = readFileSync(resolve(ROOT, SOURCE), 'utf8');
    const registered = [...css.matchAll(/@property\s+(--[\w-]+)/g)].map((match) => match[1]);
    expect(collectBaseTokens(css).map((token) => token.name)).toEqual(registered);
  });
});
