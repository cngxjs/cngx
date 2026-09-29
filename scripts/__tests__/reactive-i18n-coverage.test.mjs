import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  Call,
  ImplicitReceiver,
  KeyedRead,
  parseTemplate,
  PropertyRead,
  SafeCall,
  SafeKeyedRead,
  SafePropertyRead,
  TmplAstBoundAttribute,
  TmplAstElement,
  TmplAstTextAttribute,
} from '@angular/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  componentTemplateOf,
  hostEntries,
  isDecoratorHost,
  REPO_ROOT,
  unwrapExpression,
  walkSources,
} from './_i18n-ast.mjs';
import {
  CALIBRATION_MEMBERS,
  CALIBRATION_REGIONS,
  CALIBRATION_TOKENS,
  COMPLETED_PHASE,
  COPY_TOKENS,
  EXEMPT,
  HELPERS,
  LIVE_REGIONS,
  PHASE_1_KEYS,
  RATCHET,
  RATCHET_CEILING,
  RULE_FIXTURES,
  SETTINGS_TOKENS,
} from './reactive-i18n-coverage.fixtures.mjs';

// Coverage guard for runtime language switching. A2 made every cngx string
// overridable; A2b makes every one of them follow a live language Signal. The
// compiler forces the readers of a retyped token to change, but it cannot see
// a construction-time snapshot of a value that stays a plain string, and it
// cannot see a live region that re-announces when its copy flips. This guard
// does, and it builds the worklist instead of trusting a hand list:
//
//   discovery  every exported `InjectionToken` is classified copy or settings
//              in the fixtures; an unclassified token fails. For a copy token
//              the fixtures partition its interface keys into copy keys and
//              settings keys, checked against the type.
//   R1         an `input()` / `model()` default reads copy - a static copy
//              input that never follows a flip while unbound.
//   R2         copy read at construction (field initializer, constructor,
//              token factory, provider `useFactory`), outside any function
//              body - a snapshot.
//   R3         a raw dereference below a copy key or of a dedicated bundle
//              (`cfg.ariaLabels.x`, `{ ...base.labels }`, `inject(I18N).x`),
//              outside the argument of `coerceSignal` / `createOverrideMerge`
//              / `createNestedOverrideMerge` and outside a registered helper.
//   R4         a live region reads copy tracked - a copy flip would re-speak it.
//
// Copy reads are found through the type checker, not through names: a value
// is copy when its type is a copy token's type, a copy key's value type, or a
// Signal of either, and the locale counts as copy. Every finding is a ratchet
// row with the phase that closes it; every live region that renders copy has a
// manifest entry naming the spec that proves it does not re-speak on a flip.

/** Aliases that wrap a copy type without changing what it is. */
const TRANSPARENT_ALIASES = new Set(['Partial', 'Readonly', 'Required']);

/** Calls whose argument position may carry a copy key as a value. */
const MERGE_HELPERS = new Set(['coerceSignal', 'createOverrideMerge', 'createNestedOverrideMerge']);

/** `role` values that make an element a live region. */
const LIVE_ROLES = new Set(['status', 'alert', 'log']);

/**
 * @typedef {object} CopyTokenSpec
 * @property {string} token
 * @property {'dedicated' | 'config' | 'locale'} kind
 * @property {'*' | readonly string[]} copyKeys
 * @property {readonly string[]} settingsKeys
 * @property {number} closesIn
 */

/**
 * @typedef {object} Finding
 * @property {string} file
 * @property {string} member
 * @property {'R1' | 'R2' | 'R3' | 'R4'} rule
 * @property {string} token
 */

/**
 * @typedef {object} Region
 * @property {string} file
 * @property {string} region
 * @property {readonly string[]} tokens
 */

// ---------------------------------------------------------------------------
// Program

/**
 * A type-checked program over `files`. `virtual` maps absolute paths to
 * in-memory sources, so the rule fixtures resolve `@angular/core` from the
 * repo's `node_modules` without touching disk.
 *
 * @param {readonly string[]} files absolute paths
 * @param {Readonly<Record<string, string>>} [virtual]
 * @returns {ts.Program}
 */
export function createProgram(files, virtual = {}) {
  const config = ts.readConfigFile(
    resolve(REPO_ROOT, 'tsconfig.base.json'),
    ts.sys.readFile,
  ).config;
  const { options } = ts.convertCompilerOptionsFromJson(config.compilerOptions, REPO_ROOT);
  const compilerOptions = { ...options, noEmit: true };
  const host = ts.createCompilerHost(compilerOptions, true);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  host.readFile = (name) => virtual[name] ?? readFile(name);
  host.fileExists = (name) => name in virtual || fileExists(name);
  const directoryExists = host.directoryExists?.bind(host) ?? ts.sys.directoryExists;
  host.directoryExists = (dir) =>
    Object.keys(virtual).some((path) => path.startsWith(`${dir}/`)) || directoryExists(dir);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) =>
    name in virtual
      ? ts.createSourceFile(name, virtual[name], languageVersion, true)
      : getSourceFile(name, languageVersion, onError, shouldCreate);
  return ts.createProgram(files, compilerOptions, host);
}

/**
 * Every `export const X = new InjectionToken<T>(...)` in `sourceFiles`.
 *
 * @param {readonly ts.SourceFile[]} sourceFiles
 * @returns {{ token: string; sf: ts.SourceFile; typeNode: ts.TypeNode | undefined; node: ts.NewExpression }[]}
 */
export function discoverTokens(sourceFiles) {
  const out = [];
  for (const sf of sourceFiles) {
    for (const statement of sf.statements) {
      const exported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!ts.isVariableStatement(statement) || !exported) {
        continue;
      }
      for (const declaration of statement.declarationList.declarations) {
        const init = unwrapExpression(declaration.initializer);
        const isToken =
          !!init &&
          ts.isNewExpression(init) &&
          ts.isIdentifier(init.expression) &&
          init.expression.text === 'InjectionToken';
        if (isToken && ts.isIdentifier(declaration.name)) {
          out.push({
            token: declaration.name.text,
            sf,
            typeNode: init.typeArguments?.[0],
            node: init,
          });
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Copy model

/**
 * @param {ts.Type} type
 * @returns {boolean}
 */
const isSignalType = (type) =>
  type.getCallSignatures().length > 0 &&
  type.getProperties().some((p) => String(p.escapedName).includes('SIGNAL'));

/**
 * A copy key whose value is used directly (a string, a formatter) rather
 * than as a bundle of further keys.
 *
 * @param {ts.TypeChecker} checker
 * @param {ts.Type} type
 */
const isFlatValue = (checker, type) => {
  const nonNull = checker.getNonNullableType(type);
  const members = nonNull.isUnion() ? nonNull.types : [nonNull];
  return members.every(
    (m) =>
      !!(
        m.flags &
        (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike)
      ) || m.getCallSignatures().length > 0,
  );
};

/**
 * @typedef {object} CopyModel
 * @property {ts.TypeChecker} checker
 * @property {Map<ts.Symbol, { kind: 'value' | 'config'; token: string; copyKeys: ReadonlySet<string> | null }>} types
 * @property {ReadonlySet<string>} localeTokens
 * @property {ReadonlySet<string>} helpers
 * @property {Map<string, readonly string[]>} typeKeys every copy token's interface keys
 */

/**
 * @param {ts.TypeChecker} checker
 * @param {ts.Type} type
 * @returns {ts.Type}
 */
const unwrapAlias = (checker, type) => {
  let current = checker.getNonNullableType(type);
  while (current.aliasSymbol && TRANSPARENT_ALIASES.has(current.aliasSymbol.getName())) {
    const inner = current.aliasTypeArguments?.[0];
    if (!inner) {
      break;
    }
    current = checker.getNonNullableType(inner);
  }
  return current;
};

/**
 * The symbol that names a (possibly aliased) object type: the type alias
 * (`ErrorMessageMap`) or the interface.
 *
 * @param {ts.TypeChecker} checker
 * @param {ts.Type} type
 */
const namingSymbol = (checker, type) => {
  const unwrapped = unwrapAlias(checker, type);
  return unwrapped.aliasSymbol ?? unwrapped.getSymbol();
};

/**
 * Is the symbol declared in a source the scan owns (not a lib or package)?
 *
 * @param {ts.Symbol | undefined} symbol
 */
const isOwnSymbol = (symbol) =>
  !!symbol?.declarations?.length &&
  symbol.declarations.every((d) => !d.getSourceFile().fileName.includes('node_modules'));

/**
 * @param {ts.Program} program
 * @param {ReturnType<typeof discoverTokens>} tokens
 * @param {readonly CopyTokenSpec[]} copyTokens
 * @param {readonly string[]} helpers
 * @returns {CopyModel}
 */
export function buildCopyModel(program, tokens, copyTokens, helpers) {
  const checker = program.getTypeChecker();
  /** @type {CopyModel['types']} */
  const types = new Map();
  const typeKeys = new Map();
  const localeTokens = new Set();
  const byName = new Map(tokens.map((t) => [t.token, t]));
  for (const spec of copyTokens) {
    const found = byName.get(spec.token);
    if (!found?.typeNode) {
      continue;
    }
    if (spec.kind === 'locale') {
      localeTokens.add(spec.token);
      continue;
    }
    let type = checker.getTypeFromTypeNode(found.typeNode);
    if (isSignalType(type)) {
      type = checker.getReturnTypeOfSignature(type.getCallSignatures()[0]);
    }
    const symbol = namingSymbol(checker, type);
    const keys = unwrapAlias(checker, type)
      .getProperties()
      .map((p) => p.getName());
    typeKeys.set(spec.token, keys);
    if (!symbol) {
      continue;
    }
    const copyKeys = spec.copyKeys === '*' ? null : new Set(spec.copyKeys);
    types.set(symbol, { kind: copyKeys ? 'config' : 'value', token: spec.token, copyKeys });
    if (!copyKeys) {
      continue;
    }
    for (const key of copyKeys) {
      const property = unwrapAlias(checker, type).getProperty(key);
      if (!property) {
        continue;
      }
      const propertyType = checker.getTypeOfSymbol(property);
      const members = propertyType.isUnion() ? propertyType.types : [propertyType];
      for (const member of members) {
        const valueSymbol = isSignalType(member) ? undefined : namingSymbol(checker, member);
        if (isOwnSymbol(valueSymbol) && !types.has(valueSymbol)) {
          types.set(valueSymbol, { kind: 'value', token: spec.token, copyKeys: null });
        }
      }
    }
  }
  return { checker, types, localeTokens, helpers: new Set(helpers), typeKeys };
}

// ---------------------------------------------------------------------------
// Origins

/**
 * Where a value comes from, as far as copy is concerned:
 *
 * - `raw`     a plain copy value: a dedicated bundle, a copy key's value
 * - `config`  a config object that has copy keys
 * - `signal`  read out of a Signal (`this.labels()`, `this.labels().x`)
 * - `param`   a parameter typed as a copy value: a pure function over copy
 * - `static`  a module-level const (`DEFAULTS.ariaLabels`), never overridden
 * - `locale`  the locale Signal itself
 *
 * @typedef {{ kind: 'raw' | 'config' | 'signal' | 'param' | 'static' | 'locale'; token: string } | null} Origin
 */

/**
 * @param {CopyModel} model
 * @param {ts.Type} type
 * @returns {Origin}
 */
const originOfType = (model, type) => {
  const nonNull = model.checker.getNonNullableType(type);
  const members = nonNull.isUnion() ? nonNull.types : [nonNull];
  for (const member of members) {
    if (isSignalType(member)) {
      continue;
    }
    const info = model.types.get(namingSymbol(model.checker, member));
    if (info) {
      return { kind: info.kind === 'config' ? 'config' : 'raw', token: info.token };
    }
  }
  return null;
};

/**
 * The copy value type a Signal carries, as an origin; `null` for a Signal of
 * anything else.
 *
 * @param {CopyModel} model
 * @param {ts.Type} type
 * @returns {Origin}
 */
const signalValueOrigin = (model, type) => {
  const nonNull = model.checker.getNonNullableType(type);
  const members = nonNull.isUnion() ? nonNull.types : [nonNull];
  for (const member of members) {
    if (isSignalType(member)) {
      const value = model.checker.getReturnTypeOfSignature(member.getCallSignatures()[0]);
      const origin = originOfType(model, value);
      if (origin) {
        return origin;
      }
    }
  }
  return null;
};

/**
 * @param {CopyModel} model
 * @param {ts.PropertyAccessExpression | ts.ElementAccessExpression} node
 * @param {Origin} objectOrigin
 */
const isCopyKeyAccess = (model, node, objectOrigin) => {
  if (objectOrigin?.kind !== 'config' || !ts.isPropertyAccessExpression(node)) {
    return false;
  }
  const info = [...model.types.values()].find((i) => i.token === objectOrigin.token && i.copyKeys);
  return !!info?.copyKeys?.has(node.name.text);
};

/** @param {ts.Node} node */
const isModuleLevelConst = (node) =>
  ts.isVariableDeclaration(node) &&
  ts.isVariableDeclarationList(node.parent) &&
  ts.isVariableStatement(node.parent.parent) &&
  ts.isSourceFile(node.parent.parent.parent);

/**
 * @param {CopyModel} model
 * @param {ts.Node} node
 * @param {Map<ts.Node, Origin>} cache
 * @param {Set<ts.Node>} [visiting]
 * @returns {Origin}
 */
function originOf(model, node, cache, visiting = new Set()) {
  if (cache.has(node)) {
    return cache.get(node);
  }
  if (visiting.has(node)) {
    return null;
  }
  visiting.add(node);
  const origin = computeOrigin(model, node, cache, visiting);
  visiting.delete(node);
  cache.set(node, origin);
  return origin;
}

/**
 * @param {CopyModel} model
 * @param {ts.Node} rawNode
 * @param {Map<ts.Node, Origin>} cache
 * @param {Set<ts.Node>} visiting
 * @returns {Origin}
 */
function computeOrigin(model, rawNode, cache, visiting) {
  const { checker } = model;
  const node = unwrapExpression(rawNode) ?? rawNode;
  const byType = () => originOfType(model, checker.getTypeAtLocation(node));

  if (ts.isCallExpression(node)) {
    const callee = unwrapExpression(node.expression);
    const name = ts.isIdentifier(callee) ? callee.text : '';
    if (name === 'injectLocale') {
      return { kind: 'locale', token: [...model.localeTokens][0] ?? 'CNGX_LOCALE' };
    }
    const tokenArg = node.arguments[0];
    if (
      name === 'inject' &&
      tokenArg &&
      ts.isIdentifier(tokenArg) &&
      model.localeTokens.has(tokenArg.text)
    ) {
      return { kind: 'locale', token: tokenArg.text };
    }
    if (isSignalType(checker.getTypeAtLocation(callee))) {
      const calleeOrigin = originOf(model, callee, cache, visiting);
      const value = signalValueOrigin(model, checker.getTypeAtLocation(callee));
      if (calleeOrigin?.kind === 'locale' || value) {
        return { kind: 'signal', token: value?.token ?? calleeOrigin.token };
      }
      return null;
    }
    return byType();
  }

  if (ts.isIdentifier(node)) {
    let symbol = checker.getSymbolAtLocation(node);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
      symbol = checker.getAliasedSymbol(symbol);
    }
    const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    if (!declaration) {
      return byType();
    }
    if (ts.isParameter(declaration)) {
      const typed = originOfType(model, checker.getTypeAtLocation(declaration));
      return typed?.kind === 'raw' ? { kind: 'param', token: typed.token } : typed;
    }
    if (isModuleLevelConst(declaration) && declaration.initializer) {
      const init = unwrapExpression(declaration.initializer);
      const isFactoryCall = ts.isCallExpression(init) || ts.isNewExpression(init);
      if (!isFactoryCall) {
        const typed = byType();
        return typed ? { kind: 'static', token: typed.token } : null;
      }
    }
    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      return originOf(model, declaration.initializer, cache, visiting) ?? byType();
    }
    return byType();
  }

  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const object = node.expression;
    if (object.kind === ts.SyntaxKind.ThisKeyword && ts.isPropertyAccessExpression(node)) {
      const symbol = checker.getSymbolAtLocation(node.name);
      const declaration = symbol?.valueDeclaration;
      if (declaration && ts.isPropertyDeclaration(declaration) && declaration.initializer) {
        return originOf(model, declaration.initializer, cache, visiting) ?? byType();
      }
      return byType();
    }
    const objectOrigin = originOf(model, object, cache, visiting);
    if (objectOrigin && ['signal', 'param', 'static'].includes(objectOrigin.kind)) {
      return objectOrigin;
    }
    if (objectOrigin?.kind === 'raw') {
      return objectOrigin;
    }
    if (isCopyKeyAccess(model, node, objectOrigin)) {
      return { kind: 'raw', token: objectOrigin.token };
    }
    return byType();
  }

  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    if (op === ts.SyntaxKind.QuestionQuestionToken || op === ts.SyntaxKind.BarBarToken) {
      return (
        originOf(model, node.left, cache, visiting) ?? originOf(model, node.right, cache, visiting)
      );
    }
    return null;
  }

  return byType();
}

// ---------------------------------------------------------------------------
// Scopes

/** @param {ts.Node} node */
const isFunctionLike = (node) =>
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isGetAccessorDeclaration(node) ||
  ts.isSetAccessorDeclaration(node) ||
  ts.isConstructorDeclaration(node);

/**
 * A function that runs once, in an injection context, when the value is
 * created: a constructor, an `InjectionToken` `factory` or a provider
 * `useFactory`.
 *
 * @param {ts.Node} fn
 */
const isConstructionFunction = (fn) => {
  if (ts.isConstructorDeclaration(fn)) {
    return true;
  }
  const property = fn.parent;
  if (!property || !ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
    return false;
  }
  if (property.name.text === 'useFactory') {
    return true;
  }
  const newExpression = property.parent?.parent;
  return (
    property.name.text === 'factory' &&
    !!newExpression &&
    ts.isNewExpression(newExpression) &&
    ts.isIdentifier(newExpression.expression) &&
    newExpression.expression.text === 'InjectionToken'
  );
};

/**
 * Where a node runs relative to construction.
 *
 * @param {ts.Node} node
 * @returns {'construction' | 'input-default' | 'lazy' | 'module'}
 */
const scopeOf = (node) => {
  let child = node;
  for (let current = node.parent; current; child = current, current = current.parent) {
    if (ts.isCallExpression(current) && current.arguments[0] === child) {
      const callee = unwrapExpression(current.expression);
      const isInput = ts.isIdentifier(callee) && ['input', 'model'].includes(callee.text);
      if (isInput && current.parent && ts.isPropertyDeclaration(current.parent)) {
        return 'input-default';
      }
    }
    if (isFunctionLike(current)) {
      return isConstructionFunction(current) ? 'construction' : 'lazy';
    }
    if (ts.isPropertyDeclaration(current)) {
      return 'construction';
    }
  }
  return 'module';
};

/**
 * Is the node the (possibly `??`-coalesced) argument of a merge helper?
 *
 * @param {ts.Node} node
 */
const isMergeHelperArgument = (node) => {
  let child = node;
  for (let current = node.parent; current; child = current, current = current.parent) {
    if (ts.isParenthesizedExpression(current) || ts.isAsExpression(current)) {
      continue;
    }
    if (
      ts.isBinaryExpression(current) &&
      current.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    ) {
      continue;
    }
    if (ts.isCallExpression(current) && current.arguments.includes(child)) {
      const callee = unwrapExpression(current.expression);
      return ts.isIdentifier(callee) && MERGE_HELPERS.has(callee.text);
    }
    return false;
  }
  return false;
};

/**
 * Is the node inside the function argument of an `untracked(...)` call?
 *
 * @param {ts.Node} node
 * @param {ts.Node} boundary
 */
const isUntracked = (node, boundary) => {
  for (let current = node.parent; current && current !== boundary; current = current.parent) {
    if (ts.isCallExpression(current)) {
      const callee = unwrapExpression(current.expression);
      if (ts.isIdentifier(callee) && callee.text === 'untracked') {
        return true;
      }
    }
  }
  return false;
};

/**
 * The name a finding is keyed by: `Class.member` inside a class, else the
 * top-level declaration.
 *
 * @param {ts.Node} node
 */
const memberKeyOf = (node) => {
  let member = null;
  for (let current = node; current; current = current.parent) {
    const isMember =
      ts.isPropertyDeclaration(current) ||
      ts.isMethodDeclaration(current) ||
      ts.isGetAccessorDeclaration(current) ||
      ts.isSetAccessorDeclaration(current) ||
      ts.isConstructorDeclaration(current);
    if (isMember && !member) {
      member = ts.isConstructorDeclaration(current) ? 'constructor' : current.name?.getText();
    }
    if (ts.isDecorator(current) && !member) {
      const call = current.expression;
      member = `@${ts.isCallExpression(call) ? call.expression.getText() : call.getText()}`;
    }
    if (ts.isClassLike(current)) {
      return `${current.name?.text ?? '(anonymous)'}.${member ?? '(class)'}`;
    }
    if (ts.isSourceFile(current.parent ?? current)) {
      if (ts.isFunctionDeclaration(current) || ts.isClassDeclaration(current)) {
        return current.name?.text ?? '(anonymous)';
      }
      if (ts.isVariableStatement(current)) {
        return current.declarationList.declarations.map((d) => d.name.getText()).join(',');
      }
      return '(module)';
    }
  }
  return '(module)';
};

// ---------------------------------------------------------------------------
// Read events

/**
 * @typedef {object} ReadEvent
 * @property {'signal' | 'deref' | 'key'} kind
 * @property {string} token
 * @property {boolean} [flat] a `key` read whose value is the copy itself
 * @property {ts.Node} node
 */

/**
 * Copy reads at one node, if any:
 *
 * - `signal`  a Signal of copy (or the locale) is called
 * - `deref`   a raw copy value is dereferenced, spread, destructured or called
 * - `key`     a config copy key is taken as a value; `flat` when that value
 *             is the copy itself (a string, a formatter), not a bundle
 *
 * @param {CopyModel} model
 * @param {ts.Node} node
 * @param {Map<ts.Node, Origin>} cache
 * @returns {ReadEvent | null}
 */
function readEventAt(model, node, cache) {
  const { checker } = model;
  if (ts.isCallExpression(node)) {
    const callee = unwrapExpression(node.expression);
    const calleeType = checker.getTypeAtLocation(callee);
    if (isSignalType(calleeType)) {
      const origin = originOf(model, node, cache);
      return origin?.kind === 'signal' ? { kind: 'signal', token: origin.token, node } : null;
    }
    const calleeOrigin = originOf(model, callee, cache);
    const isKeyValue =
      calleeOrigin?.kind === 'raw' &&
      (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee));
    return isKeyValue ? { kind: 'deref', token: calleeOrigin.token, node } : null;
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    if (node.expression.kind === ts.SyntaxKind.ThisKeyword) {
      return null;
    }
    const objectOrigin = originOf(model, node.expression, cache);
    if (objectOrigin?.kind === 'raw') {
      return { kind: 'deref', token: objectOrigin.token, node };
    }
    if (isCopyKeyAccess(model, node, objectOrigin) && !isMergeHelperArgument(node)) {
      const flat = isFlatValue(checker, checker.getTypeAtLocation(node));
      return { kind: 'key', token: objectOrigin.token, node, flat };
    }
    return null;
  }
  if (ts.isSpreadAssignment(node) || ts.isSpreadElement(node)) {
    const origin = originOf(model, node.expression, cache);
    const spreadsCopy = origin && ['raw', 'param'].includes(origin.kind);
    return spreadsCopy ? { kind: 'deref', token: origin.token, node } : null;
  }
  if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && node.initializer) {
    const origin = originOf(model, node.initializer, cache);
    return origin?.kind === 'raw' ? { kind: 'deref', token: origin.token, node } : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Templates

/**
 * @typedef {object} TemplateRead
 * @property {string} root the class member the chain starts at
 * @property {ReadEvent['kind'] | 'member'} kind
 * @property {string | null} token
 * @property {boolean} [flat]
 */

/**
 * Evaluates Angular expression chains against the component class type:
 * every chain rooted at a class member reports the member, plus a copy read
 * event where the chain calls a copy Signal, dereferences raw copy or takes a
 * config copy key.
 *
 * @param {CopyModel} model
 * @param {ts.Type} classType
 * @param {Map<string, Origin>} memberOrigins
 * @param {unknown} ast
 * @param {TemplateRead[]} out
 */
function templateReads(model, classType, memberOrigins, ast, out) {
  const { checker } = model;
  const memo = new Map();

  /** @returns {{ root: string; type: ts.Type; origin: Origin } | null} */
  const evaluate = (node) => {
    if (memo.has(node)) {
      return memo.get(node);
    }
    let result = null;
    if (
      (node instanceof PropertyRead || node instanceof SafePropertyRead) &&
      node.receiver instanceof ImplicitReceiver
    ) {
      const symbol = classType.getProperty(node.name);
      if (symbol) {
        const type = checker.getTypeOfSymbol(symbol);
        const origin = memberOrigins.get(node.name) ?? originOfType(model, type);
        out.push({ root: node.name, kind: 'member', token: null });
        result = { root: node.name, type, origin };
      }
    } else if (node instanceof PropertyRead || node instanceof SafePropertyRead) {
      const receiver = evaluate(node.receiver);
      if (receiver) {
        const property = checker.getNonNullableType(receiver.type).getProperty(node.name);
        const type = property ? checker.getTypeOfSymbol(property) : checker.getAnyType();
        let origin = receiver.origin;
        if (origin?.kind === 'raw') {
          out.push({ root: receiver.root, kind: 'deref', token: origin.token });
        } else if (origin?.kind === 'config') {
          const info = [...model.types.values()].find(
            (i) => i.token === origin.token && i.copyKeys,
          );
          if (info?.copyKeys?.has(node.name)) {
            const flat = isFlatValue(checker, type);
            out.push({ root: receiver.root, kind: 'key', token: origin.token, flat });
            origin = { kind: 'raw', token: origin.token };
          } else {
            origin = originOfType(model, type);
          }
        } else if (!origin || origin.kind !== 'signal') {
          origin = originOfType(model, type);
        }
        result = { root: receiver.root, type, origin };
      }
    } else if (node instanceof KeyedRead || node instanceof SafeKeyedRead) {
      const receiver = evaluate(node.receiver);
      if (receiver?.origin?.kind === 'raw') {
        out.push({ root: receiver.root, kind: 'deref', token: receiver.origin.token });
      }
      result = receiver ? { ...receiver, type: checker.getAnyType() } : null;
    } else if (node instanceof Call || node instanceof SafeCall) {
      const callee = evaluate(node.receiver);
      if (callee) {
        const calleeType = checker.getNonNullableType(callee.type);
        if (isSignalType(calleeType)) {
          const value = signalValueOrigin(model, calleeType);
          const token =
            value?.token ?? (callee.origin?.kind === 'locale' ? callee.origin.token : null);
          if (token) {
            out.push({ root: callee.root, kind: 'signal', token });
          }
          const returned = checker.getReturnTypeOfSignature(calleeType.getCallSignatures()[0]);
          result = {
            root: callee.root,
            type: returned,
            origin: token ? { kind: 'signal', token } : null,
          };
        } else {
          if (callee.origin?.kind === 'raw') {
            out.push({ root: callee.root, kind: 'deref', token: callee.origin.token });
          }
          const signature = calleeType.getCallSignatures()[0];
          const returned = signature
            ? checker.getReturnTypeOfSignature(signature)
            : checker.getAnyType();
          result = { root: callee.root, type: returned, origin: originOfType(model, returned) };
        }
      }
    }
    memo.set(node, result);
    return result;
  };

  const seen = new Set();
  const walk = (value) => {
    if (!value || typeof value !== 'object' || seen.has(value)) {
      return;
    }
    seen.add(value);
    if (
      value instanceof PropertyRead ||
      value instanceof SafePropertyRead ||
      value instanceof KeyedRead ||
      value instanceof SafeKeyedRead ||
      value instanceof Call ||
      value instanceof SafeCall
    ) {
      evaluate(value);
    }
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      walk(child);
    }
  };
  walk(ast);
}

/**
 * The live regions of a parsed template: elements with `aria-live` (static
 * or bound) or a live `role`, each with the template nodes of its subtree.
 *
 * @param {readonly unknown[]} nodes
 * @returns {{ id: string; subtree: unknown }[]}
 */
function templateRegions(nodes) {
  const regions = [];
  const counts = new Map();
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== 'object' || seen.has(value)) {
      return;
    }
    seen.add(value);
    if (value instanceof TmplAstElement) {
      const attributes = [...value.attributes, ...value.inputs];
      const isLive = attributes.some(
        (a) =>
          (a instanceof TmplAstTextAttribute && a.name === 'aria-live') ||
          (a instanceof TmplAstBoundAttribute && a.name === 'aria-live') ||
          (a instanceof TmplAstTextAttribute && a.name === 'role' && LIVE_ROLES.has(a.value)),
      );
      if (isLive) {
        const n = (counts.get(value.name) ?? 0) + 1;
        counts.set(value.name, n);
        regions.push({ id: `${value.name}#${n}`, subtree: value });
      }
    }
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      visit(child);
    }
  };
  visit(nodes);
  return regions;
}

/**
 * Host bindings as one parsed template: `<x [binding]="expr" ...>`.
 *
 * @param {{ name: string; value: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral }[]} entries
 * @param {string} fileName
 */
const hostBindingAst = (entries, fileName) => {
  const bindings = entries
    .filter((e) => e.name.startsWith('['))
    .map((e) => `${e.name}="${e.value.text.replace(/"/g, '&quot;')}"`)
    .join(' ');
  return parseTemplate(`<x ${bindings}></x>`, fileName, { preserveWhitespaces: false }).nodes;
};

// ---------------------------------------------------------------------------
// File analysis

/**
 * @param {ts.Node} node
 * @returns {ts.CallExpression | undefined}
 */
const decoratorCall = (node, names) =>
  ts
    .getDecorators(node)
    ?.map((d) => d.expression)
    .find(
      (e) =>
        ts.isCallExpression(e) &&
        ts.isIdentifier(e.expression) &&
        names.includes(e.expression.text),
    );

/**
 * Runs R1-R4 over one source file.
 *
 * @param {CopyModel} model
 * @param {ts.SourceFile} sf
 * @param {string} fileName repo-relative (or fixture) path reported in findings
 * @returns {{ findings: Finding[]; regions: Region[]; unscannable: string[] }}
 */
export function analyzeFile(model, sf, fileName) {
  const cache = new Map();
  /** @type {Map<string, Finding>} */
  const findings = new Map();
  /** @type {Region[]} */
  const regions = [];
  const unscannable = [];
  const add = (member, rule, token) => {
    findings.set(`${member}\t${rule}\t${token}`, { file: fileName, member, rule, token });
  };

  const isInHelperBody = (node) => {
    for (let current = node.parent; current; current = current.parent) {
      const named =
        (ts.isFunctionDeclaration(current) && current.name) ||
        (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name) && current.name);
      if (named && model.helpers.has(named.text)) {
        return true;
      }
    }
    return false;
  };

  // R1-R3: every read event in the file.
  const visit = (node) => {
    const event = readEventAt(model, node, cache);
    if (event) {
      const scope = scopeOf(node);
      const member = memberKeyOf(node);
      if (scope === 'input-default') {
        add(member, 'R1', event.token);
      } else if (scope === 'construction') {
        add(member, 'R2', event.token);
      } else if ((event.kind === 'deref' || event.flat) && !isInHelperBody(node)) {
        add(member, 'R3', event.token);
      }
    }
    node.forEachChild(visit);
  };
  visit(sf);

  // Per class: carrier fixpoint, R1 through carriers, R4.
  for (const cls of sf.statements.filter(ts.isClassDeclaration)) {
    analyzeClass(model, cls, sf, fileName, cache, add, regions, unscannable);
  }

  return { findings: [...findings.values()], regions, unscannable };
}

/**
 * @param {CopyModel} model
 * @param {ts.ClassDeclaration} cls
 * @param {ts.SourceFile} sf
 * @param {string} fileName
 * @param {Map<ts.Node, Origin>} cache
 * @param {(member: string, rule: Finding['rule'], token: string) => void} add
 * @param {Region[]} regions
 * @param {string[]} unscannable
 */
function analyzeClass(model, cls, sf, fileName, cache, add, regions, unscannable) {
  const { checker } = model;
  const className = cls.name?.text ?? '(anonymous)';
  const members = cls.members.filter(
    (m) =>
      (ts.isPropertyDeclaration(m) && m.initializer) ||
      ((ts.isMethodDeclaration(m) || ts.isGetAccessorDeclaration(m)) && m.body),
  );
  const bodyOf = (m) => (ts.isPropertyDeclaration(m) ? m.initializer : m.body);
  const nameOf = (m) => m.name.getText(sf);

  /** @type {Map<string, Origin>} */
  const memberOrigins = new Map();
  for (const m of members) {
    if (ts.isPropertyDeclaration(m)) {
      memberOrigins.set(nameOf(m), originOf(model, m.initializer, cache));
    }
  }

  // Copy tokens each member reads: `tracked` skips `untracked(...)` bodies,
  // `touching` does not. Fixpoint over `this.x` references between members.
  /** @param {boolean} includeUntracked */
  const carriers = (includeUntracked) => {
    /** @type {Map<string, Set<string>>} */
    const tokens = new Map(members.map((m) => [nameOf(m), new Set()]));
    const direct = new Map();
    const refs = new Map();
    for (const m of members) {
      const body = bodyOf(m);
      const own = new Set();
      const references = new Set();
      const walk = (node) => {
        if (!includeUntracked && isUntracked(node, body)) {
          return;
        }
        const event = readEventAt(model, node, cache);
        if (event) {
          own.add(event.token);
        }
        if (
          ts.isPropertyAccessExpression(node) &&
          node.expression.kind === ts.SyntaxKind.ThisKeyword &&
          tokens.has(node.name.text)
        ) {
          references.add(node.name.text);
        }
        node.forEachChild(walk);
      };
      walk(body);
      direct.set(nameOf(m), own);
      refs.set(nameOf(m), references);
    }
    for (const [name, own] of direct) {
      own.forEach((t) => tokens.get(name).add(t));
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const [name, references] of refs) {
        const set = tokens.get(name);
        for (const ref of references) {
          for (const t of tokens.get(ref) ?? []) {
            if (!set.has(t)) {
              set.add(t);
              changed = true;
            }
          }
        }
      }
    }
    return tokens;
  };
  const tracked = carriers(false);
  const touching = carriers(true);

  // R1 through a carrier: an input default reading a copy-derived member.
  for (const m of members) {
    if (!ts.isPropertyDeclaration(m)) {
      continue;
    }
    const walk = (node) => {
      if (
        ts.isPropertyAccessExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ThisKeyword &&
        scopeOf(node) === 'input-default'
      ) {
        for (const t of tracked.get(node.name.text) ?? []) {
          add(`${className}.${nameOf(m)}`, 'R1', t);
        }
      }
      node.forEachChild(walk);
    };
    walk(m.initializer);
  }

  // R4 through an effect that announces tracked copy.
  const effectOwners = [
    ...members
      .filter(ts.isPropertyDeclaration)
      .map((m) => ({ key: nameOf(m), node: m.initializer })),
    ...cls.members
      .filter(ts.isConstructorDeclaration)
      .filter((c) => c.body)
      .map((c) => ({ key: 'constructor', node: c.body })),
  ];
  for (const owner of effectOwners) {
    let ordinal = 0;
    const walk = (node) => {
      const callee = ts.isCallExpression(node) ? unwrapExpression(node.expression) : undefined;
      if (callee && ts.isIdentifier(callee) && callee.text === 'effect' && node.arguments[0]) {
        ordinal++;
        const effectBody = node.arguments[0];
        let announces = false;
        const trackedTokens = new Set();
        const touchingTokens = new Set();
        const inner = (child) => {
          if (ts.isCallExpression(child)) {
            const c = unwrapExpression(child.expression);
            const name = ts.isPropertyAccessExpression(c)
              ? c.name.text
              : ts.isIdentifier(c)
                ? c.text
                : '';
            announces ||= /announce$/i.test(name);
          }
          const untracked = isUntracked(child, effectBody);
          const event = readEventAt(model, child, cache);
          const refTokens =
            ts.isPropertyAccessExpression(child) &&
            child.expression.kind === ts.SyntaxKind.ThisKeyword
              ? [...((untracked ? touching : tracked).get(child.name.text) ?? [])]
              : [];
          const found = [...(event ? [event.token] : []), ...refTokens];
          found.forEach((t) => touchingTokens.add(t));
          if (!untracked) {
            found.forEach((t) => trackedTokens.add(t));
          }
          child.forEachChild(inner);
        };
        inner(effectBody);
        if (announces && touchingTokens.size) {
          regions.push({
            file: fileName,
            region: `${className}.${owner.key}:effect#${ordinal}`,
            tokens: [...touchingTokens].sort(),
          });
          trackedTokens.forEach((t) => add(`${className}.${owner.key}`, 'R4', t));
        }
      }
      node.forEachChild(walk);
    };
    walk(owner.node);
  }

  // Templates and host bindings.
  const classType = checker.getDeclaredTypeOfSymbol(checker.getSymbolAtLocation(cls.name));
  const component = decoratorCall(cls, ['Component']);
  const directive = component ?? decoratorCall(cls, ['Directive']);
  if (!directive) {
    return;
  }
  const meta = directive.arguments[0];
  const hostProperty =
    meta && ts.isObjectLiteralExpression(meta) ? meta.properties.find(isDecoratorHost) : undefined;
  const host = hostProperty ? hostEntries(hostProperty) : [];

  const readsOf = (ast) => {
    const out = [];
    templateReads(model, classType, memberOrigins, ast, out);
    return out;
  };
  /** Tokens a set of reads touches, and the tracked subset per root member. */
  const classify = (reads) => {
    const touched = new Set();
    /** @type {Map<string, Set<string>>} */
    const trackedByRoot = new Map();
    const note = (root, token) => {
      touched.add(token);
      if (!trackedByRoot.has(root)) {
        trackedByRoot.set(root, new Set());
      }
      trackedByRoot.get(root).add(token);
    };
    for (const read of reads) {
      if (read.kind === 'member') {
        (touching.get(read.root) ?? []).forEach((t) => touched.add(t));
        (tracked.get(read.root) ?? []).forEach((t) => note(read.root, t));
      } else {
        note(read.root, read.token);
      }
    }
    return { touched, trackedByRoot };
  };
  const addTemplateDerefs = (reads) => {
    for (const read of reads) {
      if (read.kind === 'deref' || read.flat) {
        add(`${className}.template:${read.root}`, 'R3', read.token);
      }
    }
  };

  const hostAst = host.length ? hostBindingAst(host, fileName) : [];
  const hostReads = readsOf(hostAst);
  addTemplateDerefs(hostReads);

  let templateNodes = [];
  if (component) {
    const template = componentTemplateOf(component, sf, fileName);
    if (template === null) {
      unscannable.push(`${fileName}: ${className} template does not resolve`);
    } else if (template) {
      const parsed = parseTemplate(template.text, template.file, { preserveWhitespaces: false });
      if (parsed.errors?.length) {
        unscannable.push(`${template.file}: ${parsed.errors[0].msg}`);
      }
      templateNodes = parsed.nodes;
      addTemplateDerefs(readsOf(templateNodes));
    }
  }

  const reportRegion = (id, reads) => {
    const { touched, trackedByRoot } = classify(reads);
    if (!touched.size) {
      return;
    }
    regions.push({ file: fileName, region: `${className}.${id}`, tokens: [...touched].sort() });
    for (const [root, tokens] of trackedByRoot) {
      tokens.forEach((t) => add(`${className}.${root}`, 'R4', t));
    }
  };

  const hostIsLive = host.some(
    (e) =>
      e.name === 'aria-live' ||
      e.name === '[attr.aria-live]' ||
      (e.name === 'role' && LIVE_ROLES.has(e.value.text)),
  );
  if (hostIsLive) {
    reportRegion('host', [...hostReads, ...readsOf(templateNodes)]);
  }
  for (const region of templateRegions(templateNodes)) {
    reportRegion(region.id, readsOf(region.subtree));
  }
}

// ---------------------------------------------------------------------------
// Manifest checks

/** @param {{ file: string; member: string; rule: string; token: string }} row */
export const rowKey = (row) => `${row.file}\t${row.member}\t${row.rule}\t${row.token}`;

/**
 * Ratchet assertions (a)-(d): exact ceiling, a closing phase per row, no row
 * that outlived its phase, and no row that was not there at the end of
 * Phase 1.
 *
 * @param {{ ratchet: readonly { file: string; member: string; rule: string; token: string; closesIn: number }[]; ceiling: number; completedPhase: number; phase1Keys: readonly string[] }} input
 * @returns {string[]}
 */
export function ratchetViolations({ ratchet, ceiling, completedPhase, phase1Keys }) {
  const out = [];
  if (ratchet.length !== ceiling) {
    out.push(`(a) RATCHET has ${ratchet.length} rows, RATCHET_CEILING is ${ceiling}`);
  }
  const frozen = new Set(phase1Keys);
  for (const row of ratchet) {
    if (!Number.isInteger(row.closesIn) || row.closesIn < 2 || row.closesIn > 8) {
      out.push(`(b) ${rowKey(row)}: closesIn ${row.closesIn} is not a phase in 2..8`);
    }
    if (row.closesIn <= completedPhase) {
      out.push(`(c) ${rowKey(row)}: closesIn ${row.closesIn} but phase ${completedPhase} is done`);
    }
    if (completedPhase >= 1 && !frozen.has(rowKey(row))) {
      out.push(`(d) ${rowKey(row)}: not in the Phase 1 snapshot`);
    }
  }
  return out;
}

/**
 * Live-region manifest assertions: every discovered copy-rendering region has
 * an entry, no entry is stale, and from its closing phase on every entry's
 * spec exists and contains its test name.
 *
 * @param {{ discovered: readonly Region[]; manifest: readonly { file: string; region: string; spec?: string; testName?: string; closesIn?: number; kind?: string; reason?: string }[]; completedPhase: number; readSpec: (path: string) => string | null }} input
 * @returns {string[]}
 */
export function liveRegionViolations({ discovered, manifest, completedPhase, readSpec }) {
  const out = [];
  const key = (r) => `${r.file}\t${r.region}`;
  const listed = new Map(manifest.map((e) => [key(e), e]));
  const found = new Set(discovered.map(key));
  for (const region of discovered) {
    if (!listed.has(key(region))) {
      out.push(
        `unlisted live region ${region.file} ${region.region} (${region.tokens.join(', ')})`,
      );
    }
  }
  for (const entry of manifest) {
    if (!found.has(key(entry))) {
      out.push(`stale live-region entry ${entry.file} ${entry.region}`);
      continue;
    }
    if (entry.kind === 'consumer-text') {
      if (!entry.reason || entry.reason.trim().length < 10) {
        out.push(`consumer-text entry ${entry.file} ${entry.region} needs a reason`);
      }
      continue;
    }
    if (!Number.isInteger(entry.closesIn) || completedPhase < entry.closesIn) {
      continue;
    }
    const source = entry.spec ? readSpec(entry.spec) : null;
    if (source === null) {
      out.push(`${entry.file} ${entry.region}: spec ${entry.spec} does not exist`);
    } else if (!entry.testName || !source.includes(entry.testName)) {
      out.push(`${entry.file} ${entry.region}: spec ${entry.spec} has no test "${entry.testName}"`);
    }
  }
  return out;
}

/**
 * Classification assertions: every discovered token is classified exactly
 * once, no classified token is gone, and each copy token's keys partition its
 * interface exactly.
 *
 * @param {{ discovered: readonly string[]; copyTokens: readonly CopyTokenSpec[]; settingsTokens: readonly string[]; typeKeys: Map<string, readonly string[]> }} input
 * @returns {string[]}
 */
export function classificationViolations({ discovered, copyTokens, settingsTokens, typeKeys }) {
  const out = [];
  const copy = copyTokens.map((t) => t.token);
  const all = [...copy, ...settingsTokens];
  const seen = new Set();
  for (const token of all) {
    if (seen.has(token)) {
      out.push(`${token} is classified twice`);
    }
    seen.add(token);
  }
  const found = new Set(discovered);
  discovered.filter((t) => !seen.has(t)).forEach((t) => out.push(`${t} is not classified`));
  all
    .filter((t) => !found.has(t))
    .forEach((t) => out.push(`${t} is classified but no longer exists`));
  for (const spec of copyTokens) {
    if (spec.kind === 'locale') {
      continue;
    }
    const keys = typeKeys.get(spec.token);
    if (!keys) {
      out.push(`${spec.token}: type does not resolve`);
      continue;
    }
    if (spec.copyKeys === '*') {
      if (spec.settingsKeys.length) {
        out.push(`${spec.token}: a dedicated token has no settings keys`);
      }
      continue;
    }
    const partition = [...spec.copyKeys, ...spec.settingsKeys];
    const listedKeys = new Set(partition);
    if (listedKeys.size !== partition.length) {
      out.push(`${spec.token}: a key is listed twice`);
    }
    keys
      .filter((k) => !listedKeys.has(k))
      .forEach((k) => out.push(`${spec.token}.${k} is not partitioned`));
    partition
      .filter((k) => !keys.includes(k))
      .forEach((k) => out.push(`${spec.token}.${k} does not exist`));
  }
  return out;
}

/**
 * The token column of the "Where each string lives" table in the
 * localisation guide.
 *
 * @param {string} markdown
 * @returns {string[]}
 */
export function guideTableTokens(markdown) {
  const start = markdown.indexOf('## Where each string lives');
  const end = markdown.indexOf('\n## ', start + 1);
  const section = markdown.slice(start, end === -1 ? undefined : end);
  return [...section.matchAll(/^\|[^|\n]*\|`([A-Z0-9_]+)`\|/gm)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Rule fixtures

const FIXTURE_ROOT = resolve(REPO_ROOT, 'scripts/__tests__/__reactive-i18n-fixtures__');
const fixturePath = (name) => resolve(FIXTURE_ROOT, name);

const FIXTURE_VIRTUAL = Object.fromEntries(
  Object.entries(RULE_FIXTURES.sources).map(([name, source]) => [fixturePath(name), source]),
);
const FIXTURE_PROGRAM = createProgram(Object.keys(FIXTURE_VIRTUAL), FIXTURE_VIRTUAL);
const FIXTURE_FILES = Object.keys(FIXTURE_VIRTUAL).map((path) =>
  FIXTURE_PROGRAM.getSourceFile(path),
);
const FIXTURE_TOKENS = discoverTokens(FIXTURE_FILES);
const FIXTURE_MODEL = buildCopyModel(
  FIXTURE_PROGRAM,
  FIXTURE_TOKENS,
  RULE_FIXTURES.copyTokens,
  RULE_FIXTURES.helpers,
);

/** @param {string} name */
const analyzeFixture = (name) =>
  analyzeFile(FIXTURE_MODEL, FIXTURE_PROGRAM.getSourceFile(fixturePath(name)), name);

/** @param {string} name */
const fixtureRows = (name) =>
  analyzeFixture(name)
    .findings.map((f) => `${f.member} ${f.rule} ${f.token}`)
    .sort();

describe('reactive i18n rules', () => {
  it('type-checks the rule fixtures', () => {
    const diagnostics = ts
      .getPreEmitDiagnostics(FIXTURE_PROGRAM)
      .filter((d) => d.file && d.file.fileName.startsWith(FIXTURE_ROOT))
      .map((d) => `${d.file.fileName}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
    expect(diagnostics).toEqual([]);
  });

  for (const [name, expected] of Object.entries(RULE_FIXTURES.expected)) {
    it(`${name}: ${expected.length ? expected.join('; ') : 'passes'}`, () => {
      expect(fixtureRows(name)).toEqual([...expected].sort());
    });
  }

  it('scans every fixture template', () => {
    const unscannable = Object.keys(RULE_FIXTURES.expected).flatMap(
      (name) => analyzeFixture(name).unscannable,
    );
    expect(unscannable).toEqual([]);
  });

  it('reports the live regions that render copy, and only those', () => {
    const regions = Object.keys(RULE_FIXTURES.expected)
      .flatMap((name) => analyzeFixture(name).regions)
      .map((r) => `${r.file} ${r.region}`)
      .sort();
    expect(regions).toEqual([...RULE_FIXTURES.expectedRegions].sort());
  });

  it('classifies the fixture tokens exactly', () => {
    expect(
      classificationViolations({
        discovered: FIXTURE_TOKENS.map((t) => t.token),
        copyTokens: RULE_FIXTURES.copyTokens,
        settingsTokens: RULE_FIXTURES.settingsTokens,
        typeKeys: FIXTURE_MODEL.typeKeys,
      }),
    ).toEqual([]);
  });
});

describe('reactive i18n manifest checks', () => {
  const row = (member, closesIn) => ({ file: 'a.ts', member, rule: 'R1', token: 'T', closesIn });

  it('(a) fails a ceiling that does not match the row count', () => {
    const violations = ratchetViolations({
      ratchet: [row('A.x', 3)],
      ceiling: 2,
      completedPhase: 0,
      phase1Keys: [],
    });
    expect(violations.map((v) => v.slice(0, 3))).toEqual(['(a)']);
  });

  it('(b) fails a row without a closing phase in 2..8', () => {
    const violations = ratchetViolations({
      ratchet: [row('A.x', 9)],
      ceiling: 1,
      completedPhase: 0,
      phase1Keys: [],
    });
    expect(violations.map((v) => v.slice(0, 3))).toEqual(['(b)']);
  });

  it('(c) fails a row that outlived its phase', () => {
    const violations = ratchetViolations({
      ratchet: [row('A.x', 3)],
      ceiling: 1,
      completedPhase: 3,
      phase1Keys: [rowKey(row('A.x', 3))],
    });
    expect(violations.map((v) => v.slice(0, 3))).toEqual(['(c)']);
  });

  it('(d) fails a row swapped in after Phase 1, even at an unchanged count', () => {
    const violations = ratchetViolations({
      ratchet: [row('A.y', 3)],
      ceiling: 1,
      completedPhase: 1,
      phase1Keys: [rowKey(row('A.x', 3))],
    });
    expect(violations.map((v) => v.slice(0, 3))).toEqual(['(d)']);
  });

  it('passes a consistent ratchet', () => {
    const ratchet = [row('A.x', 2)];
    expect(
      ratchetViolations({
        ratchet,
        ceiling: 1,
        completedPhase: 1,
        phase1Keys: ratchet.map(rowKey),
      }),
    ).toEqual([]);
  });

  const region = { file: 'a.ts', region: 'A.host', tokens: ['T'] };
  const entry = {
    file: 'a.ts',
    region: 'A.host',
    spec: 'a.spec.ts',
    testName: 'keeps it',
    closesIn: 3,
  };

  it('fails an unlisted live region and a stale entry', () => {
    const violations = liveRegionViolations({
      discovered: [region],
      manifest: [{ ...entry, region: 'A.gone' }],
      completedPhase: 1,
      readSpec: () => null,
    });
    expect(violations.map((v) => v.split(' ')[0])).toEqual(['unlisted', 'stale']);
  });

  it('skips the spec check before the closing phase and enforces it after', () => {
    const input = { discovered: [region], manifest: [entry], readSpec: () => null };
    expect(liveRegionViolations({ ...input, completedPhase: 2 })).toEqual([]);
    expect(liveRegionViolations({ ...input, completedPhase: 3 })).toEqual([
      'a.ts A.host: spec a.spec.ts does not exist',
    ]);
    expect(
      liveRegionViolations({ ...input, completedPhase: 3, readSpec: () => "it('keeps it'" }),
    ).toEqual([]);
    expect(
      liveRegionViolations({ ...input, completedPhase: 3, readSpec: () => "it('other'" }),
    ).toEqual(['a.ts A.host: spec a.spec.ts has no test "keeps it"']);
  });

  it('accepts a consumer-text region with a reason instead of a spec', () => {
    const consumer = {
      file: 'a.ts',
      region: 'A.host',
      kind: 'consumer-text',
      reason: 'renders the bound message only',
    };
    expect(
      liveRegionViolations({
        discovered: [region],
        manifest: [consumer],
        completedPhase: 8,
        readSpec: () => null,
      }),
    ).toEqual([]);
  });

  it('fails an unclassified, a doubly classified and a vanished token', () => {
    const violations = classificationViolations({
      discovered: ['A', 'B'],
      copyTokens: [],
      settingsTokens: ['B', 'B', 'C'],
      typeKeys: new Map(),
    });
    expect(violations).toEqual([
      'B is classified twice',
      'A is not classified',
      'C is classified but no longer exists',
    ]);
  });

  it('fails a copy-key partition that misses or invents a key', () => {
    const violations = classificationViolations({
      discovered: ['T'],
      copyTokens: [
        { token: 'T', kind: 'config', copyKeys: ['labels'], settingsKeys: ['ghost'], closesIn: 3 },
      ],
      settingsTokens: [],
      typeKeys: new Map([['T', ['labels', 'delay']]]),
    });
    expect(violations).toEqual(['T.delay is not partitioned', 'T.ghost does not exist']);
  });

  it('reads the token column of the guide table', () => {
    const markdown = [
      '## Where each string lives',
      '|Area|Token|provide|',
      '|-|-|-|',
      '|`@cngx/a`|`CNGX_A_I18N`|`provideA()`|',
      '## Locale',
      '|`@cngx/b`|`CNGX_B`|x|',
    ].join('\n');
    expect(guideTableTokens(markdown)).toEqual(['CNGX_A_I18N']);
  });
});

// ---------------------------------------------------------------------------
// Repo scan

/** The accepted-debt registers are local-only; CI checks the reference shape. */
const DEBT_DIR = resolve(REPO_ROOT, '.internal/architektur');

/** The phase from which an `EXEMPT` row's `debtRef` must resolve. */
const DEBT_REF_PHASE = 6;

const SOURCES = walkSources('projects', /\.ts$/);
const PROGRAM = createProgram(SOURCES.map((file) => resolve(REPO_ROOT, file)));
const SOURCE_FILES = SOURCES.map((file) => PROGRAM.getSourceFile(resolve(REPO_ROOT, file)));
const TOKENS = discoverTokens(SOURCE_FILES);
const MODEL = buildCopyModel(PROGRAM, TOKENS, COPY_TOKENS, HELPERS);
const SCAN = SOURCES.map((file, i) => analyzeFile(MODEL, SOURCE_FILES[i], file));
const FINDINGS = SCAN.flatMap((result) => result.findings);
const REGIONS = SCAN.flatMap((result) => result.regions);
const UNSCANNABLE = SCAN.flatMap((result) => result.unscannable);

/** @param {string} path repo-relative */
const readRepoFile = (path) => {
  const absolute = resolve(REPO_ROOT, path);
  return existsSync(absolute) ? readFileSync(absolute, 'utf-8') : null;
};

describe('reactive i18n coverage', () => {
  it('finds sources and tokens to scan', () => {
    expect(SOURCES.length).toBeGreaterThan(900);
    expect(TOKENS.length).toBeGreaterThan(150);
  });

  it('classifies every exported injection token and partitions every copy key', () => {
    expect(
      classificationViolations({
        discovered: TOKENS.map((t) => t.token),
        copyTokens: COPY_TOKENS,
        settingsTokens: SETTINGS_TOKENS,
        typeKeys: MODEL.typeKeys,
      }),
    ).toEqual([]);
  });

  it('closes every copy token in one of the phases 2..7', () => {
    const outOfRange = COPY_TOKENS.filter((t) => t.closesIn < 2 || t.closesIn > 7).map(
      (t) => t.token,
    );
    expect(outOfRange).toEqual([]);
  });

  it('parses every template it meets', () => {
    expect(UNSCANNABLE).toEqual([]);
  });

  it('carries every finding on the ratchet or the exempt list', () => {
    const listed = new Set([...RATCHET, ...EXEMPT].map(rowKey));
    const unlisted = FINDINGS.filter((finding) => !listed.has(rowKey(finding))).map(rowKey);
    expect(unlisted).toEqual([]);
  });

  it('carries no ratchet or exempt row that is already fixed', () => {
    const found = new Set(FINDINGS.map(rowKey));
    const stale = [...RATCHET, ...EXEMPT].filter((row) => !found.has(rowKey(row))).map(rowKey);
    expect(stale).toEqual([]);
  });

  it('keeps the ratchet exact, phased and frozen', () => {
    expect(
      ratchetViolations({
        ratchet: RATCHET,
        ceiling: RATCHET_CEILING,
        completedPhase: COMPLETED_PHASE,
        phase1Keys: PHASE_1_KEYS,
      }),
    ).toEqual([]);
  });

  it('gives every exempt row a reason and an accepted-debt reference', () => {
    const malformed = EXEMPT.filter(
      (row) =>
        row.reason.trim().length < 20 || !/^[a-z0-9-]+-accepted-debt\.md#.+/.test(row.debtRef),
    ).map(rowKey);
    expect(malformed).toEqual([]);
  });

  it('resolves every exempt debtRef once its register entry is due', () => {
    const unresolved = EXEMPT.filter((row) => {
      const [register, heading] = row.debtRef.split('#');
      const path = resolve(DEBT_DIR, register);
      if (COMPLETED_PHASE < DEBT_REF_PHASE || !existsSync(DEBT_DIR)) {
        return false;
      }
      return !existsSync(path) || !readFileSync(path, 'utf-8').includes(heading);
    }).map((row) => row.debtRef);
    expect(unresolved).toEqual([]);
  });

  it('lists exactly the copy tokens in the localisation guide table', () => {
    const guide = guideTableTokens(readRepoFile('core-concepts/i18n.md') ?? '').sort();
    const copy = COPY_TOKENS.filter((t) => t.kind !== 'locale')
      .map((t) => t.token)
      .sort();
    expect(guide).toEqual(copy);
  });

  it('found every calibration site at the end of Phase 1', () => {
    const frozen = [...PHASE_1_KEYS, ...EXEMPT.map(rowKey)].map((key) => key.split('\t'));
    const missingMembers = CALIBRATION_MEMBERS.filter(
      ([file, member]) => !frozen.some(([f, m]) => f === file && m === member),
    ).map(([file, member]) => `${file} ${member}`);
    const missingTokens = CALIBRATION_TOKENS.filter(
      (token) => !frozen.some(([, , , t]) => t === token),
    );
    const listedRegions = new Set(LIVE_REGIONS.map((e) => `${e.file} ${e.region}`));
    const missingRegions = CALIBRATION_REGIONS.map(([file, region]) => `${file} ${region}`).filter(
      (key) => !listedRegions.has(key),
    );
    expect([...missingMembers, ...missingTokens, ...missingRegions]).toEqual([]);
  });

  it('lists every live region that renders copy, with its no-respeak spec when due', () => {
    expect(
      liveRegionViolations({
        discovered: REGIONS,
        manifest: LIVE_REGIONS,
        completedPhase: COMPLETED_PHASE,
        readSpec: readRepoFile,
      }),
    ).toEqual([]);
  });
});
