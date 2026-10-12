import { describe, expect, it } from 'vitest';

import { EMPTY_RENAME_TABLE, isEmptyRenameTable, type RenameTable, renameInSource, renameInTemplate } from './rename-table';

const TABLE: RenameTable = {
  classes: { CngxOldCard: 'CngxCard' },
  selectors: { 'cngx-old-card': 'cngx-card', cngxOldRipple: 'cngxRipple' },
  inputs: [{ owner: 'cngx-old-card', from: 'heading', to: 'title' }],
  outputs: [{ owner: 'cngxOldRipple', from: 'rippled', to: 'rippleEnd' }],
  tokens: { CNGX_OLD_CONFIG: 'CNGX_CARD_CONFIG' },
  importPaths: { '@cngx/common/old-card': '@cngx/common/card' },
};

describe('isEmptyRenameTable', () => {
  it('is true for the empty table', () => {
    expect(isEmptyRenameTable(EMPTY_RENAME_TABLE)).toBe(true);
  });

  it('is false once any section has an entry', () => {
    expect(isEmptyRenameTable({ ...EMPTY_RENAME_TABLE, tokens: { A: 'B' } })).toBe(false);
    expect(isEmptyRenameTable({ ...EMPTY_RENAME_TABLE, inputs: [{ owner: 'x', from: 'a', to: 'b' }] })).toBe(false);
  });
});

describe('renameInTemplate', () => {
  it('renames element selectors on the start and the end tag', () => {
    const rename = renameInTemplate(TABLE);

    expect(rename('<cngx-old-card>Body</cngx-old-card>')).toBe('<cngx-card>Body</cngx-card>');
    expect(rename('<cngx-old-card />')).toBe('<cngx-card />');
  });

  it('renames attribute selectors in every binding form', () => {
    const rename = renameInTemplate(TABLE);

    expect(rename('<button cngxOldRipple [cngxOldRipple]="on"></button>')).toBe(
      '<button cngxRipple [cngxRipple]="on"></button>',
    );
  });

  it('renames inputs and outputs only on their owner', () => {
    const rename = renameInTemplate(TABLE);

    expect(rename('<cngx-old-card [heading]="t" heading="x"></cngx-old-card><h2 [heading]="t"></h2>')).toBe(
      '<cngx-card [title]="t" title="x"></cngx-card><h2 [heading]="t"></h2>',
    );
    expect(rename('<button cngxOldRipple (rippled)="done()"></button><a (rippled)="done()"></a>')).toBe(
      '<button cngxRipple (rippleEnd)="done()"></button><a (rippled)="done()"></a>',
    );
  });

  it('renames a two-way binding once', () => {
    expect(renameInTemplate(TABLE)('<cngx-old-card [(heading)]="t"></cngx-old-card>')).toBe(
      '<cngx-card [(title)]="t"></cngx-card>',
    );
  });

  it('renames once under a structural directive and inside control flow', () => {
    const template = '@if (on) {<cngx-old-card *ngIf="x" [heading]="t"></cngx-old-card>}';

    expect(renameInTemplate(TABLE)(template)).toBe('@if (on) {<cngx-card *ngIf="x" [title]="t"></cngx-card>}');
  });

  it('returns the content unchanged when nothing matches', () => {
    const template = '<div class="cngx-old-card-like">{{ heading }}</div>';

    expect(renameInTemplate(TABLE)(template)).toBe(template);
  });

  it('does not parse a template that names no table entry', () => {
    expect(renameInTemplate(TABLE)('<div>@if (</div>')).toBe('<div>@if (</div>');
  });
});

describe('renameInSource', () => {
  it('renames cngx imports and every reference to them', () => {
    const source = [
      "import { CngxOldCard, CNGX_OLD_CONFIG } from '@cngx/common/old-card';",
      '',
      '@Component({ imports: [CngxOldCard], providers: [{ provide: CNGX_OLD_CONFIG, useValue: {} }] })',
      'export class Page {',
      '  readonly card = viewChild(CngxOldCard);',
      '}',
      '',
    ].join('\n');

    expect(renameInSource(TABLE)(source)).toBe(
      [
        "import { CngxCard, CNGX_CARD_CONFIG } from '@cngx/common/card';",
        '',
        '@Component({ imports: [CngxCard], providers: [{ provide: CNGX_CARD_CONFIG, useValue: {} }] })',
        'export class Page {',
        '  readonly card = viewChild(CngxCard);',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('keeps a local alias and renames only the imported name', () => {
    const source = "import { CngxOldCard as Card } from '@cngx/common/card';\nconst x = Card;\n";

    expect(renameInSource(TABLE)(source)).toBe("import { CngxCard as Card } from '@cngx/common/card';\nconst x = Card;\n");
  });

  it('keeps the exported name of a re-export', () => {
    expect(renameInSource(TABLE)("export { CngxOldCard } from '@cngx/common/card';\n")).toBe(
      "export { CngxCard as CngxOldCard } from '@cngx/common/card';\n",
    );
  });

  it('leaves identifiers alone that the file does not import from cngx', () => {
    const source = [
      "import { CngxOldCard } from './local-card';",
      'const x = { CngxOldCard: 1 };',
      'x.CngxOldCard;',
      '',
    ].join('\n');

    expect(renameInSource(TABLE)(source)).toBe(source);
  });

  it('leaves property names alone and expands a shorthand property', () => {
    const source = [
      "import { CngxOldCard } from '@cngx/common/card';",
      'const map = { CngxOldCard, other: x.CngxOldCard };',
      '',
    ].join('\n');

    expect(renameInSource(TABLE)(source)).toBe(
      [
        "import { CngxCard } from '@cngx/common/card';",
        'const map = { CngxOldCard: CngxCard, other: x.CngxOldCard };',
        '',
      ].join('\n'),
    );
  });

  it('keeps the exported name of a local re-export bound', () => {
    const source = [
      "import { CngxOldCard } from '@cngx/common/card';",
      'export { CngxOldCard };',
      'export { CngxOldCard as Card };',
      '',
    ].join('\n');

    expect(renameInSource(TABLE)(source)).toBe(
      [
        "import { CngxCard } from '@cngx/common/card';",
        'export { CngxCard as CngxOldCard };',
        'export { CngxCard as Card };',
        '',
      ].join('\n'),
    );
  });

  it('leaves destructuring keys and bindings alone', () => {
    const source = [
      "import { CngxOldCard } from '@cngx/common/card';",
      'const { CngxOldCard: picked } = registry;',
      'const use = CngxOldCard;',
      '',
    ].join('\n');

    expect(renameInSource(TABLE)(source)).toBe(
      [
        "import { CngxCard } from '@cngx/common/card';",
        'const { CngxOldCard: picked } = registry;',
        'const use = CngxCard;',
        '',
      ].join('\n'),
    );
  });

  it('renames inside an inline template', () => {
    const source = [
      "@Component({ template: '<cngx-old-card [heading]=\"t\"></cngx-old-card>' })",
      'export class A {}',
      '@Component({ template: `<button cngxOldRipple></button>` })',
      'export class B {}',
      '',
    ].join('\n');

    expect(renameInSource(TABLE)(source)).toBe(
      [
        "@Component({ template: '<cngx-card [title]=\"t\"></cngx-card>' })",
        'export class A {}',
        '@Component({ template: `<button cngxRipple></button>` })',
        'export class B {}',
        '',
      ].join('\n'),
    );
  });

  it('returns the content unchanged for the empty table', () => {
    const source = "import { CngxOldCard } from '@cngx/common/old-card';\n";

    expect(renameInSource(EMPTY_RENAME_TABLE)(source)).toBe(source);
  });
});
