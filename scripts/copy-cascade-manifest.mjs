// Generates `scripts/manifests/copy-cascades.json`: every `??` chain in the
// libs where a per-instance input overrides copy from a bundle, with its tiers
// in resolution order. The runtime can tell which value won; only the source
// can tell that input `stopLabel` stands in front of key `stopSpeaking` of
// `CNGX_SPEAK_I18N`. That join is static, so it is extracted here, from the
// same type-checked program and copy classifiers the reactive-i18n guard uses
// (`__tests__/_copy-program.mjs`), configured by the guard's own fixtures.
//
//   node scripts/copy-cascade-manifest.mjs           write the manifest
//   node scripts/copy-cascade-manifest.mjs --check   exit 1 when stale

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as prettier from 'prettier';
import ts from 'typescript';

import {
  buildCopyModel,
  createProgram,
  discoverTokens,
  isSignalType,
  originOf,
} from './__tests__/_copy-program.mjs';
import { REPO_ROOT, unwrapExpression, walkSources } from './__tests__/_i18n-ast.mjs';
import {
  COPY_TOKENS,
  HELPERS,
  LOCALE_READERS,
} from './__tests__/reactive-i18n-coverage.fixtures.mjs';

/** Bumped together with `copy-cascades.schema.json` on any shape change. */
export const SCHEMA_VERSION = 1;

export const MANIFEST_PATH = resolve(REPO_ROOT, 'scripts/manifests/copy-cascades.json');

/** Calls whose function argument is the reactive body of a signal. */
const ENCLOSING_CALLS = {
  computed: 'computed',
  linkedSignal: 'computed',
  effect: 'effect',
  afterRenderEffect: 'effect',
  untracked: 'untracked',
};

/** The signal factories that declare a per-instance input. */
const INPUT_FACTORIES = new Set(['input', 'model']);

/**
 * @typedef {{ kind: 'input'; field: string }
 *   | { kind: 'bundle'; field: string; path: string[]; token: string }
 *   | { kind: 'bundle-fn'; field: string; path: string[]; token: string }
 *   | { kind: 'bundle-signal'; field: string; path: string[]; token: string }
 *   | { kind: 'literal'; value: string | null }} Tier
 */

/**
 * @typedef {object} CascadeEntry
 * @property {string | null} class
 * @property {string} file repo-relative
 * @property {number} line
 * @property {string} member
 * @property {'computed' | 'method' | 'effect' | 'untracked' | 'function'} enclosing
 * @property {Tier[]} [tiers]
 * @property {string} [unresolved]
 */

/** @param {ts.Node} node */
const unwrap = (node) => {
  let current = unwrapExpression(node);
  while (current && ts.isNonNullExpression(current)) {
    current = unwrapExpression(current.expression);
  }
  return current;
};

/** @param {ts.Node} node */
const isCoalesce = (node) =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken;

/**
 * The operands of a `??` chain in resolution order, through parentheses on
 * either side.
 *
 * @param {ts.Expression} node
 * @returns {ts.Expression[]}
 */
const operandsOf = (node) => {
  const inner = unwrap(node);
  return isCoalesce(inner) ? [...operandsOf(inner.left), ...operandsOf(inner.right)] : [inner];
};

/**
 * Is `node` the outermost `??` of its chain?
 *
 * @param {ts.Node} node
 */
const isChainRoot = (node) => {
  let parent = node.parent;
  while (
    parent &&
    (ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isSatisfiesExpression(parent) ||
      ts.isNonNullExpression(parent))
  ) {
    parent = parent.parent;
  }
  return !parent || !isCoalesce(parent);
};

/**
 * The declaration a callee names: `this.x` resolves to the class member,
 * an identifier to its binding.
 *
 * @param {ts.TypeChecker} checker
 * @param {ts.Expression} callee
 */
const declarationOf = (checker, callee) => {
  const name = ts.isPropertyAccessExpression(callee) ? callee.name : callee;
  let symbol = checker.getSymbolAtLocation(name);
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol?.valueDeclaration ?? symbol?.declarations?.[0];
};

/** @param {ts.Node | undefined} declaration */
const isInputDeclaration = (declaration) => {
  if (!declaration || !ts.isPropertyDeclaration(declaration) || !declaration.initializer) {
    return false;
  }
  const init = unwrap(declaration.initializer);
  if (!ts.isCallExpression(init)) {
    return false;
  }
  const callee = unwrap(init.expression);
  const base = ts.isPropertyAccessExpression(callee) ? unwrap(callee.expression) : callee;
  return ts.isIdentifier(base) && INPUT_FACTORIES.has(base.text);
};

/**
 * Is the binding a function parameter, or destructured from one
 * (`const { ariaLabel } = options`)?
 *
 * @param {ts.TypeChecker} checker
 * @param {ts.Node | undefined} declaration
 */
const isParameterBinding = (checker, declaration) => {
  if (!declaration) {
    return false;
  }
  if (ts.isParameter(declaration)) {
    return true;
  }
  if (!ts.isBindingElement(declaration)) {
    return false;
  }
  let pattern = declaration.parent;
  while (pattern && ts.isBindingElement(pattern.parent)) {
    pattern = pattern.parent.parent;
  }
  const owner = pattern?.parent;
  if (owner && ts.isParameter(owner)) {
    return true;
  }
  if (!owner || !ts.isVariableDeclaration(owner) || !owner.initializer) {
    return false;
  }
  const init = unwrap(owner.initializer);
  return ts.isIdentifier(init) && isParameterBinding(checker, declarationOf(checker, init));
};

/**
 * The identifier a member chain starts from (`inputs` in `inputs.ariaLabel`);
 * `undefined` for a chain rooted in `this` or a call.
 *
 * @param {ts.Expression} node
 * @returns {ts.Identifier | undefined}
 */
const rootIdentifierOf = (node) => {
  let current = unwrap(node);
  while (ts.isPropertyAccessExpression(current)) {
    current = unwrap(current.expression);
  }
  return ts.isIdentifier(current) ? current : undefined;
};

/**
 * The root field and key path of a read: `this.config.ariaLabels().x` is
 * field `config`, path `['ariaLabels', 'x']`.
 *
 * @param {ts.Expression} node
 * @returns {{ field: string; path: string[] } | null}
 */
const fieldPathOf = (node) => {
  const path = [];
  let current = unwrap(node);
  for (;;) {
    if (ts.isCallExpression(current)) {
      current = unwrap(current.expression);
      continue;
    }
    if (ts.isPropertyAccessExpression(current)) {
      const object = unwrap(current.expression);
      if (object.kind === ts.SyntaxKind.ThisKeyword) {
        return { field: current.name.text, path: path.reverse() };
      }
      path.push(current.name.text);
      current = object;
      continue;
    }
    if (
      ts.isElementAccessExpression(current) &&
      ts.isStringLiteralLike(current.argumentExpression)
    ) {
      path.push(current.argumentExpression.text);
      current = unwrap(current.expression);
      continue;
    }
    if (ts.isIdentifier(current)) {
      return { field: current.text, path: path.reverse() };
    }
    return null;
  }
};

/**
 * The expression an `untracked(() => expr)` tier reads, if the operand is one.
 *
 * @param {ts.Expression} operand
 * @returns {ts.Expression | undefined}
 */
const untrackedBodyOf = (operand) => {
  if (!ts.isCallExpression(operand) || operand.arguments.length !== 1) {
    return undefined;
  }
  const callee = unwrap(operand.expression);
  const fn = unwrap(operand.arguments[0]);
  const isUntrackedArrow =
    ts.isIdentifier(callee) &&
    callee.text === 'untracked' &&
    ts.isArrowFunction(fn) &&
    !ts.isBlock(fn.body);
  return isUntrackedArrow ? unwrap(fn.body) : undefined;
};

/**
 * @param {import('./__tests__/_copy-program.mjs').CopyModel} model
 * @param {Map<ts.Node, unknown>} cache
 * @param {ts.Expression} operand
 * @returns {Tier | { kind: 'unknown'; reason: string }}
 */
const tierOf = (model, cache, operand) => {
  const { checker } = model;
  if (ts.isStringLiteralLike(operand)) {
    return { kind: 'literal', value: operand.text };
  }
  if (operand.kind === ts.SyntaxKind.NullKeyword) {
    return { kind: 'literal', value: null };
  }
  if (ts.isCallExpression(operand) && operand.arguments.length === 0) {
    const callee = unwrap(operand.expression);
    const isOwnMember =
      ts.isPropertyAccessExpression(callee) &&
      unwrap(callee.expression).kind === ts.SyntaxKind.ThisKeyword;
    if (isOwnMember && isInputDeclaration(declarationOf(checker, callee))) {
      return { kind: 'input', field: callee.name.text };
    }
    const root = rootIdentifierOf(callee);
    const isParameterSignal =
      !!root &&
      isSignalType(checker.getTypeAtLocation(callee)) &&
      isParameterBinding(checker, declarationOf(checker, root)) &&
      !originOf(model, callee, cache);
    if (isParameterSignal) {
      return { kind: 'input', field: ts.isIdentifier(callee) ? callee.text : callee.name.text };
    }
  }
  const untrackedBody = untrackedBodyOf(operand);
  if (untrackedBody) {
    return tierOf(model, cache, untrackedBody);
  }
  const callee = ts.isCallExpression(operand) ? unwrap(operand.expression) : undefined;
  const isKeyCall = !!callee && !isSignalType(checker.getTypeAtLocation(callee));
  const origin = originOf(model, isKeyCall ? callee : operand, cache);
  const where = origin ? fieldPathOf(operand) : null;
  const isLocale =
    !!origin &&
    (origin.kind === 'locale' || (model.localeTokens.has(origin.token) && !where?.path.length));
  if (!origin || isLocale) {
    return {
      kind: 'unknown',
      reason: `operand \`${operand.getText()}\` is neither input nor copy`,
    };
  }
  if (!where) {
    return { kind: 'unknown', reason: `copy operand \`${operand.getText()}\` has no field path` };
  }
  const token = origin.token;
  if (isKeyCall) {
    return { kind: 'bundle-fn', ...where, token };
  }
  if (where.path.length === 0) {
    return { kind: 'bundle-signal', ...where, token };
  }
  return { kind: 'bundle', ...where, token };
};

/**
 * Where the chain is evaluated: the nearest reactive wrapper, method or
 * function around it.
 *
 * @param {ts.Node} node
 * @returns {CascadeEntry['enclosing'] | null}
 */
const enclosingOf = (node) => {
  for (let current = node.parent; current; current = current.parent) {
    const isCallback = ts.isArrowFunction(current) || ts.isFunctionExpression(current);
    if (isCallback) {
      let holder = current.parent;
      if (holder && ts.isPropertyAssignment(holder)) {
        holder = holder.parent?.parent;
      }
      if (holder && ts.isCallExpression(holder)) {
        const callee = unwrap(holder.expression);
        const wrapper = ts.isIdentifier(callee) ? ENCLOSING_CALLS[callee.text] : undefined;
        if (wrapper) {
          return wrapper;
        }
      }
      if (current.parent && ts.isPropertyDeclaration(current.parent)) {
        return 'method';
      }
      continue;
    }
    if (
      ts.isMethodDeclaration(current) ||
      ts.isGetAccessorDeclaration(current) ||
      ts.isSetAccessorDeclaration(current) ||
      ts.isConstructorDeclaration(current)
    ) {
      return ts.isClassLike(current.parent) ? 'method' : 'function';
    }
    if (ts.isFunctionDeclaration(current)) {
      return 'function';
    }
    if (ts.isPropertyDeclaration(current)) {
      return null;
    }
  }
  return null;
};

/**
 * The class (or `null`) and the member that holds the chain. Outside a class
 * the member is `<function>.<local>`.
 *
 * @param {ts.Node} node
 * @returns {{ class: string | null; member: string }}
 */
const ownerOf = (node) => {
  const names = [];
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isClassLike(current)) {
      return { class: current.name?.text ?? '(anonymous)', member: names[0] ?? '(class)' };
    }
    if (ts.isConstructorDeclaration(current)) {
      names.unshift('constructor');
    } else if (
      (ts.isPropertyDeclaration(current) ||
        ts.isMethodDeclaration(current) ||
        ts.isGetAccessorDeclaration(current) ||
        ts.isSetAccessorDeclaration(current) ||
        ts.isPropertyAssignment(current) ||
        ts.isVariableDeclaration(current) ||
        ts.isFunctionDeclaration(current)) &&
      current.name &&
      ts.isIdentifier(current.name)
    ) {
      names.unshift(current.name.text);
    }
  }
  const outer = names[0] ?? '(module)';
  const inner = names.at(-1) ?? outer;
  return { class: null, member: outer === inner ? outer : `${outer}.${inner}` };
};

/**
 * Every input-over-bundle cascade in `sourceFiles`, sorted by file and line.
 *
 * @param {import('./__tests__/_copy-program.mjs').CopyModel} model
 * @param {readonly ts.SourceFile[]} sourceFiles
 * @param {string} [root] paths in the entries are relative to it
 * @returns {CascadeEntry[]}
 */
export function collectCascades(model, sourceFiles, root = REPO_ROOT) {
  const cache = new Map();
  const entries = [];
  for (const sf of sourceFiles) {
    const file = relative(root, sf.fileName);
    const visit = (node) => {
      if (isCoalesce(node) && isChainRoot(node)) {
        const tiers = operandsOf(node).map((operand) => tierOf(model, cache, operand));
        const hasInput = tiers.some((t) => t.kind === 'input');
        const hasCopy = tiers.some((t) => t.kind.startsWith('bundle'));
        if (hasInput && hasCopy) {
          const enclosing = enclosingOf(node);
          const unknown = tiers.find((t) => t.kind === 'unknown');
          const entry = {
            ...ownerOf(node),
            file,
            line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
            enclosing: enclosing ?? 'function',
          };
          if (unknown || !enclosing) {
            entry.unresolved = unknown?.reason ?? 'chain evaluated in a field initializer';
          } else {
            entry.tiers = tiers;
          }
          entries.push(entry);
        }
      }
      node.forEachChild(visit);
    };
    visit(sf);
  }
  return entries
    .map(normalize)
    .sort((a, b) => a.file.localeCompare(b.file, 'en') || a.line - b.line);
}

/**
 * Stable key order, so a regenerated manifest diffs only where the source did.
 *
 * @param {CascadeEntry} entry
 */
const normalize = (entry) => {
  const { class: cls, file, line, member, enclosing, tiers, unresolved } = entry;
  const tierOrder = (t) => {
    if (t.kind === 'input') {
      return { kind: t.kind, field: t.field };
    }
    if (t.kind === 'literal') {
      return { kind: t.kind, value: t.value };
    }
    return { kind: t.kind, field: t.field, path: t.path, token: t.token };
  };
  return {
    class: cls,
    file,
    line,
    member,
    enclosing,
    ...(tiers ? { tiers: tiers.map(tierOrder) } : { unresolved }),
  };
};

/** The manifest over the repo's `projects/**`. */
export function collectRepoCascades() {
  const sources = walkSources('projects', /\.ts$/).map((file) => resolve(REPO_ROOT, file));
  const program = createProgram(sources);
  const sourceFiles = sources.map((file) => program.getSourceFile(file));
  const model = buildCopyModel(
    program,
    discoverTokens(sourceFiles),
    COPY_TOKENS,
    HELPERS,
    LOCALE_READERS,
  );
  return collectCascades(model, sourceFiles);
}

/**
 * The formatted manifest file.
 *
 * @param {readonly CascadeEntry[]} entries
 */
export async function renderManifest(entries) {
  const source = JSON.stringify({
    $schema: './copy-cascades.schema.json',
    schemaVersion: SCHEMA_VERSION,
    entries,
  });
  const options = (await prettier.resolveConfig(MANIFEST_PATH)) ?? {};
  return prettier.format(source, { ...options, filepath: MANIFEST_PATH });
}

/**
 * The first entry that differs between two manifests, for the `--check`
 * message.
 *
 * @param {readonly unknown[]} current
 * @param {readonly unknown[]} next
 */
export function firstDifference(current, next) {
  const length = Math.max(current.length, next.length);
  for (let i = 0; i < length; i++) {
    if (JSON.stringify(current[i]) !== JSON.stringify(next[i])) {
      return { index: i, current: current[i], next: next[i] };
    }
  }
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const entries = collectRepoCascades();
  const rendered = await renderManifest(entries);
  const current = existsSync(MANIFEST_PATH) ? readFileSync(MANIFEST_PATH, 'utf8') : '';
  if (process.argv.includes('--check')) {
    if (current !== rendered) {
      const previous = current ? JSON.parse(current).entries : [];
      const diff = firstDifference(previous, entries);
      console.error(
        'scripts/manifests/copy-cascades.json is stale. Run `npm run manifest:copy`.\n' +
          (diff
            ? `First changed entry (#${diff.index}):\n` +
              `  manifest: ${JSON.stringify(diff.current) ?? '(none)'}\n` +
              `  source:   ${JSON.stringify(diff.next) ?? '(none)'}`
            : 'Entries match; the file layout differs.'),
      );
      process.exit(1);
    }
  } else if (current !== rendered) {
    writeFileSync(MANIFEST_PATH, rendered);
    console.log(`Wrote scripts/manifests/copy-cascades.json (${entries.length} entries)`);
  }
}
