// Shared AST collectors for the coded dev diagnostics (`cngxDevWarn` /
// `cngxDevError`, `projects/utils/dev-message.ts`) and the coded thrown errors
// (`CngxRuntimeError`, `projects/utils/runtime-error.ts`). The raw-console and
// raw-throw guards, the error-code manifest and the prod-strip needle
// derivation read source through these, so they agree on what a helper call,
// a runtime error, a guard and a dev wrapper are.

import { posix } from 'node:path';

import ts from 'typescript';

const HELPERS = { cngxDevWarn: 'warn', cngxDevError: 'error' };

/** The one file that declares the helpers and may call `console` directly. */
export const HELPER_FILE = 'projects/utils/dev-message.ts';

/** The utils barrel, which re-exports the helpers by name from `HELPER_FILE`. */
const HELPER_BARREL = 'projects/utils/public-api.ts';

const isBarrelReExport = (path, specifier) =>
  path === HELPER_BARREL &&
  !specifier.propertyName &&
  specifier.parent.parent.moduleSpecifier?.text === './dev-message';

export const parse = (path, text) =>
  ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

export const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

/**
 * A checker over the one file, with no lib and no resolution: a global
 * resolves to no symbol, a local binding of the same name does, and two
 * same-named bindings in different scopes resolve to different symbols.
 */
export function singleFileChecker(sf) {
  const options = { noLib: true, noResolve: true, types: [], allowJs: false };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === sf.fileName ? sf : undefined);
  host.fileExists = (name) => name === sf.fileName;
  return ts.createProgram([sf.fileName], options, host).getTypeChecker();
}

/** `node` through parentheses, `as`, `satisfies`, `!` and `<T>` casts. */
export const unwrap = (node) => {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
};

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

const checkers = new WeakMap();

/** `singleFileChecker(sf)`, built once per source file. */
const checkerOf = (sf) => {
  let checker = checkers.get(sf);
  if (!checker) {
    checker = singleFileChecker(sf);
    checkers.set(sf, checker);
  }
  return checker;
};

const isPlus = (node) =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken;

/** The left-most operand of a `+` concatenation (the node itself when it is none). */
export const firstOperand = (node) => {
  let current = unwrap(node);
  while (isPlus(current)) {
    current = unwrap(current.left);
  }
  return current;
};

const isLiteralText = (node) =>
  ts.isStringLiteral(node) ||
  ts.isNoSubstitutionTemplateLiteral(node) ||
  ts.isTemplateExpression(node);

/**
 * Text built in place: a string literal, a template literal or a `+`
 * concatenation whose first operand is one. `m + ' text'` starts with a value
 * built elsewhere, which may be the whole message.
 */
const isInlineText = (node) => {
  const inner = unparen(node);
  return isLiteralText(inner) || (isPlus(inner) && isLiteralText(firstOperand(inner)));
};

/**
 * A parameter of the guard-first function around `node`: a dev wrapper's
 * message, which R4 holds every caller to build behind a guard.
 */
const isWrapperParameter = (node, sf) => {
  const inner = unwrap(node);
  if (!ts.isIdentifier(inner)) {
    return false;
  }
  const declaration = checkerOf(sf).getSymbolAtLocation(inner)?.declarations?.[0];
  const body = declaration && ts.isParameter(declaration) ? declaration.parent.body : undefined;
  return Boolean(
    body && ts.isBlock(body) && body.statements.length > 0 && isEarlyReturn(body.statements[0]),
  );
};

/**
 * Is the message built where the guard folds it? A local, a field or a call
 * result can carry text built before the guard, which then ships; only text
 * written inline, or a dev wrapper's own parameter, is certain to drop.
 */
const isInlineMessage = (node, sf) => isInlineText(node) || isWrapperParameter(node, sf);

/** Is `id` the variable of a `catch` clause that encloses `site`? */
export function isEnclosingCatchVariable(id, site, sf) {
  const clause = checkerOf(sf).getSymbolAtLocation(id)?.declarations?.[0]?.parent;
  if (!clause || !ts.isCatchClause(clause)) {
    return false;
  }
  for (let current = site.parent; current; current = current.parent) {
    if (current === clause) {
      return true;
    }
  }
  return false;
}

/**
 * Is the options argument of a runtime error free of shipped text? It is
 * omitted, or `{ cause: <enclosing catch variable> }`: a `new Error('text')`
 * built for the cause would ship its message with the code.
 */
const isPlainOptions = (options, site, sf) => {
  if (options === undefined) {
    return true;
  }
  const inner = unwrap(options);
  if (!ts.isObjectLiteralExpression(inner) || inner.properties.length !== 1) {
    return false;
  }
  const [property] = inner.properties;
  const value = ts.isPropertyAssignment(property)
    ? unwrap(property.initializer)
    : ts.isShorthandPropertyAssignment(property)
      ? property.name
      : null;
  return (
    nameText(property.name) === 'cause' &&
    value !== null &&
    ts.isIdentifier(value) &&
    isEnclosingCatchVariable(value, site, sf)
  );
};

const isStatic = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword);

/**
 * Does `node` run while its module loads? A dev build does not define
 * `ngDevMode`; Angular sets it lazily (`initNgDevMode()` when the first
 * component is defined), so a guard read at module load can see it undefined
 * and freeze the production branch into a dev build. Code inside a function,
 * a method, an accessor or an instance field initialiser runs later; a static
 * block, a static field initialiser, a function invoked in place (an IIFE)
 * and the constructor and instance field initialisers of a class expression
 * constructed in place (`new (class { ... })()`) run with the code around it.
 */
export function runsAtModuleLoad(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isClassStaticBlockDeclaration(current)) {
      return true;
    }
    if (ts.isPropertyDeclaration(current)) {
      if (isStatic(current)) {
        return true;
      }
      if (!isConstructedInPlace(current.parent)) {
        return false;
      }
      continue;
    }
    if (ts.isFunctionLike(current) && !isInvokedInPlace(current)) {
      return false;
    }
  }
  return true;
}

/**
 * `node` up through the parentheses, casts and `!` that wrap it, and through
 * a comma expression whose last operand it is (`(0, fn)`).
 */
const upCallee = (node) => {
  let current = node;
  for (let parent = current.parent; parent; parent = current.parent) {
    const wraps = unwrap(parent) !== parent && parent.expression === current;
    const lastOperand =
      ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.CommaToken &&
      parent.right === current;
    if (!wraps && !lastOperand) {
      break;
    }
    current = parent;
  }
  return current;
};

/** The member name of `callee.name` or `callee['name']`, else undefined. */
const memberOf = (callee) => {
  const access = callee.parent;
  if (ts.isPropertyAccessExpression(access) && access.expression === callee) {
    return access.name.text;
  }
  if (
    ts.isElementAccessExpression(access) &&
    access.expression === callee &&
    ts.isStringLiteralLike(access.argumentExpression)
  ) {
    return access.argumentExpression.text;
  }
  return undefined;
};

/** Is `callee` the expression of a call or `new` right above it? */
const isCalled = (callee) => {
  const call = callee.parent;
  return (ts.isCallExpression(call) || ts.isNewExpression(call)) && call.expression === callee;
};

/** `new (class { ... })()`: a class expression constructed where it is written. */
const isConstructedInPlace = (cls) => {
  if (!ts.isClassExpression(cls)) {
    return false;
  }
  const callee = upCallee(cls);
  return ts.isNewExpression(callee.parent) && callee.parent.expression === callee;
};

/**
 * `(() => ...)()`, `(function () { ... })()`, `new (function () { ... })()`,
 * the same through `.call(...)` / `.apply(...)` (also `['call']`), through
 * one `.bind(...)` whose result is called right away or through `.call` /
 * `.apply`, with the function wrapped in a cast (`as`, `<T>`, `satisfies`,
 * `!`) or as the last operand of a comma expression (`(0, fn)()`), and the
 * constructor of a class expression constructed in place: a function called
 * where it is written. A callback handed to a synchronous call
 * (`[1].forEach(() => ...)`) or to `Reflect.apply(...)` is not detected; it
 * counts as running later.
 */
const isInvokedInPlace = (fn) => {
  if (ts.isConstructorDeclaration(fn)) {
    return isConstructedInPlace(fn.parent);
  }
  if (!ts.isArrowFunction(fn) && !ts.isFunctionExpression(fn)) {
    return false;
  }
  let callee = upCallee(fn);
  if (memberOf(callee) === 'bind') {
    const bound = callee.parent.parent;
    if (!ts.isCallExpression(bound) || bound.expression !== callee.parent) {
      return false;
    }
    callee = upCallee(bound);
  }
  const member = memberOf(callee);
  if (member === 'call' || member === 'apply') {
    callee = upCallee(callee.parent);
  }
  return isCalled(callee);
};

/** The violation text for a guard `runsAtModuleLoad` reports. */
export const MODULE_LOAD_GUARD =
  'sits behind a dev-mode guard evaluated at module load, before Angular sets ngDevMode; move the guard into a function or getter';

/**
 * Every `cngxDevWarn` / `cngxDevError` call in `files` ([{ path, text }]).
 * `code` is the first argument when it is a string literal, else null.
 * `messageInline`: the second argument is text built in place (or a dev
 * wrapper's parameter), so the guard drops it with the call.
 *
 * @returns {{ file: string; line: number; severity: 'warn' | 'error'; code: string | null; messageInline: boolean; node: ts.CallExpression; sf: ts.SourceFile }[]}
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
        const [first, message] = node.arguments;
        const code =
          first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))
            ? first.text
            : null;
        out.push({
          file: path,
          line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
          severity: HELPERS[node.expression.text],
          code,
          messageInline: message !== undefined && isInlineMessage(message, sf),
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

/** The class whose constructions `collectRuntimeErrors` reads. */
export const RUNTIME_ERROR = 'CngxRuntimeError';

/**
 * Every `new CngxRuntimeError(...)` in `files` ([{ path, text }]). `code` is
 * the first argument when it is a string literal, else null. `thrown`: the
 * construction is the operand of a `throw` statement; otherwise the error is
 * built and stored (a commit handler's error state). `devOnly`: the
 * construction itself sits behind an inline guard, so the production build
 * drops it with its code. `messageGuarded`: the second argument is an `&&`
 * chain starting with the guard. `atModuleLoad`: the construction runs while
 * its module loads, where a guard can see `ngDevMode` still undefined.
 * `messageInline`: the message (its guarded tail, or the whole message of a
 * dev-only construction) is text built in place. `optionsPlain`: the third
 * argument is omitted or `{ cause: <enclosing catch variable> }`, or the
 * whole construction is dev-only.
 *
 * @returns {{ file: string; line: number; code: string | null; devOnly: boolean; thrown: boolean; messageGuarded: boolean; messageInline: boolean; optionsPlain: boolean; atModuleLoad: boolean; node: ts.NewExpression; sf: ts.SourceFile }[]}
 */
/** Is `node` the operand of a `throw` statement (through parentheses)? */
function isThrownOperand(node) {
  let parent = node.parent;
  while (parent && ts.isParenthesizedExpression(parent)) {
    parent = parent.parent;
  }
  return Boolean(parent && ts.isThrowStatement(parent));
}

export function collectRuntimeErrors(files) {
  const out = [];
  for (const { path, text } of files) {
    if (!text.includes(RUNTIME_ERROR)) {
      continue;
    }
    const sf = parse(path, text);
    const visit = (node) => {
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === RUNTIME_ERROR
      ) {
        const [first, message, options] = node.arguments ?? [];
        const code =
          first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))
            ? first.text
            : null;
        const devOnly = isLexicallyGuarded(node);
        const messageGuarded = message !== undefined && startsWithGuard(message);
        const text = messageGuarded ? andLeaves(message).at(-1) : message;
        out.push({
          file: path,
          line: lineOf(sf, node),
          code,
          devOnly,
          thrown: isThrownOperand(node),
          messageGuarded,
          messageInline: text === undefined || isInlineMessage(text, sf),
          optionsPlain: devOnly || isPlainOptions(options, node, sf),
          atModuleLoad: runsAtModuleLoad(node),
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
 * the helpers and is skipped; the utils barrel may re-export them unaliased
 * from it.
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
          if (!isBarrelReExport(path, parent)) {
            report(node, `re-export of ${node.text}`);
          }
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

/** Does `node` sit in an ambient (`declare`) declaration? */
export const isAmbient = (node) => {
  for (let current = node; current; current = current.parent) {
    if (current.modifiers?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword)) {
      return true;
    }
  }
  return false;
};

/**
 * Lines that declare a local `ngDevMode` (variable, parameter, function,
 * class, enum, namespace, import, `import =`). A guard reading such a binding
 * never folds in production. The ambient `declare const ngDevMode` that types
 * the global is allowed.
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
        ts.isClassDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isModuleDeclaration(node) ||
        ts.isImportEqualsDeclaration(node) ||
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

/** `{ onWarn: (m) => ... }`: a function stored as an object-literal property. */
const isPropertyFunction = (node) =>
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
  ts.isPropertyAssignment(node.parent) &&
  node.parent.initializer === node;

/** A function an object literal carries as a value (property or shorthand method). */
const isObjectMember = (node) =>
  isPropertyFunction(node) ||
  (ts.isMethodDeclaration(node) && ts.isObjectLiteralExpression(node.parent));

/**
 * An argument-less function an object literal carries (`{ onGiveUp: () => ... }`).
 * It has no caller arguments that could ship, and its guarded body already
 * folds, so it is neither held to guard-first nor counted as a wrapper.
 */
const isArgumentlessObjectMember = (node) => isObjectMember(node) && node.parameters.length === 0;

/** The name a function-like node is called by, or null. */
function functionName(node) {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return nameText(node.name);
  }
  if (isClassFieldFunction(node) || isPropertyFunction(node)) {
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

/** A module-level `Set` / `Map` whose name says it records what was already reported. */
const WARN_ONCE_NAME = /warn|seen|report|logged/i;

function warnOnceCollections(sf) {
  const names = new Set();
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer && unparen(declaration.initializer);
      const isCollection =
        init &&
        ts.isNewExpression(init) &&
        ts.isIdentifier(init.expression) &&
        /^(?:Weak)?(?:Set|Map)$/.test(init.expression.text);
      if (
        isCollection &&
        ts.isIdentifier(declaration.name) &&
        WARN_ONCE_NAME.test(declaration.name.text)
      ) {
        names.add(declaration.name.text);
      }
    }
  }
  return names;
}

/** `x.has(...)` / `x.add(...)` / ... on a warn-once collection. */
const isWarnOnceCall = (expression, collections) => {
  const inner = unparen(expression);
  return (
    ts.isCallExpression(inner) &&
    ts.isPropertyAccessExpression(inner.expression) &&
    ts.isIdentifier(inner.expression.expression) &&
    collections.has(inner.expression.expression.text)
  );
};

const isFunctionLike = (node) =>
  ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node);

/**
 * Classifies one statement of a function body: `dev` runs only in dev mode,
 * `neutral` does no observable production work (control flow, warn-once
 * bookkeeping), `prod` is everything else.
 */
function classifyStatement(statement, collections) {
  if (isEarlyReturn(statement)) {
    return 'neutral';
  }
  if (ts.isIfStatement(statement) && !statement.elseStatement) {
    if (startsWithGuard(statement.expression)) {
      return 'dev';
    }
    const inner = ts.isBlock(statement.thenStatement)
      ? [...statement.thenStatement.statements]
      : [statement.thenStatement];
    const kinds = inner.map((s) => classifyStatement(s, collections));
    const conditionIsBookkeeping =
      !hasCall(statement.expression) ||
      isWarnOnceCall(statement.expression, collections) ||
      (ts.isPrefixUnaryExpression(unparen(statement.expression)) &&
        isWarnOnceCall(unparen(statement.expression).operand, collections));
    if (conditionIsBookkeeping && kinds.every((k) => k !== 'prod')) {
      return kinds.includes('dev') ? 'dev' : 'neutral';
    }
    return 'prod';
  }
  if (ts.isExpressionStatement(statement)) {
    if (startsWithGuard(statement.expression)) {
      return 'dev';
    }
    return isWarnOnceCall(statement.expression, collections) ? 'neutral' : 'prod';
  }
  if (ts.isReturnStatement(statement)) {
    if (!statement.expression) {
      return 'neutral';
    }
    const value = unparen(statement.expression);
    return isFunctionLike(value) && isDevOnlyBody(value, collections) ? 'dev' : 'prod';
  }
  return 'prod';
}

const hasCall = (node) => {
  let found = false;
  const visit = (child) => {
    if (found) {
      return;
    }
    if (ts.isCallExpression(child)) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
};

/** Is every identifier reference to `names` inside one of `regions`? */
const usedOnlyWithin = (names, root, regions) => {
  let outside = false;
  const visit = (node) => {
    if (outside) {
      return;
    }
    if (ts.isIdentifier(node) && names.has(node.text) && !ts.isVariableDeclaration(node.parent)) {
      outside = !regions.some((region) => node.pos >= region.pos && node.end <= region.end);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return !outside;
};

/**
 * A syntactic approximation of "this function only works for dev mode": its
 * body has at least one dev-guarded statement and every other top-level
 * statement is control flow, warn-once bookkeeping, or a local read only by
 * dev statements. Statements after a negated early return count as dev-only.
 * Anything else, including a registration (`effect`, `afterNextRender`) or a
 * loop, counts as production work, so a wrapper built from those is not
 * recognised here; the pinned wrapper list in the raw-console guard catches it
 * when it loses its guard-first shape.
 */
function isDevOnlyBody(fn, collections) {
  const body = fn.body;
  if (!body) {
    return false;
  }
  if (!ts.isBlock(body)) {
    const inner = unparen(body);
    return (
      startsWithGuard(inner) ||
      (ts.isConditionalExpression(inner) && startsWithGuard(inner.condition)) ||
      (isFunctionLike(inner) && isDevOnlyBody(inner, collections))
    );
  }
  const statements = [...body.statements];
  const earlyReturn = statements.findIndex(isEarlyReturn);
  const kinds = statements.map((statement, index) => {
    if (earlyReturn !== -1 && index > earlyReturn) {
      return 'dev';
    }
    return ts.isVariableStatement(statement)
      ? 'pending'
      : classifyStatement(statement, collections);
  });
  const devRegions = statements.filter(
    (_, index) => kinds[index] === 'dev' || kinds[index] === 'neutral',
  );
  statements.forEach((statement, index) => {
    if (kinds[index] !== 'pending') {
      return;
    }
    const names = new Set(
      statement.declarationList.declarations
        .map((d) => d.name)
        .filter(ts.isIdentifier)
        .map((name) => name.text),
    );
    kinds[index] = usedOnlyWithin(names, body, devRegions) ? 'neutral' : 'prod';
  });
  return kinds.includes('dev') && !kinds.includes('prod');
}

/**
 * Why the innermost named function around a helper call is a dev-only
 * function that is not written guard-first, or null. Such a function is a
 * wrapper in all but shape: its callers' arguments and its own work would
 * ship, and R4 could not see its callers. Every dev-only function must open
 * with the negated early return.
 */
function wrapperShapeProblem(fn, sf) {
  const body = fn.body;
  if (isArgumentlessObjectMember(fn)) {
    return null;
  }
  if (
    !body ||
    (ts.isBlock(body) && body.statements.length > 0 && isEarlyReturn(body.statements[0]))
  ) {
    return null;
  }
  if (!isDevOnlyBody(fn, warnOnceCollections(sf))) {
    return null;
  }
  return ts.isBlock(body)
    ? 'is a dev-only function that is not guard-first'
    : 'is an expression-body dev-only function';
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
    const problem = wrapperShapeProblem(fn, sf);
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
      if (!name || seen.has(fn) || isArgumentlessObjectMember(fn)) {
        continue;
      }
      const body = fn.body;
      if (
        body &&
        ts.isBlock(body) &&
        body.statements.length > 0 &&
        isEarlyReturn(body.statements[0])
      ) {
        const isMember =
          ts.isMethodDeclaration(fn) || isClassFieldFunction(fn) || isObjectMember(fn);
        seen.set(fn, {
          file,
          name,
          line: lineOf(sf, fn),
          kind: isObjectMember(fn) ? 'property' : isMember ? 'method' : 'function',
          exportedAs: isMember ? [] : exportNamesOf(fn, name, sf),
          defaultExport: !isMember && isDefaultExport(fn, name, sf),
        });
      }
    }
  }
  return [...seen.values()];
}

const PLACEMENT = {
  method: 'is a class member',
  property: 'is an object-literal member',
};

/**
 * Wrappers production keeps referenced by where they live. A class keeps its
 * methods in the bundle, and an object literal keeps its members, so the
 * emptied body still imports the helper and its doc URL. A module-level
 * function whose callers are all guarded is unreferenced and tree-shaken.
 *
 * @returns {{ file: string; line: number; problem: string }[]}
 */
export function collectWrapperPlacementProblems(wrappers) {
  return wrappers
    .filter((w) => Object.hasOwn(PLACEMENT, w.kind))
    .map((w) => ({
      file: w.file,
      line: w.line,
      problem: `dev wrapper ${w.name} ${PLACEMENT[w.kind]}; move it to module level so production tree-shakes it`,
    }));
}

/**
 * The files a relative module specifier can name from `from`, or null for a
 * bare or path-mapped specifier (`@cngx/...`), which this read cannot follow.
 */
const moduleFilesOf = (from, specifier) => {
  if (!specifier.startsWith('.')) {
    return null;
  }
  const base = posix.join(posix.dirname(from), specifier);
  return [`${base}.ts`, `${base}/index.ts`, base];
};

/**
 * The wrappers exported as `name` that an import from `files` can reach.
 * When the import does not name the wrapper's own file (a barrel, a
 * path-mapped specifier), every wrapper exported under that name is a
 * candidate.
 */
const exportedWrappers = (wrappers, name, files) => {
  const byName = wrappers.filter((w) => w.exportedAs.includes(name));
  const inFile = files ? byName.filter((w) => files.includes(w.file)) : [];
  return inFile.length > 0 ? inFile : byName;
};

/**
 * Direct calls of a wrapper (by name in its own file, by imported name
 * elsewhere; a method wrapper through any receiver in its own file), plus the
 * problems R4 fails: a wrapper used as a value outside a dev-mode guard (the
 * reference keeps it, the helper and the doc URL in production) and forms R4
 * cannot follow by name. Each call carries the wrappers it can reach
 * (`wrappers`, as `{ file, name }`): the local wrapper of that name, or the
 * exported ones its import resolves to.
 */
export function collectWrapperUses(files, wrappers) {
  const exportedNames = new Set(wrappers.flatMap((w) => w.exportedAs));
  const calls = [];
  const problems = wrappers
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
    /** Local name -> the wrappers it reaches. */
    const reach = new Map();
    for (const w of local.filter((w) => w.kind === 'function')) {
      reach.set(w.name, [...(reach.get(w.name) ?? []), w]);
    }
    const nsReach = new Map();
    for (const statement of sf.statements) {
      const bindings = ts.isImportDeclaration(statement) && statement.importClause?.namedBindings;
      const from =
        bindings && ts.isStringLiteral(statement.moduleSpecifier)
          ? moduleFilesOf(path, statement.moduleSpecifier.text)
          : null;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          const original = (element.propertyName ?? element.name).text;
          if (exportedNames.has(original)) {
            names.add(element.name.text);
            if (!reach.has(element.name.text)) {
              reach.set(element.name.text, exportedWrappers(wrappers, original, from));
            }
          }
        }
      }
      if (bindings && ts.isNamespaceImport(bindings)) {
        namespaces.add(bindings.name.text);
        nsReach.set(bindings.name.text, from);
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
          problems.push({
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
          const reached = byName
            ? reach.get(callee.text)
            : byMember
              ? local.filter((w) => w.kind === 'method' && w.name === callee.name.text)
              : exportedWrappers(wrappers, callee.name.text, nsReach.get(callee.expression.text));
          calls.push({
            file: path,
            line: lineOf(sf, node),
            name: callee.getText(sf),
            node,
            wrappers: reached.map((w) => ({ file: w.file, name: w.name })),
          });
        }
      }
      const nameValue = ts.isIdentifier(node) && names.has(node.text) && isValueUse(node);
      const memberValue =
        ts.isPropertyAccessExpression(node) &&
        (methods.has(node.name.text) || isNamespaceMember(node)) &&
        !(ts.isCallExpression(node.parent) && node.parent.expression === node);
      if ((nameValue || memberValue) && !isLexicallyGuarded(node)) {
        problems.push({
          file: path,
          line: lineOf(sf, node),
          problem: `dev wrapper ${node.getText(sf)} is used as a value outside a dev-mode guard`,
        });
      } else if ((nameValue || memberValue) && runsAtModuleLoad(node)) {
        problems.push({
          file: path,
          line: lineOf(sf, node),
          problem: `dev wrapper ${node.getText(sf)} ${MODULE_LOAD_GUARD}`,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return { calls, problems };
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

/** A `${...}` part, or any operand that is not literal text, in a message. */
export const WILD = Symbol('wild');

/** How `messageText` writes a WILD part. */
export const WILD_TEXT = '${...}';

function rawSegmentsOf(node) {
  const inner = unwrap(node);
  if (ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner)) {
    return [inner.text];
  }
  if (ts.isTemplateExpression(inner)) {
    return [inner.head.text, ...inner.templateSpans.flatMap((span) => [WILD, span.literal.text])];
  }
  if (isPlus(inner)) {
    return [...rawSegmentsOf(inner.left), ...rawSegmentsOf(inner.right)];
  }
  return [WILD];
}

/**
 * A message expression as literal text and WILD parts, without empty
 * literals and with adjacent WILD parts merged, so a WILD is the last
 * segment exactly when no literal text follows it.
 */
export function segmentsOf(node) {
  return rawSegmentsOf(node).reduce((out, part) => {
    if (part === '' || (part === WILD && out.at(-1) === WILD)) {
      return out;
    }
    return [...out, part];
  }, []);
}

/** `segments` as one string, a WILD part written as `${...}`. */
export const messageText = (segments) =>
  segments.map((part) => (part === WILD ? WILD_TEXT : part)).join('');

/** The right-most leaf of an `&&` chain: the message behind a guard. */
function guardedTail(node) {
  let current = unwrap(node);
  while (isAnd(current)) {
    current = unwrap(current.right);
  }
  return current;
}

/**
 * The function whose parameter `message` reads, and the parameter's index,
 * or null. A callback in between that does not declare the name is passed
 * (`afterNextRender(() => cngxDevWarn('CNGXnnnn', message))` reads the
 * wrapper's parameter through a closure).
 */
function wrapperParameterOf(message) {
  const inner = unwrap(message);
  if (!ts.isIdentifier(inner)) {
    return null;
  }
  for (let fn = inner.parent; fn; fn = fn.parent) {
    if (!ts.isFunctionLike(fn) || !fn.parameters) {
      continue;
    }
    const index = fn.parameters.findIndex(
      (param) => ts.isIdentifier(param.name) && param.name.text === inner.text,
    );
    if (index >= 0) {
      return { fn, index };
    }
  }
  return null;
}

/**
 * Every coded message the libs print, as [{ code, file, segments }]. A
 * helper call whose message is a dev wrapper's parameter (also read through
 * a callback inside the wrapper) is followed into the wrapper's callers: the
 * row then names the caller's file, where the text is written. A caller
 * belongs to a wrapper by the wrapper's declaring file and name (an arrow or
 * function expression is named by its variable), so same-named wrappers in
 * two files keep their own rows. Known limit: an import through a barrel or
 * a path-mapped specifier (`@cngx/...`) does not name the wrapper's file;
 * such a caller reaches every exported wrapper of that name, so two
 * exported same-named wrappers imported that way would share their rows. A
 * wrapper with no caller found keeps its own row, with the parameter as a
 * wildcard. A code-only `CngxRuntimeError` contributes the text behind its
 * guard.
 *
 * @param {{ path: string; text: string }[]} files
 * @returns {{ code: string; file: string; segments: (string | symbol)[] }[]}
 */
export function collectMessages(files) {
  const out = [];
  const add = (code, file, node) => {
    if (code && node) {
      out.push({ code, file, segments: segmentsOf(node) });
    }
  };
  const calls = collectHelperCalls(files);
  const wrappers = collectWrappers(calls);
  const { calls: wrapperCalls } = collectWrapperUses(files, wrappers);
  for (const call of calls) {
    const message = call.node.arguments[1];
    const parameter = message ? wrapperParameterOf(message) : null;
    if (!parameter) {
      add(call.code, call.file, message);
      continue;
    }
    const { fn, index } = parameter;
    const name = functionName(fn);
    const callers = wrapperCalls.filter((use) =>
      use.wrappers.some((w) => w.file === call.file && w.name === name),
    );
    for (const use of callers) {
      add(call.code, use.file, use.node.arguments[index]);
    }
    if (callers.length === 0) {
      add(call.code, call.file, message);
    }
  }
  for (const error of collectRuntimeErrors(files)) {
    const message = error.node.arguments[1];
    add(
      error.code,
      error.file,
      message && (error.devOnly ? unwrap(message) : guardedTail(message)),
    );
  }
  return out;
}
