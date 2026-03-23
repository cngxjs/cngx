// @generated usage: node scripts/generate-demos.mjs
import { readFile, writeFile, readdir, access, stat } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = join(__dirname, '..');
const DEMOS_ROOT = join(WORKSPACE_ROOT, 'dev-app', 'src', 'app', 'demos');
const APP_DIR = join(WORKSPACE_ROOT, 'dev-app', 'src', 'app');
const COMPODOC_JSON = join(WORKSPACE_ROOT, '.compodoc', 'documentation.json');
const COMPODOC_MAX_AGE_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/** 'data-source' → 'DataSource' */
function kebabToPascal(str) {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/** 'selectionMode' → 'Selection Mode' */
function camelToTitleCase(str) {
  return str
    .replaceAll(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/** 'treetable' → 'Treetable' */
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Known Angular / Material import map
// ---------------------------------------------------------------------------

/** Well-known Angular and Material class → module path mappings. */
const KNOWN_ANGULAR_IMPORTS = new Map([
  // @angular/common
  ['AsyncPipe', '@angular/common'],
  ['CurrencyPipe', '@angular/common'],
  ['DatePipe', '@angular/common'],
  ['DecimalPipe', '@angular/common'],
  ['JsonPipe', '@angular/common'],
  ['LowerCasePipe', '@angular/common'],
  ['NgClass', '@angular/common'],
  ['NgFor', '@angular/common'],
  ['NgIf', '@angular/common'],
  ['NgStyle', '@angular/common'],
  ['PercentPipe', '@angular/common'],
  ['SlicePipe', '@angular/common'],
  ['TitleCasePipe', '@angular/common'],
  ['UpperCasePipe', '@angular/common'],
  // @angular/router
  ['RouterLink', '@angular/router'],
  ['RouterLinkActive', '@angular/router'],
  ['RouterModule', '@angular/router'],
  // @angular/forms
  ['FormsModule', '@angular/forms'],
  ['ReactiveFormsModule', '@angular/forms'],
  // @angular/material/*
  ['MatAutocompleteModule', '@angular/material/autocomplete'],
  ['MatBadgeModule', '@angular/material/badge'],
  ['MatButtonModule', '@angular/material/button'],
  ['MatCardModule', '@angular/material/card'],
  ['MatCheckboxModule', '@angular/material/checkbox'],
  ['MatChipsModule', '@angular/material/chips'],
  ['MatDatepickerModule', '@angular/material/datepicker'],
  ['MatDialogModule', '@angular/material/dialog'],
  ['MatDividerModule', '@angular/material/divider'],
  ['MatExpansionModule', '@angular/material/expansion'],
  ['MatFormFieldModule', '@angular/material/form-field'],
  ['MatIconModule', '@angular/material/icon'],
  ['MatInputModule', '@angular/material/input'],
  ['MatListModule', '@angular/material/list'],
  ['MatMenuModule', '@angular/material/menu'],
  ['MatPaginatorModule', '@angular/material/paginator'],
  ['MatProgressBarModule', '@angular/material/progress-bar'],
  ['MatProgressSpinnerModule', '@angular/material/progress-spinner'],
  ['MatRadioModule', '@angular/material/radio'],
  ['MatRippleModule', '@angular/material/core'],
  ['MatSelectModule', '@angular/material/select'],
  ['MatSidenavModule', '@angular/material/sidenav'],
  ['MatSlideToggleModule', '@angular/material/slide-toggle'],
  ['MatSnackBarModule', '@angular/material/snack-bar'],
  ['MatSortModule', '@angular/material/sort'],
  ['MatStepperModule', '@angular/material/stepper'],
  ['MatTableModule', '@angular/material/table'],
  ['MatTabsModule', '@angular/material/tabs'],
  ['MatToolbarModule', '@angular/material/toolbar'],
  ['MatTooltipModule', '@angular/material/tooltip'],
]);

// ---------------------------------------------------------------------------
// parseDemoPath
// ---------------------------------------------------------------------------

/**
 * @param {string} absoluteDemoPath  absolute path to a *-demo/ folder
 * @param {string} demoRoot          absolute path to the demos/ root
 * @returns {{ lib, segments, name, routePath, componentClassName, componentFileName }}
 */
export function parseDemoPath(absoluteDemoPath, demoRoot) {
  const rel = relative(demoRoot, absoluteDemoPath); // e.g. 'common/behaviors/sort-demo'
  const parts = rel.split('/');

  // Strip '-demo' suffix from last segment
  const lastRaw = parts[parts.length - 1]; // 'sort-demo'
  const name = lastRaw.replace(/-demo$/, ''); // 'sort'
  const segments = [...parts.slice(0, -1), name]; // ['common', 'behaviors', 'sort']
  const lib = segments[0];
  const routePath = segments.join('/');
  const componentClassName = `${kebabToPascal(name)}DemoComponent`;
  const componentFileName = `${name}-demo.component.ts`;

  return { lib, segments, name, routePath, componentClassName, componentFileName };
}

// ---------------------------------------------------------------------------
// parseStoryMeta
// ---------------------------------------------------------------------------

/**
 * Derives demo meta from a single story file inside a *-demo/ directory.
 * The primary story (`{name}-demo.story.ts`) reuses the dir-level meta.
 * Additional stories get their own route derived from the file stem.
 *
 * @param {string} storyFile  filename only, e.g. 'sort-backend.story.ts'
 * @param {{ lib, segments, name, routePath, componentClassName, componentFileName }} dirMeta
 */
export function parseStoryMeta(storyFile, dirMeta) {
  const fileStem = storyFile.replace(/\.story\.ts$/, ''); // e.g. 'sort-backend'
  const isPrimary = fileStem === `${dirMeta.name}-demo`;

  if (isPrimary) {
    return dirMeta;
  }

  // Secondary story: replace last segment with fileStem
  const parentSegments = dirMeta.segments.slice(0, -1);
  const segments = [...parentSegments, fileStem];
  const lib = segments[0];
  const routePath = segments.join('/');
  const componentClassName = `${kebabToPascal(fileStem)}DemoComponent`;
  const componentFileName = `${fileStem}.component.ts`;

  return { lib, segments, name: fileStem, routePath, componentClassName, componentFileName };
}

// ---------------------------------------------------------------------------
// typeStringToControlSpec
// ---------------------------------------------------------------------------

/**
 * Converts a TypeScript type string (from compodoc) to a ControlSpec object.
 * Returns null if the type cannot be represented as a playground control.
 *
 * @param {string} name           input name (becomes key)
 * @param {string} typeString     raw TypeScript type string
 * @param {string} defaultValue   raw default value string from compodoc
 * @returns {object|null}
 */
export function typeStringToControlSpec(name, typeString, defaultValue) {
  let type = typeString.trim();
  let isOptional = false;

  // Strip `| undefined` or `undefined |`
  if (/\|\s*undefined$/.test(type)) {
    type = type.replace(/\s*\|\s*undefined$/, '').trim();
    isOptional = true;
  } else if (/^undefined\s*\|/.test(type)) {
    type = type.replace(/^undefined\s*\|\s*/, '').trim();
    isOptional = true;
  }

  const def = isOptional ? undefined : defaultValue;

  // boolean
  if (type === 'boolean') {
    return {
      key: name,
      type: 'bool',
      label: camelToTitleCase(name),
      default: def === undefined ? undefined : def === 'true',
    };
  }

  // string
  if (type === 'string') {
    return {
      key: name,
      type: 'text',
      label: camelToTitleCase(name),
      default: def === undefined ? undefined : def === 'undefined' ? undefined : def,
    };
  }

  // number
  if (type === 'number') {
    return {
      key: name,
      type: 'number',
      label: camelToTitleCase(name),
      default: def === undefined ? undefined : def === 'undefined' ? undefined : Number(def),
    };
  }

  // string literal union: 'a' | 'b' | 'c'
  if (/^'[^']+'(\s*\|\s*'[^']+')*$/.test(type)) {
    const options = [...type.matchAll(/'([^']+)'/g)].map(([, v]) => ({
      label: v,
      value: v,
    }));
    const rawDefault = (def ?? '').replaceAll(/^'|'$/g, '');
    return {
      key: name,
      type: 'select',
      label: camelToTitleCase(name),
      options,
      default: rawDefault || options[0]?.value,
    };
  }

  // Anything else (generics, functions, arrays, objects) → skip
  return null;
}

// ---------------------------------------------------------------------------
// compodocInputsToControls
// ---------------------------------------------------------------------------

/**
 * @param {Array<{name: string, type: string, defaultValue: string}>} inputsClass
 * @returns {object[]}
 */
export function compodocInputsToControls(inputsClass) {
  return inputsClass
    .map((inp) => typeStringToControlSpec(inp.name, inp.type, inp.defaultValue ?? 'undefined'))
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// generateRoutesFile
// ---------------------------------------------------------------------------

/**
 * @param {Array<{lib, routePath, componentClassName, importPath}>} demos
 * @returns {string}
 */
export function generateRoutesFile(demos) {
  // Group by lib
  const groups = new Map();
  for (const demo of demos) {
    if (!groups.has(demo.lib)) groups.set(demo.lib, []);
    groups.get(demo.lib).push(demo);
  }

  // Sort within each group by routePath
  for (const items of groups.values()) {
    items.sort((a, b) => a.routePath.localeCompare(b.routePath));
  }

  const groupBlocks = [...groups.entries()]
    .map(([lib, items]) => {
      const children = items.map((d) => {
        const innerPath = d.routePath.slice(lib.length + 1); // strip 'lib/'
        return [
          `      {`,
          `        path: '${innerPath}',`,
          `        loadComponent: () =>`,
          `          import('${d.importPath}').then((m) => m.${d.componentClassName}),`,
          `      },`,
        ].join('\n');
      });

      const firstInnerPath = items[0].routePath.slice(lib.length + 1);
      children.push(`      { path: '', redirectTo: '${firstInnerPath}', pathMatch: 'full' },`);

      return [
        `  {`,
        `    path: '${lib}',`,
        `    children: [`,
        children.join('\n'),
        `    ],`,
        `  },`,
      ].join('\n');
    })
    .join('\n');

  return [
    `// @generated by scripts/generate-demos.mjs — do not edit manually`,
    ``,
    `import { type Routes } from '@angular/router';`,
    ``,
    `export const routes: Routes = [`,
    `  {`,
    `    path: '',`,
    `    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),`,
    `  },`,
    `  {`,
    `    path: 'demos',`,
    `    loadComponent: () => import('./demos/demos-overview.component').then((m) => m.DemosOverviewComponent),`,
    `  },`,
    groupBlocks,
    `  { path: '**', redirectTo: '' },`,
    `];`,
    ``,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// generateNavFile
// ---------------------------------------------------------------------------

/**
 * @param {Array<{lib, routePath, title?, name}>} demos
 * @returns {string}
 */
export function generateNavFile(demos) {
  const groups = new Map();
  for (const demo of demos) {
    if (!groups.has(demo.lib)) groups.set(demo.lib, []);
    groups.get(demo.lib).push(demo);
  }

  const groupEntries = [...groups.entries()]
    .map(([lib, items]) => {
      const itemEntries = items
        .map((d) => {
          const label = d.title ?? capitalise(d.name ?? d.routePath.split('/').pop());
          return `      { label: '${label}', path: '${d.routePath}' },`;
        })
        .join('\n');

      return [
        `  {`,
        `    label: '@cngx/${lib}',`,
        `    items: [`,
        itemEntries,
        `    ],`,
        `  },`,
      ].join('\n');
    })
    .join('\n');

  return [
    `// @generated by scripts/generate-demos.mjs — do not edit manually`,
    ``,
    `export interface NavItem {`,
    `  label: string;`,
    `  path: string;`,
    `}`,
    `export interface NavGroup {`,
    `  label: string;`,
    `  items: NavItem[];`,
    `}`,
    ``,
    `export const NAV_GROUPS: NavGroup[] = [`,
    groupEntries,
    `];`,
    ``,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// generateNavHtmlBlock
// ---------------------------------------------------------------------------

/**
 * @param {Array<{lib, routePath, title?, name, demoDir, segments}>} demos
 * @returns {string}
 */
export function generateNavHtmlBlock(demos) {
  // Group by lib
  const libGroups = new Map();
  for (const demo of demos) {
    if (!libGroups.has(demo.lib)) libGroups.set(demo.lib, []);
    libGroups.get(demo.lib).push(demo);
  }

  return [...libGroups.entries()]
    .map(([lib, items]) => {
      // Sub-group by category (segments[1] when segments.length >= 3)
      const catGroups = new Map();
      for (const demo of items) {
        const cat = demo.segments?.length >= 3 ? demo.segments[1] : null;
        if (!catGroups.has(cat)) catGroups.set(cat, []);
        catGroups.get(cat).push(demo);
      }

      const inner = [...catGroups.entries()]
        .map(([cat, catItems]) => {
          const links = renderDirGroups(catItems);
          if (cat === null) return links;
          return [
            `      <details class="nav-category" open>`,
            `        <summary class="nav-category-label">${capitalise(cat)}</summary>`,
            links,
            `      </details>`,
          ].join('\n');
        })
        .join('\n');

      return [
        `    <div class="nav-group">`,
        `      <span class="nav-label">@cngx/${lib}</span>`,
        inner,
        `    </div>`,
      ].join('\n');
    })
    .join('\n');
}

/**
 * Renders nav links for demos, grouping multi-story dirs into collapsible sub-groups.
 * @param {Array<{routePath, title?, name, demoDir}>} items
 * @returns {string}
 */
function renderDirGroups(items) {
  const dirGroups = new Map();
  for (const demo of items) {
    const key = demo.demoDir;
    if (!dirGroups.has(key)) dirGroups.set(key, []);
    dirGroups.get(key).push(demo);
  }

  return [...dirGroups.values()]
    .map((dirItems) => {
      if (dirItems.length === 1) {
        const d = dirItems[0];
        const label = d.title ?? capitalise(d.name ?? d.routePath.split('/').pop());
        return `        <a routerLink="/${d.routePath}" routerLinkActive="active">${label}</a>`;
      }
      // Multiple stories in same dir → collapsible group
      const dirBase = basename(dirItems[0].demoDir).replace(/-demo$/, '');
      const groupLabel = capitalise(dirBase);
      const links = dirItems
        .map((d) => {
          const label = d.title ?? capitalise(d.name ?? d.routePath.split('/').pop());
          return `          <a routerLink="/${d.routePath}" routerLinkActive="active">${label}</a>`;
        })
        .join('\n');
      return [
        `        <details class="nav-sub-group" open>`,
        `          <summary class="nav-sub-label">${groupLabel}</summary>`,
        links,
        `        </details>`,
      ].join('\n');
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// injectNavBlock
// ---------------------------------------------------------------------------

const NAV_START = '<!-- @generated:nav:start -->';
const NAV_END = '<!-- @generated:nav:end -->';

/**
 * @param {string} appHtml  full contents of app.html
 * @param {string} navHtml  replacement HTML for the nav block
 * @returns {string}
 */
export function injectNavBlock(appHtml, navHtml) {
  const startIdx = appHtml.indexOf(NAV_START);
  const endIdx = appHtml.indexOf(NAV_END);

  if (startIdx === -1) throw new Error(`Missing marker: ${NAV_START}`);
  if (endIdx === -1) throw new Error(`Missing marker: ${NAV_END}`);

  const before = appHtml.slice(0, startIdx + NAV_START.length);
  const after = appHtml.slice(endIdx);

  return `${before}\n${navHtml}\n${after}`;
}

// ---------------------------------------------------------------------------
// generateComponentFile
// ---------------------------------------------------------------------------

function renderControlCode(ctrl) {
  switch (ctrl.type) {
    case 'bool':
      return `  readonly ${ctrl.key} = Playground.bool('${ctrl.label}', ${ctrl.default ?? false});`;
    case 'text':
      return `  readonly ${ctrl.key} = Playground.text('${ctrl.label}', '${ctrl.default ?? ''}');`;
    case 'number': {
      const opts = [];
      if (ctrl.min !== undefined) {
        opts.push(`min: ${ctrl.min}`);
      }
      if (ctrl.max !== undefined) {
        opts.push(`max: ${ctrl.max}`);
      }
      if (ctrl.step !== undefined) {
        opts.push(`step: ${ctrl.step}`);
      }
      const optsStr = opts.length ? `, { ${opts.join(', ')} }` : '';
      return `  readonly ${ctrl.key} = Playground.number('${ctrl.label}', ${ctrl.default ?? 0}${optsStr});`;
    }
    case 'range':
      return `  readonly ${ctrl.key} = Playground.range('${ctrl.label}', ${ctrl.min}, ${ctrl.max}, ${ctrl.default}, ${ctrl.step ?? 1});`;
    case 'select': {
      const opts = ctrl.options
        .map((o) => `{ label: '${o.label}', value: '${o.value}' }`)
        .join(', ');
      const defStr = typeof ctrl.default === 'string' ? `'${ctrl.default}'` : String(ctrl.default);
      return [
        `  readonly ${ctrl.key} = Playground.select(`,
        `    '${ctrl.label}',`,
        `    [${opts}],`,
        `    ${defStr},`,
        `  );`,
      ].join('\n');
    }
  }
}

/**
 * @param {object} story       DemoSpec
 * @param {{ name, demoFolder, storyPath, sharedRelativePath, importMap? }} meta
 * @returns {string}
 */
export function generateComponentFile(story, meta) {
  const { name, storyPath, sharedRelativePath } = meta;
  const importMap = meta.importMap ?? new Map();
  const controls = story.controls ?? [];
  const hasControls = controls.length > 0;

  const className = `${kebabToPascal(name)}DemoComponent`;
  const selector = `app-${name}-demo`;

  // Collect all story imports (deduplicated) — these go into @Component.imports
  const allStoryImports = [...new Set(story.sections.flatMap((s) => s.imports ?? []))];

  // Build a set of identifiers already covered by moduleImports so we can skip
  // the duplicate TS import line while still adding them to @Component.imports.
  const moduleImportIdentifiers = new Set(
    (story.moduleImports ?? []).flatMap((line) => {
      const match = line.match(/import\s*\{([^}]+)\}/);
      if (!match) return [];
      return match[1].split(',').map((id) => id.trim().replace(/^type\s+/, ''));
    }),
  );

  // Resolve story imports + hostDirectives via importMap; group unresolved together
  const resolvedImports = new Map(); // modulePath → Set<className>
  const unresolved = [];
  const allClassesNeedingTsImport = [
    ...new Set([...allStoryImports, ...(story.hostDirectives ?? [])]),
  ];
  for (const cls of allClassesNeedingTsImport) {
    if (moduleImportIdentifiers.has(cls)) {
      // Already covered by moduleImports — no duplicate TS import line is emitted
      continue;
    }
    const src = importMap.get(cls);
    if (src) {
      if (!resolvedImports.has(src)) {
        resolvedImports.set(src, new Set());
      }
      resolvedImports.get(src).add(cls);
    } else {
      unresolved.push(cls);
    }
  }

  // Build import lines — only include what is actually referenced in TS class body
  const allSetupCode = [story.setup, ...story.sections.map((s) => s.setup)]
    .filter(Boolean)
    .join('\n');
  const needsInject = !!(story.hostDirectives?.length) || allSetupCode.includes('inject(');
  const usesComputed = allSetupCode.includes('computed(');
  const usesSignal = allSetupCode.includes('signal(') || allSetupCode.includes('signal<');
  const coreSymbols = [
    'ChangeDetectionStrategy',
    'Component',
    ...(usesComputed ? ['computed'] : []),
    ...(needsInject ? ['inject'] : []),
    ...(usesSignal ? ['signal'] : []),
  ];
  const coreImports = `import { ${coreSymbols.join(', ')} } from '@angular/core';`;

  const sharedImportLines = [
    `import { ExampleCardComponent } from '${sharedRelativePath}/example-card.component';`,
    `import { DocShellComponent } from '${sharedRelativePath}/doc-shell.component';`,
  ];
  if (hasControls) {
    sharedImportLines.push(
      `import { PlaygroundComponent } from '${sharedRelativePath}/playground.component';`,
      `import { Playground } from '${sharedRelativePath}/playground';`,
    );
  }

  const resolvedImportLines = [...resolvedImports.entries()].map(
    ([src, names]) => `import { ${[...names].join(', ')} } from '${src}';`,
  );
  const unresolvedLine =
    unresolved.length > 0 ? `import { ${unresolved.join(', ')} } from 'TODO';` : null;

  // story.moduleImports: raw import statement strings (e.g. fixture imports)
  const extraImportLines = story.moduleImports ?? [];

  const allImportLines = [
    coreImports,
    ...sharedImportLines,
    ...resolvedImportLines,
    ...(unresolvedLine ? [unresolvedLine] : []),
    ...extraImportLines,
  ];

  // Decorator imports array entries
  const decoratorImports = [
    'ExampleCardComponent',
    'DocShellComponent',
    ...(hasControls ? ['PlaygroundComponent'] : []),
    ...allStoryImports,
  ];

  // Subtitle class fields — subtitles are HTML strings passed to [innerHTML].
  // We emit them as protected class properties to avoid Angular's template parser
  // treating <code> etc. inside attribute values as HTML elements.
  const subtitleFields = story.sections
    .map((s, i) =>
      s.subtitle
        ? `  protected readonly _s${i} = '${s.subtitle.replaceAll('\\', '\\\\').replaceAll('\'', String.raw`\'`)}';`
        : null,
    )
    .filter(Boolean);

  // Build source string fields for each section (HTML, TS, CSS)
  const sourceFields = story.sections.flatMap((section, i) => {
    const escapeStr = (s) =>
      s.replaceAll('\\', '\\\\').replaceAll('\'', String.raw`\'`).replaceAll('\n', '\\n');
    const fields = [`  protected readonly _srcHtml${i} = '${escapeStr(section.template)}';`];
    if (section.setup) {
      fields.push(`  protected readonly _srcTs${i} = '${escapeStr(section.setup)}';`);
    }
    if (section.css) {
      fields.push(`  protected readonly _srcCss${i} = '${escapeStr(section.css)}';`);
    }
    return fields;
  });

  // Template sections
  const templateParts = story.sections.map((section, i) => {
    const isPlayground = hasControls && i === 0;
    const subtitleAttr = section.subtitle ? `\n        [subtitle]="_s${i}"` : '';
    const sourceHtmlAttr = `\n        [sourceHtml]="_srcHtml${i}"`;
    const sourceTsAttr = section.setup ? `\n        [sourceTs]="_srcTs${i}"` : '';
    const sourceCssAttr = section.css ? `\n        [sourceCss]="_srcCss${i}"` : '';
    // Escape backticks and ${} interpolations so they survive being embedded in a TS template literal.
    const tpl = section.template.replaceAll('`', '\\`').replaceAll('${', '\\${');
    if (isPlayground) {
      return [
        `      <app-playground [playground]="pg">`,
        `        ${tpl}`,
        `      </app-playground>`,
      ].join('\n');
    }
    return [
      `      <app-example-card title="${section.title}"${subtitleAttr}${sourceHtmlAttr}${sourceTsAttr}${sourceCssAttr}>`,
      `        ${tpl}`,
      `      </app-example-card>`,
    ].join('\n');
  });

  // DocShell wrapper
  const apiComponentsAttr = story.apiComponents?.length
    ? `\n      [apiComponents]="[${story.apiComponents.map((c) => `'${c}'`).join(', ')}]"`
    : '';
  const overviewAttr = story.overview
    ? `\n      overview="${story.overview.replaceAll('"', '&quot;')}"`
    : '';
  const descriptionAttr = story.description
    ? `\n      description="${story.description.replaceAll('"', '&quot;')}"`
    : '';

  const wrappedTemplate = [
    `    <app-doc-shell title="${story.title}"${descriptionAttr}${overviewAttr}${apiComponentsAttr}>`,
    ...templateParts,
    `    </app-doc-shell>`,
  ];

  // Class body
  const controlFields = controls.map(renderControlCode);
  const pgLine = hasControls
    ? `  readonly pg = new Playground([${controls.map((c) => `this.${c.key}`).join(', ')}]);`
    : null;

  // story.setup: shared class-level code (DemoSpec top-level)
  const sharedSetup = story.setup ? [story.setup] : [];

  // section-level setup statements
  const sectionSetups = story.sections.flatMap((s) => (s.setup ? [s.setup] : []));

  const classBodyParts = [
    ...subtitleFields,
    ...sourceFields,
    ...controlFields,
    ...(pgLine ? [pgLine] : []),
    ...sharedSetup,
    ...sectionSetups,
  ].filter(Boolean);

  const hostDirectivesLines = story.hostDirectives?.length
    ? [
      `  hostDirectives: [`,
      ...story.hostDirectives.map((d) => `    { directive: ${d} },`),
      `  ],`,
    ]
    : [];

  return [
    `// @generated by scripts/generate-demos.mjs — do not edit manually`,
    `// Source: ${storyPath}`,
    ``,
    ...allImportLines,
    ``,
    `@Component({`,
    `  selector: '${selector}',`,
    `  standalone: true,`,
    `  changeDetection: ChangeDetectionStrategy.OnPush,`,
    ...hostDirectivesLines,
    `  imports: [`,
    ...decoratorImports.map((n) => `    ${n},`),
    `  ],`,
    `  template: \``,
    ...wrappedTemplate,
    `  \`,`,
    `})`,
    `export class ${className} {`,
    classBodyParts.length > 0 ? classBodyParts.join('\n') : '',
    `}`,
    ``,
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

// ---------------------------------------------------------------------------
// generateIndexFile
// ---------------------------------------------------------------------------

/**
 * @param {string} componentClassName  e.g. 'SortDemoComponent'
 * @param {string} componentFileName   e.g. 'sort-demo.component.ts'
 * @returns {string}
 */
export function generateIndexFile(componentClassName, componentFileName) {
  const importPath = componentFileName.replace(/\.ts$/, '');
  return `export { ${componentClassName} } from './${importPath}';\n`;
}

// ---------------------------------------------------------------------------
// Compodoc helpers
// ---------------------------------------------------------------------------

async function ensureCompodocJson() {
  let needsRegen = true;
  try {
    const s = await stat(COMPODOC_JSON);
    needsRegen = Date.now() - s.mtimeMs > COMPODOC_MAX_AGE_MS;
  } catch {
    // file doesn't exist
  }
  if (needsRegen) {
    console.log('Regenerating compodoc JSON…');
    execSync('npm run docs:json', { cwd: WORKSPACE_ROOT, stdio: 'inherit' });
  }
}

async function loadCompodocJson() {
  const raw = await readFile(COMPODOC_JSON, 'utf8');
  return JSON.parse(raw);
}

/** Build a Map<className, modulePath> from compodoc JSON for import resolution. */
function buildImportMap(compodocData) {
  const map = new Map(KNOWN_ANGULAR_IMPORTS);
  for (const section of ['directives', 'components', 'pipes', 'classes', 'injectables']) {
    for (const item of compodocData[section] ?? []) {
      if (item.name && item.file) {
        // Convert file path to @cngx import — handles primary and secondary entry points.
        // Primary:   projects/<lib>/src/...         → @cngx/<lib>
        // Secondary: projects/<lib>/<entry>/src/... → @cngx/<lib>/<entry>
        const file = item.file;
        const primary = file.match(/projects\/([^/]+)\/src\//);
        if (primary) {
          map.set(item.name, `@cngx/${primary[1]}`);
          continue;
        }
        const secondary = file.match(/projects\/([^/]+)\/([^/]+)\/src\//);
        if (secondary) {
          map.set(item.name, `@cngx/${secondary[1]}/${secondary[2]}`);
        }
      }
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Story file loader
// ---------------------------------------------------------------------------

async function loadStoryFile(storyPath) {
  // Dynamic import of .story.ts — but these are TypeScript.
  // We evaluate them with tsx / ts-node or use a simple text parse.
  // For now we use a best-effort JS evaluation via Function (stories must be valid ESM).
  // In CI this runs after tsc, so we could also look for .js output.
  // Simplest: require a .mjs story or use createRequire trick.
  // We'll use a simple AST-free approach: eval the story via node --input-type=module.
  // Trade-off: stories must use only JSON-serialisable literals (no runtime imports).
  const content = await readFile(storyPath, 'utf8');
  // Strip the `import type { DemoSpec }` line — it's type-only
  const stripped = content.replace(/^import type[^\n]+\n/m, '');
  // Extract the exported STORY object via JSON parse trick
  // Stories export: export const STORY: DemoSpec = { ... };
  const match = stripped.match(/export const STORY[^=]*=\s*([\s\S]+?);?\s*$/);
  if (!match) return null;
  // Safe eval using Function constructor (no network/fs access in stories)
  try {
    const fn = new Function(`return (${match[1]})`);
    return fn();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Demo discovery
// ---------------------------------------------------------------------------

async function findDemoDirs(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = join(root, entry.name);
    if (entry.name.endsWith('-demo')) {
      results.push(fullPath);
    } else {
      results.push(...(await findDemoDirs(fullPath)));
    }
  }
  return results;
}

function computeSharedRelativePath(demoFolder, appDir) {
  const depth = relative(appDir, demoFolder).split('/').length;
  return '../'.repeat(depth) + 'shared';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await ensureCompodocJson();
  const compodocData = await loadCompodocJson();
  const importMap = buildImportMap(compodocData);

  const demoDirs = await findDemoDirs(DEMOS_ROOT);
  const demos = [];

  for (const demoDir of demoDirs) {
    const dirMeta = parseDemoPath(demoDir, DEMOS_ROOT);
    const files = await readdir(demoDir);
    const storyFiles = files.filter((f) => f.endsWith('.story.ts')).sort();

    // If no story files, add a placeholder entry so the route/nav slot is preserved
    if (storyFiles.length === 0) {
      const relativeImportPath =
        './demos/' + relative(DEMOS_ROOT, demoDir).replaceAll('\\', '/') + '/index';
      demos.push({
        ...dirMeta,
        title: undefined,
        importPath: relativeImportPath,
        story: null,
        storyPath: relative(APP_DIR, join(demoDir, `${dirMeta.name}-demo.story.ts`)),
        sharedRelativePath: computeSharedRelativePath(demoDir, APP_DIR),
        importMap,
        demoDir,
      });
      continue;
    }

    for (const storyFile of storyFiles) {
      const meta = parseStoryMeta(storyFile, dirMeta);
      const storyPath = join(demoDir, storyFile);
      const story = await loadStoryFile(storyPath);
      const importPath =
        './demos/' +
        relative(DEMOS_ROOT, demoDir).replaceAll('\\', '/') +
        '/' +
        meta.componentFileName.replace(/\.ts$/, '');

      demos.push({
        ...meta,
        title: story?.title,
        importPath,
        story,
        storyPath: relative(APP_DIR, storyPath),
        sharedRelativePath: computeSharedRelativePath(demoDir, APP_DIR),
        importMap,
        demoDir,
      });
    }
  }

  // Generate routes
  const routesContent = generateRoutesFile(demos);
  await writeFile(join(APP_DIR, 'app.routes.ts'), routesContent);
  console.log('Written: app.routes.ts');

  // Generate nav file
  const navContent = generateNavFile(demos);
  await writeFile(join(APP_DIR, 'app-nav.ts'), navContent);
  console.log('Written: app-nav.ts');

  // Update nav block in app.html
  const appHtmlPath = join(APP_DIR, 'app.html');
  const appHtml = await readFile(appHtmlPath, 'utf8');
  if (appHtml.includes(NAV_START)) {
    const navHtml = generateNavHtmlBlock(demos);
    const updated = injectNavBlock(appHtml, navHtml);
    await writeFile(appHtmlPath, updated);
    console.log('Updated: app.html nav block');
  }

  // Generate component files for every demo that has a story
  for (const demo of demos) {
    if (!demo.story || !demo.demoDir) continue;

    const componentPath = join(demo.demoDir, demo.componentFileName);

    // Only write component if it doesn't exist or already has @generated marker
    let shouldWrite = true;
    try {
      const existing = await readFile(componentPath, 'utf8');
      shouldWrite = existing.startsWith('// @generated by scripts/generate-demos.mjs');
    } catch {
      // file doesn't exist → write it
    }

    if (shouldWrite) {
      const componentContent = generateComponentFile(demo.story, {
        name: demo.name,
        storyPath: demo.storyPath,
        sharedRelativePath: demo.sharedRelativePath,
        importMap: demo.importMap,
      });
      await writeFile(componentPath, componentContent);
      console.log(`Generated component: ${demo.componentFileName.replace('.component.ts', '')}`);
    } else {
      console.log(`Skipped (not @generated): ${demo.componentFileName}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
