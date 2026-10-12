import { describe, expect, it } from 'vitest';

import {
  createSourceRenamer,
  createTemplateRenamer,
  EMPTY_RENAME_TABLE,
  isEmptyRenameTable,
  type RenameTable,
} from './rename-table';

const TABLE: RenameTable = {
  classes: { CngxOldCard: 'CngxCard' },
  selectors: { 'cngx-old-card': 'cngx-card', cngxOldRipple: 'cngxRipple' },
  inputs: [
    { owner: 'cngx-old-card', from: 'heading', to: 'title' },
    { owner: 'cngxOldFor', from: 'cngxOldForOf', to: 'cngxOldForFrom' },
  ],
  outputs: [{ owner: 'cngxOldRipple', from: 'rippled', to: 'rippleEnd' }],
  exportAs: { cngxOldMenu: 'cngxMenu' },
  tokens: { CNGX_OLD_CONFIG: 'CNGX_CARD_CONFIG' },
  importPaths: { '@cngx/common/old-card': '@cngx/common/card' },
};

const template = (content: string): string => createTemplateRenamer(TABLE)(content).content;
const source = (content: string): string => createSourceRenamer(TABLE)(content).content;
const lines = (...parts: string[]): string => [...parts, ''].join('\n');

describe('isEmptyRenameTable', () => {
  it('is true for the empty table', () => {
    expect(isEmptyRenameTable(EMPTY_RENAME_TABLE)).toBe(true);
  });

  it('is false once any section has an entry', () => {
    expect(isEmptyRenameTable({ ...EMPTY_RENAME_TABLE, tokens: { A: 'B' } })).toBe(false);
    expect(isEmptyRenameTable({ ...EMPTY_RENAME_TABLE, exportAs: { a: 'b' } })).toBe(false);
    expect(
      isEmptyRenameTable({ ...EMPTY_RENAME_TABLE, inputs: [{ owner: 'x', from: 'a', to: 'b' }] }),
    ).toBe(false);
  });
});

describe('createTemplateRenamer', () => {
  it('renames element selectors on the start and the end tag', () => {
    expect(template('<cngx-old-card>Body</cngx-old-card>')).toBe('<cngx-card>Body</cngx-card>');
    expect(template('<cngx-old-card />')).toBe('<cngx-card />');
  });

  it('renames attribute selectors in every binding form', () => {
    expect(template('<button cngxOldRipple [cngxOldRipple]="on"></button>')).toBe(
      '<button cngxRipple [cngxRipple]="on"></button>',
    );
  });

  it('renames inputs and outputs only on their owner', () => {
    expect(
      template('<cngx-old-card [heading]="t" heading="x"></cngx-old-card><h2 [heading]="t"></h2>'),
    ).toBe('<cngx-card [title]="t" title="x"></cngx-card><h2 [heading]="t"></h2>');
    expect(
      template('<button cngxOldRipple (rippled)="done()"></button><a (rippled)="done()"></a>'),
    ).toBe('<button cngxRipple (rippleEnd)="done()"></button><a (rippled)="done()"></a>');
  });

  it('renames a two-way binding once', () => {
    expect(template('<cngx-old-card [(heading)]="t"></cngx-old-card>')).toBe(
      '<cngx-card [(title)]="t"></cngx-card>',
    );
  });

  it('renames once under a structural directive and inside control flow', () => {
    expect(template('@if (on) {<cngx-old-card *ngIf="x" [heading]="t"></cngx-old-card>}')).toBe(
      '@if (on) {<cngx-card *ngIf="x" [title]="t"></cngx-card>}',
    );
  });

  it('renames an exportAs reference', () => {
    expect(template('<div cngxOldRipple #menu="cngxOldMenu"></div>')).toBe(
      '<div cngxRipple #menu="cngxMenu"></div>',
    );
  });

  it('names a structural microsyntax input it cannot reach', () => {
    const result = createTemplateRenamer(TABLE)(
      '<li *cngxOldFor="let item of items">{{ item }}</li>',
    );

    expect(result.content).toBe('<li *cngxOldFor="let item of items">{{ item }}</li>');
    expect(result.manual).toEqual([
      'structural directive input `cngxOldForOf` is now `cngxOldForFrom`; rename it by hand',
    ]);
  });

  it('returns the content unchanged when nothing matches', () => {
    const content = '<div class="cngx-old-card-like">{{ heading }}</div>';

    expect(createTemplateRenamer(TABLE)(content)).toEqual({ content, manual: [] });
  });

  it('does not parse a template that names a member but not its owner', () => {
    expect(template('<div [heading]="x">@if (</div>')).toBe('<div [heading]="x">@if (</div>');
  });
});

describe('createSourceRenamer', () => {
  it('renames cngx imports and every reference to them', () => {
    expect(
      source(
        lines(
          "import { CngxOldCard, CNGX_OLD_CONFIG } from '@cngx/common/old-card';",
          '',
          '@Component({ imports: [CngxOldCard], providers: [{ provide: CNGX_OLD_CONFIG, useValue: {} }] })',
          'export class Page {',
          '  readonly card = viewChild(CngxOldCard);',
          '}',
        ),
      ),
    ).toBe(
      lines(
        "import { CngxCard, CNGX_CARD_CONFIG } from '@cngx/common/card';",
        '',
        '@Component({ imports: [CngxCard], providers: [{ provide: CNGX_CARD_CONFIG, useValue: {} }] })',
        'export class Page {',
        '  readonly card = viewChild(CngxCard);',
        '}',
      ),
    );
  });

  it('keeps a local alias and renames only the imported name', () => {
    expect(
      source("import { CngxOldCard as Card } from '@cngx/common/card';\nconst x = Card;\n"),
    ).toBe("import { CngxCard as Card } from '@cngx/common/card';\nconst x = Card;\n");
  });

  it('keeps the exported name of a re-export', () => {
    expect(source("export { CngxOldCard } from '@cngx/common/card';\n")).toBe(
      "export { CngxCard as CngxOldCard } from '@cngx/common/card';\n",
    );
  });

  it('keeps the exported name of a local re-export bound', () => {
    expect(
      source(
        lines(
          "import { CngxOldCard } from '@cngx/common/card';",
          'export { CngxOldCard };',
          'export { CngxOldCard as Card };',
        ),
      ),
    ).toBe(
      lines(
        "import { CngxCard } from '@cngx/common/card';",
        'export { CngxCard as CngxOldCard };',
        'export { CngxCard as Card };',
      ),
    );
  });

  it('leaves destructuring keys and bindings alone', () => {
    expect(
      source(
        lines(
          "import { CngxOldCard } from '@cngx/common/card';",
          'const { CngxOldCard: picked } = registry;',
          'const use = CngxOldCard;',
        ),
      ),
    ).toBe(
      lines(
        "import { CngxCard } from '@cngx/common/card';",
        'const { CngxOldCard: picked } = registry;',
        'const use = CngxCard;',
      ),
    );
  });

  it('leaves identifiers alone that the file does not import from cngx', () => {
    const content = lines(
      "import { CngxOldCard } from './local-card';",
      'const x = { CngxOldCard: 1 };',
      'x.CngxOldCard;',
    );

    expect(source(content)).toBe(content);
  });

  it('leaves property names alone and expands a shorthand property', () => {
    expect(
      source(
        lines(
          "import { CngxOldCard } from '@cngx/common/card';",
          'const map = { CngxOldCard, other: x.CngxOldCard };',
        ),
      ),
    ).toBe(
      lines(
        "import { CngxCard } from '@cngx/common/card';",
        'const map = { CngxOldCard: CngxCard, other: x.CngxOldCard };',
      ),
    );
  });

  it('renames the members of a cngx namespace import', () => {
    expect(
      source(
        lines(
          "import * as card from '@cngx/common/card';",
          'const a = card.CngxOldCard;',
          'let b: card.CngxOldCard;',
          'const c = other.CngxOldCard;',
        ),
      ),
    ).toBe(
      lines(
        "import * as card from '@cngx/common/card';",
        'const a = card.CngxCard;',
        'let b: card.CngxCard;',
        'const c = other.CngxOldCard;',
      ),
    );
  });

  it('renames inside an inline template', () => {
    expect(
      source(
        lines(
          '@Component({ template: \'<cngx-old-card [heading]="t"></cngx-old-card>\' })',
          'export class A {}',
          '@Component({ template: `<button cngxOldRipple></button>` })',
          'export class B {}',
        ),
      ),
    ).toBe(
      lines(
        '@Component({ template: \'<cngx-card [title]="t"></cngx-card>\' })',
        'export class A {}',
        '@Component({ template: `<button cngxRipple></button>` })',
        'export class B {}',
      ),
    );
  });

  it('names a dynamic cngx import and a hostDirectives string it cannot rename', () => {
    const result = createSourceRenamer(TABLE)(
      lines(
        "const card = await import('@cngx/common/card').then((m) => m.CngxOldCard);",
        "@Directive({ hostDirectives: [{ directive: CngxThing, inputs: ['heading: label'] }] })",
        'export class A {}',
      ),
    );

    expect(result.manual).toEqual([
      "dynamic import of '@cngx/common/card': rename its members by hand",
      'hostDirectives names `heading`, which a cngx directive renamed; check it by hand',
    ]);
  });

  it('returns the content unchanged for the empty table', () => {
    const content = "import { CngxOldCard } from '@cngx/common/old-card';\n";

    expect(createSourceRenamer(EMPTY_RENAME_TABLE)(content)).toEqual({ content, manual: [] });
  });
});
