import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

import { isToolingRoot } from './source-roots.mjs';

// Shared scanner for the two i18n guards (`user-facing-string-coverage` and
// `reactive-i18n-coverage`): the repo walk, the TS-AST helpers, the
// component-template hand-off (inline `template:` and `templateUrl` files),
// the decorator `host:` reader and the config-fallback classifier. Not a
// `*.test.mjs`, so vitest never collects it on its own.

const HERE = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(HERE, '..', '..');

/**
 * Directories whose strings are never library defaults: demo code is
 * consumer-authored, `projects/testing` is not published, and a
 * `__test-helpers` folder holds spec scaffolding that happens not to carry the
 * `.spec.ts` suffix.
 */
export const SKIPPED_DIRS = new Set(['examples', 'testing', '__test-helpers']);

/** Reads that make a following `??` / `||` literal a mere fallback. */
export const CONFIG_READ = /\b(?:config|cfg|i18n|labels|messages|glyphs|defaults|ariaLabels)\b/i;

/**
 * Every published source under `relDir` whose basename matches `extension`,
 * skipping specs, fixtures, declaration files, {@link SKIPPED_DIRS} and the
 * tooling roots (`source-roots.mjs`).
 *
 * @param {string} relDir repo-relative directory
 * @param {RegExp} extension
 * @returns {string[]} repo-relative paths
 */
export function walkSources(relDir, extension) {
  const out = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      if (!SKIPPED_DIRS.has(entry) && !isToolingRoot(rel)) {
        out.push(...walkSources(rel, extension));
      }
    } else if (
      extension.test(entry) &&
      !entry.includes('.spec.') &&
      !entry.includes('.fixtures.') &&
      !entry.endsWith('.d.ts')
    ) {
      out.push(rel);
    }
  }
  return out;
}

/**
 * The source with every comment blanked and line count preserved - a JSDoc
 * `@example` block is full of `aria-label="Price range"` prose, and no check
 * may see it.
 *
 * @param {ts.SourceFile} sf
 * @returns {string}
 */
export function commentFreeText(sf) {
  const chars = sf.text.split('');
  const blank = (range) => {
    for (let i = range.pos; i < range.end; i++) {
      if (chars[i] !== '\n') {
        chars[i] = ' ';
      }
    }
  };
  const visit = (node) => {
    (ts.getLeadingCommentRanges(sf.text, node.getFullStart()) ?? []).forEach(blank);
    (ts.getTrailingCommentRanges(sf.text, node.getEnd()) ?? []).forEach(blank);
    node.getChildren(sf).forEach(visit);
  };
  visit(sf);
  return chars.join('');
}

/**
 * Is `node` inside `container`?
 *
 * @param {ts.Node} node
 * @param {ts.Node | undefined} container
 */
export const isWithin = (node, container) =>
  !!container && node.pos >= container.pos && node.end <= container.end;

/** @param {ts.Node | undefined} node */
export const unwrapExpression = (node) => {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }
  return current;
};

/** @param {ts.Node | undefined} node */
export const isStringLiteralLike = (node) =>
  !!node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));

/**
 * @param {ts.Node | undefined} node
 * @param {string} callee
 * @returns {node is ts.CallExpression}
 */
export const isCallTo = (node, callee) =>
  !!node &&
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === callee;

/**
 * A literal on the right of `??` / `||` whose left operand reads a config,
 * i18n or labels bundle (`config.ariaLabels?.x ?? 'X'`). The left operand
 * itself decides, not a word on a neighbouring line.
 *
 * @param {ts.Node} node
 * @param {ts.SourceFile} sf
 */
export const isConfigFallback = (node, sf) => {
  let operand = node;
  while (ts.isParenthesizedExpression(operand.parent)) {
    operand = operand.parent;
  }
  const parent = operand.parent;
  return (
    ts.isBinaryExpression(parent) &&
    parent.right === operand &&
    (parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
      parent.operatorToken.kind === ts.SyntaxKind.BarBarToken) &&
    CONFIG_READ.test(parent.left.getText(sf))
  );
};

/**
 * A named property of a `@Component` / `@Directive` decorator argument.
 *
 * @param {ts.Node} node
 * @param {string} name
 * @param {readonly string[]} decorators
 * @returns {node is ts.PropertyAssignment}
 */
const isDecoratorProperty = (node, name, decorators) => {
  if (!ts.isPropertyAssignment(node) || !ts.isIdentifier(node.name) || node.name.text !== name) {
    return false;
  }
  const call = node.parent?.parent;
  return (
    !!call &&
    ts.isCallExpression(call) &&
    ts.isIdentifier(call.expression) &&
    decorators.includes(call.expression.text)
  );
};

/**
 * The `template:` initializer of an `@Component` decorator, whatever its
 * shape. Its content is markup, not TypeScript copy.
 *
 * @param {ts.Node} node
 * @returns {node is ts.PropertyAssignment}
 */
export const isComponentTemplateProperty = (node) =>
  isDecoratorProperty(node, 'template', ['Component']);

/**
 * The `host:` object of an `@Component` / `@Directive` decorator.
 *
 * @param {ts.Node} node
 * @returns {node is ts.PropertyAssignment & { initializer: ts.ObjectLiteralExpression }}
 */
export const isDecoratorHost = (node) =>
  isDecoratorProperty(node, 'host', ['Component', 'Directive']) &&
  ts.isObjectLiteralExpression(node.initializer);

/**
 * The entries of a decorator `host:` object that carry a string-literal value:
 * static attributes (`role`, `'aria-live'`) and bindings (`'[attr.aria-label]'`).
 *
 * @param {ts.PropertyAssignment & { initializer: ts.ObjectLiteralExpression }} host
 * @returns {{ name: string; value: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral }[]}
 */
export const hostEntries = (host) =>
  host.initializer.properties.filter(ts.isPropertyAssignment).flatMap((property) => {
    const name =
      ts.isStringLiteral(property.name) || ts.isIdentifier(property.name) ? property.name.text : '';
    return isStringLiteralLike(property.initializer) ? [{ name, value: property.initializer }] : [];
  });

/**
 * Resolves a `template:` initializer to the literal that holds the markup: the
 * initializer itself, or a same-file `const X = \`...\`` it names. A template
 * built with substitutions, or imported from elsewhere, cannot be scanned.
 *
 * @param {ts.Expression} initializer
 * @param {ts.SourceFile} sf
 * @returns {ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | null}
 */
export const templateLiteralOf = (initializer, sf) => {
  if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer;
  }
  if (!ts.isIdentifier(initializer)) {
    return null;
  }
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      const named = ts.isIdentifier(declaration.name) && declaration.name.text === initializer.text;
      if (named && init && (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init))) {
        return init;
      }
    }
  }
  return null;
};

/**
 * @typedef {object} ComponentTemplate
 * @property {string} text the markup
 * @property {string} file repo-relative file the markup lives in
 * @property {number} lineOffset 0-based line of the markup's first line in `file`
 */

/**
 * The template of an `@Component` decorator call, inline or external. An
 * inline template that is not a same-file literal, or a `templateUrl` that
 * does not resolve, comes back as `null` so the caller can fail instead of
 * passing unread. `undefined` means the decorator declares no template.
 *
 * @param {ts.CallExpression} decorator the `Component(...)` call
 * @param {ts.SourceFile} sf
 * @param {string} fileName repo-relative path of `sf`
 * @returns {ComponentTemplate | null | undefined}
 */
export function componentTemplateOf(decorator, sf, fileName) {
  const meta = decorator.arguments[0];
  if (!meta || !ts.isObjectLiteralExpression(meta)) {
    return undefined;
  }
  for (const property of meta.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
      continue;
    }
    if (property.name.text === 'template') {
      const literal = templateLiteralOf(property.initializer, sf);
      if (!literal) {
        return null;
      }
      const lineOffset = sf.getLineAndCharacterOfPosition(literal.getStart(sf)).line;
      return { text: literal.text, file: fileName, lineOffset };
    }
    if (property.name.text === 'templateUrl' && isStringLiteralLike(property.initializer)) {
      const file = posix.join(posix.dirname(fileName), property.initializer.text);
      const absolute = resolve(REPO_ROOT, file);
      return existsSync(absolute)
        ? { text: readFileSync(absolute, 'utf-8'), file, lineOffset: 0 }
        : null;
    }
  }
  return undefined;
}
