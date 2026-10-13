// Shared AST collectors for the coded dev diagnostics (`cngxDevWarn` /
// `cngxDevError`, `projects/utils/dev-message.ts`). The raw-console guard, the
// error-code manifest and the prod-strip needle derivation read source through
// these, so the three agree on what a helper call, a guard and a dev wrapper
// are.

import ts from 'typescript';

const HELPERS = { cngxDevWarn: 'warn', cngxDevError: 'error' };

/** The one file that declares the helpers and may call `console` directly. */
export const HELPER_FILE = 'projects/utils/dev-message.ts';

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

/**
 * Every reference to `cngxDevWarn` / `cngxDevError` that is not a direct call
 * through the helper's own name: an aliased import, a namespace member, a
 * re-export, `.call` / `.apply`, or the helper used as a value. Each would
 * hide a diagnostic from the guard, the manifest and the prod-strip needles,
 * which all key on the direct call. `projects/utils/dev-message.ts` declares
 * the helpers and is skipped.
 *
 * @returns {{ file: string; line: number; reason: string }[]}
 */
export function collectHelperMisuse(files) {
  const out = [];
  for (const { path, text } of files) {
    if (!text.includes('cngxDev') || path === HELPER_FILE) {
      continue;
    }
    const sf = parse(path, text);
    const report = (node, reason) => out.push({ file: path, line: lineOf(sf, node), reason });
    const visit = (node) => {
      if (
        (ts.isIdentifier(node) || ts.isStringLiteral(node)) &&
        Object.hasOwn(HELPERS, node.text)
      ) {
        const parent = node.parent;
        if (ts.isCallExpression(parent) && parent.expression === node) {
          // direct call: collected by collectHelperCalls
        } else if (ts.isImportSpecifier(parent)) {
          if (parent.propertyName) {
            report(node, `aliased import of ${node.text}`);
          }
        } else if (ts.isExportSpecifier(parent)) {
          report(node, `re-export of ${node.text}`);
        } else if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
          report(node, `${node.text} called through a namespace or object`);
        } else if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) {
          report(node, `${node.text} read by element access`);
        } else if (ts.isIdentifier(node)) {
          report(node, `${node.text} used as a value`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

const isAmbient = (node) => {
  for (let current = node; current; current = current.parent) {
    if (current.modifiers?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword)) {
      return true;
    }
  }
  return false;
};

/**
 * Lines that declare a local `ngDevMode` (variable, parameter, function,
 * import). A guard reading such a binding never folds in production. The
 * ambient `declare const ngDevMode` that types the global is allowed.
 */
export function localNgDevModeLines(sf) {
  const lines = [];
  const visit = (node) => {
    const name = node.name;
    const declares =
      (ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isBindingElement(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isImportSpecifier(node) ||
        ts.isImportClause(node) ||
        ts.isNamespaceImport(node)) &&
      name &&
      ts.isIdentifier(name) &&
      name.text === 'ngDevMode';
    if (declares && !isAmbient(node)) {
      lines.push(lineOf(sf, node));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return lines;
}

/**
 * The string value of every `const CNGX_ERROR_DOCS_URL = '...'` declaration
 * in `files`. Read from the AST, so a commented-out declaration never counts.
 */
export function collectDocsUrls(files) {
  const out = [];
  for (const { path, text } of files) {
    if (!text.includes('CNGX_ERROR_DOCS_URL')) {
      continue;
    }
    const visit = (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'CNGX_ERROR_DOCS_URL' &&
        node.initializer &&
        ts.isStringLiteralLike(node.initializer)
      ) {
        out.push(node.initializer.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(parse(path, text));
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

const nameText = (name) =>
  name && (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) ? name.text : null;

const isClassFieldFunction = (node) =>
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
  ts.isPropertyDeclaration(node.parent) &&
  node.parent.initializer === node;

/** The name a function-like node is called by, or null. */
function functionName(node) {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return nameText(node.name);
  }
  if (isClassFieldFunction(node)) {
    return nameText(node.parent.name);
  }
  if (
    (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer === node &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }
  return null;
}

/** The innermost enclosing function that has a callable name, or null. */
const namedFunctionOf = (node) => {
  for (let fn = node.parent; fn; fn = fn.parent) {
    if (functionName(fn)) {
      return fn;
    }
  }
  return null;
};

const isPositiveGuardedIf = (statement) =>
  ts.isIfStatement(statement) && !statement.elseStatement && startsWithGuard(statement.expression);

/**
 * Why the innermost named function around a helper call is a dev-only
 * function that is not written guard-first, or null. Such a function is a
 * wrapper in all but shape: its callers' arguments would ship, and R4 could
 * not see them. Every dev-only function must open with the negated early
 * return.
 */
function wrapperShapeProblem(fn) {
  const body = fn.body;
  if (!body) {
    return null;
  }
  if (!ts.isBlock(body)) {
    const inner = unparen(body);
    const devOnly =
      startsWithGuard(inner) ||
      (ts.isConditionalExpression(inner) && startsWithGuard(inner.condition));
    return devOnly ? 'is an expression-body dev-only function' : null;
  }
  const statements = body.statements;
  if (statements.length === 0 || isEarlyReturn(statements[0])) {
    return null;
  }
  if (statements.slice(1).some(isEarlyReturn)) {
    return 'opens with code before its ngDevMode early return';
  }
  if (statements.every(isPositiveGuardedIf)) {
    return 'wraps its whole body in an ngDevMode if';
  }
  return null;
}

/**
 * Dev-only functions around helper calls that are not guard-first.
 *
 * @returns {{ file: string; line: number; name: string; problem: string }[]}
 */
export function collectWrapperShapeProblems(calls) {
  const seen = new Set();
  const out = [];
  for (const { node, file, sf } of calls) {
    const fn = namedFunctionOf(node);
    if (!fn || seen.has(fn)) {
      continue;
    }
    seen.add(fn);
    const problem = wrapperShapeProblem(fn);
    if (problem) {
      out.push({ file, line: lineOf(sf, fn), name: functionName(fn), problem });
    }
  }
  return out;
}

const exportSpecifiers = new WeakMap();

/** Local name -> exported names, from `export { a, b as c }` in `sf`. */
function exportSpecifiersOf(sf) {
  let map = exportSpecifiers.get(sf);
  if (!map) {
    map = new Map();
    for (const statement of sf.statements) {
      const clause =
        ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause;
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          const local = (element.propertyName ?? element.name).text;
          map.set(local, [...(map.get(local) ?? []), element.name.text]);
        }
      }
    }
    exportSpecifiers.set(sf, map);
  }
  return map;
}

/** The names a module-level function is exported under (empty when not). */
const exportNamesOf = (node, name, sf) => {
  const holder = ts.isFunctionDeclaration(node) ? node : node.parent?.parent?.parent;
  const isTopLevel =
    holder &&
    holder.parent === sf &&
    (ts.isFunctionDeclaration(holder) || ts.isVariableStatement(holder));
  if (!isTopLevel) {
    return [];
  }
  const inline = holder.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  return [...(inline ? [name] : []), ...(exportSpecifiersOf(sf).get(name) ?? [])];
};

/** Is the module-level function `name` the default export of `sf`? */
const isDefaultExport = (node, name, sf) => {
  const isDefaultModifier = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
  const assigned = sf.statements.some(
    (s) =>
      ts.isExportAssignment(s) &&
      !s.isExportEquals &&
      ts.isIdentifier(s.expression) &&
      s.expression.text === name,
  );
  return Boolean(
    isDefaultModifier || assigned || exportSpecifiersOf(sf).get(name)?.includes('default'),
  );
};

/**
 * Every guard-first function that contains a helper call: a dev wrapper.
 *
 * @param {{ node: ts.CallExpression }[]} calls helper calls
 */
export function collectWrappers(calls) {
  const seen = new Map();
  for (const { node, file, sf } of calls) {
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
        const isMember = ts.isMethodDeclaration(fn) || isClassFieldFunction(fn);
        seen.set(fn, {
          file,
          name,
          line: lineOf(sf, fn),
          kind: isMember ? 'method' : 'function',
          exportedAs: isMember ? [] : exportNamesOf(fn, name, sf),
          defaultExport: !isMember && isDefaultExport(fn, name, sf),
        });
      }
    }
  }
  return [...seen.values()];
}

/**
 * Direct calls of a wrapper (by name in its own file, by imported name
 * elsewhere; a method wrapper through any receiver in its own file) and
 * wrapper references used as values.
 */
export function collectWrapperUses(files, wrappers) {
  const exportedNames = new Set(wrappers.flatMap((w) => w.exportedAs));
  const calls = [];
  const indirect = [];
  // Forms R4 cannot follow by name fail closed instead of passing unseen.
  const untraceable = wrappers
    .filter((w) => w.defaultExport)
    .map((w) => ({
      file: w.file,
      line: w.line,
      problem: `dev wrapper ${w.name} is a default export; export it by name`,
    }));
  for (const { path, text } of files) {
    const local = wrappers.filter((w) => w.file === path);
    if (local.length === 0 && ![...exportedNames].some((name) => text.includes(name))) {
      continue;
    }
    const sf = parse(path, text);
    const names = new Set(local.filter((w) => w.kind === 'function').map((w) => w.name));
    const methods = new Set(local.filter((w) => w.kind === 'method').map((w) => w.name));
    const namespaces = new Set();
    for (const statement of sf.statements) {
      const bindings = ts.isImportDeclaration(statement) && statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          if (exportedNames.has((element.propertyName ?? element.name).text)) {
            names.add(element.name.text);
          }
        }
      }
      if (bindings && ts.isNamespaceImport(bindings)) {
        namespaces.add(bindings.name.text);
      }
      const reexports =
        ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
          ? statement.exportClause.elements
          : [];
      for (const element of reexports) {
        const original = (element.propertyName ?? element.name).text;
        if (exportedNames.has(original) && original !== element.name.text) {
          untraceable.push({
            file: path,
            line: lineOf(sf, element),
            problem: `dev wrapper ${original} is re-exported as ${element.name.text}; keep its name`,
          });
        }
      }
    }
    const isNamespaceMember = (node) =>
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      namespaces.has(node.expression.text) &&
      exportedNames.has(node.name.text);
    if (names.size === 0 && methods.size === 0 && namespaces.size === 0) {
      continue;
    }
    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        const byName = ts.isIdentifier(callee) && names.has(callee.text);
        const byMember =
          ts.isPropertyAccessExpression(callee) &&
          methods.has(callee.name.text) &&
          !(ts.isIdentifier(callee.expression) && callee.expression.text === 'console');
        if (byName || byMember || isNamespaceMember(callee)) {
          calls.push({ file: path, line: lineOf(sf, node), name: callee.getText(sf), node });
        }
      }
      if (ts.isIdentifier(node) && names.has(node.text) && isValueUse(node)) {
        indirect.push({ file: path, line: lineOf(sf, node), name: node.text });
      }
      const memberValue =
        ts.isPropertyAccessExpression(node) &&
        (methods.has(node.name.text) || isNamespaceMember(node)) &&
        !(ts.isCallExpression(node.parent) && node.parent.expression === node);
      if (memberValue) {
        indirect.push({ file: path, line: lineOf(sf, node), name: node.getText(sf) });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return { calls, indirect, untraceable };
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
  if (ts.isExportAssignment(parent)) {
    return false;
  }
  return !isNameOfDeclaration(node);
}
