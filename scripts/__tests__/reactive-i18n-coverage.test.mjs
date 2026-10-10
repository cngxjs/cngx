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
  buildCopyModel,
  createProgram,
  decoratorCall,
  discoverTokens,
  isFlatValue,
  isFunctionLike,
  isLiveHost,
  isLiveRoleExpression,
  isModuleLevelConst,
  isSignalType,
  isUntracked,
  LIVE_ROLES,
  memberTextsOf,
  originOf,
  originOfType,
  readEventAt,
  scopeOf,
  signalValueOrigin,
} from './_copy-program.mjs';
import {
  COPY_TOKENS,
  EXEMPT,
  HELPERS,
  LIVE_REGIONS,
  LOCALE_READERS,
  RATCHET,
  RULE_FIXTURES,
  SETTINGS_TOKENS,
} from './reactive-i18n-coverage.fixtures.mjs';

// Coverage guard for runtime language switching. A2 made every cngx string
// overridable; A2b makes every one of them follow a live language Signal. The
// compiler forces the readers of a retyped token to change, but it cannot see
// a construction-time snapshot of a value that stays a plain string, and it
// cannot see a live region that re-announces when its copy flips. This guard
// does, over the whole surface instead of a hand list:
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
//              / `createNestedOverrideMerge` / `createFilledOverrideMerge` and
//              outside a registered helper.
//   R4         a live region reads copy tracked - a copy flip would re-speak it.
//
// Copy reads are found through the type checker, not through names: a value
// is copy when its type is a copy token's type, a copy key's value type, or a
// Signal of either, and the locale counts as copy. A finding fails unless it
// is an `EXEMPT` row backed by an accepted-debt entry; every live region that
// renders copy has a manifest entry naming the spec that proves it does not
// re-speak on a flip.

/** Calls that hand text to an announcer (`announce`, `announceCommitError`). */
const ANNOUNCE_CALL = /^announce/i;

/** @typedef {import('./_copy-program.mjs').CopyTokenSpec} CopyTokenSpec */
/** @typedef {import('./_copy-program.mjs').CopyModel} CopyModel */
/** @typedef {import('./_copy-program.mjs').Origin} Origin */
/** @typedef {import('./_copy-program.mjs').ReadEvent} ReadEvent */

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
// Taint

/**
 * The copy tokens a subtree reads: read events, dereferences of copy-typed
 * parameters (a pure builder still reads copy), `this.x` members through
 * `memberTokens`, and - with `followLocals` - the initializers of the local
 * consts it names, so a factory's `computed` over a local closure counts.
 * `untracked(...)` bodies are skipped unless `includeUntracked`.
 *
 * @param {CopyModel} model
 * @param {Map<ts.Node, Origin>} cache
 * @param {ts.Node} root
 * @param {{ includeUntracked: boolean; followLocals?: boolean; memberTokens?: (node: ts.PropertyAccessExpression) => Iterable<string> }} options
 * @returns {Set<string>}
 */
function subtreeTokens(model, cache, root, options) {
  const { checker } = model;
  const out = new Set();
  const followed = new Set();
  const walk = (node, boundary) => {
    if (!options.includeUntracked && isUntracked(node, boundary)) {
      return;
    }
    const event = readEventAt(model, node, cache);
    if (event) {
      out.add(event.token);
    }
    const isAccess = ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
    const onThis = isAccess && node.expression.kind === ts.SyntaxKind.ThisKeyword;
    if (isAccess && !onThis) {
      const origin = originOf(model, node.expression, cache);
      if (origin?.kind === 'param') {
        out.add(origin.token);
      }
    }
    const readsFactoryResult =
      ts.isPropertyAccessExpression(node) && ts.isCallExpression(unwrapExpression(node.expression));
    if (readsFactoryResult) {
      const tokens = factoryPropertyTokens(
        model,
        cache,
        node.expression,
        node.name.text,
        options.includeUntracked,
      );
      tokens.forEach((t) => out.add(t));
    }
    if (onThis && ts.isPropertyAccessExpression(node) && options.memberTokens) {
      for (const token of options.memberTokens(node)) {
        out.add(token);
      }
    }
    if (options.followLocals && ts.isIdentifier(node)) {
      const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
      const isLocal =
        !!declaration &&
        ts.isVariableDeclaration(declaration) &&
        !!declaration.initializer &&
        !isModuleLevelConst(declaration);
      if (isLocal && !followed.has(declaration)) {
        followed.add(declaration);
        walk(declaration.initializer, declaration.initializer);
      }
    }
    node.forEachChild((child) => walk(child, boundary));
  };
  walk(root, root);
  return out;
}

/**
 * The copy tokens behind `member.prop` when `member` is initialized by a
 * factory call (`announcement = createStepperAnnouncementBuilders(...)`): the
 * factory's returned object literal is resolved to the expression behind
 * `prop`, and that expression's closure is walked.
 *
 * @param {CopyModel} model
 * @param {Map<ts.Node, Origin>} cache
 * @param {ts.Expression | undefined} initializer the member's initializer
 * @param {string} prop
 * @param {boolean} includeUntracked
 * @returns {Set<string>}
 */
function factoryPropertyTokens(model, cache, initializer, prop, includeUntracked) {
  const { checker } = model;
  const call = unwrapExpression(initializer);
  if (!call || !ts.isCallExpression(call)) {
    return new Set();
  }
  let symbol = checker.getSymbolAtLocation(unwrapExpression(call.expression));
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  const declaration = symbol?.valueDeclaration;
  const fn =
    declaration && ts.isFunctionDeclaration(declaration)
      ? declaration
      : declaration &&
          ts.isVariableDeclaration(declaration) &&
          declaration.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ? declaration.initializer
        : undefined;
  if (!fn?.body || fn.getSourceFile().fileName.includes('node_modules')) {
    return new Set();
  }
  const key = `${fn.getSourceFile().fileName}:${fn.pos}\t${prop}\t${includeUntracked}`;
  const memo = model.factoryTokens.get(key);
  if (memo) {
    return memo;
  }
  const out = new Set();
  model.factoryTokens.set(key, out);
  const values = [];
  const collect = (object) => {
    const literal = unwrapExpression(object);
    if (!literal || !ts.isObjectLiteralExpression(literal)) {
      return;
    }
    for (const property of literal.properties) {
      if (property.name?.getText() !== prop) {
        continue;
      }
      if (ts.isPropertyAssignment(property)) {
        values.push(property.initializer);
      } else if (ts.isShorthandPropertyAssignment(property)) {
        const local = checker.getShorthandAssignmentValueSymbol(property)?.valueDeclaration;
        if (local && ts.isVariableDeclaration(local) && local.initializer) {
          values.push(local.initializer);
        }
      } else if (ts.isMethodDeclaration(property) && property.body) {
        values.push(property.body);
      }
    }
  };
  if (!ts.isBlock(fn.body)) {
    collect(fn.body);
  }
  const findReturns = (node) => {
    if (node !== fn && isFunctionLike(node)) {
      return;
    }
    if (ts.isReturnStatement(node) && node.expression) {
      collect(node.expression);
    }
    node.forEachChild(findReturns);
  };
  findReturns(fn);
  for (const value of values) {
    for (const token of subtreeTokens(model, cache, value, {
      includeUntracked,
      followLocals: true,
    })) {
      out.add(token);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Templates

/**
 * @typedef {object} TemplateRead
 * @property {string} root the class member the chain starts at
 * @property {ReadEvent['kind'] | 'member' | 'member-prop'} kind
 * @property {string | null} token
 * @property {boolean} [flat]
 * @property {string} [prop] for `member-prop`: the property read off the member
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
      const readsMemberProperty =
        (node.receiver instanceof PropertyRead || node.receiver instanceof SafePropertyRead) &&
        node.receiver.receiver instanceof ImplicitReceiver;
      if (receiver && readsMemberProperty) {
        out.push({ root: receiver.root, kind: 'member-prop', token: null, prop: node.name });
      }
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
 * or bound), a live `role` (static or bound), or an attribute of a directive
 * that makes its host live (`cngxLiveRegion`), each with its subtree.
 *
 * @param {readonly unknown[]} nodes
 * @param {ReadonlySet<string>} liveAttributes
 * @param {(expression: string) => boolean} isLiveRole
 * @returns {{ tag: string; subtree: unknown }[]}
 */
function templateRegions(nodes, liveAttributes, isLiveRole) {
  const regions = [];
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
          a.name === 'aria-live' ||
          liveAttributes.has(a.name) ||
          (a instanceof TmplAstTextAttribute && a.name === 'role' && LIVE_ROLES.has(a.value)) ||
          (a instanceof TmplAstBoundAttribute &&
            a.name === 'role' &&
            isLiveRole(a.value?.source ?? '')),
      );
      if (isLive) {
        regions.push({ tag: value.name, subtree: value });
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

  // Per class: carrier fixpoint, R1 through carriers, R4 through templates.
  /** @type {Map<ts.ClassDeclaration, (node: ts.PropertyAccessExpression, includeUntracked: boolean) => Iterable<string>>} */
  const classTokens = new Map();
  for (const cls of sf.statements.filter(ts.isClassDeclaration)) {
    classTokens.set(cls, analyzeClass(model, cls, sf, fileName, cache, add, regions, unscannable));
  }

  // R4 through an effect that announces copy, in a class or a factory.
  const ordinals = new Map();
  const visitEffects = (node) => {
    const callee = ts.isCallExpression(node) ? unwrapExpression(node.expression) : undefined;
    const isEffect =
      !!callee && ts.isIdentifier(callee) && callee.text === 'effect' && !!node.arguments[0];
    if (isEffect) {
      let owner = node.parent;
      while (owner && !ts.isClassDeclaration(owner)) {
        owner = owner.parent;
      }
      const memberTokensOf = owner ? classTokens.get(owner) : undefined;
      const body = node.arguments[0];
      const tokensOf = (includeUntracked) =>
        subtreeTokens(model, cache, body, {
          includeUntracked,
          followLocals: true,
          memberTokens: memberTokensOf
            ? (access) => memberTokensOf(access, includeUntracked)
            : undefined,
        });
      let announces = false;
      const findAnnounce = (child) => {
        if (ts.isCallExpression(child)) {
          const c = unwrapExpression(child.expression);
          const name = ts.isPropertyAccessExpression(c)
            ? c.name.text
            : ts.isIdentifier(c)
              ? c.text
              : '';
          announces ||= ANNOUNCE_CALL.test(name);
        }
        child.forEachChild(findAnnounce);
      };
      findAnnounce(body);
      const touching = announces ? tokensOf(true) : new Set();
      if (touching.size) {
        const member = memberKeyOf(node);
        const n = (ordinals.get(member) ?? 0) + 1;
        ordinals.set(member, n);
        regions.push({
          file: fileName,
          region: `${member}:effect#${n}`,
          tokens: [...touching].sort(),
        });
        tokensOf(false).forEach((t) => add(member, 'R4', t));
      }
    }
    node.forEachChild(visitEffects);
  };
  visitEffects(sf);

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
 * @returns {(node: ts.PropertyAccessExpression, includeUntracked: boolean) => Iterable<string>}
 *   the copy tokens behind a `this.x` read in this class
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

  const initializerOf = (name) => {
    const m = members.find((x) => nameOf(x) === name);
    return m && ts.isPropertyDeclaration(m) ? m.initializer : undefined;
  };
  /** `this.member.prop` where `member` holds a factory result. */
  const factoryTokensOf = (access, includeUntracked) => {
    const parent = access.parent;
    return parent && ts.isPropertyAccessExpression(parent) && parent.expression === access
      ? factoryPropertyTokens(
          model,
          cache,
          initializerOf(access.name.text),
          parent.name.text,
          includeUntracked,
        )
      : [];
  };

  // Copy tokens each member reads: `tracked` skips `untracked(...)` bodies,
  // `touching` does not. Fixpoint over `this.x` references between members.
  /** @param {boolean} includeUntracked */
  const carriers = (includeUntracked) => {
    /** @type {Map<string, Set<string>>} */
    const tokens = new Map(members.map((m) => [nameOf(m), new Set()]));
    const refs = new Map();
    for (const m of members) {
      const references = new Set();
      const own = subtreeTokens(model, cache, bodyOf(m), {
        includeUntracked,
        memberTokens: (access) => {
          if (tokens.has(access.name.text)) {
            references.add(access.name.text);
          }
          return factoryTokensOf(access, includeUntracked);
        },
      });
      own.forEach((t) => tokens.get(nameOf(m)).add(t));
      refs.set(nameOf(m), references);
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
  const memberTokens = (access, includeUntracked) => [
    ...((includeUntracked ? touching : tracked).get(access.name.text) ?? []),
    ...factoryTokensOf(access, includeUntracked),
  ];

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

  // Templates and host bindings.
  const classType = checker.getDeclaredTypeOfSymbol(checker.getSymbolAtLocation(cls.name));
  const component = decoratorCall(cls, ['Component']);
  const directive = component ?? decoratorCall(cls, ['Directive']);
  if (!directive) {
    return memberTokens;
  }
  const meta = directive.arguments[0];
  const hostProperty =
    meta && ts.isObjectLiteralExpression(meta) ? meta.properties.find(isDecoratorHost) : undefined;
  const host = hostProperty ? hostEntries(hostProperty) : [];
  const texts = memberTextsOf(cls);
  const isLiveRole = (expression) => isLiveRoleExpression(expression, texts);

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
      } else if (read.kind === 'member-prop') {
        const init = initializerOf(read.root);
        factoryPropertyTokens(model, cache, init, read.prop, true).forEach((t) => touched.add(t));
        factoryPropertyTokens(model, cache, init, read.prop, false).forEach((t) =>
          note(read.root, t),
        );
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

  const seenIds = new Map();
  const reportRegion = (baseId, reads) => {
    const { touched, trackedByRoot } = classify(reads);
    if (!touched.size) {
      return;
    }
    const n = (seenIds.get(baseId) ?? 0) + 1;
    seenIds.set(baseId, n);
    const id = n === 1 ? baseId : `${baseId}#${n}`;
    regions.push({ file: fileName, region: `${className}.${id}`, tokens: [...touched].sort() });
    for (const [root, tokens] of trackedByRoot) {
      tokens.forEach((t) => add(`${className}.${root}`, 'R4', t));
    }
  };

  if (isLiveHost(host, isLiveRole)) {
    reportRegion('host', [...hostReads, ...readsOf(templateNodes)]);
  }
  for (const region of templateRegions(templateNodes, model.liveAttributes, isLiveRole)) {
    const reads = readsOf(region.subtree);
    const viaProperty = new Set(reads.filter((r) => r.kind === 'member-prop').map((r) => r.root));
    const parts = reads
      .filter((r) => r.kind === 'member-prop' || !viaProperty.has(r.root))
      .map((r) => (r.kind === 'member-prop' ? `${r.root}.${r.prop}` : r.root));
    reportRegion(`${region.tag}(${[...new Set(parts)].sort().join(',')})`, reads);
  }
  return memberTokens;
}

// ---------------------------------------------------------------------------
// Manifest checks

/** @param {{ file: string; member: string; rule: string; token: string }} row */
export const rowKey = (row) => `${row.file}\t${row.member}\t${row.rule}\t${row.token}`;

/**
 * Live-region manifest assertions: every discovered copy-rendering region has
 * an entry, no entry is stale, and every entry's spec exists and contains its
 * test name.
 *
 * @param {{ discovered: readonly Region[]; manifest: readonly { file: string; region: string; spec?: string; testName?: string; kind?: string; reason?: string }[]; readSpec: (path: string) => string | null }} input
 * @returns {string[]}
 */
export function liveRegionViolations({ discovered, manifest, readSpec }) {
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
  RULE_FIXTURES.localeReaders,
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
  it('registers every Cngx*LanguageSection interface as a copy type', () => {
    const path = resolve(FIXTURE_ROOT, 'language-section.ts');
    const virtual = {
      [path]: [
        'export interface CngxDemoLanguageSection { readonly title: string; }',
        'export interface CngxDemoSettings { readonly size: number; }',
      ].join('\n'),
    };
    const program = createProgram([path], virtual);
    const model = buildCopyModel(program, [], [], []);
    const names = [...model.types.keys()].map((symbol) => symbol.getName());
    expect(names).toContain('CngxDemoLanguageSection');
    expect(names).not.toContain('CngxDemoSettings');
  });

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
  const region = { file: 'a.ts', region: 'A.host', tokens: ['T'] };
  const entry = { file: 'a.ts', region: 'A.host', spec: 'a.spec.ts', testName: 'keeps it' };

  it('fails an unlisted live region and a stale entry', () => {
    const violations = liveRegionViolations({
      discovered: [region],
      manifest: [{ ...entry, region: 'A.gone' }],
      readSpec: () => null,
    });
    expect(violations.map((v) => v.split(' ')[0])).toEqual(['unlisted', 'stale']);
  });

  it('fails a missing spec and a spec without the named test', () => {
    const input = { discovered: [region], manifest: [entry] };
    expect(liveRegionViolations({ ...input, readSpec: () => null })).toEqual([
      'a.ts A.host: spec a.spec.ts does not exist',
    ]);
    expect(liveRegionViolations({ ...input, readSpec: () => "it('keeps it'" })).toEqual([]);
    expect(liveRegionViolations({ ...input, readSpec: () => "it('other'" })).toEqual([
      'a.ts A.host: spec a.spec.ts has no test "keeps it"',
    ]);
  });

  it('accepts a consumer-text region with a reason instead of a spec', () => {
    const consumer = {
      file: 'a.ts',
      region: 'A.host',
      kind: 'consumer-text',
      reason: 'renders the bound message only',
    };
    expect(
      liveRegionViolations({ discovered: [region], manifest: [consumer], readSpec: () => null }),
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
      copyTokens: [{ token: 'T', kind: 'config', copyKeys: ['labels'], settingsKeys: ['ghost'] }],
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

const SOURCES = walkSources('projects', /\.ts$/);
const PROGRAM = createProgram(SOURCES.map((file) => resolve(REPO_ROOT, file)));
const SOURCE_FILES = SOURCES.map((file) => PROGRAM.getSourceFile(resolve(REPO_ROOT, file)));
const TOKENS = discoverTokens(SOURCE_FILES);
const MODEL = buildCopyModel(PROGRAM, TOKENS, COPY_TOKENS, HELPERS, LOCALE_READERS);
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

  it('keeps the ratchet empty', () => {
    expect(RATCHET).toEqual([]);
  });

  // CI cannot read the local debt registers, so an exempt row with any
  // well-formed debtRef would silence a finding. Pinning the keys here makes
  // every new exemption a second, reviewable edit to the guard itself.
  it('exempts exactly the pinned rows', () => {
    expect(EXEMPT.map(rowKey)).toEqual([
      'projects/forms/input/phone-input/phone-input.component.ts\tCngxPhoneInput.country\tR1\tCNGX_LOCALE',
    ]);
  });

  it('gives every exempt row a reason and an accepted-debt reference', () => {
    const malformed = EXEMPT.filter(
      (row) =>
        row.reason.trim().length < 20 || !/^[a-z0-9-]+-accepted-debt\.md#.+/.test(row.debtRef),
    ).map(rowKey);
    expect(malformed).toEqual([]);
  });

  // The registers are local-only: where they are absent (CI) the check reports
  // as skipped rather than passing without having looked.
  it.skipIf(!existsSync(DEBT_DIR))('resolves every exempt debtRef', () => {
    const unresolved = EXEMPT.filter((row) => {
      const [register, heading] = row.debtRef.split('#');
      const path = resolve(DEBT_DIR, register);
      return !existsSync(path) || !readFileSync(path, 'utf-8').includes(heading);
    }).map((row) => row.debtRef);
    expect(unresolved).toEqual([]);
  });

  it('reads the select copy behind injectSelectCopy as copy', () => {
    const sf = PROGRAM.getSourceFile(
      resolve(REPO_ROOT, 'projects/forms/select/single-select/select.component.ts'),
    );
    let read;
    const find = (node) => {
      if (
        ts.isPropertyAccessExpression(node) &&
        node.getText() === 'this.selectCopy().clearSelection'
      ) {
        read = node;
      }
      node.forEachChild(find);
    };
    find(sf);
    expect(originOf(MODEL, read, new Map())).toEqual({
      kind: 'signal',
      token: 'CNGX_LANGUAGE_PACK',
    });
  });

  it('lists exactly the copy tokens in the localisation guide table', () => {
    const guide = guideTableTokens(readRepoFile('core-concepts/i18n.md') ?? '').sort();
    const copy = COPY_TOKENS.filter((t) => t.kind !== 'locale')
      .map((t) => t.token)
      .sort();
    expect(guide).toEqual(copy);
  });

  it('lists every live region that renders copy, with its no-respeak spec', () => {
    expect(
      liveRegionViolations({
        discovered: REGIONS,
        manifest: LIVE_REGIONS,
        readSpec: readRepoFile,
      }),
    ).toEqual([]);
  });
});
