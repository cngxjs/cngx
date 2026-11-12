import { readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, walkSources } from './_i18n-ast.mjs';

/**
 * Repo-wide static guard pinning `@slot` JSDoc lines to the template slots a
 * host actually reads.
 *
 * A template slot is an `@Directive` whose selector contains
 * `ng-template[<attr>]`. A host is any `@Component` / `@Directive` class whose
 * body calls `contentChild(Slot)`, `contentChild.required(Slot)` or
 * `contentChildren(Slot)` with a slot class as the first argument. compodocx
 * renders the host page's Slots section from `@slot <attr> <text>` tags on the
 * host's class JSDoc, so a slot the host queries without a tag is invisible to
 * the consumer browsing that page, and a tag without a query advertises a
 * region that does nothing.
 *
 * Asserted, in both directions:
 *   - every queried slot attr has a `@slot <attr>` tag on the host, unless the
 *     host-attr pair is listed in {@link EXEMPT};
 *   - every `@slot <attr>` tag names an attr the host queries, itself or
 *     through a directive it lists in `hostDirectives` (bare identifier or
 *     `{ directive: X }`, resolved transitively): the slot is projected into
 *     the host, so its page documents it;
 *   - {@link EXEMPT} is empty: no host queries a slot it does not render. A
 *     future row must still be a real query without a `@slot` tag (rendering
 *     the slot means deleting its row);
 *   - the scan found more than 100 slot directives and more than 200 host-slot
 *     pairs, so a scan that silently finds nothing fails;
 *   - every slot directive is reachable from a `public-api.ts` barrel, through
 *     `export * from` chains or a named `export { X }`: a slot directive a
 *     consumer cannot import never matches in a consumer template, so the host
 *     renders its default. {@link UNEXPORTED_EXEMPT} is exact and empty.
 *
 * Marker slots (attribute directives on projected content: `cngxButtonStart`,
 * the card and tag slots) carry no `@slot` tag; the tag names `ng-template`
 * slots only.
 *
 * Scanned: `projects/**` `.ts`, minus `*.spec.ts` and the directories
 * `walkSources` skips. Queries are resolved on the TypeScript AST, so generic
 * and multi-line calls resolve and a `contentChild(X)` mention in a comment or
 * JSDoc example never counts.
 *
 * The exemption list is shrink-only. A new entry is a scope decision, not a
 * silent addition.
 */

/**
 * Queried but unrendered host-slot pairs. Exact, shrink-only; empty since the
 * select hosts stopped querying the slots they never render.
 * Row shape: `{ host, attr, reason, source }`.
 */
export const EXEMPT = [];

/**
 * Slot directives no `public-api.ts` barrel reaches. Exact, shrink-only, empty.
 * Row shape: `{ file, slot, reason }`, keyed `<file> <slot>` like the scan.
 */
export const UNEXPORTED_EXEMPT = [];

const QUERY_FNS = new Set(['contentChild', 'contentChildren']);
const SLOT_SELECTOR = /ng-template\[([\w-]+)\]/g;

/** @param {ts.ClassDeclaration} node */
function decoratorOf(node, names) {
  for (const decorator of ts.getDecorators(node) ?? []) {
    const call = decorator.expression;
    if (
      ts.isCallExpression(call) &&
      ts.isIdentifier(call.expression) &&
      names.has(call.expression.text)
    ) {
      return { name: call.expression.text, call };
    }
  }
  return undefined;
}

/** @param {ts.CallExpression} call */
function selectorOf(call) {
  const meta = call.arguments[0];
  if (!meta || !ts.isObjectLiteralExpression(meta)) {
    return undefined;
  }
  for (const prop of meta.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === 'selector' &&
      (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer))
    ) {
      return prop.initializer.text;
    }
  }
  return undefined;
}

/**
 * Class names a decorator lists in `hostDirectives`: `X` or `{ directive: X }`.
 *
 * @param {ts.CallExpression} call
 */
function hostDirectivesOf(call) {
  const meta = call.arguments[0];
  if (!meta || !ts.isObjectLiteralExpression(meta)) {
    return [];
  }
  const prop = meta.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'hostDirectives',
  );
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) {
    return [];
  }
  const names = [];
  for (const element of prop.initializer.elements) {
    if (ts.isIdentifier(element)) {
      names.push(element.text);
      continue;
    }
    if (!ts.isObjectLiteralExpression(element)) {
      continue;
    }
    const directive = element.properties.find(
      (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'directive',
    );
    if (directive && ts.isIdentifier(directive.initializer)) {
      names.push(directive.initializer.text);
    }
  }
  return names;
}

/**
 * `contentChild(...)`, `contentChildren(...)` or `contentChild.required(...)`.
 *
 * @param {ts.CallExpression} call
 */
function isSlotQueryCall(call) {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) {
    return QUERY_FNS.has(callee.text);
  }
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'contentChild' &&
    callee.name.text === 'required'
  );
}

/**
 * The class identifier of a query argument. An instantiation expression
 * (`contentChild(Slot<A, B>)`) carries the host's generics into the slot type
 * and still names the slot class.
 *
 * @param {ts.Expression | undefined} arg
 */
function slotClassArgument(arg) {
  let current = arg;
  while (
    current &&
    (ts.isExpressionWithTypeArguments(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

/** @param {ts.ClassDeclaration} node */
function slotTagsOf(node) {
  const attrs = [];
  for (const tag of ts.getJSDocTags(node)) {
    if (tag.tagName.text !== 'slot') {
      continue;
    }
    const text = ts.getTextOfJSDocComment(tag.comment) ?? '';
    const attr = /^\s*([\w-]+)/.exec(text)?.[1];
    if (attr) {
      attrs.push(attr);
    }
  }
  return attrs;
}

const isSpec = (path) => /\.spec\.ts$/.test(path);
const pairKey = (host, attr) => `${host}::${attr}`;

/**
 * Pure scan over source texts.
 *
 * @param {{ path: string, text: string }[]} files
 * @param {{ exempt?: { host: string, attr: string }[] }} [options]
 */
export function scanSlotCoverage(files, { exempt = EXEMPT } = {}) {
  const parsed = files
    .filter((file) => !isSpec(file.path))
    .map((file) => ({
      path: file.path,
      sf: ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
    }));

  /** className -> attrs */
  const slotDirectives = new Map();
  /** className -> declaring file */
  const slotDirectiveFiles = new Map();
  /** @type {{ path: string, node: ts.ClassDeclaration, hostDirectives: string[] }[]} */
  const hosts = [];

  for (const { path, sf } of parsed) {
    const visit = (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const decorator = decoratorOf(node, new Set(['Component', 'Directive']));
        if (decorator) {
          hosts.push({ path, node, hostDirectives: hostDirectivesOf(decorator.call) });
          const selector = decorator.name === 'Directive' ? selectorOf(decorator.call) : undefined;
          const attrs = selector ? [...selector.matchAll(SLOT_SELECTOR)].map((m) => m[1]) : [];
          if (attrs.length > 0) {
            slotDirectives.set(node.name.text, attrs);
            slotDirectiveFiles.set(node.name.text, path);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  const exemptKeys = new Set(exempt.map((row) => pairKey(row.host, row.attr)));
  const pairs = [];
  const documented = [];
  const missing = [];
  const stale = [];
  const exempted = [];
  const exemptWithSlot = [];

  /** className -> attrs the class queries itself */
  const ownQueries = new Map();
  for (const { node } of hosts) {
    const queried = new Set();
    const visit = (child) => {
      if (ts.isCallExpression(child) && isSlotQueryCall(child)) {
        const first = slotClassArgument(child.arguments[0]);
        if (first && ts.isIdentifier(first) && slotDirectives.has(first.text)) {
          slotDirectives.get(first.text).forEach((attr) => queried.add(attr));
        }
      }
      ts.forEachChild(child, visit);
    };
    node.members.forEach(visit);
    ownQueries.set(node.name.text, queried);
  }
  const hostDirectivesByClass = new Map(hosts.map((h) => [h.node.name.text, h.hostDirectives]));
  /** Attrs the listed host directives query, transitively. */
  const viaHostDirectives = (name, seen = new Set()) => {
    const attrs = new Set();
    for (const directive of hostDirectivesByClass.get(name) ?? []) {
      if (seen.has(directive)) {
        continue;
      }
      seen.add(directive);
      (ownQueries.get(directive) ?? new Set()).forEach((attr) => attrs.add(attr));
      viaHostDirectives(directive, seen).forEach((attr) => attrs.add(attr));
    }
    return attrs;
  };

  for (const { path, node } of hosts) {
    const host = node.name.text;
    const queried = ownQueries.get(host);
    const inherited = viaHostDirectives(host);

    const tags = new Set(slotTagsOf(node));
    for (const attr of queried) {
      const entry = { path, host, attr };
      pairs.push(entry);
      const isExempt = exemptKeys.has(pairKey(host, attr));
      if (isExempt && tags.has(attr)) {
        exemptWithSlot.push(entry);
      } else if (isExempt) {
        exempted.push(entry);
      } else if (tags.has(attr)) {
        documented.push(entry);
      } else {
        missing.push(entry);
      }
    }
    for (const attr of tags) {
      if (!queried.has(attr) && !inherited.has(attr)) {
        stale.push({ path, host, attr });
      }
    }
  }

  const pairKeys = new Set(pairs.map((p) => pairKey(p.host, p.attr)));
  const exemptNotQueried = exempt.filter((row) => !pairKeys.has(pairKey(row.host, row.attr)));

  return {
    slotDirectives,
    slotDirectiveFiles,
    pairs,
    documented,
    missing,
    stale,
    exempted,
    exemptWithSlot,
    exemptNotQueried,
  };
}

const BARREL = /(^|\/)public-api\.ts$/;

/**
 * What the `public-api.ts` barrels expose, as `<file>::*` (every export of the
 * file, reached through an `export * from` chain) and `<file>::<name>` (one
 * name, reached through `export { X } from` or a local `export { X }` of an
 * imported binding). A relative specifier resolves to `x.ts`, `x/index.ts` or
 * `x/public-api.ts`. A named re-export is followed to the module it names, so a
 * same-named export elsewhere never reaches a slot directive.
 *
 * @param {{ path: string, text: string }[]} files
 */
export function barrelReach(files) {
  const byPath = new Map(files.map((file) => [file.path, file.text]));
  const resolveSpecifier = (from, specifier) => {
    if (!ts.isStringLiteral(specifier) || !specifier.text.startsWith('.')) {
      return undefined;
    }
    const base = posix.join(posix.dirname(from), specifier.text);
    return [`${base}.ts`, `${base}/index.ts`, `${base}/public-api.ts`].find((c) => byPath.has(c));
  };
  const reached = new Set();
  /** @type {{ path: string, name: string | null }[]} */
  const queue = files
    .filter((file) => BARREL.test(file.path))
    .map((file) => ({ path: file.path, name: null }));
  const push = (path, name) => {
    if (path) {
      queue.push({ path, name });
    }
  };
  while (queue.length > 0) {
    const { path, name } = queue.pop();
    const key = `${path}::${name ?? '*'}`;
    if (reached.has(key)) {
      continue;
    }
    reached.add(key);
    const sf = ts.createSourceFile(path, byPath.get(path), ts.ScriptTarget.Latest, true);
    /** local name -> { path, name } of the import it binds */
    const imports = new Map();
    for (const statement of sf.statements) {
      const bindings = ts.isImportDeclaration(statement)
        ? statement.importClause?.namedBindings
        : undefined;
      if (!bindings || !ts.isNamedImports(bindings)) {
        continue;
      }
      const target = resolveSpecifier(path, statement.moduleSpecifier);
      bindings.elements.forEach((el) =>
        imports.set(el.name.text, { path: target, name: (el.propertyName ?? el.name).text }),
      );
    }
    for (const statement of sf.statements) {
      if (!ts.isExportDeclaration(statement)) {
        continue;
      }
      const clause = statement.exportClause;
      const target = statement.moduleSpecifier
        ? resolveSpecifier(path, statement.moduleSpecifier)
        : undefined;
      if (!clause) {
        push(target, name);
        continue;
      }
      if (!ts.isNamedExports(clause)) {
        continue;
      }
      for (const el of clause.elements) {
        if (name !== null && el.name.text !== name) {
          continue;
        }
        const local = (el.propertyName ?? el.name).text;
        if (statement.moduleSpecifier) {
          push(target, local);
          continue;
        }
        const imported = imports.get(local);
        push(imported?.path, imported?.name);
      }
    }
  }
  return reached;
}

/**
 * Slot directives whose declaring file is neither reached whole nor reached
 * for their own name, as `<file> <class>` keys.
 *
 * @param {Map<string, string>} slotDirectiveFiles className -> file
 * @param {Set<string>} reached output of {@link barrelReach}
 */
export function unreachableSlotDirectives(slotDirectiveFiles, reached) {
  return [...slotDirectiveFiles]
    .filter(([slot, path]) => !reached.has(`${path}::*`) && !reached.has(`${path}::${slot}`))
    .map(([slot, path]) => `${path} ${slot}`)
    .sort();
}

const describePair = (p) => `${p.path} ${p.host}: ${p.attr}`;

describe('slot JSDoc coverage (repo)', () => {
  const files = walkSources('projects', /\.ts$/)
    .filter((path) => !isSpec(path))
    .map((path) => ({ path, text: readFileSync(resolve(REPO_ROOT, path), 'utf8') }));
  const result = scanSlotCoverage(files);

  it('finds the slot directives and host-slot pairs', () => {
    expect(result.slotDirectives.size).toBeGreaterThan(100);
    expect(result.pairs.length).toBeGreaterThan(200);
  });

  it('documents every queried slot with a @slot line on its host', () => {
    expect(
      result.missing.map(describePair),
      'add `@slot <attr> <what it replaces>` to the host class JSDoc',
    ).toEqual([]);
  });

  it('lists only slots the host queries under @slot', () => {
    expect(
      result.stale.map(describePair),
      'remove the @slot line or query the slot directive on the host',
    ).toEqual([]);
  });

  it('keeps the exemption list empty', () => {
    expect(EXEMPT).toHaveLength(0);
  });

  it('exports every slot directive from a public-api barrel', () => {
    const unreachable = unreachableSlotDirectives(result.slotDirectiveFiles, barrelReach(files));
    expect(
      unreachable,
      'a slot directive no public-api.ts reaches cannot be imported, so it never matches in a consumer template; export it from its entry barrel',
    ).toEqual(UNEXPORTED_EXEMPT.map((row) => `${row.file} ${row.slot}`).sort());
  });

  it('keeps the barrel exemption list empty and every row reasoned', () => {
    expect(UNEXPORTED_EXEMPT).toHaveLength(0);
    expect(UNEXPORTED_EXEMPT.filter((row) => !row.reason || row.reason.trim() === '')).toEqual([]);
  });

  it('matches every exemption row to a real query without a @slot line', () => {
    expect(
      result.exemptNotQueried.map((row) => `${row.host}: ${row.attr}`),
      'the host no longer queries this slot; delete the exemption row',
    ).toEqual([]);
    expect(
      result.exemptWithSlot.map(describePair),
      'the slot is documented now; delete its exemption row',
    ).toEqual([]);
    expect(result.exempted).toHaveLength(EXEMPT.length);
  });
});

describe('slot JSDoc coverage (scanner fixtures)', () => {
  const slotFile = {
    path: 'projects/x/slots.ts',
    text: `
      @Directive({ selector: 'ng-template[cngxFoo]' })
      export class CngxFoo<T> {}
      @Directive({ selector: 'ng-template[cngxBar], ng-template[cngxBarAlt]' })
      export class CngxBar {}
    `,
  };
  const host = (body, jsdoc = '') => ({
    path: 'projects/x/host.component.ts',
    text: `
      /**
       * Host.
       ${jsdoc}
       */
      @Component({ selector: 'cngx-host', template: '' })
      export class CngxHost<T> {
        ${body}
      }
    `,
  });
  const scan = (hostFile, exempt = []) => scanSlotCoverage([slotFile, hostFile], { exempt });
  const attrs = (list) => list.map((p) => `${p.host}:${p.attr}`);

  it('collects slot directives including comma-separated selectors', () => {
    const result = scan(host(''));
    expect(result.slotDirectives.get('CngxFoo')).toEqual(['cngxFoo']);
    expect(result.slotDirectives.get('CngxBar')).toEqual(['cngxBar', 'cngxBarAlt']);
  });

  it('accepts a documented pair', () => {
    const result = scan(
      host('readonly foo = contentChild(CngxFoo);', '* @slot cngxFoo Replaces foo.'),
    );
    expect(attrs(result.documented)).toEqual(['CngxHost:cngxFoo']);
    expect(result.missing).toEqual([]);
    expect(result.stale).toEqual([]);
  });

  it('reports a missing @slot line', () => {
    const result = scan(host('readonly foo = contentChild(CngxFoo);'));
    expect(attrs(result.missing)).toEqual(['CngxHost:cngxFoo']);
  });

  it('reports a stale @slot line', () => {
    const result = scan(host('', '* @slot cngxFoo Replaces foo.'));
    expect(attrs(result.stale)).toEqual(['CngxHost:cngxFoo']);
  });

  const brainFile = {
    path: 'projects/x/brain.ts',
    text: `
      @Directive({ standalone: true })
      export class CngxInner { readonly foo = contentChild(CngxFoo); }
      @Directive({ standalone: true, hostDirectives: [CngxInner] })
      export class CngxBrain {}
    `,
  };
  const hostWith = (hostDirectives, jsdoc) => ({
    path: 'projects/x/host.component.ts',
    text: `
      /**
       * Host.
       ${jsdoc}
       */
      @Component({ selector: 'cngx-host', template: '', hostDirectives: ${hostDirectives} })
      export class CngxHost {}
    `,
  });

  it('accepts a @slot line for a slot a listed host directive queries, transitively', () => {
    for (const listed of ['[CngxBrain]', "[{ directive: CngxBrain, inputs: ['x'] }]"]) {
      const result = scanSlotCoverage(
        [slotFile, brainFile, hostWith(listed, '* @slot cngxFoo Foo.')],
        {
          exempt: [],
        },
      );
      expect(result.stale).toEqual([]);
    }
  });

  it('still reports a @slot line no listed host directive queries', () => {
    const result = scanSlotCoverage(
      [slotFile, brainFile, hostWith('[CngxBrain]', '* @slot cngxBar Bar.')],
      { exempt: [] },
    );
    expect(attrs(result.stale)).toEqual(['CngxHost:cngxBar']);
  });

  it('accepts an exempted pair without a @slot line', () => {
    const result = scan(host('readonly foo = contentChild(CngxFoo);'), [
      { host: 'CngxHost', attr: 'cngxFoo' },
    ]);
    expect(result.missing).toEqual([]);
    expect(attrs(result.exempted)).toEqual(['CngxHost:cngxFoo']);
    expect(result.exemptWithSlot).toEqual([]);
  });

  it('reports an exempted pair that carries a @slot line', () => {
    const result = scan(
      host('readonly foo = contentChild(CngxFoo);', '* @slot cngxFoo Replaces foo.'),
      [{ host: 'CngxHost', attr: 'cngxFoo' }],
    );
    expect(attrs(result.exemptWithSlot)).toEqual(['CngxHost:cngxFoo']);
  });

  it('reports an exemption row that is not a real query', () => {
    const result = scan(host(''), [{ host: 'CngxHost', attr: 'cngxFoo' }]);
    expect(result.exemptNotQueried).toEqual([{ host: 'CngxHost', attr: 'cngxFoo' }]);
  });

  it('ignores a query in a .spec.ts file', () => {
    const spec = {
      ...host('readonly foo = contentChild(CngxFoo);'),
      path: 'projects/x/host.spec.ts',
    };
    const result = scan(spec);
    expect(result.pairs).toEqual([]);
  });

  it('resolves a generic multi-line query', () => {
    const result = scan(host('readonly foo = contentChild<CngxFoo<T>>(\n  CngxFoo,\n);'));
    expect(attrs(result.missing)).toEqual(['CngxHost:cngxFoo']);
  });

  it('resolves a query whose argument is an instantiation expression', () => {
    const result = scan(host('readonly foo = contentChild(\n  CngxFoo<T>,\n);'));
    expect(attrs(result.missing)).toEqual(['CngxHost:cngxFoo']);
  });

  it('ignores a query mentioned only in a comment', () => {
    const result = scan(
      host('// readonly foo = contentChild(CngxFoo);\n/* contentChildren(CngxBar) */'),
    );
    expect(result.pairs).toEqual([]);
  });

  it('reports a slot directive no barrel reaches and passes one reached through export *', () => {
    const files = [
      slotFile,
      { path: 'projects/x/public-api.ts', text: "export * from './reached';" },
      { path: 'projects/x/reached/index.ts', text: "export * from '../slots';" },
      {
        path: 'projects/x/hidden.ts',
        text: "@Directive({ selector: 'ng-template[cngxHidden]' }) export class CngxHidden {}",
      },
    ];
    const { slotDirectiveFiles } = scanSlotCoverage(files, { exempt: [] });
    expect(unreachableSlotDirectives(slotDirectiveFiles, barrelReach(files))).toEqual([
      'projects/x/hidden.ts CngxHidden',
    ]);
  });

  it('does not let a same-named export from another module reach a slot directive', () => {
    const files = [
      {
        path: 'projects/x/hidden.ts',
        text: "@Directive({ selector: 'ng-template[cngxHidden]' }) export class CngxHidden {}",
      },
      { path: 'projects/x/other.ts', text: 'export class CngxHidden {}' },
      { path: 'projects/x/public-api.ts', text: "export { CngxHidden } from './other';" },
    ];
    const { slotDirectiveFiles } = scanSlotCoverage(files, { exempt: [] });
    expect(unreachableSlotDirectives(slotDirectiveFiles, barrelReach(files))).toEqual([
      'projects/x/hidden.ts CngxHidden',
    ]);
  });

  it('follows an imported binding the barrel exports locally', () => {
    const files = [
      {
        path: 'projects/x/hidden.ts',
        text: "@Directive({ selector: 'ng-template[cngxHidden]' }) export class CngxHidden {}",
      },
      {
        path: 'projects/x/public-api.ts',
        text: "import { CngxHidden } from './hidden';\nexport { CngxHidden };",
      },
    ];
    const { slotDirectiveFiles } = scanSlotCoverage(files, { exempt: [] });
    expect(unreachableSlotDirectives(slotDirectiveFiles, barrelReach(files))).toEqual([]);
  });

  it('passes a slot directive a barrel re-exports by name', () => {
    const files = [
      {
        path: 'projects/x/hidden.ts',
        text: "@Directive({ selector: 'ng-template[cngxHidden]' }) export class CngxHidden {}",
      },
      { path: 'projects/x/public-api.ts', text: "export { CngxHidden } from './hidden';" },
    ];
    const { slotDirectiveFiles } = scanSlotCoverage(files, { exempt: [] });
    expect(unreachableSlotDirectives(slotDirectiveFiles, barrelReach(files))).toEqual([]);
  });

  it('resolves contentChild.required and contentChildren', () => {
    const result = scan(
      host(
        'readonly foo = contentChild.required(CngxFoo);\nreadonly bars = contentChildren(CngxBar);',
      ),
    );
    expect(attrs(result.missing)).toEqual([
      'CngxHost:cngxFoo',
      'CngxHost:cngxBar',
      'CngxHost:cngxBarAlt',
    ]);
  });
});
