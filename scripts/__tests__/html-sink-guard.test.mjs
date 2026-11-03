// The libraries never hand markup to the DOM as a raw string. Text goes in
// through interpolation or `textContent`, structure through templates.
// A raw HTML sink either skips Angular's sanitiser (the DOM APIs and the
// `bypassSecurityTrust*` calls) or relies on it to strip what a caller passed
// in (an `[innerHTML]` binding), and both turn a library string into a
// markup channel.
//
// H1  TypeScript code (AST): no call of `bypassSecurityTrustHtml`, `Style`,
//     `Script`, `Url` or `ResourceUrl`; no import or re-export of
//     `DomSanitizer` or `SecurityContext` from `@angular/platform-browser` or
//     `@angular/core`; no assignment (`=`, `+=`, `??=`, `||=`, `&&=`) to
//     `.innerHTML` / `.outerHTML` (also `['innerHTML']`); no call of
//     `.insertAdjacentHTML(...)`, `.createContextualFragment(...)`,
//     `setHTMLUnsafe(...)` or `parseHTMLUnsafe(...)`; no `document.write(...)`
//     or `document.writeln(...)` on a receiver named `document`; no
//     `setProperty(x, 'innerHTML' | 'outerHTML' | 'srcdoc', ...)` and no
//     `setAttribute(x, 'innerHTML' | 'srcdoc', ...)` (renderer form) or
//     `el.setAttribute('innerHTML' | 'srcdoc', ...)` with a literal name.
// H2  templates: no `[innerHTML]`, `[outerHTML]`, `[srcdoc]`,
//     `[attr.srcdoc]`, `bind-innerHTML` / `bind-outerHTML` / `bind-srcdoc` or
//     interpolated `innerHTML="{{ ... }}"` binding. Read in inline `template:`
//     strings and `host: { '[innerHTML]': ... }` keys of a decorator, in
//     `@HostBinding('innerHTML')`, and in the `.html` files under
//     `projects/**`. Names match case-insensitively, as Angular maps
//     `innerHtml` to `innerHTML`. HTML comments in a template are skipped.
//
// A site of either rule is allowed only in a file of HTML_SINK_EXEMPT. Exact
// counts (H1 and H2 sites together): a new sink in an exempt file fails, and
// so does a row whose sites are gone or whose count is 0.
//
// Known limits (open bypasses, each needs more than a syntactic read):
// a property name built at runtime (`el['inner' + 'HTML'] = x`, a key held
// in a variable), an aliased element (`const el = x; el.innerHTML` is caught,
// but `Object.assign(el, { innerHTML: x })` and `Reflect.set(el, 'innerHTML',
// x)` are not), a method read off a variable first
// (`const f = el.insertAdjacentHTML; f.call(el, ...)`), `document.write` on an
// injected `DOCUMENT` stored under another name (`this.doc.write(...)`), a
// sanitiser reached without an import of the class (`inject(TOKEN)` that
// resolves to it), `new Function(...)` / `eval`, an `[innerHTML]` built by
// template-literal substitution into an inline template, and a template whose
// binding name is split across an interpolation.
//
// The `.ts` walk is `readSources`, shared with the raw-throw and raw-console
// guards; the `.html` walk applies the same filter (`isLibrarySource`, tooling
// roots skipped). Specs, `projects/testing`, example folders, tooling roots
// and `__test-helpers` folders (spec-only, see
// excluded-path-import-boundary.test.mjs) are out.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';

import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import { lineOf, parse, unwrap } from '../dev-diagnostics.mjs';
import { REPO_ROOT, libOf, readSources } from '../error-codes-manifest.mjs';
import { isLibrarySource, isToolingRoot } from './source-roots.mjs';

/**
 * Files allowed to carry an HTML sink (H1 or H2). Exact counts: a new sink in
 * an exempt file fails, and so does a row whose sites are gone or whose count
 * is 0.
 *
 * @type {{ file: string; count: number; reason: string }[]}
 */
const PAGINATOR_FORMAT_REASON =
  "renders the paginator format output, whose language texts carry `<b>` emphasis; Angular's sanitiser cleans the binding. Removal planned (texts with placeholders, emphasis in the template), then this row goes";

const HTML_SINK_EXEMPT = [
  {
    file: 'projects/ui/paginator/segments/paginator-page-of-pages.component.ts',
    count: 1,
    reason: PAGINATOR_FORMAT_REASON,
  },
  {
    file: 'projects/ui/paginator/segments/paginator-range.component.ts',
    count: 1,
    reason: PAGINATOR_FORMAT_REASON,
  },
  {
    file: 'projects/ui/paginator/segments/paginator-status.component.ts',
    count: 1,
    reason: PAGINATOR_FORMAT_REASON,
  },
];

const TEST_HELPERS = /(^|\/)__test-helpers\//;
const SKIPPED_DIRS = new Set(['node_modules', 'dist', '.angular']);

const BYPASS_CALLS = new Set([
  'bypassSecurityTrustHtml',
  'bypassSecurityTrustStyle',
  'bypassSecurityTrustScript',
  'bypassSecurityTrustUrl',
  'bypassSecurityTrustResourceUrl',
]);
const SANITIZER_MODULES = new Set(['@angular/platform-browser', '@angular/core']);
const SANITIZER_NAMES = new Set(['DomSanitizer', 'SecurityContext']);
const HTML_PROPERTIES = new Set(['innerHTML', 'outerHTML']);
const HTML_CALLS = new Set([
  'insertAdjacentHTML',
  'createContextualFragment',
  'setHTMLUnsafe',
  'parseHTMLUnsafe',
]);
const DOCUMENT_WRITES = new Set(['write', 'writeln']);
const SET_PROPERTY_NAMES = new Set(['innerHTML', 'outerHTML', 'srcdoc']);
const SET_ATTRIBUTE_NAMES = new Set(['innerhtml', 'srcdoc']);
const ASSIGNMENTS = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
]);

/** `[innerHTML]`, `[attr.srcdoc]`, `bind-innerHTML`, `innerHTML="{{ x }}"`. */
const TEMPLATE_SINK =
  /\[\s*(innerHTML|outerHTML|srcdoc|attr\.srcdoc)\s*\]|\bbind-(innerHTML|outerHTML|srcdoc|attr\.srcdoc)\b|(?<![\w.[-])(innerHTML|outerHTML|srcdoc)\s*=\s*(["'])[^"']*\{\{/gi;
/** A `host` metadata key or `@HostBinding` name that binds a sink. */
const HOST_SINK = /^\[?\s*(innerHTML|outerHTML|srcdoc|attr\.srcdoc)\s*\]?$/i;

/** The member name a callee or access reads: `a.b` and `a['b']` give `b`. */
const memberName = (expr) => {
  const node = unwrap(expr);
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text;
  }
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
    return node.argumentExpression.text;
  }
  return null;
};

/** The receiver of a member access, else null. */
const receiverOf = (expr) => {
  const node = unwrap(expr);
  return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)
    ? unwrap(node.expression)
    : null;
};

/** Is the receiver `document` or `x.document`? */
const isDocument = (node) =>
  node !== null &&
  ((ts.isIdentifier(node) && node.text === 'document') ||
    (ts.isPropertyAccessExpression(node) && node.name.text === 'document'));

const literalArg = (call, index) => {
  const arg = call.arguments[index];
  return arg && ts.isStringLiteralLike(arg) ? arg.text : null;
};

/** Why a call is an H1 sink, or null. */
function callSink(node) {
  const callee = unwrap(node.expression);
  const name = ts.isIdentifier(callee) ? callee.text : memberName(callee);
  if (name === null) {
    return null;
  }
  if (BYPASS_CALLS.has(name)) {
    return `${name}(...) skips the sanitiser`;
  }
  if (HTML_CALLS.has(name)) {
    return `${name}(...) parses a string as markup`;
  }
  if (DOCUMENT_WRITES.has(name) && isDocument(receiverOf(callee))) {
    return `document.${name}(...) writes raw markup`;
  }
  if (name === 'setProperty' && SET_PROPERTY_NAMES.has(literalArg(node, 1))) {
    return `setProperty(..., '${literalArg(node, 1)}') writes raw markup`;
  }
  if (name === 'setAttribute') {
    const attr = literalArg(node, node.arguments.length >= 3 ? 1 : 0);
    if (attr !== null && SET_ATTRIBUTE_NAMES.has(attr.toLowerCase())) {
      return `setAttribute(..., '${attr}') writes raw markup`;
    }
  }
  return null;
}

/** Why an import or re-export pulls in the sanitiser, else null. */
function sanitizerImport(node) {
  const module = node.moduleSpecifier;
  if (!module || !ts.isStringLiteral(module) || !SANITIZER_MODULES.has(module.text)) {
    return null;
  }
  const elements = ts.isImportDeclaration(node)
    ? node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)
      ? node.importClause.namedBindings.elements
      : []
    : node.exportClause && ts.isNamedExports(node.exportClause)
      ? node.exportClause.elements
      : [];
  const hit = elements.find((el) => SANITIZER_NAMES.has((el.propertyName ?? el.name).text));
  return hit ? `${(hit.propertyName ?? hit.name).text} is imported from ${module.text}` : null;
}

/** Offset and text of each template sink binding in `text`, HTML comments blanked. */
export function templateSinkOffsets(text) {
  const plain = text.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));
  return [...plain.matchAll(TEMPLATE_SINK)].map((m) => ({
    offset: m.index,
    binding: m[0].replace(/\s+/g, ' '),
  }));
}

const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;

/** Is `node` the object literal handed to `@Component(...)` / `@Directive(...)`? */
const isDecoratorMetadata = (node) =>
  ts.isObjectLiteralExpression(node) &&
  ts.isCallExpression(node.parent) &&
  ts.isDecorator(node.parent.parent);

const propertyKey = (prop) =>
  prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteralLike(prop.name))
    ? prop.name.text
    : null;

/** Every H1 and H2 site in one `.ts` file, as `{ line, rule, what }`. */
export function codeSinks(path, text) {
  const sf = parse(path, text);
  const out = [];
  const add = (node, rule, what) => out.push({ line: lineOf(sf, node), rule, what });
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const why = callSink(node);
      if (why) {
        add(node, 'H1', why);
      }
    }
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const why = sanitizerImport(node);
      if (why) {
        add(node, 'H1', why);
      }
    }
    if (
      ts.isBinaryExpression(node) &&
      ASSIGNMENTS.has(node.operatorToken.kind) &&
      HTML_PROPERTIES.has(memberName(node.left))
    ) {
      add(node, 'H1', `assignment to .${memberName(node.left)}`);
    }
    if (isDecoratorMetadata(node)) {
      for (const prop of node.properties) {
        const key = ts.isPropertyAssignment(prop) ? propertyKey(prop) : null;
        if (key === 'template' && ts.isStringLiteralLike(prop.initializer)) {
          const start = prop.initializer.getStart(sf) + 1;
          const base = sf.getLineAndCharacterOfPosition(start).line;
          for (const { offset, binding } of templateSinkOffsets(prop.initializer.text)) {
            const line = base + lineAt(prop.initializer.text, offset);
            out.push({ line, rule: 'H2', what: `template binding ${binding}` });
          }
        }
        if (key === 'host' && ts.isObjectLiteralExpression(prop.initializer)) {
          for (const hostProp of prop.initializer.properties) {
            const hostKey = propertyKey(hostProp);
            if (hostKey && hostKey.startsWith('[') && HOST_SINK.test(hostKey)) {
              add(hostProp, 'H2', `host binding ${hostKey}`);
            }
          }
        }
      }
    }
    if (
      ts.isDecorator(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'HostBinding' &&
      HOST_SINK.test(literalArg(node.expression, 0) ?? '')
    ) {
      add(node, 'H2', `@HostBinding('${literalArg(node.expression, 0)}')`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/** Every H2 site in one `.html` template file. */
export function htmlSinks(text) {
  return templateSinkOffsets(text).map(({ offset, binding }) => ({
    line: lineAt(text, offset),
    rule: 'H2',
    what: `template binding ${binding}`,
  }));
}

/** The guarded file set: library sources minus spec-only `__test-helpers`. */
const isGuarded = (path) => isLibrarySource(path) && !TEST_HELPERS.test(path);

/**
 * Runs H1 and H2 over `files` ([{ path, text }], `.ts` and `.html`).
 * `counts` holds the sites per file, `sites` lists each one as
 * `file:line rule what`.
 *
 * @returns {{ counts: Map<string, number>; sites: string[] }}
 */
export function checkSources(allFiles) {
  const counts = new Map();
  const sites = [];
  for (const { path, text } of allFiles.filter(({ path }) => isGuarded(path))) {
    const found = path.endsWith('.html') ? htmlSinks(text) : codeSinks(path, text);
    if (found.length > 0) {
      counts.set(path, found.length);
    }
    sites.push(...found.map(({ line, rule, what }) => `${path}:${line} ${rule} ${what}`));
  }
  return { counts, sites };
}

/** The `.html` templates under `projects/`, with the `readSources` exclusions. */
export function readTemplates(root = REPO_ROOT) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (SKIPPED_DIRS.has(name)) {
        continue;
      }
      const abs = join(dir, name);
      const rel = relative(root, abs).split(sep).join('/');
      if (isToolingRoot(rel)) {
        continue;
      }
      if (statSync(abs).isDirectory()) {
        walk(abs);
      } else if (name.endsWith('.html') && isLibrarySource(rel)) {
        out.push({ path: rel, text: readFileSync(abs, 'utf8') });
      }
    }
  };
  walk(resolve(root, 'projects'));
  return out;
}

/** The sink sites grouped per lib, for the failure message. */
export function groupPerLib(sites) {
  const out = {};
  for (const site of [...sites].sort()) {
    (out[libOf(site.slice(0, site.indexOf(':')))] ??= []).push(site);
  }
  return out;
}

/** Exemption rows that do not match `counts` exactly, carry no reason, or exempt nothing. */
export function exemptionProblems(counts, exempt = HTML_SINK_EXEMPT) {
  const out = [];
  for (const row of exempt) {
    if (!row.reason?.trim()) {
      out.push(`${row.file}: exemption without a reason`);
    }
    if (row.count === 0) {
      out.push(`${row.file}: exemption with no sink`);
    }
    const actual = counts.get(row.file) ?? 0;
    if (actual !== row.count) {
      out.push(`${row.file}: source ${actual}, exemption ${row.count}`);
    }
  }
  return out;
}

const fixture = (text, path = 'projects/common/a.ts') => checkSources([{ path, text }]);
const sitesOf = (text, path) => fixture(text, path).sites;

describe('html-sink guard - H1 DOM and sanitiser sinks', () => {
  it('fails assignments to innerHTML and outerHTML, also compound and by literal key', () => {
    expect(
      sitesOf(
        [
          'function f(el: HTMLElement, x: string) {',
          '  el.innerHTML = x;',
          '  el.innerHTML += x;',
          '  el.outerHTML = x;',
          "  el['innerHTML'] = x;",
          '  this.host.nativeElement.innerHTML ??= x;',
          '}',
        ].join('\n'),
      ),
    ).toEqual([
      'projects/common/a.ts:2 H1 assignment to .innerHTML',
      'projects/common/a.ts:3 H1 assignment to .innerHTML',
      'projects/common/a.ts:4 H1 assignment to .outerHTML',
      'projects/common/a.ts:5 H1 assignment to .innerHTML',
      'projects/common/a.ts:6 H1 assignment to .innerHTML',
    ]);
  });

  it('passes reads of innerHTML, textContent writes, comments and strings', () => {
    expect(
      sitesOf(
        [
          '// el.innerHTML = x;',
          'const s = \'el.innerHTML = x; [innerHTML]="x"\';',
          'function f(el: HTMLElement, x: string) {',
          '  const html = el.innerHTML;',
          '  el.textContent = x;',
          '  return html === el.outerHTML;',
          '}',
        ].join('\n'),
      ),
    ).toEqual([]);
  });

  it('fails the markup-parsing DOM calls and document.write', () => {
    expect(
      sitesOf(
        [
          "el.insertAdjacentHTML('beforeend', x);",
          'range.createContextualFragment(x);',
          'el.setHTMLUnsafe(x);',
          'Document.parseHTMLUnsafe(x);',
          'document.write(x);',
          'window.document.writeln(x);',
          'stream.write(x);',
        ].join('\n'),
      ),
    ).toEqual([
      'projects/common/a.ts:1 H1 insertAdjacentHTML(...) parses a string as markup',
      'projects/common/a.ts:2 H1 createContextualFragment(...) parses a string as markup',
      'projects/common/a.ts:3 H1 setHTMLUnsafe(...) parses a string as markup',
      'projects/common/a.ts:4 H1 parseHTMLUnsafe(...) parses a string as markup',
      'projects/common/a.ts:5 H1 document.write(...) writes raw markup',
      'projects/common/a.ts:6 H1 document.writeln(...) writes raw markup',
    ]);
  });

  it('fails every bypassSecurityTrust call and a sanitiser import or re-export', () => {
    expect(
      sitesOf(
        [
          "import { DomSanitizer } from '@angular/platform-browser';",
          "import { SecurityContext as Ctx, inject } from '@angular/core';",
          "export { DomSanitizer } from '@angular/platform-browser';",
          'const a = s.bypassSecurityTrustHtml(x);',
          'const b = s.bypassSecurityTrustStyle(x);',
          'const c = s.bypassSecurityTrustScript(x);',
          'const d = s.bypassSecurityTrustUrl(x);',
          "const e = s['bypassSecurityTrustResourceUrl'](x);",
        ].join('\n'),
      ),
    ).toEqual([
      'projects/common/a.ts:1 H1 DomSanitizer is imported from @angular/platform-browser',
      'projects/common/a.ts:2 H1 SecurityContext is imported from @angular/core',
      'projects/common/a.ts:3 H1 DomSanitizer is imported from @angular/platform-browser',
      'projects/common/a.ts:4 H1 bypassSecurityTrustHtml(...) skips the sanitiser',
      'projects/common/a.ts:5 H1 bypassSecurityTrustStyle(...) skips the sanitiser',
      'projects/common/a.ts:6 H1 bypassSecurityTrustScript(...) skips the sanitiser',
      'projects/common/a.ts:7 H1 bypassSecurityTrustUrl(...) skips the sanitiser',
      'projects/common/a.ts:8 H1 bypassSecurityTrustResourceUrl(...) skips the sanitiser',
    ]);
  });

  it('passes other imports from the Angular packages and a DomSanitizer from elsewhere', () => {
    expect(
      sitesOf(
        [
          "import { Component, inject } from '@angular/core';",
          "import { DomSanitizer } from './local';",
          "import type { Title } from '@angular/platform-browser';",
        ].join('\n'),
      ),
    ).toEqual([]);
  });

  it('fails renderer and element writes of a markup property or attribute by literal name', () => {
    expect(
      sitesOf(
        [
          "renderer.setProperty(el, 'innerHTML', x);",
          "renderer.setProperty(el, 'outerHTML', x);",
          "renderer.setProperty(frame, 'srcdoc', x);",
          "renderer.setAttribute(frame, 'srcdoc', x);",
          "renderer.setAttribute(el, 'innerHTML', x);",
          "frame.setAttribute('srcdoc', x);",
          "renderer.setProperty(el, 'textContent', x);",
          "renderer.setAttribute(el, 'title', 'srcdoc');",
          "el.setAttribute('aria-label', x);",
        ].join('\n'),
      ),
    ).toEqual([
      "projects/common/a.ts:1 H1 setProperty(..., 'innerHTML') writes raw markup",
      "projects/common/a.ts:2 H1 setProperty(..., 'outerHTML') writes raw markup",
      "projects/common/a.ts:3 H1 setProperty(..., 'srcdoc') writes raw markup",
      "projects/common/a.ts:4 H1 setAttribute(..., 'srcdoc') writes raw markup",
      "projects/common/a.ts:5 H1 setAttribute(..., 'innerHTML') writes raw markup",
      "projects/common/a.ts:6 H1 setAttribute(..., 'srcdoc') writes raw markup",
    ]);
  });

  it('documents the open bypasses: computed keys and Object.assign pass', () => {
    expect(
      sitesOf(
        ["el['inner' + 'HTML'] = x;", 'el[key] = x;', 'Object.assign(el, { innerHTML: x });'].join(
          '\n',
        ),
      ),
    ).toEqual([]);
  });
});

describe('html-sink guard - H2 template bindings', () => {
  const component = (template, extra = '') =>
    [
      "import { Component } from '@angular/core';",
      '@Component({',
      "  selector: 'cngx-a',",
      `  template: \`${template}\`,`,
      extra,
      '})',
      'export class A {}',
    ].join('\n');

  it('fails each sink binding form in an inline template, at its own line', () => {
    expect(
      sitesOf(
        component(
          [
            '<span [innerHTML]="a()"></span>',
            '<span [outerHTML]="a()"></span>',
            '<iframe [srcdoc]="a()"></iframe>',
            '<iframe [attr.srcdoc]="a()"></iframe>',
            '<span bind-innerHTML="a()"></span>',
            '<span [innerHtml]="a()"></span>',
            '<span innerHTML="{{ a() }}"></span>',
          ].join('\n'),
        ),
      ),
    ).toEqual([
      'projects/common/a.ts:4 H2 template binding [innerHTML]',
      'projects/common/a.ts:5 H2 template binding [outerHTML]',
      'projects/common/a.ts:6 H2 template binding [srcdoc]',
      'projects/common/a.ts:7 H2 template binding [attr.srcdoc]',
      'projects/common/a.ts:8 H2 template binding bind-innerHTML',
      'projects/common/a.ts:9 H2 template binding [innerHtml]',
      'projects/common/a.ts:10 H2 template binding innerHTML="{{',
    ]);
  });

  it('passes text bindings, a static innerHTML attribute, comments and lookalike names', () => {
    expect(
      sitesOf(
        component(
          [
            '<span [textContent]="a()">{{ a() }}</span>',
            '<span innerHTML="static"></span>',
            '<!-- <span [innerHTML]="a()"></span> -->',
            '<span [cngxInnerHTML]="a()" [data-innerHTML]="b"></span>',
          ].join('\n'),
        ),
      ),
    ).toEqual([]);
  });

  it('fails a host metadata key and a HostBinding decorator', () => {
    expect(
      sitesOf(
        [
          "import { Directive, HostBinding } from '@angular/core';",
          "@Directive({ selector: '[a]', host: { '[innerHTML]': 'x()', '[class.on]': 'on()' } })",
          'export class A {',
          "  @HostBinding('innerHTML') html = '';",
          "  @HostBinding('attr.srcdoc') doc = '';",
          "  @HostBinding('title') title = '';",
          '}',
        ].join('\n'),
      ),
    ).toEqual([
      'projects/common/a.ts:2 H2 host binding [innerHTML]',
      "projects/common/a.ts:4 H2 @HostBinding('innerHTML')",
      "projects/common/a.ts:5 H2 @HostBinding('attr.srcdoc')",
    ]);
  });

  it('reads .html templates with their own line numbers', () => {
    expect(
      sitesOf(
        ['<div>', '  <span [innerHTML]="a"></span>', '  <span [title]="a"></span>', '</div>'].join(
          '\n',
        ),
        'projects/ui/x/x.component.html',
      ),
    ).toEqual(['projects/ui/x/x.component.html:2 H2 template binding [innerHTML]']);
  });

  it('ignores specs, projects/testing, examples and __test-helpers', () => {
    for (const path of [
      'projects/common/a.spec.ts',
      'projects/testing/a.ts',
      'projects/ui/tabs/examples/demo.ts',
      'projects/forms/select/shared/__test-helpers/host.ts',
    ]) {
      expect(sitesOf('el.innerHTML = x;', path), path).toEqual([]);
    }
  });
});

describe('html-sink guard - exemptions', () => {
  const counts = new Map([['projects/ui/x.ts', 2]]);
  const row = (file, count, reason = 'why') => ({ file, count, reason });

  it('passes an exact row with a reason', () => {
    expect(exemptionProblems(counts, [row('projects/ui/x.ts', 2)])).toEqual([]);
  });

  it('fails a new site in an exempt file, a stale row, a zero row and a reasonless row', () => {
    expect(exemptionProblems(counts, [row('projects/ui/x.ts', 1)])).toEqual([
      'projects/ui/x.ts: source 2, exemption 1',
    ]);
    expect(exemptionProblems(counts, [row('projects/ui/gone.ts', 1)])).toEqual([
      'projects/ui/gone.ts: source 0, exemption 1',
    ]);
    expect(exemptionProblems(counts, [row('projects/ui/y.ts', 0)])).toEqual([
      'projects/ui/y.ts: exemption with no sink',
    ]);
    expect(exemptionProblems(counts, [row('projects/ui/x.ts', 2, ' ')])).toEqual([
      'projects/ui/x.ts: exemption without a reason',
    ]);
  });
});

describe('html-sink guard - projects/**', () => {
  let result;
  let templates;
  let elapsed;
  beforeAll(() => {
    const started = performance.now();
    templates = readTemplates();
    result = checkSources([...readSources(), ...templates]);
    elapsed = performance.now() - started;
  });

  it('runs in under 5 s', () => {
    expect(elapsed).toBeLessThan(5000);
  });

  it('reads the .html component templates', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it('matches the exemptions exactly, each with a reason', () => {
    expect(exemptionProblems(result.counts)).toEqual([]);
  });

  it('has no HTML sink outside the exemptions', () => {
    const exempt = new Set(HTML_SINK_EXEMPT.map((e) => e.file));
    const outside = result.sites.filter((site) => !exempt.has(site.slice(0, site.indexOf(':'))));
    expect(
      outside,
      `Raw HTML sinks found; render text through interpolation or textContent and structure through the template. Per lib:\n${JSON.stringify(groupPerLib(outside), null, 2)}`,
    ).toEqual([]);
  });
});
