// @generated usage: node scripts/generate-demos.mjs
import { readFile, writeFile, readdir, access, stat } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

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
 * @param {Array<{lib, routePath, title?, name}>} demos
 * @returns {string}
 */
export function generateNavHtmlBlock(demos) {
  const groups = new Map();
  for (const demo of demos) {
    if (!groups.has(demo.lib)) groups.set(demo.lib, []);
    groups.get(demo.lib).push(demo);
  }

  return [...groups.entries()]
    .map(([lib, items]) => {
      const links = items
        .map((d) => {
          const label = d.title ?? capitalise(d.name ?? d.routePath.split('/').pop());
          return `      <a routerLink="/${d.routePath}" routerLinkActive="active">${label}</a>`;
        })
        .join('\n');

      return [
        `    <div class="nav-group">`,
        `      <span class="nav-label">@cngx/${lib}</span>`,
        links,
        `    </div>`,
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
      if (ctrl.min !== undefined) opts.push(`min: ${ctrl.min}`);
      if (ctrl.max !== undefined) opts.push(`max: ${ctrl.max}`);
      if (ctrl.step !== undefined) opts.push(`step: ${ctrl.step}`);
      const optsStr = opts.length ? `, { ${opts.join(', ')} }` : '';
      return `  readonly ${ctrl.key} = Playground.number('${ctrl.label}', ${ctrl.default ?? 0}${optsStr});`;
    }
    case 'range':
      return `  readonly ${ctrl.key} = Playground.range('${ctrl.label}', ${ctrl.min}, ${ctrl.max}, ${ctrl.default}, ${ctrl.step ?? 1});`;
    case 'select': {
      const opts = ctrl.options.map((o) => `{ label: '${o.label}', value: '${o.value}' }`).join(', ');
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

  // Collect all story imports (deduplicated)
  const allStoryImports = [
    ...new Set(story.sections.flatMap((s) => s.imports ?? [])),
  ];

  // Resolve story imports via importMap; group unresolved together
  const resolvedImports = new Map(); // modulePath → Set<className>
  const unresolved = [];
  for (const cls of allStoryImports) {
    const src = importMap.get(cls);
    if (src) {
      if (!resolvedImports.has(src)) resolvedImports.set(src, new Set());
      resolvedImports.get(src).add(cls);
    } else {
      unresolved.push(cls);
    }
  }

  // Build import lines
  const coreImports = `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';`;

  const sharedImportLines = [
    `import { ExampleCardComponent } from '${sharedRelativePath}/example-card.component';`,
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
    ...(hasControls ? ['PlaygroundComponent'] : []),
    ...allStoryImports,
  ];

  // Template sections
  const templateParts = story.sections.map((section, i) => {
    const isPlayground = hasControls && i === 0;
    if (isPlayground) {
      return [
        `    <app-playground [playground]="pg">`,
        `      ${section.template}`,
        `    </app-playground>`,
      ].join('\n');
    }
    return [
      `    <app-example-card title="${section.title}">`,
      `      ${section.template}`,
      `    </app-example-card>`,
    ].join('\n');
  });

  // Class body
  const controlFields = controls.map(renderControlCode);
  const pgLine =
    hasControls
      ? `  readonly pg = new Playground([${controls.map((c) => `this.${c.key}`).join(', ')}]);`
      : null;

  // story.setup: shared class-level code (DemoSpec top-level)
  const sharedSetup = story.setup ? [story.setup] : [];

  // section-level setup statements
  const sectionSetups = story.sections.flatMap((s) => (s.setup ? [s.setup] : []));

  const classBodyParts = [
    ...controlFields,
    ...(pgLine ? [pgLine] : []),
    ...sharedSetup,
    ...sectionSetups,
  ].filter(Boolean);

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
    `  imports: [`,
    ...decoratorImports.map((n) => `    ${n},`),
    `  ],`,
    `  template: \``,
    ...templateParts,
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
  const map = new Map();
  for (const section of ['directives', 'components', 'pipes', 'classes', 'injectables']) {
    for (const item of compodocData[section] ?? []) {
      if (item.name && item.file) {
        // Convert absolute file path to @cngx import if possible
        const file = item.file;
        const match = file.match(/projects\/([^/]+)\/src\/(?:public-api\.ts|.*)/);
        if (match) {
          map.set(item.name, `@cngx/${match[1]}`);
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
    const meta = parseDemoPath(demoDir, DEMOS_ROOT);
    const storyPath = join(demoDir, `${meta.name}-demo.story.ts`);

    let story = null;
    try {
      await access(storyPath);
      story = await loadStoryFile(storyPath);
    } catch {
      // no story file
    }

    const relativeImportPath =
      './demos/' + relative(DEMOS_ROOT, demoDir).replaceAll('\\', '/') + '/index';

    demos.push({
      ...meta,
      title: story?.title,
      importPath: relativeImportPath,
      story,
      storyPath: relative(APP_DIR, storyPath),
      sharedRelativePath: computeSharedRelativePath(demoDir, APP_DIR),
      importMap,
    });
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

  // Generate index.ts and (if story exists) component files for every demo
  for (const demo of demos) {
    const actualDemoDir = demoDirs.find((d) => {
      const m = parseDemoPath(d, DEMOS_ROOT);
      return m.lib === demo.lib && m.name === demo.name;
    });
    if (!actualDemoDir) continue;

    const componentPath = join(actualDemoDir, demo.componentFileName);

    if (demo.story) {
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
        console.log(`Generated component: ${demo.name}-demo`);
      } else {
        console.log(`Skipped (not @generated): ${demo.name}-demo component`);
      }
    }

    // Always write index.ts (re-exports the component regardless of origin)
    const indexContent = generateIndexFile(demo.componentClassName, demo.componentFileName);
    await writeFile(join(actualDemoDir, 'index.ts'), indexContent);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
