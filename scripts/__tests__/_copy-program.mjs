import { resolve } from 'node:path';

import ts from 'typescript';

import { hostEntries, isDecoratorHost, REPO_ROOT, unwrapExpression } from './_i18n-ast.mjs';

// The type-checked program behind `reactive-i18n-coverage`: the program over
// `projects/**`, token discovery, the copy model and the classifiers that say
// whether a node reads copy. Shared so tooling (the copy-cascade manifest)
// classifies copy exactly as the guard does. Not a `*.test.mjs`, so vitest
// never collects it on its own.

/**
 * @typedef {object} CopyTokenSpec
 * @property {string} token
 * @property {'dedicated' | 'config' | 'locale'} kind
 * @property {'*' | readonly string[]} copyKeys
 * @property {readonly string[]} settingsKeys
 */

/** Aliases that wrap a copy type without changing what it is. */
const TRANSPARENT_ALIASES = new Set(['Partial', 'Readonly', 'Required']);

/** Calls whose argument position may carry a copy key as a value. */
const MERGE_HELPERS = new Set([
  'coerceSignal',
  'createOverrideMerge',
  'createNestedOverrideMerge',
  'createFilledOverrideMerge',
]);

/** `role` values that make an element a live region. */
export const LIVE_ROLES = new Set(['status', 'alert', 'log']);

/** A live `role` literal inside a bound expression or a member initializer. */
const LIVE_ROLE_LITERAL = /['"](?:status|alert|log)['"]/;

/** Angular's `[SIGNAL]` brand, as TypeScript names a unique-symbol key. */
const SIGNAL_BRAND = /^__@SIGNAL@\d+$/;

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
export const isSignalType = (type) =>
  type.getCallSignatures().length > 0 &&
  type.getProperties().some((p) => SIGNAL_BRAND.test(String(p.escapedName)));

/**
 * A copy key whose value is used directly (a string, a formatter) rather
 * than as a bundle of further keys.
 *
 * @param {ts.TypeChecker} checker
 * @param {ts.Type} type
 */
export const isFlatValue = (checker, type) => {
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
 * @property {ReadonlyMap<string, string>} localeReaders reader function name to its locale token
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

/** A language-pack section interface: every value of it is copy by definition. */
const LANGUAGE_SECTION_NAME = /^Cngx\w+LanguageSection$/;

/**
 * Registers every `Cngx*LanguageSection` interface as a copy value type, so a
 * reader that gets its copy straight from a section (a section accessor, not a
 * copy token) is still seen as reading copy.
 *
 * @param {ts.TypeChecker} checker
 * @param {readonly ts.SourceFile[]} files
 * @param {CopyModel['types']} types
 */
function registerLanguageSections(checker, files, types) {
  for (const file of files) {
    for (const statement of file.statements) {
      if (
        !ts.isInterfaceDeclaration(statement) ||
        !LANGUAGE_SECTION_NAME.test(statement.name.text)
      ) {
        continue;
      }
      const symbol = checker.getSymbolAtLocation(statement.name);
      if (symbol && !types.has(symbol)) {
        types.set(symbol, { kind: 'value', token: 'CNGX_LANGUAGE_PACK', copyKeys: null });
      }
    }
  }
}

/**
 * @param {ts.Program} program
 * @param {ReturnType<typeof discoverTokens>} tokens
 * @param {readonly CopyTokenSpec[]} copyTokens
 * @param {readonly string[]} helpers
 * @param {Readonly<Record<string, string>>} [localeReaders]
 * @returns {CopyModel}
 */
export function buildCopyModel(program, tokens, copyTokens, helpers, localeReaders = {}) {
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
  const ownFiles = program.getSourceFiles().filter((sf) => !sf.fileName.includes('node_modules'));
  registerLanguageSections(checker, ownFiles, types);
  return {
    checker,
    types,
    localeTokens,
    localeReaders: new Map(Object.entries(localeReaders)),
    helpers: new Set(helpers),
    typeKeys,
    liveAttributes: discoverLiveAttributes(ownFiles),
    factoryTokens: new Map(),
  };
}

/**
 * Is a `host:` object a live region: static `aria-live`, a bound
 * `[attr.aria-live]`, or a live `role`, static or bound (a bound role counts
 * when its expression, or the initializer of a member it calls, names a live
 * role literal).
 *
 * @param {{ name: string; value: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral }[]} host
 * @param {(expression: string) => boolean} isLiveRoleExpression
 */
export const isLiveHost = (host, isLiveRoleExpression) =>
  host.some(
    (e) =>
      e.name === 'aria-live' ||
      e.name === '[attr.aria-live]' ||
      (e.name === 'role' && LIVE_ROLES.has(e.value.text)) ||
      (e.name === '[attr.role]' && isLiveRoleExpression(e.value.text)),
  );

/**
 * Does a bound role expression resolve to a live role: a literal in the
 * expression itself, or in the initializer of a member it calls.
 *
 * @param {string} expression
 * @param {ReadonlyMap<string, string>} memberTexts
 */
export const isLiveRoleExpression = (expression, memberTexts) =>
  LIVE_ROLE_LITERAL.test(expression) ||
  [...expression.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)].some((m) =>
    LIVE_ROLE_LITERAL.test(memberTexts.get(m[1]) ?? ''),
  );

/**
 * The initializer (or body) text of every member of a class, by name.
 *
 * @param {ts.ClassDeclaration} cls
 * @returns {Map<string, string>}
 */
export const memberTextsOf = (cls) =>
  new Map(
    cls.members
      .filter((m) => m.name && (ts.isPropertyDeclaration(m) || ts.isMethodDeclaration(m)))
      .map((m) => [
        m.name.getText(),
        (ts.isPropertyDeclaration(m) ? m.initializer : m.body)?.getText() ?? '',
      ]),
  );

/**
 * Attribute names whose directive turns its host into a live region
 * (`cngxLiveRegion`): an element carrying one is a live region in a template.
 *
 * @param {readonly ts.SourceFile[]} sourceFiles
 * @returns {Set<string>}
 */
export function discoverLiveAttributes(sourceFiles) {
  const out = new Set();
  for (const sf of sourceFiles) {
    for (const cls of sf.statements.filter(ts.isClassDeclaration)) {
      const call = decoratorCall(cls, ['Directive', 'Component']);
      const meta = call?.arguments[0];
      if (!meta || !ts.isObjectLiteralExpression(meta)) {
        continue;
      }
      const hostProperty = meta.properties.find(isDecoratorHost);
      const host = hostProperty ? hostEntries(hostProperty) : [];
      const texts = memberTextsOf(cls);
      if (!isLiveHost(host, (e) => isLiveRoleExpression(e, texts))) {
        continue;
      }
      const selector = meta.properties.find(
        (p) => ts.isPropertyAssignment(p) && p.name.getText() === 'selector',
      );
      const selectorText =
        selector &&
        ts.isPropertyAssignment(selector) &&
        ts.isStringLiteralLike(selector.initializer)
          ? selector.initializer.text
          : '';
      for (const m of selectorText.matchAll(/\[([A-Za-z][\w-]*)\]/g)) {
        out.add(m[1]);
      }
    }
  }
  return out;
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
export const originOfType = (model, type) => {
  const nonNull = model.checker.getNonNullableType(type);
  const members = nonNull.isUnion() ? nonNull.types : [nonNull];
  for (const member of members) {
    if (isSignalType(member)) {
      continue;
    }
    // A resolved shape that intersects a copy type with a stricter view of it
    // (`Labels & Required<Pick<Labels, ...>>`) is still that copy type.
    const parts = member.isIntersection() ? member.types : [member];
    for (const part of parts) {
      const info = model.types.get(namingSymbol(model.checker, part));
      if (info) {
        return { kind: info.kind === 'config' ? 'config' : 'raw', token: info.token };
      }
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
export const signalValueOrigin = (model, type) => {
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
export const isCopyKeyAccess = (model, node, objectOrigin) => {
  if (objectOrigin?.kind !== 'config' || !ts.isPropertyAccessExpression(node)) {
    return false;
  }
  const info = [...model.types.values()].find((i) => i.token === objectOrigin.token && i.copyKeys);
  return !!info?.copyKeys?.has(node.name.text);
};

/** @param {ts.Node} node */
export const isModuleLevelConst = (node) =>
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
export function originOf(model, node, cache, visiting = new Set()) {
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
export function computeOrigin(model, rawNode, cache, visiting) {
  const { checker } = model;
  const node = unwrapExpression(rawNode) ?? rawNode;
  const byType = () => originOfType(model, checker.getTypeAtLocation(node));

  if (ts.isCallExpression(node)) {
    const callee = unwrapExpression(node.expression);
    const name = ts.isIdentifier(callee) ? callee.text : '';
    const readerToken = model.localeReaders.get(name);
    if (readerToken !== undefined) {
      return { kind: 'locale', token: readerToken };
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
export const isFunctionLike = (node) =>
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
export const scopeOf = (node) => {
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
export const isUntracked = (node, boundary) => {
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
export function readEventAt(model, node, cache) {
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

/**
 * @param {ts.Node} node
 * @returns {ts.CallExpression | undefined}
 */
export const decoratorCall = (node, names) =>
  ts
    .getDecorators(node)
    ?.map((d) => d.expression)
    .find(
      (e) =>
        ts.isCallExpression(e) &&
        ts.isIdentifier(e.expression) &&
        names.includes(e.expression.text),
    );
