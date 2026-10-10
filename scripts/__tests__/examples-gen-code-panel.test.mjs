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

  it('renders the core import, the filtered imports, the decorator and the class', () => {
    expect(buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta })).toBe(
      [
        "import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';",
        "import { FormControl, ReactiveFormsModule } from '@angular/forms';",
        "import { CngxFormBridge } from '@cngx/forms/controls';",
        "import { CngxInputMask } from '@cngx/forms/input';",
        '',
        '@Component({',
        "  selector: 'app-mask-reactive-forms',",
        '  changeDetection: ChangeDetectionStrategy.OnPush,',
        '  imports: [ReactiveFormsModule, CngxFormBridge, CngxInputMask],',
        "  templateUrl: './reactive-forms.html',",
        '})',
        'export class MaskReactiveForms {',
        '  private readonly destroyRef = inject(DestroyRef);',
        "  protected readonly start = new FormControl('', { nonNullable: true });",
        '}',
      ].join('\n'),
    );
  });

  it('renders an empty class when setup is empty', () => {
    const ts = buildDisplayedTs({
      story: menuStory,
      importLines: menuImportLines,
      ...meta('MenuScroll', 'scroll'),
    });
    expect(ts.endsWith("  templateUrl: './scroll.html',\n})\nexport class MenuScroll {}")).toBe(
      true,
    );
  });

  it('renders the @Component decorator with the template-matched imports', () => {
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

  it('wraps setup in the class at member column', () => {
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

  it('shows the @angular/core line from setup, not from setupChrome', () => {
    const ts = buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta });
    expect(ts.split('\n')[0]).toBe(
      "import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';",
    );
  });

  it('leaves a Cngx class that only the chrome uses out of the decorator and the imports', () => {
    const ts = buildDisplayedTs({ story: maskStory, importLines: maskImportLines, ...maskMeta });
    expect(ts).toContain('@Component({');
    expect(ts).not.toContain('CngxDebugPanel');
  });

  it('imports every symbol the viewProviders name', () => {
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

  it('imports the hostDirectives and lists them in the decorator', () => {
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
  it('treats a flush line 1 as member column when the rest sits at 2', () => {
    expect(panel.dedentClassBody('a = 1;\n  b = 2;')).toBe('a = 1;\nb = 2;');
  });

  it('keeps the extra indent of a continuation line', () => {
    const quota = 'readonly x = compute(\n    1,\n    2);';
    expect(panel.dedentClassBody(quota)).toBe('readonly x = compute(\n  1,\n  2);');
  });

  it('leaves a single line unchanged', () => {
    expect(panel.dedentClassBody('a = 1;')).toBe('a = 1;');
  });

  it('leaves a flush line 1 with the rest at 0 unchanged', () => {
    expect(panel.dedentClassBody('a = 1;\nb = 2;')).toBe('a = 1;\nb = 2;');
  });
});

describe('parseNamedImport', () => {
  it('splits a type import into its parts', () => {
    expect(panel.parseNamedImport("import type { A, B } from '@cngx/x';")).toEqual({
      head: 'import type {',
      specifiers: ['A', 'B'],
      tail: "} from '@cngx/x';",
      isType: true,
      module: '@cngx/x',
    });
  });

  it('keeps an aliased specifier verbatim', () => {
    const parsed = panel.parseNamedImport("import { a as b } from 'x'");
    expect(parsed.specifiers).toEqual(['a as b']);
    expect(parsed.isType).toBe(false);
  });

  it('returns null for a line that is not a named import', () => {
    expect(panel.parseNamedImport("import * as d3 from 'd3';")).toBeNull();
  });
});

describe('stripDemoChrome', () => {
  it('removes a chrome div with its nested divs and keeps the rest', () => {
    const tpl = '<p>a</p>\n<div class="button-row"><div><button>x</button></div></div>\n<p>b</p>';
    expect(panel.stripDemoChrome(tpl)).toBe('<p>a</p>\n<p>b</p>');
  });
});

describe('selectorsInSource', () => {
  it('returns the selector and exportAs of an exported class', () => {
    const src = "@Directive({ selector: '[cngxX], cngx-x', exportAs: 'cngxX' })\nexport class CngxX {}";
    expect(panel.selectorsInSource(src)).toEqual([['CngxX', ['[cngxX]', 'cngx-x', 'cngxX']]]);
  });
});

describe('chromeHiddenClasses', () => {
  const dialogMap = new Map([['CngxDialogClose', ['[cngxDialogClose]']]]);
  const dialogStory = (wrapperClass) => ({
    imports: ['CngxDialogClose'],
    template: `<dialog>\n  <div class="${wrapperClass}">\n    <button [cngxDialogClose]="true">OK</button>\n  </div>\n</dialog>`,
  });

  it('lists a class whose only use sits inside a chrome div', () => {
    expect(panel.chromeHiddenClasses(dialogStory('button-row'), dialogMap)).toEqual([
      'CngxDialogClose',
    ]);
  });

  it('lists nothing when the wrapper is not a chrome class', () => {
    expect(panel.chromeHiddenClasses(dialogStory('demo-inline-actions'), dialogMap)).toEqual([]);
  });
});

describe('buildDisplayedHtml', () => {
  it('dedents an indented template', () => {
    expect(panel.buildDisplayedHtml('\n    <p>a</p>\n    <p>b</p>\n  ')).toBe('<p>a</p>\n<p>b</p>');
  });

  it('aligns the children and closing tag of a flush first line', () => {
    const quota = '<div style="gap:8px">\n    <span>Quota</span>\n    <cngx-goal />\n  </div>';
    expect(panel.buildDisplayedHtml(quota)).toBe(
      '<div style="gap:8px">\n  <span>Quota</span>\n  <cngx-goal />\n</div>',
    );
  });

  it('aligns siblings that follow a flush self-closed first line', () => {
    expect(panel.buildDisplayedHtml('<cngx-a />\n    <cngx-b />\n    <cngx-c />')).toBe(
      '<cngx-a />\n<cngx-b />\n<cngx-c />',
    );
  });
});

describe('buildDisplayedTs import lines', () => {
  const story = {
    imports: [],
    setup: 'protected readonly people = PEOPLE;\nprotected readonly c = DemoMountCounter;',
    template: '<p>{{ people.length }}</p>',
  };
  const lines = (...rest) => [
    "import { ChangeDetectionStrategy, Component } from '@angular/core';",
    ...rest,
  ];
  const importBlock = (importLines, s = story) =>
    buildDisplayedTs({ story: s, importLines, ...meta('X', 'x') }).split('\n\n')[0];

  it('shows the shared fixtures barrel as ./fixtures', () => {
    expect(importBlock(lines("import { PEOPLE } from '../../../../../../fixtures';"))).toContain(
      "import { PEOPLE } from './fixtures';",
    );
  });

  it('shows a story-local _fixtures file under ./fixtures', () => {
    const line =
      "import { DemoMountCounter } from '../../../_fixtures/demo-mount-counter.component';";
    expect(importBlock(lines(line))).toContain(
      "import { DemoMountCounter } from './fixtures/demo-mount-counter.component';",
    );
  });

  it('merges two import lines from the same module into one', () => {
    const s = { imports: ['CngxA', 'CngxB'], setup: '', template: '<cngx-a /><cngx-b />' };
    const block = importBlock(
      lines("import { CngxA } from '@cngx/x';", "import { CngxB, CngxA } from '@cngx/x';"),
      s,
    );
    expect(block.split('\n').filter((l) => l.includes("'@cngx/x'"))).toEqual([
      "import { CngxA, CngxB } from '@cngx/x';",
    ]);
  });

  it('keeps a type import from the same module on its own line', () => {
    const s = { imports: ['CngxA'], setup: 'readonly t: T | null = null;', template: '<cngx-a />' };
    const block = importBlock(
      lines("import { CngxA } from '@cngx/x';", "import type { T } from '@cngx/x';"),
      s,
    );
    expect(block.split('\n').filter((l) => l.includes("'@cngx/x'"))).toEqual([
      "import { CngxA } from '@cngx/x';",
      "import type { T } from '@cngx/x';",
    ]);
  });
});

describe('dedentMarkup', () => {
  it('leaves a single line unchanged', () => {
    expect(panel.dedentMarkup('<p>a</p>')).toBe('<p>a</p>');
  });

  it('leaves a flush line 1 with the rest at 0 unchanged', () => {
    expect(panel.dedentMarkup('<p>a</p>\n<p>b</p>')).toBe('<p>a</p>\n<p>b</p>');
  });

  it('matches dedent when every line is indented', () => {
    const tpl = '\n  <div>\n    <p>a</p>\n  </div>\n';
    expect(panel.dedentMarkup(tpl)).toBe(panel.dedent(tpl));
  });
});

describe('mergeImportLines', () => {
  it('passes a non-named import through', () => {
    const lines = ["import * as d3 from 'd3';", "import * as d3 from 'd3';"];
    expect(panel.mergeImportLines(lines)).toEqual(lines);
  });

  it('keeps a single line without a semicolon unchanged', () => {
    const lines = ["import { A,B } from 'x'", "import { C } from 'y';"];
    expect(panel.mergeImportLines(lines)).toEqual(lines);
  });
});
