import { parseTemplate, TmplAstElement } from '@angular/compiler';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { readWorkspace } from '@schematics/angular/utility';
import { format } from 'prettier';
import { describe, expect, it, vi } from 'vitest';

import { createAnswers, VERSIONS } from '../testing/onboarding';
import { createFixtureTree, type FixtureName, readFixture, readTree, runRule } from '../testing/run-schematic';
import { type AppShell, appShellBlockedText, type AppShellBlockedReason, detectProject, type ProjectFacts } from './detect/detect';
import { ngAdd } from './index';
import { OUTLETS_ID, OUTLETS_SNIPPET, planAppShell } from './steps/app-shell';

// Runs `ng add --feedback` over every root component shape in CORPUS and
// holds each to one of two outcomes: a note with a reason from the closed
// set and no outlet written, or outlets that compile, parse, sit there once
// and plan nothing more, raw and after Prettier.

vi.mock('./shell/git-state', () => ({ readGitState: () => 'clean' }));

type Files = Readonly<Record<string, string>>;
type Tree = ReturnType<typeof createFixtureTree>;

const STOCK_APP = readFixture('scaffold-21')['src/app/app.ts'];
const STOCK_SPEC = readFixture('scaffold-21')['src/app/app.spec.ts'];
const PRETTIERRC = JSON.parse(readFixture('scaffold-21')['.prettierrc']) as Record<string, unknown>;

const NGMODULE_MAIN = `import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule, {

})
  .catch(err => console.error(err));
`;

function ngModule(imports = `imports: [
    BrowserModule
  ],`): string {
  return `import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app';

@NgModule({
  declarations: [
    App
  ],
  ${imports}
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
`;
}

const NGMODULE_APP = `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fixture-app');
}
`;

function app(edit: (stock: string) => string): Files {
  return { 'src/app/app.ts': edit(STOCK_APP) };
}

function withImports(imports: string, head = ''): Files {
  return app((stock) => `${head}${stock.replace('  imports: [RouterOutlet],\n', imports)}`);
}

function inline(template: string): Files {
  return app((stock) => stock.replace("  templateUrl: './app.html',\n", `  template: ${template},\n`));
}

function ngModuleApp(imports?: string): Files {
  return {
    'src/main.ts': NGMODULE_MAIN,
    'src/app/app-module.ts': ngModule(imports),
    'src/app/app.ts': NGMODULE_APP,
  };
}

function crlf(files: Files): Files {
  return Object.fromEntries(Object.entries(files).map(([path, content]) => [path, content.replace(/\n/g, '\r\n')]));
}

interface Shape {
  readonly name: string;
  readonly fixture?: FixtureName;
  readonly files?: Files;
  readonly remove?: readonly string[];
  /** `placed`, or the reason cngx names with the snippet instead of editing. */
  readonly outcome: 'placed' | AppShellBlockedReason;
}

const OUTLETS_HTML = '<cngx-banner-outlet />\n<router-outlet />\n<cngx-toast-outlet />\n';
const RE_EXPORT_MAIN = readFixture('scaffold-21')['src/main.ts'].replace("from './app/app';", "from './app/index';");

// One row per shape; a new shape is one more line.
const CORPUS: readonly Shape[] = [
  { name: 'scaffold-21', fixture: 'scaffold-21', outcome: 'placed' },
  { name: 'scaffold-21 routing off', fixture: 'scaffold-21-routing-off', outcome: 'placed' },
  { name: 'scaffold-21 zone', fixture: 'scaffold-21-zone', outcome: 'placed' },
  { name: 'scaffold-21 scss', fixture: 'scaffold-21-scss', outcome: 'placed' },
  { name: 'standalone-app', fixture: 'standalone-app', outcome: 'placed' },
  { name: 'existing-tailwind-app', fixture: 'existing-tailwind-app', outcome: 'placed' },
  { name: 'NgModule app', files: ngModuleApp(), remove: ['src/app/app.spec.ts'], outcome: 'placed' },
  { name: "NgModule 'imports' key", files: ngModuleApp(`'imports': [\n    BrowserModule\n  ],`), outcome: 'placed' },
  { name: 'NgModule without imports', files: ngModuleApp(''), outcome: 'placed' },
  { name: 'NgModule identifier imports', files: ngModuleApp('imports: MODULES,'), outcome: 'imports-not-array' },
  { name: 'NgModule duplicate imports', files: ngModuleApp('imports: [BrowserModule],\n  imports: [],'), outcome: 'duplicate-property' },
  { name: "single-quoted 'imports' key", files: withImports("  'imports': [RouterOutlet],\n"), outcome: 'placed' },
  { name: 'double-quoted "imports" key', files: withImports('  "imports": [RouterOutlet],\n'), outcome: 'placed' },
  { name: 'spread in the decorator', files: withImports('  ...shared,\n', 'const shared = {};\n'), outcome: 'decorator-dynamic' },
  { name: 'computed key', files: withImports("  ['imports']: [RouterOutlet],\n"), outcome: 'decorator-dynamic' },
  { name: 'shorthand imports', files: withImports('  imports,\n', 'const imports = [RouterOutlet];\n'), outcome: 'imports-not-array' },
  { name: 'identifier imports', files: withImports('  imports: IMPORTS,\n', 'const IMPORTS = [RouterOutlet];\n'), outcome: 'imports-not-array' },
  { name: 'duplicate imports', files: withImports('  imports: [RouterOutlet],\n  imports: [],\n'), outcome: 'duplicate-property' },
  { name: 'imports as const', files: withImports('  imports: [RouterOutlet] as const,\n'), outcome: 'imports-not-array' },
  { name: 'missing imports', files: withImports(''), outcome: 'placed' },
  { name: 'empty imports', files: withImports('  imports: [],\n'), outcome: 'placed' },
  { name: 'empty multi-line imports', files: withImports('  imports: [\n  ],\n'), outcome: 'placed' },
  { name: 'imports with other classes', files: withImports('  imports: [RouterOutlet, NgClass],\n', "import { NgClass } from '@angular/common';\n"), outcome: 'placed' },
  { name: 'imports with a spread element', files: withImports('  imports: [...SHARED],\n', 'const SHARED = [RouterOutlet];\n'), outcome: 'placed' },
  { name: 'inline backtick template', files: inline('`\n    <main>\n      <router-outlet />\n    </main>\n  `'), outcome: 'placed' },
  { name: 'inline one-line backtick template', files: inline('`<router-outlet />`'), outcome: 'placed' },
  { name: 'inline single-quoted template', files: inline("'<router-outlet />'"), outcome: 'quoted-template' },
  { name: 'inline double-quoted template', files: inline('"<router-outlet />"'), outcome: 'quoted-template' },
  { name: 'quoted template holding both outlets', files: { ...withImports(''), ...inline("'<cngx-banner-outlet /><router-outlet /><cngx-toast-outlet />'") }, outcome: 'placed' },
  { name: 'interpolated template', files: inline('`<router-outlet />${extra}`'), outcome: 'template-interpolated' },
  { name: 'identifier template', files: inline('TEMPLATE'), outcome: 'template-not-literal' },
  { name: "quoted 'templateUrl' key", files: app((stock) => stock.replace('  templateUrl:', "  'templateUrl':")), outcome: 'placed' },
  { name: "quoted 'template' key", files: app((stock) => stock.replace("  templateUrl: './app.html',\n", "  'template': `<router-outlet />`,\n")), outcome: 'placed' },
  { name: 'missing templateUrl file', remove: ['src/app/app.html'], outcome: 'template-file-missing' },
  { name: 'no template', files: app((stock) => stock.replace("  templateUrl: './app.html',\n", '')), outcome: 'no-template' },
  { name: 'duplicate template', files: app((stock) => stock.replace("  templateUrl: './app.html',\n", "  templateUrl: './app.html',\n  templateUrl: './other.html',\n")), outcome: 'duplicate-property' },
  { name: 'decorator without object literal', files: app((stock) => stock.replace(/@Component\(\{[\s\S]*?\}\)/, '@Component(CONFIG)')), outcome: 'decorator-not-object' },
  { name: 'outlet name bound elsewhere', files: app((stock) => `${stock}\nconst CngxToastOutlet = 1;\n`), outcome: 'outlet-name-bound' },
  { name: 'CRLF component and template', files: crlf({ 'src/app/app.ts': STOCK_APP, 'src/app/app.html': readFixture('scaffold-21')['src/app/app.html'] }), outcome: 'placed' },
  { name: 'CRLF inline template', files: crlf(inline('`\n    <router-outlet />\n  `')), outcome: 'placed' },
  {
    name: 'comments naming class, export and bootstrap',
    files: {
      'src/main.ts': `// bootstrapApplication(Other, otherConfig);\n/* platformBrowser().bootstrapModule(OtherModule) */\n${readFixture('scaffold-21')['src/main.ts']}`,
      ...app((stock) => `// export class App {}\n${stock.replace('@Component({', '/* class Other */\n@Component({')}`),
    },
    outcome: 'placed',
  },
  { name: 'commented-out bootstrap only', files: { 'src/main.ts': "// bootstrapApplication(App, appConfig);\nimport { App } from './app/app';\n" }, outcome: 'no-bootstrap-call' },
  { name: 're-exported class', files: { 'src/main.ts': RE_EXPORT_MAIN, 'src/app/index.ts': "export { App } from './app';\n" }, outcome: 'placed' },
  { name: 'class from a package', files: { 'src/main.ts': RE_EXPORT_MAIN.replace("'./app/index'", "'@acme/shell'") }, outcome: 'class-not-followed' },
  { name: 'type-only outlet import', files: app((stock) => `import type { CngxToastOutlet } from '@cngx/ui/feedback';\n${stock}`), outcome: 'placed' },
  { name: 'single-line decorator', files: app((stock) => stock.replace(/@Component\(\{[\s\S]*?\}\)/, "@Component({ selector: 'app-root', templateUrl: './app.html' })")), outcome: 'placed' },
  { name: 'single-line decorator, trailing comma', files: app((stock) => stock.replace(/@Component\(\{[\s\S]*?\}\)/, "@Component({ selector: 'app-root', templateUrl: './app.html', })")), outcome: 'placed' },
  { name: 'comment after the last property', files: app((stock) => stock.replace('  imports: [RouterOutlet],\n', '').replace("styleUrl: './app.css'", "styleUrl: './app.css' // styles")), outcome: 'placed' },
  { name: 'comment after a trailing comma', files: app((stock) => stock.replace('  imports: [RouterOutlet],\n', '').replace("styleUrl: './app.css'", "styleUrl: './app.css', // styles")), outcome: 'placed' },
  { name: 'imports with a trailing comma and a comment', files: withImports('  imports: [RouterOutlet, /* routing */],\n'), outcome: 'placed' },
  { name: 'multi-line imports with a comment line', files: withImports('  imports: [\n    RouterOutlet,\n    // more to come\n  ],\n'), outcome: 'placed' },
  { name: 'export default class', files: app((stock) => stock.replace('export class App', 'export default class App')), outcome: 'placed' },
  { name: 'two component decorators', files: app((stock) => stock.replace('export class App', "@Component({ selector: 'app-other', template: '' })\nexport class App")), outcome: 'duplicate-property' },
  { name: 'namespaced decorator', files: app((stock) => stock.replace("import { Component, signal } from '@angular/core';", "import * as core from '@angular/core';\nimport { signal } from '@angular/core';").replace('@Component(', '@core.Component(')), outcome: 'no-component-decorator' },
  { name: 'NgModule spread', files: ngModuleApp('...shared,'), outcome: 'decorator-dynamic' },
  { name: 'empty template file', files: { 'src/app/app.html': '' }, outcome: 'placed' },
  { name: 'whitespace-only template file', files: { 'src/app/app.html': '\n  \n' }, outcome: 'placed' },
  { name: 'template without a final newline', files: { 'src/app/app.html': '<router-outlet />' }, outcome: 'placed' },
  { name: 'nested indented router outlet', files: { 'src/app/app.html': '<main>\n  <div>\n    <router-outlet />\n  </div>\n</main>\n' }, outcome: 'placed' },
  { name: 'router outlet in a control-flow block', files: { 'src/app/app.html': '@if (true) {\n  <router-outlet />\n}\n' }, outcome: 'placed' },
  { name: 'router outlet sharing its line', files: { 'src/app/app.html': '<main><router-outlet></router-outlet></main>\n' }, outcome: 'placed' },
  { name: 'indented template', files: { 'src/app/app.html': '  <main>\n    <router-outlet />\n  </main>\n' }, outcome: 'placed' },
  { name: 'template that does not parse', files: { 'src/app/app.html': '<main>\n  <div>\n</main>\n<router-outlet\n' }, outcome: 'template-parse-error' },
  { name: 'imports with satisfies', files: withImports('  imports: [RouterOutlet] satisfies unknown[],\n'), outcome: 'imports-not-array' },
  { name: 'NgModule with an inline template', files: { ...ngModuleApp(), 'src/app/app.ts': NGMODULE_APP.replace("templateUrl: './app.html'", 'template: `<router-outlet />`') }, outcome: 'placed' },
  {
    name: 'NgModule and component in one file',
    files: {
      'src/main.ts': NGMODULE_MAIN.replace("'./app/app-module'", "'./app/app'"),
      'src/app/app.ts': `${NGMODULE_APP.replace("templateUrl: './app.html'", 'template: `\n    <router-outlet />\n  `')}\n${ngModule().replace(/^[\s\S]*?@NgModule/, "import { NgModule } from '@angular/core';\nimport { BrowserModule } from '@angular/platform-browser';\n\n@NgModule")}`,
    },
    outcome: 'placed',
  },
  { name: 'default import of a default class', files: { 'src/main.ts': readFixture('scaffold-21')['src/main.ts'].replace("import { App } from './app/app';", "import App from './app/app';"), ...app((stock) => stock.replace('export class App', 'export default class App')) }, outcome: 'placed' },
  { name: 'template file with a byte order mark', files: { 'src/app/app.html': '\uFEFF<router-outlet />\n' }, outcome: 'placed' },
  { name: 'templateUrl without ./', files: app((stock) => stock.replace("'./app.html'", "'app.html'")), outcome: 'placed' },
  { name: 'outlet class listed but not imported', files: withImports('  imports: [RouterOutlet, CngxBannerOutlet],\n'), outcome: 'placed' },
  { name: 'outlet class imported but not listed', files: withImports('  imports: [RouterOutlet],\n', "import { CngxBannerOutlet } from '@cngx/ui/feedback';\n"), outcome: 'placed' },
  { name: 'stock spec', fixture: 'scaffold-21', outcome: 'placed' },
  { name: 'provided spec', files: { 'src/app/app.spec.ts': STOCK_SPEC.replace("import { App } from './app';\n", "import { App } from './app';\nimport { provideFeedback, withBanners, withToasts } from '@cngx/ui/feedback';\n").replace('      imports: [App],\n', '      imports: [App],\n      providers: [provideFeedback(withToasts(), withBanners())],\n') }, outcome: 'placed' },
  { name: 'custom spec', files: { 'src/app/app.spec.ts': `${STOCK_SPEC}// mine\n` }, outcome: 'placed' },
  { name: 'absent spec', remove: ['src/app/app.spec.ts'], outcome: 'placed' },
  { name: 'banner outlet already present', files: { 'src/app/app.html': '<cngx-banner-outlet />\n<router-outlet />\n' }, outcome: 'placed' },
  {
    name: 'both outlets already present',
    files: {
      'src/app/app.html': OUTLETS_HTML,
      ...app((stock) => stock.replace('imports: [RouterOutlet]', 'imports: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet]').replace("import { RouterOutlet } from '@angular/router';\n", "import { RouterOutlet } from '@angular/router';\nimport { CngxBannerOutlet, CngxToastOutlet } from '@cngx/ui/feedback';\n")),
    },
    outcome: 'placed',
  },
];

function treeOf(shape: Shape): Tree {
  const tree = createFixtureTree(shape.fixture ?? 'scaffold-21', shape.files ?? {});
  for (const path of shape.remove ?? []) {
    tree.delete(path);
  }
  return tree;
}

async function factsOf(tree: Tree): Promise<ProjectFacts> {
  return detectProject(tree, await readWorkspace(tree));
}

function changed(before: Files, after: Files): readonly string[] {
  return Object.keys(after).filter((path) => before[path] !== after[path]);
}

// Syntax errors and grammar errors (codes below 2000, TS1117 a duplicate
// property among them) of one file; unresolved names are not its concern.
function grammarErrors(path: string, content: string): readonly string[] {
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const options: ts.CompilerOptions = { noLib: true, noResolve: true, types: [], target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };
  const host: ts.CompilerHost = {
    getSourceFile: (name) => (name === path ? source : undefined),
    writeFile: () => undefined,
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => true,
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => '/',
    getNewLine: () => '\n',
    fileExists: (name) => name === path,
    readFile: (name) => (name === path ? content : undefined),
  };
  const program = ts.createProgram([path], options, host);
  return [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)]
    .filter((diagnostic) => diagnostic.code < 2000)
    .map((diagnostic) => `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
}

function templateErrors(content: string): readonly string[] {
  return (parseTemplate(content, 'template.html', { preserveWhitespaces: true }).errors ?? []).map((error) => error.msg);
}

// Node fields holding nested template nodes, control-flow and defer blocks included.
const NESTED = ['children', 'branches', 'groups', 'cases', 'empty', 'placeholder', 'loading', 'error'] as const;

function nested(node: unknown): readonly unknown[] {
  const record = node as Readonly<Record<string, unknown>>;
  return NESTED.flatMap((key) => {
    const value = record[key];
    if (Array.isArray(value)) {
      return value as readonly unknown[];
    }
    return value ? [value] : [];
  });
}

function elementCount(template: string, name: string): number {
  const walk = (nodes: readonly unknown[]): number =>
    nodes.reduce<number>((count, node) => count + (node instanceof TmplAstElement && node.name === name ? 1 : 0) + walk(nested(node)), 0);
  return walk(parseTemplate(template, 'template.html', { preserveWhitespaces: true }).nodes);
}

function classDecoratorObject(source: ts.SourceFile, className: string): ts.ObjectLiteralExpression | undefined {
  const declaration = source.statements.find(
    (statement): statement is ts.ClassDeclaration => ts.isClassDeclaration(statement) && statement.name?.text === className,
  );
  const decorators = declaration === undefined ? [] : (ts.getDecorators(declaration) ?? []);
  const call = decorators.map((decorator) => decorator.expression).find(ts.isCallExpression);
  const [argument] = call?.arguments ?? [];
  return argument !== undefined && ts.isObjectLiteralExpression(argument) ? argument : undefined;
}

function propertyKey(property: ts.ObjectLiteralElementLike): string | undefined {
  const name = property.name;
  return name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : undefined;
}

// The elements of every `imports` property of the host decorator, as text.
function importsOf(content: string, className: string): readonly (readonly string[])[] {
  const source = ts.createSourceFile('host.ts', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const object = classDecoratorObject(source, className);
  return (object?.properties ?? [])
    .filter((property) => propertyKey(property) === 'imports')
    .map((property) =>
      ts.isPropertyAssignment(property) && ts.isArrayLiteralExpression(property.initializer)
        ? property.initializer.elements.map((element) => element.getText(source))
        : [],
    );
}

function importSpecifierCount(content: string, name: string): number {
  const source = ts.createSourceFile('host.ts', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return source.statements
    .filter(ts.isImportDeclaration)
    .flatMap((statement) => {
      const bindings = statement.importClause?.namedBindings;
      return bindings !== undefined && ts.isNamedImports(bindings) ? bindings.elements : [];
    })
    .filter((element) => element.name.text === name).length;
}

function followed(facts: ProjectFacts): AppShell {
  if (facts.appShell.kind !== 'followed') {
    throw new Error(appShellBlockedText(facts.appShell));
  }
  return facts.appShell;
}

function templateText(files: Files, facts: ProjectFacts): string {
  const shell = followed(facts);
  if (shell.template.kind === 'file') {
    return files[shell.template.path];
  }
  const source = ts.createSourceFile('app.ts', files[shell.componentFile], ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const property = classDecoratorObject(source, shell.className)?.properties.find((candidate) => propertyKey(candidate) === 'template');
  if (property === undefined || !ts.isPropertyAssignment(property) || !(ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer))) {
    throw new Error('no inline template');
  }
  return property.initializer.text;
}

// Both outlets in the template and in the host imports, each exactly once,
// and nothing more for the outlets step to plan.
function expectPlacedOnce(files: Files, facts: ProjectFacts, originalImports: readonly string[]): void {
  const shell = followed(facts);
  expect(shell.outlets).toMatchObject({
    kind: 'editable',
    elements: ['cngx-banner-outlet', 'cngx-toast-outlet'],
    classes: ['CngxBannerOutlet', 'CngxToastOutlet'],
  });
  const template = templateText(files, facts);
  expect(elementCount(template, 'cngx-banner-outlet')).toBe(1);
  expect(elementCount(template, 'cngx-toast-outlet')).toBe(1);
  const host = files[shell.importsHost.file];
  const imports = importsOf(host, shell.importsHost.className);
  expect(imports).toHaveLength(1);
  for (const name of ['CngxBannerOutlet', 'CngxToastOutlet']) {
    expect(imports[0].filter((element) => element === name)).toHaveLength(1);
    expect(importSpecifierCount(host, name)).toBe(1);
  }
  expect(imports[0]).toEqual(expect.arrayContaining([...originalImports]));
  for (const explicit of [false, true]) {
    const replan = planAppShell(facts, createAnswers({ feedback: true }), VERSIONS, [OUTLETS_ID], explicit);
    expect(replan.changes.filter((change) => change.id.startsWith('app-shell:'))).toEqual([]);
  }
}

const OUTLET_NAMES = /CngxBannerOutlet|CngxToastOutlet|cngx-banner-outlet|cngx-toast-outlet/g;

// No source or template the run changed gains an outlet element or class.
function expectNoOutletWritten(before: Files, after: Files): void {
  for (const path of changed(before, after).filter((candidate) => /\.(ts|html)$/.test(candidate))) {
    const count = (text: string | undefined) => (text ?? '').match(OUTLET_NAMES)?.length ?? 0;
    expect({ path, outlets: count(after[path]) }).toEqual({ path, outlets: count(before[path]) });
  }
}

function expectCompiles(before: Files, after: Files): void {
  for (const path of changed(before, after)) {
    if (path.endsWith('.ts')) {
      expect({ path, errors: grammarErrors(path, after[path]) }).toEqual({ path, errors: [] });
    }
    if (path.endsWith('.html')) {
      expect({ path, errors: templateErrors(after[path]) }).toEqual({ path, errors: [] });
    }
  }
}

// Whitespace-only lines that end with a newline; the indent before the
// closing backtick of an inline template is not one.
function blankLines(text: string): number {
  return text.split('\n').slice(0, -1).filter((line) => line.trim() === '' && line.replace(/\r$/, '') !== '').length;
}

// The outlets add no whitespace-only line, and an appended toast outlet takes
// the indent of the template's first line.
function expectTidyOutlets(before: string, after: string): void {
  expect(blankLines(after)).toBe(blankLines(before));
  if (!before.includes('<cngx-toast-outlet')) {
    const indent = /^[ \t]*/.exec(after.split('\n').find((line) => line.trim() !== '') ?? '')?.[0] ?? '';
    expect(after.split('\n').find((line) => line.includes('<cngx-toast-outlet />'))).toMatch(new RegExp(`^${indent}<cngx-toast-outlet />`));
  }
}

async function formatted(tree: Tree, paths: readonly string[]): Promise<void> {
  for (const path of paths.filter((candidate) => /\.(ts|html)$/.test(candidate))) {
    const parser = path.endsWith('.html') ? 'angular' : 'typescript';
    tree.overwrite(path, await format(tree.readText(path), { ...PRETTIERRC, parser }));
  }
}

const run = (tree: Tree) => runRule(ngAdd({ feedback: true, yes: true }), tree);

describe('every planned app shell edit', () => {
  it.each(CORPUS.map((shape) => [shape.name, shape] as const))('%s', async (_name, shape) => {
    const tree = treeOf(shape);
    const before = readTree(tree);
    const detected = await factsOf(tree);
    const shellFiles = [
      'src/app/app.ts',
      'src/app/app.html',
      'src/app/app.spec.ts',
      ...Object.keys(shape.files ?? {}),
    ].filter((path) => /\.(ts|html)$/.test(path) && path !== detected.rootProvidersFile && path !== 'src/main.ts');

    const first = await run(tree);
    const after = readTree(first.tree);
    const logs = first.logs.join('\n');

    if (shape.outcome !== 'placed') {
      const shell = detected.appShell;
      const at = shell.kind === 'unfollowed' ? shell : shell.outlets;
      expect(at).toMatchObject({ kind: shell.kind === 'unfollowed' ? 'unfollowed' : 'blocked', reason: shape.outcome });
      if (at.kind !== 'editable') {
        expect(logs).toContain(`${appShellBlockedText(at)}; ${OUTLETS_SNIPPET}`);
      }
      for (const path of shellFiles) {
        expect({ path, content: after[path] }).toEqual({ path, content: before[path] });
      }
      expectNoOutletWritten(before, after);
      return;
    }
    const shell = followed(detected);
    const originalImports = importsOf(before[shell.importsHost.file] ?? '', shell.importsHost.className)[0] ?? [];
    expect(logs).not.toContain(OUTLETS_SNIPPET);
    expectCompiles(before, after);
    const placed = await factsOf(first.tree);
    expectPlacedOnce(after, placed, originalImports);
    expectTidyOutlets(templateText(before, detected), templateText(after, placed));

    const second = await run(first.tree);
    for (const path of shellFiles) {
      expect({ path, content: readTree(second.tree)[path] }).toEqual({ path, content: after[path] });
    }
    // Only `=` (already in place) lines may name the outlets or the spec now.
    const planned = second.logs.filter((line) => /toast and banner outlets|feedback services/.test(line) && !line.startsWith('  = '));
    expect(planned).toEqual([]);

    await formatted(first.tree, changed(before, after));
    const reformatted = readTree(first.tree);
    const third = await run(first.tree);
    const final = readTree(third.tree);
    for (const path of shellFiles) {
      expect({ path, content: final[path] }).toEqual({ path, content: reformatted[path] });
    }
    expectPlacedOnce(final, await factsOf(third.tree), originalImports);
  });
});
