import { describe, expect, it } from 'vitest';

// Never import index.mjs here: importing it runs main(), which wipes and
// rewrites examples/src/app/features.
import * as panel from '../examples-gen/code-panel.mjs';

const { buildDisplayedTs, coreSymbolsFor, filterImportLine, templateUsesClass } = panel;

const selectorMap = new Map([
  [
    'CngxFormBridge',
    ['input[cngxInputMask][formControl]', 'input[cngxInputMask][formControlName]'],
  ],
  ['CngxInputMask', ['[cngxInputMask]']],
  ['CngxDebugPanel', ['cngx-debug-panel']],
  ['CngxPhoneInput', ['cngx-phone-input']],
  ['CngxOption', ['cngx-option[value]']],
]);

const maskStory = {
  imports: ['ReactiveFormsModule', 'CngxFormBridge', 'CngxInputMask', 'CngxDebugPanel'],
  setup: `private readonly destroyRef = inject(DestroyRef);
  protected readonly start = new FormControl('', { nonNullable: true });`,
  template: '<input cngxInputMask="time:24" [formControl]="start" />',
  templateChrome: '<cngx-debug-panel [value]="start.value" />',
  setupChrome: 'protected readonly log = signal<string[]>([]);',
};

const maskImportLines = [
  "import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';",
  "import { FormControl, ReactiveFormsModule } from '@angular/forms';",
  "import { CngxFormBridge } from '@cngx/forms/controls';",
  "import { CngxInputMask } from '@cngx/forms/input';",
  "import { CngxDebugPanel } from '@cngx/ui/debug';",
];

const maskMeta = {
  selector: 'app-mask-reactive-forms',
  className: 'MaskReactiveForms',
  fileBase: 'reactive-forms',
  selectorMap,
};

const menuStory = {
  imports: ['CngxMenu'],
  setup: '',
  template: '<div cngxMenu></div>',
  viewProviders: ['provideMenuConfigAt(withDismissOnScroll(true))'],
};

const menuImportLines = [
  "import { ChangeDetectionStrategy, Component } from '@angular/core';",
  "import { CngxMenu, provideMenuConfigAt, withDismissOnScroll } from '@cngx/common/interactive';",
];

const hostStory = {
  imports: [],
  hostDirectives: ['CngxSort', 'CngxFilter'],
  setup: 'protected readonly sort = inject(CngxSort);',
  template: '<p>{{ sort.active() }}</p>',
};

const hostImportLines = [
  "import { ChangeDetectionStrategy, Component, inject } from '@angular/core';",
  "import { CngxFilter, CngxSort } from '@cngx/common/data';",
];

const meta = (className, fileBase) => ({ selector: 'app-x', className, fileBase, selectorMap });

describe('templateUsesClass', () => {
  it('matches an element selector on the tag name only', () => {
    expect(templateUsesClass('CngxPhoneInput', '<cngx-phone-input />', selectorMap)).toBe(true);
    expect(templateUsesClass('CngxPhoneInput', '<cngx-phone-input-x />', selectorMap)).toBe(false);
  });

  it('matches an attribute selector anywhere in the template', () => {
    expect(templateUsesClass('CngxInputMask', '<input cngxInputMask="phone" />', selectorMap)).toBe(
      true,
    );
    expect(templateUsesClass('CngxInputMask', '<input cngxInput />', selectorMap)).toBe(false);
  });

  it('matches a tag[attr] selector only on that tag', () => {
    expect(
      templateUsesClass('CngxOption', '<cngx-option value="a">A</cngx-option>', selectorMap),
    ).toBe(true);
    expect(
      templateUsesClass('CngxOption', '<div value="a"><cngx-option /></div>', selectorMap),
    ).toBe(false);
  });

  it('matches a multi-attribute selector only when every attribute sits on one tag', () => {
    const together = '<input cngxInputMask="time:24" [formControl]="start" />';
    const split = '<input cngxInputMask="time:24" /><input [formControl]="start" />';
    expect(templateUsesClass('CngxFormBridge', together, selectorMap)).toBe(true);
    expect(templateUsesClass('CngxFormBridge', split, selectorMap)).toBe(false);
  });

  it('keeps non-Cngx classes and Cngx classes without a known selector', () => {
    expect(templateUsesClass('ReactiveFormsModule', '', selectorMap)).toBe(true);
    expect(templateUsesClass('CngxUnknown', '', selectorMap)).toBe(true);
  });
});

describe('coreSymbolsFor', () => {
  it('counts inject from the providers', () => {
    expect(coreSymbolsFor('', ['provideX(inject(Y))'])).toEqual(['inject']);
  });

  it('counts signal from the class text only', () => {
    expect(coreSymbolsFor('readonly a = signal(1);', [])).toEqual(['signal']);
    expect(coreSymbolsFor('', ['signal(1)'])).toEqual([]);
  });
});

describe('filterImportLine', () => {
  it('keeps an aliased specifier by its local name', () => {
    const line = "import { a as b, c } from 'x';";
    expect(filterImportLine(line, (id) => id === 'b')).toBe("import { a as b } from 'x';");
  });

  it('keeps a type specifier and drops a line with nothing left', () => {
    const line = "import { type A, B } from 'x';";
    expect(filterImportLine(line, (id) => id === 'A')).toBe("import { type A } from 'x';");
    expect(filterImportLine(line, () => false)).toBeNull();
  });
});

describe('buildDisplayedTs', () => {
  it('drops imports that only the chrome uses', () => {
    const story = {
      imports: [],
      setup: 'protected readonly items = signal([]);',
      setupChrome: 'protected readonly slow = of(1).pipe(delay(300));',
      template: '<p>{{ items() }}</p>',
    };
    const importLines = [
      "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';",
      "import { delay, of } from 'rxjs';",
    ];
    const ts = buildDisplayedTs({ story, importLines, ...meta('ListBasic', 'basic') });
    expect(ts).not.toContain("from 'rxjs'");
  });

  it('renders the filtered import lines and the dedented setup', () => {
    expect(buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta })).toBe(
      [
        "import { FormControl, ReactiveFormsModule } from '@angular/forms';",
        "import { CngxFormBridge } from '@cngx/forms/controls';",
        "import { CngxInputMask } from '@cngx/forms/input';",
        "import { CngxDebugPanel } from '@cngx/ui/debug';",
        '',
        'private readonly destroyRef = inject(DestroyRef);',
        "  protected readonly start = new FormControl('', { nonNullable: true });",
      ].join('\n'),
    );
  });

  it.fails('renders the @Component decorator with the template-matched imports', () => {
    const ts = buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta });
    expect(ts).toContain(
      [
        '@Component({',
        "  selector: 'app-mask-reactive-forms',",
        '  changeDetection: ChangeDetectionStrategy.OnPush,',
        '  imports: [ReactiveFormsModule, CngxFormBridge, CngxInputMask],',
        "  templateUrl: './reactive-forms.html',",
        '})',
      ].join('\n'),
    );
  });

  it.fails('wraps setup in the class at member column', () => {
    const ts = buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta });
    expect(ts).toContain(
      [
        'export class MaskReactiveForms {',
        '  private readonly destroyRef = inject(DestroyRef);',
        "  protected readonly start = new FormControl('', { nonNullable: true });",
        '}',
      ].join('\n'),
    );
  });

  it.fails('shows the @angular/core line from setup, not from setupChrome', () => {
    const ts = buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta });
    expect(ts.split('\n')[0]).toBe(
      "import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';",
    );
  });

  it.fails(
    'leaves a Cngx class that only the chrome uses out of the decorator and the imports',
    () => {
      const ts = buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta });
      expect(ts).toContain('@Component({');
      expect(ts).not.toContain('CngxDebugPanel');
    },
  );

  it.fails('imports every symbol the viewProviders name', () => {
    const ts = buildDisplayedTs({
      story: menuStory,
      importLines: menuImportLines,
      ...meta('MenuScroll', 'scroll'),
    });
    expect(ts).toContain(
      "import { CngxMenu, provideMenuConfigAt, withDismissOnScroll } from '@cngx/common/interactive';",
    );
    expect(ts).toContain('  viewProviders: [provideMenuConfigAt(withDismissOnScroll(true))],');
  });

  it.fails('imports the hostDirectives and lists them in the decorator', () => {
    const ts = buildDisplayedTs({
      story: hostStory,
      importLines: hostImportLines,
      ...meta('AutoWired', 'auto-wired'),
    });
    expect(ts).toContain("import { CngxFilter, CngxSort } from '@cngx/common/data';");
    expect(ts).toContain('  hostDirectives: [CngxSort, CngxFilter],');
  });
});

describe('dedentClassBody', () => {
  it.fails('treats a flush line 1 as member column when the rest sits at 2', () => {
    expect(panel.dedentClassBody('a = 1;\n  b = 2;')).toBe('a = 1;\nb = 2;');
  });

  it.fails('keeps the extra indent of a continuation line', () => {
    const quota = 'readonly x = compute(\n    1,\n    2);';
    expect(panel.dedentClassBody(quota)).toBe('readonly x = compute(\n  1,\n  2);');
  });

  it.fails('leaves a single line unchanged', () => {
    expect(panel.dedentClassBody('a = 1;')).toBe('a = 1;');
  });

  it.fails('leaves a flush line 1 with the rest at 0 unchanged', () => {
    expect(panel.dedentClassBody('a = 1;\nb = 2;')).toBe('a = 1;\nb = 2;');
  });
});
