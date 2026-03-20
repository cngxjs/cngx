import { describe, it, expect } from 'vitest';
import {
  parseDemoPath,
  typeStringToControlSpec,
  compodocInputsToControls,
  generateRoutesFile,
  generateNavFile,
  generateNavHtmlBlock,
  injectNavBlock,
  generateComponentFile,
  generateIndexFile,
} from '../generate-demos.mjs';

// ---------------------------------------------------------------------------
// parseDemoPath
// ---------------------------------------------------------------------------

describe('parseDemoPath', () => {
  const demoRoot = '/project/dev-app/src/app/demos';

  it('handles flat demo path (lib only)', () => {
    const result = parseDemoPath(`${demoRoot}/data-display/treetable-demo`, demoRoot);
    expect(result.lib).toBe('data-display');
    expect(result.routePath).toBe('data-display/treetable');
    expect(result.name).toBe('treetable');
    expect(result.componentClassName).toBe('TreetableDemoComponent');
    expect(result.componentFileName).toBe('treetable-demo.component.ts');
  });

  it('handles nested demo path (lib/category)', () => {
    const result = parseDemoPath(`${demoRoot}/common/behaviors/sort-demo`, demoRoot);
    expect(result.lib).toBe('common');
    expect(result.routePath).toBe('common/behaviors/sort');
    expect(result.name).toBe('sort');
    expect(result.componentClassName).toBe('SortDemoComponent');
    expect(result.componentFileName).toBe('sort-demo.component.ts');
  });

  it('handles three-level nesting (lib/category/sub)', () => {
    const result = parseDemoPath(`${demoRoot}/ui/layout/stack-demo`, demoRoot);
    expect(result.lib).toBe('ui');
    expect(result.routePath).toBe('ui/layout/stack');
    expect(result.name).toBe('stack');
    expect(result.componentClassName).toBe('StackDemoComponent');
    expect(result.componentFileName).toBe('stack-demo.component.ts');
  });

  it('returns segments without demo root prefix', () => {
    const result = parseDemoPath(`${demoRoot}/common/data/data-source-demo`, demoRoot);
    expect(result.segments).toEqual(['common', 'data', 'data-source']);
  });
});

// ---------------------------------------------------------------------------
// typeStringToControlSpec
// ---------------------------------------------------------------------------

describe('typeStringToControlSpec', () => {
  it('converts boolean type', () => {
    const spec = typeStringToControlSpec('showCheckboxes', 'boolean', 'false');
    expect(spec).toMatchObject({ key: 'showCheckboxes', type: 'bool', default: false });
  });

  it('converts boolean type with true default', () => {
    const spec = typeStringToControlSpec('active', 'boolean', 'true');
    expect(spec).toMatchObject({ type: 'bool', default: true });
  });

  it('converts string type', () => {
    const spec = typeStringToControlSpec('label', 'string', '');
    expect(spec).toMatchObject({ key: 'label', type: 'text', default: '' });
  });

  it('converts number type', () => {
    const spec = typeStringToControlSpec('pageSize', 'number', '10');
    expect(spec).toMatchObject({ key: 'pageSize', type: 'number', default: 10 });
  });

  it('converts string literal union to select', () => {
    const spec = typeStringToControlSpec('selectionMode', "'none' | 'single' | 'multi'", "'none'");
    expect(spec).toMatchObject({
      key: 'selectionMode',
      type: 'select',
      default: 'none',
      options: [
        { label: 'none', value: 'none' },
        { label: 'single', value: 'single' },
        { label: 'multi', value: 'multi' },
      ],
    });
  });

  it('converts two-value string literal union', () => {
    const spec = typeStringToControlSpec('direction', "'asc' | 'desc'", "'asc'");
    expect(spec).toMatchObject({ type: 'select', options: [{ value: 'asc' }, { value: 'desc' }] });
  });

  it('converts T | undefined to underlying type with undefined default', () => {
    const spec = typeStringToControlSpec('placeholder', 'string | undefined', 'undefined');
    expect(spec).toMatchObject({ type: 'text', default: undefined });
  });

  it('returns null for complex object types', () => {
    expect(typeStringToControlSpec('tree', 'Node<T>', 'undefined')).toBeNull();
  });

  it('returns null for function types', () => {
    expect(typeStringToControlSpec('trackBy', '(node: T) => string', 'undefined')).toBeNull();
  });

  it('returns null for generic array types', () => {
    expect(typeStringToControlSpec('items', 'T[]', '[]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// compodocInputsToControls
// ---------------------------------------------------------------------------

describe('compodocInputsToControls', () => {
  it('maps inputsClass array to ControlSpec[], skipping nulls', () => {
    const inputs = [
      { name: 'selectionMode', type: "'none' | 'single' | 'multi'", defaultValue: "'none'" },
      { name: 'showCheckboxes', type: 'boolean', defaultValue: 'false' },
      { name: 'tree', type: 'Node<T>', defaultValue: 'undefined' },
    ];
    const controls = compodocInputsToControls(inputs);
    expect(controls).toHaveLength(2);
    expect(controls[0].key).toBe('selectionMode');
    expect(controls[1].key).toBe('showCheckboxes');
  });

  it('derives label from camelCase name', () => {
    const inputs = [{ name: 'selectionMode', type: "'none' | 'single'", defaultValue: "'none'" }];
    const [ctrl] = compodocInputsToControls(inputs);
    expect(ctrl.label).toBe('Selection Mode');
  });

  it('derives label from single-word name', () => {
    const inputs = [{ name: 'disabled', type: 'boolean', defaultValue: 'false' }];
    const [ctrl] = compodocInputsToControls(inputs);
    expect(ctrl.label).toBe('Disabled');
  });
});

// ---------------------------------------------------------------------------
// generateRoutesFile
// ---------------------------------------------------------------------------

describe('generateRoutesFile', () => {
  const demos = [
    {
      lib: 'common',
      routePath: 'common/behaviors/sort',
      componentClassName: 'SortDemoComponent',
      importPath: './demos/common/behaviors/sort-demo/index',
    },
    {
      lib: 'common',
      routePath: 'common/behaviors/filter',
      componentClassName: 'FilterDemoComponent',
      importPath: './demos/common/behaviors/filter-demo/index',
    },
    {
      lib: 'data-display',
      routePath: 'data-display/treetable',
      componentClassName: 'TreetableDemoComponent',
      importPath: './demos/data-display/treetable-demo/index',
    },
  ];

  it('contains @generated header', () => {
    const output = generateRoutesFile(demos);
    expect(output).toContain('@generated by scripts/generate-demos.mjs');
  });

  it('groups routes by lib', () => {
    const output = generateRoutesFile(demos);
    expect(output).toContain("path: 'common'");
    expect(output).toContain("path: 'data-display'");
  });

  it('generates lazy loadComponent with correct then()', () => {
    const output = generateRoutesFile(demos);
    expect(output).toContain("import('./demos/common/behaviors/sort-demo/index')");
    expect(output).toContain('.then((m) => m.SortDemoComponent)');
  });

  it('adds default redirect per group to first alpha demo', () => {
    const output = generateRoutesFile(demos);
    expect(output).toContain("redirectTo: 'behaviors/filter'");
  });

  it('adds catchall redirect', () => {
    const output = generateRoutesFile(demos);
    expect(output).toContain("path: '**'");
    expect(output).toContain("redirectTo: ''");
  });

  it('includes home route', () => {
    const output = generateRoutesFile(demos);
    expect(output).toContain("path: ''");
    expect(output).toContain("HomeComponent");
  });
});

// ---------------------------------------------------------------------------
// generateNavFile
// ---------------------------------------------------------------------------

describe('generateNavFile', () => {
  const demos = [
    {
      lib: 'common',
      routePath: 'common/behaviors/sort',
      title: 'Sort',
    },
    {
      lib: 'common',
      routePath: 'common/behaviors/filter',
      title: 'Filter',
    },
    {
      lib: 'data-display',
      routePath: 'data-display/treetable',
      title: undefined,
      name: 'treetable',
    },
  ];

  it('contains @generated header', () => {
    const output = generateNavFile(demos);
    expect(output).toContain('@generated by scripts/generate-demos.mjs');
  });

  it('exports NAV_GROUPS constant', () => {
    const output = generateNavFile(demos);
    expect(output).toContain('export const NAV_GROUPS');
  });

  it('uses demo.title for item label', () => {
    const output = generateNavFile(demos);
    expect(output).toContain("label: 'Sort'");
    expect(output).toContain("label: 'Filter'");
  });

  it('falls back to capitalised name when title is missing', () => {
    const output = generateNavFile(demos);
    expect(output).toContain("label: 'Treetable'");
  });

  it('uses @cngx/<lib> as group label', () => {
    const output = generateNavFile(demos);
    expect(output).toContain("label: '@cngx/common'");
    expect(output).toContain("label: '@cngx/data-display'");
  });

  it('includes correct routerLink paths', () => {
    const output = generateNavFile(demos);
    expect(output).toContain("path: 'common/behaviors/sort'");
  });
});

// ---------------------------------------------------------------------------
// generateNavHtmlBlock
// ---------------------------------------------------------------------------

describe('generateNavHtmlBlock', () => {
  const demos = [
    { lib: 'common', routePath: 'common/behaviors/sort', title: 'Sort', demoDir: 'common/behaviors/sort-demo', segments: ['common', 'behaviors', 'sort'] },
    { lib: 'common', routePath: 'common/behaviors/filter', title: 'Filter', demoDir: 'common/behaviors/filter-demo', segments: ['common', 'behaviors', 'filter'] },
  ];

  it('generates nav-group divs', () => {
    const output = generateNavHtmlBlock(demos);
    expect(output).toContain('class="nav-group"');
  });

  it('uses nav-label span with @cngx/<lib>', () => {
    const output = generateNavHtmlBlock(demos);
    expect(output).toContain('class="nav-label"');
    expect(output).toContain('@cngx/common');
  });

  it('generates routerLink anchors', () => {
    const output = generateNavHtmlBlock(demos);
    expect(output).toContain('routerLink="/common/behaviors/sort"');
    expect(output).toContain('routerLinkActive="active"');
  });

  it('groups demos by category when segments.length >= 3', () => {
    const output = generateNavHtmlBlock(demos);
    expect(output).toContain('class="nav-category"');
    expect(output).toContain('class="nav-category-label"');
    expect(output).toContain('Behaviors');
  });

  it('skips category grouping for flat demos', () => {
    const flat = [
      { lib: 'data-display', routePath: 'data-display/treetable', title: 'Treetable', demoDir: 'data-display/treetable-demo', segments: ['data-display', 'treetable'] },
    ];
    const output = generateNavHtmlBlock(flat);
    expect(output).not.toContain('nav-category');
    expect(output).toContain('routerLink="/data-display/treetable"');
  });
});

// ---------------------------------------------------------------------------
// injectNavBlock
// ---------------------------------------------------------------------------

describe('injectNavBlock', () => {
  const marker = (content) =>
    `<header>Brand</header>\n<!-- @generated:nav:start -->\n${content}\n<!-- @generated:nav:end -->\n<router-outlet />`;

  it('replaces content between markers', () => {
    const original = marker('<a>Old</a>');
    const result = injectNavBlock(original, '<a>New</a>');
    expect(result).toContain('<a>New</a>');
    expect(result).not.toContain('<a>Old</a>');
  });

  it('preserves content outside markers', () => {
    const original = marker('<a>Old</a>');
    const result = injectNavBlock(original, '<a>New</a>');
    expect(result).toContain('<header>Brand</header>');
    expect(result).toContain('<router-outlet />');
  });

  it('preserves the marker comments themselves', () => {
    const original = marker('');
    const result = injectNavBlock(original, '<a>X</a>');
    expect(result).toContain('<!-- @generated:nav:start -->');
    expect(result).toContain('<!-- @generated:nav:end -->');
  });

  it('throws when start marker is missing', () => {
    expect(() => injectNavBlock('<html>no markers</html>', '')).toThrow();
  });

  it('throws when end marker is missing', () => {
    const html = '<html><!-- @generated:nav:start -->no end</html>';
    expect(() => injectNavBlock(html, '')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// generateComponentFile
// ---------------------------------------------------------------------------

describe('generateComponentFile', () => {
  const meta = {
    name: 'sort',
    demoFolder: 'demos/common/behaviors/sort-demo',
    storyPath: 'demos/common/behaviors/sort-demo/sort-demo.story.ts',
    sharedRelativePath: '../../../../shared',
  };

  const storyNoControls = {
    title: 'Sort Demo',
    sections: [
      {
        title: 'Basic',
        template: '<div>hello</div>',
      },
    ],
  };

  const storyWithControls = {
    title: 'Sort Demo',
    controls: [
      { key: 'direction', type: 'select', label: 'Direction', options: [{ label: 'Asc', value: 'asc' }, { label: 'Desc', value: 'desc' }], default: 'asc' },
    ],
    sections: [
      {
        title: 'Playground Section',
        template: '<div [attr]="direction.value()">x</div>',
        imports: ['CngxSort'],
      },
    ],
  };

  it('contains @generated header with source path', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).toContain('@generated by scripts/generate-demos.mjs');
    expect(output).toContain('sort-demo.story.ts');
  });

  it('uses correct selector', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).toContain("selector: 'app-sort-demo'");
  });

  it('sets ChangeDetectionStrategy.OnPush', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).toContain('ChangeDetectionStrategy.OnPush');
  });

  it('sets standalone: true', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).toContain('standalone: true');
  });

  it('always imports ExampleCardComponent', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).toContain('ExampleCardComponent');
  });

  it('wraps sections without controls in app-example-card', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).toContain('<app-example-card');
    expect(output).toContain('Basic');
  });

  it('generates Playground controls as named fields', () => {
    const output = generateComponentFile(storyWithControls, meta);
    expect(output).toContain('readonly direction = Playground.select(');
  });

  it('generates pg = new Playground([...control fields])', () => {
    const output = generateComponentFile(storyWithControls, meta);
    expect(output).toContain('readonly pg = new Playground([this.direction])');
  });

  it('imports PlaygroundComponent when controls present', () => {
    const output = generateComponentFile(storyWithControls, meta);
    expect(output).toContain('PlaygroundComponent');
    expect(output).toContain('Playground');
  });

  it('wraps first section in app-playground when controls present', () => {
    const output = generateComponentFile(storyWithControls, meta);
    expect(output).toContain('<app-playground');
  });

  it('deduplicates imports list', () => {
    const story = {
      title: 'Test',
      sections: [
        { title: 'A', template: '', imports: ['CngxSort'] },
        { title: 'B', template: '', imports: ['CngxSort', 'CngxFilter'] },
      ],
    };
    const output = generateComponentFile(story, meta);
    const matches = [...output.matchAll(/CngxSort/g)];
    // should appear in imports array once, and in template twice but not duplicated in import list
    const importLineMatches = output
      .split('\n')
      .filter((l) => l.includes('import') && l.includes('CngxSort'));
    expect(importLineMatches).toHaveLength(1);
  });

  it('embeds section setup statements as class fields', () => {
    const story = {
      title: 'Test',
      sections: [
        {
          title: 'A',
          template: '<div>{{ lastClicked() }}</div>',
          setup: 'readonly lastClicked = signal<string | null>(null);',
        },
      ],
    };
    const output = generateComponentFile(story, meta);
    expect(output).toContain('readonly lastClicked = signal<string | null>(null);');
  });

  it('exports class with correct name', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).toContain('export class SortDemoComponent');
  });

  it('emits subtitle as class property and [subtitle] property binding', () => {
    const story = {
      title: 'Test',
      sections: [{ title: 'Basic', subtitle: 'A <code>subtitle</code> here.', template: '<div/>' }],
    };
    const output = generateComponentFile(story, meta);
    // Subtitle is emitted as a class property to avoid Angular template parser issues with HTML tags
    expect(output).toContain("protected readonly _s0 = 'A <code>subtitle</code> here.';");
    expect(output).toContain('[subtitle]="_s0"');
  });

  it('skips subtitle attribute when section has none', () => {
    const output = generateComponentFile(storyNoControls, meta);
    const lines = output.split('\n').filter((l) => l.includes('app-example-card'));
    expect(lines.every((l) => !l.includes('[subtitle]'))).toBe(true);
  });

  it('emits hostDirectives block and inject in core imports', () => {
    const story = {
      title: 'Smart',
      hostDirectives: ['CngxSort', 'CngxFilter'],
      sections: [{ title: 'Basic', template: '<div/>' }],
    };
    const output = generateComponentFile(story, meta);
    expect(output).toContain('hostDirectives: [');
    expect(output).toContain('{ directive: CngxSort },');
    expect(output).toContain('{ directive: CngxFilter },');
    expect(output).toMatch(/\binject\b/);
  });

  it('does not emit inject when no hostDirectives', () => {
    const output = generateComponentFile(storyNoControls, meta);
    expect(output).not.toMatch(/\binject\b/);
  });

  it('does not emit signal when setup has no signal()', () => {
    const story = {
      title: 'NoSignal',
      sections: [{ title: 'Basic', template: '<div/>' }],
    };
    const output = generateComponentFile(story, meta);
    expect(output).not.toMatch(/\bsignal\b/);
  });

  it('emits signal when setup uses signal()', () => {
    const story = {
      title: 'WithSignal',
      setup: 'protected open = signal(false);',
      sections: [{ title: 'Basic', template: '<div/>' }],
    };
    const output = generateComponentFile(story, meta);
    expect(output).toMatch(/\bsignal\b/);
  });
});

// ---------------------------------------------------------------------------
// generateIndexFile
// ---------------------------------------------------------------------------

describe('generateIndexFile', () => {
  it('exports the component class from the component file', () => {
    const output = generateIndexFile('SortDemoComponent', 'sort-demo.component.ts');
    expect(output).toContain("export { SortDemoComponent } from './sort-demo.component'");
  });

  it('strips .ts extension from import path', () => {
    const output = generateIndexFile('TreetableDemoComponent', 'treetable-demo.component.ts');
    expect(output).toContain("from './treetable-demo.component'");
    expect(output).not.toContain('.ts');
  });
});
