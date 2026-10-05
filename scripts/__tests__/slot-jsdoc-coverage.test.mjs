import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
 *   - every `@slot <attr>` tag names an attr the host queries;
 *   - {@link EXEMPT} holds exactly the twelve queried-but-unrendered pairs in
 *     three groups, every row is still a real query, and no exempted pair carries a
 *     `@slot` tag (rendering the slot means deleting its row);
 *   - the scan found more than 100 slot directives and more than 200 host-slot
 *     pairs, so a scan that silently finds nothing fails.
 *
 * Scanned: `projects/**` `.ts`, minus `*.spec.ts` and the directories
 * `walkSources` skips. Queries are resolved on the TypeScript AST, so generic
 * and multi-line calls resolve and a `contentChild(X)` mention in a comment or
 * JSDoc example never counts.
 *
 * The exemption list is shrink-only. A new entry is a scope decision, not a
 * silent addition.
 */

const TREE_OPTION_LOOP_REASON =
  'tree rows render through cngxTreeSelectNode with a built-in checkbox; option-loop slots are queried for template-registry parity only';
const TREE_OPTION_LOOP_SOURCE = 'select family accepted debt: tree-select option-loop slots';
const INPUT_PLACEHOLDER_REASON =
  'the placeholder renders as the <input placeholder> attribute, which no template can fill; the slot is queried for template-registry parity only';
const INPUT_PLACEHOLDER_SOURCE = 'select family accepted debt: placeholder slot on input variants';
const SHELL_OPTION_LOOP_REASON =
  'the shell renders projected <cngx-option> / <cngx-optgroup> markup instead of the shared option panel; option-loop slots are queried for template-registry parity only';
const SHELL_OPTION_LOOP_SOURCE = 'select family accepted debt: select-shell option-loop slots';

/** Queried but unrendered host-slot pairs. Exact, shrink-only. */
export const EXEMPT = [
  ...[
    'cngxSelectCheck',
    'cngxSelectOptgroup',
    'cngxSelectOptionLabel',
    'cngxSelectOptionPending',
    'cngxSelectOptionError',
  ].map((attr) => ({
    host: 'CngxTreeSelect',
    attr,
    reason: TREE_OPTION_LOOP_REASON,
    source: TREE_OPTION_LOOP_SOURCE,
  })),
  ...['CngxTypeahead', 'CngxCombobox', 'CngxActionSelect', 'CngxActionMultiSelect'].map((host) => ({
    host,
    attr: 'cngxSelectPlaceholder',
    reason: INPUT_PLACEHOLDER_REASON,
    source: INPUT_PLACEHOLDER_SOURCE,
  })),
  ...['cngxSelectCheck', 'cngxSelectOptgroup', 'cngxSelectOptionLabel'].map((attr) => ({
    host: 'CngxSelectShell',
    attr,
    reason: SHELL_OPTION_LOOP_REASON,
    source: SHELL_OPTION_LOOP_SOURCE,
  })),
];

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
  /** @type {{ path: string, node: ts.ClassDeclaration }[]} */
  const hosts = [];

  for (const { path, sf } of parsed) {
    const visit = (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const decorator = decoratorOf(node, new Set(['Component', 'Directive']));
        if (decorator) {
          hosts.push({ path, node });
          const selector = decorator.name === 'Directive' ? selectorOf(decorator.call) : undefined;
          const attrs = selector ? [...selector.matchAll(SLOT_SELECTOR)].map((m) => m[1]) : [];
          if (attrs.length > 0) {
            slotDirectives.set(node.name.text, attrs);
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

  for (const { path, node } of hosts) {
    const host = node.name.text;
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
      if (!queried.has(attr)) {
        stale.push({ path, host, attr });
      }
    }
  }

  const pairKeys = new Set(pairs.map((p) => pairKey(p.host, p.attr)));
  const exemptNotQueried = exempt.filter((row) => !pairKeys.has(pairKey(row.host, row.attr)));

  return {
    slotDirectives,
    pairs,
    documented,
    missing,
    stale,
    exempted,
    exemptWithSlot,
    exemptNotQueried,
  };
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

  it('keeps the exemption list at exactly the twelve unrendered pairs in three groups', () => {
    expect(EXEMPT).toHaveLength(12);
    expect(new Set(EXEMPT.map((row) => row.reason)).size).toBe(3);
    for (const row of EXEMPT) {
      expect(row.reason).not.toMatch(/\.internal|\.md\b/);
      expect(row.source).not.toMatch(/\.internal|\.md\b/);
    }
    expect(new Set(EXEMPT.map((row) => pairKey(row.host, row.attr))).size).toBe(12);
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
