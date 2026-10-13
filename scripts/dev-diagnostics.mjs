// Shared AST collectors for the coded dev diagnostics (`cngxDevWarn` /
// `cngxDevError`, `projects/utils/dev-message.ts`). The raw-console guard, the
// error-code manifest and the prod-strip needle derivation read source through
// these, so the three agree on what a helper call, a guard and a dev wrapper
// are.

import ts from 'typescript';

const HELPERS = { cngxDevWarn: 'warn', cngxDevError: 'error' };

export const parse = (path, text) =>
  ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

export const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

const unparen = (node) => {
  let current = node;
  while (ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }
  return current;
};

const isAnd = (node) =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken;

/** The operands of an `&&` chain, left to right, through parentheses. */
const andLeaves = (node) => {
  const inner = unparen(node);
  return isAnd(inner) ? [...andLeaves(inner.left), ...andLeaves(inner.right)] : [inner];
};

const isTypeofCheck = (node) =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
  ts.isTypeOfExpression(node.left) &&
  ts.isIdentifier(node.left.expression) &&
  node.left.expression.text === 'ngDevMode' &&
  ts.isStringLiteral(node.right) &&
  node.right.text === 'undefined';

const isNgDevMode = (node) => ts.isIdentifier(node) && node.text === 'ngDevMode';

/** Does the `&&` chain begin with `typeof ngDevMode !== 'undefined' && ngDevMode`? */
const startsWithGuard = (node) => {
  const leaves = andLeaves(node);
  return leaves.length >= 2 && isTypeofCheck(leaves[0]) && isNgDevMode(leaves[1]);
};

const isNegatedGuard = (node) => {
  const inner = unparen(node);
  return (
    ts.isPrefixUnaryExpression(inner) &&
    inner.operator === ts.SyntaxKind.ExclamationToken &&
    andLeaves(inner.operand).length === 2 &&
    startsWithGuard(inner.operand)
  );
};

const isReturnOnly = (node) =>
  ts.isReturnStatement(node) ||
  (ts.isBlock(node) && node.statements.length === 1 && ts.isReturnStatement(node.statements[0]));

/** `if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) { return ...; }` */
const isEarlyReturn = (statement) =>
  ts.isIfStatement(statement) &&
  !statement.elseStatement &&
  isNegatedGuard(statement.expression) &&
  isReturnOnly(statement.thenStatement);

const isFunctionBoundary = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isConstructorDeclaration(node) ||
  ts.isGetAccessorDeclaration(node) ||
  ts.isSetAccessorDeclaration(node) ||
  ts.isClassStaticBlockDeclaration(node) ||
  ts.isSourceFile(node);

/**
 * Is `node` behind an inline dev-mode guard in the same file? The guard may
 * sit outside an arrow function or function expression, never outside a
 * named function declaration or method.
 */
export function isLexicallyGuarded(node) {
  let child = node;
  let parent = node.parent;
  while (parent && !isFunctionBoundary(parent)) {
    if (
      ts.isIfStatement(parent) &&
      child === parent.thenStatement &&
      startsWithGuard(parent.expression)
    ) {
      return true;
    }
    if (isAnd(parent) && child === parent.right && startsWithGuard(parent.left)) {
      return true;
    }
    if (
      ts.isConditionalExpression(parent) &&
      child === parent.whenTrue &&
      startsWithGuard(parent.condition)
    ) {
      return true;
    }
    if (ts.isBlock(parent)) {
      const index = parent.statements.indexOf(child);
      if (parent.statements.slice(0, index).some(isEarlyReturn)) {
        return true;
      }
    }
    child = parent;
    parent = parent.parent;
  }
  return false;
}

/**
 * Every `cngxDevWarn` / `cngxDevError` call in `files` ([{ path, text }]).
 * `code` is the first argument when it is a string literal, else null.
 *
 * @returns {{ file: string; line: number; severity: 'warn' | 'error'; code: string | null; node: ts.CallExpression; sf: ts.SourceFile }[]}
 */
export function collectHelperCalls(files) {
  const out = [];
  for (const { path, text } of files) {
    if (!text.includes('cngxDev')) {
      continue;
    }
    const sf = parse(path, text);
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        Object.hasOwn(HELPERS, node.expression.text)
      ) {
        const first = node.arguments[0];
        const code =
          first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))
            ? first.text
            : null;
        out.push({
          file: path,
          line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
          severity: HELPERS[node.expression.text],
          code,
          node,
          sf,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

export const isNameOfDeclaration = (node) => {
  const parent = node.parent;
  return (
    (ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodSignature(parent) ||
      ts.isGetAccessorDeclaration(parent) ||
      ts.isSetAccessorDeclaration(parent) ||
      ts.isEnumMember(parent)) &&
    parent.name === node
  );
};

/** The name a function-like node is called by, or null. */
function functionName(node) {
  if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
    return ts.isIdentifier(node.name) ? node.name.text : null;
  }
  if (
    (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer === node &&
    ts.isIdentifier(node.parent.name) &&
    ts.isVariableDeclarationList(node.parent.parent) &&
    node.parent.parent.flags & ts.NodeFlags.Const
  ) {
    return node.parent.name.text;
  }
  return null;
}

const isExported = (node) => {
  const holder = ts.isFunctionDeclaration(node) ? node : node.parent?.parent?.parent;
  return Boolean(
    holder &&
    (ts.isFunctionDeclaration(holder) || ts.isVariableStatement(holder)) &&
    holder.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
  );
};

/**
 * Every guard-first function that contains a helper call: a dev wrapper.
 *
 * @param {{ node: ts.CallExpression }[]} calls helper calls
 */
export function collectWrappers(calls) {
  const seen = new Map();
  for (const { node, file } of calls) {
    for (let fn = node.parent; fn; fn = fn.parent) {
      const name = functionName(fn);
      if (!name || seen.has(fn)) {
        continue;
      }
      const body = fn.body;
      if (
        body &&
        ts.isBlock(body) &&
        body.statements.length > 0 &&
        isEarlyReturn(body.statements[0])
      ) {
        seen.set(fn, {
          file,
          name,
          kind: ts.isMethodDeclaration(fn) ? 'method' : 'function',
          exported: isExported(fn),
        });
      }
    }
  }
  return [...seen.values()];
}

/**
 * Direct calls of a wrapper (by name in its own file, by imported name
 * elsewhere) and wrapper references used as values.
 */
export function collectWrapperUses(files, wrappers) {
  const exportedNames = new Set(wrappers.filter((w) => w.exported).map((w) => w.name));
  const calls = [];
  const indirect = [];
  for (const { path, text } of files) {
    const local = wrappers.filter((w) => w.file === path);
    if (local.length === 0 && ![...exportedNames].some((name) => text.includes(name))) {
      continue;
    }
    const sf = parse(path, text);
    const names = new Set(local.filter((w) => w.kind === 'function').map((w) => w.name));
    const methods = new Set(local.filter((w) => w.kind === 'method').map((w) => w.name));
    for (const statement of sf.statements) {
      const bindings = ts.isImportDeclaration(statement) && statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          if (exportedNames.has((element.propertyName ?? element.name).text)) {
            names.add(element.name.text);
          }
        }
      }
    }
    if (names.size === 0 && methods.size === 0) {
      continue;
    }
    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        const byName = ts.isIdentifier(callee) && names.has(callee.text);
        const byThis =
          ts.isPropertyAccessExpression(callee) &&
          callee.expression.kind === ts.SyntaxKind.ThisKeyword &&
          methods.has(callee.name.text);
        if (byName || byThis) {
          calls.push({ file: path, line: lineOf(sf, node), name: callee.getText(sf), node });
        }
      }
      if (ts.isIdentifier(node) && names.has(node.text) && isValueUse(node)) {
        indirect.push({ file: path, line: lineOf(sf, node), name: node.text });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return { calls, indirect };
}

function isValueUse(node) {
  const parent = node.parent;
  if (ts.isCallExpression(parent) && parent.expression === node) {
    return false;
  }
  if (
    (ts.isVariableDeclaration(parent) || ts.isFunctionDeclaration(parent)) &&
    parent.name === node
  ) {
    return false;
  }
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) {
    return false;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }
  return !isNameOfDeclaration(node);
}
