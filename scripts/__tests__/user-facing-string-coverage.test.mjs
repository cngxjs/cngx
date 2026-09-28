import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  ASTWithSource,
  Binary,
  Conditional,
  Interpolation,
  LiteralPrimitive,
  ParenthesizedExpression,
  parseTemplate,
  TmplAstRecursiveVisitor,
  tmplAstVisitAll,
} from '@angular/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  ALREADY_COVERED,
  COMPLETED_PHASE,
  EXCLUDED,
  PHASE_1_KEYS,
  RATCHET,
  RATCHET_CEILING,
} from './user-facing-string-coverage.fixtures.mjs';

// Coverage guard for the EN-default contract: cngx ships English library
// defaults, and every one of them is overridable through the config cascade
// (`architecture-summary.md`, "Configuration cascade"). The type system cannot
// see the second half - a string literal sitting in a directive body compiles
// exactly like one sitting in a `CNGX_*_I18N` default factory, and only the
// second is reachable from a consumer's language file.
//
// The rule: a user-facing string literal lives in an override source, or it is
// on a manifest. Three ways to be covered, all structural:
//
//   1. The file IS the override source - an `i18n/` module, a `*-config.ts` /
//      `*.defaults.ts`, or any file declaring a `Cngx*Config` / `*I18n` /
//      `*Labels` injection token. Its literals are the EN defaults by
//      definition.
//   2. The use-site coalesces off a config read (`config.ariaLabels?.x ?? 'X'`).
//      The literal is dead weight the moment a consumer provides the token.
//      An `input()` defaulted from a token read (`input(this.i18n().x)`) has
//      no literal at all.
//   3. It is a dev-only message (`console.warn`, `new Error`, an `isDevMode()`
//      block). Never reaches an end user, never translated.
//
// Both 2 and 3 are decided by the literal's position in the AST, never by
// neighbouring lines. A bare `input('X')` default is NOT covered: a
// per-instance binding alone is not translatable, the app-wide path is the
// token. A template the scanner cannot parse or resolve fails the suite
// rather than passing unread.
//
// Everything else is a gap and must carry a manifest row. See
// `user-facing-string-coverage.fixtures.mjs`.

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

/**
 * Directories whose strings are never library defaults: demo code is
 * consumer-authored, `projects/testing` is not published, and a
 * `__test-helpers` folder holds spec scaffolding that happens not to carry the
 * `.spec.ts` suffix.
 */
const SKIPPED_DIRS = new Set(['examples', 'testing', '__test-helpers']);

/** `event.key` values and the like - code, not copy. */
const KEY_NAMES = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Enter',
  'Escape',
  'PageUp',
  'PageDown',
  'Tab',
  'Backspace',
  'Delete',
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'Space',
]);

/** A single CamelCase word: an injection-token debug name, never a sentence. */
const CAMEL_WORD = /^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/;

/** Basenames that mark a file as the override source for its area. */
const OVERRIDE_SOURCE_FILE = /(?:^|[-.])(?:config|defaults|i18n|token|tokens|labels|messages)\.ts$/;

/** An injection token whose payload is the area's config / label bundle. */
const OVERRIDE_TOKEN = /new InjectionToken<\s*[A-Za-z0-9_]*(?:Config|I18n|Labels|Messages)\b/;

/** A guard expression that only holds in a development build. */
const DEV_GUARD = /\b(?:isDevMode|ngDevMode)\b/;

/** A call that only ever writes to a developer's console. */
const DEV_CALL = /^console\.|(?:^|\.)warn[A-Z]\w*$/;

/** Reads that make a following `??` / `||` literal a mere fallback. */
const CONFIG_READ = /\b(?:config|cfg|i18n|labels|messages|glyphs|defaults|ariaLabels)\b/i;

/**
 * @typedef {'override-source' | 'config-fallback' | 'dev-message' | 'uncovered' | 'unscannable'} StringCoverage
 */

/**
 * @typedef {object} StringFinding
 * @property {number} line
 * @property {string} value
 * @property {StringCoverage} coverage
 */

/** A `{identifier}` placeholder inside a literal: normalised, not disqualifying. */
const PLACEHOLDER = /\{[A-Za-z_$][\w$]*\}/g;

/** `1 row selected` - a count glued to a word, composed by hand. */
const DIGIT_PHRASE = /^\d+\s+[a-z]{2,}/;

/** Backtick spans that are CSS, selectors, ids, paths or units - code, not copy. */
const BACKTICK_NOISE = /[-#.:[/()=]|px|var|calc/;

/** Stands in for a `${...}` substitution while testing word boundaries. */
const SUBSTITUTION = '\u0000';

/** A word of 2+ letters bounded by whitespace or the ends of the text. */
const BOUNDED_WORD = /(?:^|\s)[A-Za-z]{2,}(?=\s|$|[,;!?])/;

/** A literal being compared against or searched for is data, not copy. */
const COMPARISON_BEFORE = /(?:===|!==|\.includes\(|\.startsWith\(|\.endsWith\(|indexOf\()\s*$/;

/**
 * Does this literal read as copy a user could be shown?
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isUserFacingPhrase(value) {
  if (value.length < 3 || value.length > 120) {
    return false;
  }
  if (KEY_NAMES.has(value) || CAMEL_WORD.test(value)) {
    return false;
  }
  if (!/^[A-Z]/.test(value) || !/[a-z]/.test(value)) {
    return false;
  }
  const bare = value.replace(PLACEHOLDER, '');
  if (bare.trim().length === 0) {
    return false;
  }
  // Template fragments, selectors and code snippets.
  return !/[<>{}=_]|\$\{|=>/.test(bare);
}

/**
 * Does a backtick literal compose copy? `spans` are the static parts between
 * substitutions. A word only counts when whitespace or the text's own edge
 * bounds it - `${n}ms` and `${key}State` glue a word to a substitution and
 * stay silent.
 *
 * @param {readonly string[]} spans
 * @returns {boolean}
 */
export function isBacktickPhrase(spans) {
  if (spans.join('{}').length > 200 || BACKTICK_NOISE.test(spans.join(''))) {
    return false;
  }
  return spans.some((span, i) => {
    const text = (i > 0 ? SUBSTITUTION : '') + span + (i < spans.length - 1 ? SUBSTITUTION : '');
    return BOUNDED_WORD.test(text);
  });
}

/**
 * The source with every comment blanked and line count preserved - a JSDoc
 * `@example` block is full of `aria-label="Price range"` prose, and neither
 * the comparison check nor the override-token check may see it.
 *
 * @param {ts.SourceFile} sf
 * @returns {string}
 */
function commentFreeText(sf) {
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
const isWithin = (node, container) =>
  !!container && node.pos >= container.pos && node.end <= container.end;

/**
 * A literal that only ever reaches a developer: an argument of a `throw`, a
 * `new *Error(...)`, a `console.*` / `warn*` call, or anything behind an
 * `isDevMode()` / `ngDevMode` guard. Decided by the literal's ancestors, never
 * by neighbouring lines - copy two lines below an unrelated `throw` stays copy.
 *
 * @param {ts.Node} node
 * @param {ts.SourceFile} sf
 */
const isDevOnly = (node, sf) => {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isThrowStatement(current)) {
      return true;
    }
    if (ts.isNewExpression(current) && /Error$/.test(current.expression.getText(sf))) {
      return true;
    }
    if (ts.isCallExpression(current) && DEV_CALL.test(current.expression.getText(sf))) {
      return true;
    }
    const guardedIf =
      ts.isIfStatement(current) &&
      DEV_GUARD.test(current.expression.getText(sf)) &&
      isWithin(node, current.thenStatement);
    const guardedAnd =
      ts.isBinaryExpression(current) &&
      current.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      DEV_GUARD.test(current.left.getText(sf)) &&
      isWithin(node, current.right);
    if (guardedIf || guardedAnd) {
      return true;
    }
  }
  return false;
};

/**
 * A literal on the right of `??` / `||` whose left operand reads a config,
 * i18n or labels bundle (`config.ariaLabels?.x ?? 'X'`). The left operand
 * itself decides, not a word on a neighbouring line.
 *
 * @param {ts.Node} node
 * @param {ts.SourceFile} sf
 */
const isConfigFallback = (node, sf) => {
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
 * The `template:` initializer of an `@Component` decorator, whatever its
 * shape. Its content is markup, not TypeScript copy.
 *
 * @param {ts.Node} node
 * @returns {node is ts.PropertyAssignment}
 */
const isComponentTemplateProperty = (node) => {
  if (
    !ts.isPropertyAssignment(node) ||
    !ts.isIdentifier(node.name) ||
    node.name.text !== 'template'
  ) {
    return false;
  }
  const call = node.parent?.parent;
  return (
    !!call &&
    ts.isCallExpression(call) &&
    ts.isIdentifier(call.expression) &&
    call.expression.text === 'Component'
  );
};

/**
 * The `host:` object of an `@Component` / `@Directive` decorator.
 *
 * @param {ts.Node} node
 * @returns {node is ts.PropertyAssignment & { initializer: ts.ObjectLiteralExpression }}
 */
const isDecoratorHost = (node) => {
  if (!ts.isPropertyAssignment(node) || !ts.isIdentifier(node.name) || node.name.text !== 'host') {
    return false;
  }
  const call = node.parent?.parent;
  return (
    ts.isObjectLiteralExpression(node.initializer) &&
    !!call &&
    ts.isCallExpression(call) &&
    ts.isIdentifier(call.expression) &&
    ['Component', 'Directive'].includes(call.expression.text)
  );
};

/**
 * Resolves a `template:` initializer to the literal that holds the markup: the
 * initializer itself, or a same-file `const X = \`...\`` it names. A template
 * built with substitutions, or imported from elsewhere, cannot be scanned.
 *
 * @param {ts.Expression} initializer
 * @param {ts.SourceFile} sf
 * @returns {ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | null}
 */
const templateLiteralOf = (initializer, sf) => {
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
 * Which rule, if any, makes this literal copy. Single- and double-quoted
 * literals follow the uppercase phrase rule; a backtick literal also counts
 * when it composes words around substitutions; any literal starting with a
 * count glued to a word counts.
 *
 * @param {ts.Node} node
 * @param {ts.SourceFile} sf
 * @returns {string | null} the value to report, `{}` per substitution
 */
const phraseOf = (node, sf) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const value = node.text;
    const quote = sf.text[node.getStart(sf)];
    const isPhrase =
      isUserFacingPhrase(value) ||
      (quote === '`' && isBacktickPhrase([value])) ||
      DIGIT_PHRASE.test(value);
    return isPhrase ? value : null;
  }
  if (ts.isTemplateExpression(node)) {
    const spans = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
    const value = spans.join('{}');
    return isBacktickPhrase(spans) || DIGIT_PHRASE.test(value) ? value : null;
  }
  return null;
};

/** An `input()` field whose default is read out or shown (rule c). */
const LABEL_INPUT_FIELD =
  /(label|text|noun|singular|plural|phrase|announcement|message|title|placeholder|description)$/i;

/** A module-level const holding a word map (rule d). */
const WORD_CONST = /WORD|LABEL|TEXT|PHRASE|NOUN/;

/** A `computed()` field that resolves copy (rule e). */
const LABEL_COMPUTED_FIELD = /label|text|announcement|valuetext|phrase|message/i;

/** Their first argument is an attribute name, not copy. */
const ATTRIBUTE_CALLS = new Set([
  'hasAttribute',
  'getAttribute',
  'setAttribute',
  'removeAttribute',
]);

/** Calls whose first argument is a lookup key, not copy. */
const LOOKUP_CALLS = new Set(['includes', 'startsWith', 'endsWith', 'indexOf', 'has', 'get']);

const EQUALITY_OPERATORS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.InKeyword,
]);

/** @param {ts.Node | undefined} node */
const unwrapExpression = (node) => {
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
const isStringLiteralLike = (node) =>
  !!node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));

/**
 * @param {ts.Node | undefined} node
 * @param {string} callee
 * @returns {node is ts.CallExpression}
 */
const isCallTo = (node, callee) =>
  !!node &&
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === callee;

/**
 * Does the const's declared type say its values are strings? A key map such
 * as `Record<Score, PasswordStrengthLabel>` holds a union of keys, not copy.
 *
 * @param {ts.VariableDeclaration} declaration
 */
const declaresStringValues = (declaration) => {
  const type = declaration.type;
  if (!type) {
    return true;
  }
  if (ts.isTypeReferenceNode(type) && type.typeName.getText() === 'Record') {
    return type.typeArguments?.[1]?.kind === ts.SyntaxKind.StringKeyword;
  }
  if (ts.isTypeLiteralNode(type)) {
    return type.members.every(
      (member) => !member.type || member.type.kind === ts.SyntaxKind.StringKeyword,
    );
  }
  return false;
};

/**
 * A literal that is compared, looked up, used as a key or an attribute name.
 *
 * @param {ts.Node} node
 */
const isDataLiteral = (node) => {
  const parent = node.parent;
  if (ts.isBinaryExpression(parent)) {
    return EQUALITY_OPERATORS.has(parent.operatorToken.kind);
  }
  if (ts.isCaseClause(parent) || ts.isLiteralTypeNode(parent)) {
    return true;
  }
  if (ts.isElementAccessExpression(parent)) {
    return parent.argumentExpression === node;
  }
  if (ts.isPropertyAssignment(parent)) {
    return parent.name === node;
  }
  if (ts.isCallExpression(parent) && parent.arguments[0] === node) {
    const callee = parent.expression;
    const name = ts.isPropertyAccessExpression(callee) ? callee.name.text : '';
    return ATTRIBUTE_CALLS.has(name) || LOOKUP_CALLS.has(name);
  }
  return false;
};

/**
 * Lowercase copy found by where it flows, not by its shape (an `input()`
 * default of `'horizontal'` is an enum value, one of `'results'` on `plural`
 * is copy):
 *
 * (c) the default of an `input()` / `model()` whose field name is a label sink, read
 *     through a same-file `const X = '...'` when the default is `X`;
 * (d) a value of the object literal a module-level `*WORD*` / `*LABEL*` /
 *     `*TEXT*` / `*PHRASE*` / `*NOUN*` const is initialised with, unless the
 *     key is `providedIn` or the declared value type is not `string`;
 * (e) a literal inside a `computed()` assigned to a label field, unless it is
 *     compared, looked up, a key, or an attribute name.
 *
 * @param {ts.SourceFile} sf
 * @returns {{ node: ts.Node; value: string }[]}
 */
const sinkHitsOf = (sf) => {
  /** @type {Map<string, string>} */
  const stringConsts = new Map();
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      const init = unwrapExpression(declaration.initializer);
      if (ts.isIdentifier(declaration.name) && isStringLiteralLike(init)) {
        stringConsts.set(declaration.name.text, init.text);
      }
    }
  }

  /** @type {{ node: ts.Node; value: string }[]} */
  const hits = [];
  const add = (node, value) => {
    if (hasWord(value)) {
      hits.push({ node, value });
    }
  };

  const labelInputDefault = (node) => {
    const init = unwrapExpression(node.initializer);
    const isSignalInput = isCallTo(init, 'input') || isCallTo(init, 'model');
    if (!isSignalInput || !LABEL_INPUT_FIELD.test(node.name.text)) {
      return;
    }
    const arg = unwrapExpression(init.arguments[0]);
    if (isStringLiteralLike(arg)) {
      add(arg, arg.text);
    } else if (arg && ts.isIdentifier(arg) && stringConsts.has(arg.text)) {
      add(arg, stringConsts.get(arg.text));
    }
  };

  const wordConstValues = (statement) => {
    for (const declaration of statement.declarationList.declarations) {
      const init = unwrapExpression(declaration.initializer);
      const isWordMap =
        ts.isIdentifier(declaration.name) &&
        WORD_CONST.test(declaration.name.text) &&
        !!init &&
        ts.isObjectLiteralExpression(init) &&
        declaresStringValues(declaration);
      if (!isWordMap) {
        continue;
      }
      for (const property of init.properties) {
        const value = ts.isPropertyAssignment(property)
          ? unwrapExpression(property.initializer)
          : undefined;
        if (property.name?.getText(sf) !== 'providedIn' && isStringLiteralLike(value)) {
          add(value, value.text);
        }
      }
    }
  };

  const labelComputedLiterals = (node) => {
    const init = unwrapExpression(node.initializer);
    if (!isCallTo(init, 'computed') || !LABEL_COMPUTED_FIELD.test(node.name.text)) {
      return;
    }
    const inner = (child) => {
      if (isStringLiteralLike(child) && !isDataLiteral(child)) {
        add(child, child.text);
      }
      child.forEachChild(inner);
    };
    init.arguments.forEach(inner);
  };

  const visit = (node) => {
    if (ts.isPropertyDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
      labelInputDefault(node);
      labelComputedLiterals(node);
    }
    if (ts.isVariableStatement(node) && ts.isSourceFile(node.parent)) {
      wordConstValues(node);
    }
    node.forEachChild(visit);
  };
  visit(sf);
  return hits;
};

/**
 * Classifies one file's user-facing literals. Exported so the negative
 * fixtures below can prove the scanner is capable of failing - a guard that
 * only ever reports green is indistinguishable from a broken matcher.
 *
 * @param {string} source
 * @param {string} [fileName]
 * @returns {readonly StringFinding[]}
 */
export function scanSource(source, fileName = 'x.ts') {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const code = commentFreeText(sf);
  const lines = code.split('\n');
  const isOverrideSource =
    OVERRIDE_SOURCE_FILE.test(fileName) || /\/i18n\//.test(fileName) || OVERRIDE_TOKEN.test(code);
  /** @type {StringFinding[]} */
  const findings = [];
  /** @type {Set<ts.Node>} */
  const reported = new Set();
  /** @type {Set<ts.Node>} template literals, scanned as markup instead */
  const templates = new Set();

  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;

  const report = (node, value) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    if (COMPARISON_BEFORE.test(lines[line].slice(0, character))) {
      return;
    }
    findings.push({ line: line + 1, value, coverage: classify(node, sf, isOverrideSource) });
    reported.add(node);
  };

  /** @type {ts.Node[]} static host sink values, reported after the phrase pass */
  const hostSinkValues = [];

  const collectHost = (property) => {
    const name =
      ts.isStringLiteral(property.name) || ts.isIdentifier(property.name) ? property.name.text : '';
    const value = property.initializer;
    if (!isStringLiteralLike(value)) {
      return;
    }
    if (name.startsWith('[')) {
      // A host binding is a template binding on the host element: parse it as one.
      templates.add(value);
      const synthetic = `<x ${name}="${value.text.replace(/"/g, '&quot;')}"></x>`;
      findings.push(...scanTemplate(synthetic, fileName, lineOf(value)));
    } else if (isSinkName(name) && hasWord(value.text)) {
      hostSinkValues.push(value);
    }
  };

  const collectTemplates = (node) => {
    if (isDecoratorHost(node)) {
      node.initializer.properties.filter(ts.isPropertyAssignment).forEach(collectHost);
    }
    if (isComponentTemplateProperty(node)) {
      const literal = templateLiteralOf(node.initializer, sf);
      if (literal) {
        templates.add(literal);
        findings.push(...scanTemplate(literal.text, fileName, lineOf(literal)));
      } else {
        findings.push({
          line: lineOf(node) + 1,
          value: 'template: not a same-file string literal',
          coverage: 'unscannable',
        });
      }
    }
    node.forEachChild(collectTemplates);
  };
  collectTemplates(sf);

  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || templates.has(node)) {
      return;
    }
    if (isComponentTemplateProperty(node) && !ts.isIdentifier(node.initializer)) {
      return;
    }
    const value = phraseOf(node, sf);
    if (value !== null) {
      report(node, value);
    }
    node.forEachChild(visit);
  };
  visit(sf);

  for (const hit of sinkHitsOf(sf)) {
    if (!reported.has(hit.node)) {
      report(hit.node, hit.value);
    }
  }
  for (const value of hostSinkValues) {
    if (!reported.has(value)) {
      report(value, value.text);
    }
  }

  return findings;
}

/** Static attributes whose value is read out or shown. */
const ATTRIBUTE_SINKS = new Set([
  'aria-label',
  'aria-roledescription',
  'aria-valuetext',
  'aria-description',
  'aria-placeholder',
  'title',
  'alt',
  'placeholder',
  'label',
]);

/**
 * An attribute, host key or binding target whose value is read out or shown.
 *
 * @param {string} name
 */
const isSinkName = (name) => ATTRIBUTE_SINKS.has(name) || name.endsWith('Label');

/** @param {string} text */
const hasWord = (text) => /[A-Za-z]{2,}/.test(text);

/**
 * String literals in value position of a binding expression - the whole
 * expression, a branch of `a ? 'X' : 'Y'`, an operand of `??` / `||` / `+`.
 * Call and pipe arguments, and comparison operands, are data. The right side
 * of `??` / `||` after a config read (`ariaLabels.x ?? 'X'`) is a covered
 * fallback, exactly as in TypeScript.
 *
 * @param {unknown} ast
 * @param {string} source the expression source the AST spans index into
 * @returns {string[]}
 */
const valueLiterals = (ast, source) => {
  if (ast instanceof ASTWithSource) {
    return valueLiterals(ast.ast, ast.source ?? source);
  }
  if (ast instanceof ParenthesizedExpression) {
    return valueLiterals(ast.expression, source);
  }
  if (ast instanceof LiteralPrimitive) {
    return typeof ast.value === 'string' && hasWord(ast.value) ? [ast.value] : [];
  }
  if (ast instanceof Conditional) {
    return [...valueLiterals(ast.trueExp, source), ...valueLiterals(ast.falseExp, source)];
  }
  if (!(ast instanceof Binary) || !['??', '||', '+'].includes(ast.operation)) {
    return [];
  }
  const left = valueLiterals(ast.left, source);
  const leftText = source.slice(ast.left.span.start, ast.left.span.end);
  const isFallback = ast.operation !== '+' && CONFIG_READ.test(leftText);
  return isFallback ? left : [...left, ...valueLiterals(ast.right, source)];
};

/** @param {string} text */
const normaliseWhitespace = (text) => text.replace(/\s+/g, ' ').trim();

/**
 * Collects static copy from a parsed template. The recursive visitor descends
 * into control-flow blocks (`@if` branches, `@switch` cases, `@for` /
 * `@empty`, `@defer` sub-blocks), not only element children.
 */
class TemplateSinkVisitor extends TmplAstRecursiveVisitor {
  /**
   * @param {StringFinding[]} out
   * @param {number} lineOffset
   */
  constructor(out, lineOffset) {
    super();
    this.out = out;
    this.lineOffset = lineOffset;
  }

  add(value, span) {
    this.out.push({ line: span.start.line + 1 + this.lineOffset, value, coverage: 'uncovered' });
  }

  visitTextAttribute(attribute) {
    if (isSinkName(attribute.name) && hasWord(attribute.value)) {
      this.add(normaliseWhitespace(attribute.value), attribute.sourceSpan);
    }
  }

  visitBoundAttribute(attribute) {
    if (!isSinkName(attribute.name)) {
      return;
    }
    const source = attribute.value.source ?? '';
    const ast = attribute.value instanceof ASTWithSource ? attribute.value.ast : attribute.value;
    if (ast instanceof Interpolation) {
      this.addInterpolation(ast, source, attribute.sourceSpan);
      return;
    }
    valueLiterals(ast, source).forEach((value) => this.add(value, attribute.sourceSpan));
  }

  visitText(text) {
    const value = normaliseWhitespace(text.value);
    if (hasWord(value)) {
      this.add(value, text.sourceSpan);
    }
  }

  visitBoundText(text) {
    this.addInterpolation(text.value.ast, text.value.source ?? '', text.sourceSpan);
  }

  addInterpolation(interpolation, source, span) {
    const strings = interpolation.strings ?? [];
    if (hasWord(strings.join(' '))) {
      this.add(normaliseWhitespace(strings.join('{}')), span);
    }
    for (const expression of interpolation.expressions ?? []) {
      valueLiterals(expression, source).forEach((value) => this.add(value, span));
    }
  }
}

/**
 * Static copy in an Angular template: sink attributes (`aria-label`, `title`,
 * `placeholder`, `*Label`, ...) whether static, interpolated or bound, text
 * nodes, the static parts of an interpolation (`+ {{ n }} more` is reported
 * as `+ {} more`), and string literals in value position of a bound sink or
 * an interpolation (`{{ open ? 'Collapse' : 'Expand' }}`). Template copy has
 * no override path by construction, so every finding is `uncovered`.
 *
 * @param {string} template
 * @param {string} fileName
 * @param {number} [lineOffset] 0-based line of the template's first line
 * @returns {readonly StringFinding[]}
 */
export function scanTemplate(template, fileName, lineOffset = 0) {
  const parsed = parseTemplate(template, fileName, { preserveWhitespaces: false });
  /** @type {StringFinding[]} */
  const out = (parsed.errors ?? []).map((error) => ({
    line: error.span.start.line + 1 + lineOffset,
    value: `template parse error: ${error.msg}`,
    coverage: /** @type {StringCoverage} */ ('unscannable'),
  }));
  tmplAstVisitAll(new TemplateSinkVisitor(out, lineOffset), parsed.nodes);
  return out;
}

/**
 * Generated `content:` copy in a stylesheet. Screen readers read it, and no
 * token reaches it. Every string in the declaration counts - the alt text
 * after `/` (`'\25BC' / 'Expand'`) is exactly what AT reads, and a string
 * after `counter(n)` is copy too. CSS escapes (`'\25BC'`) are glyphs, not
 * words; `content: attr(x) / ''` carries no string copy at all.
 *
 * @param {string} stylesheet
 * @returns {readonly StringFinding[]}
 */
export function scanStylesheet(stylesheet) {
  const code = stylesheet.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  /** @type {StringFinding[]} */
  const out = [];
  for (const declaration of code.matchAll(/content\s*:([^;}]*)/g)) {
    const line = code.slice(0, declaration.index).split('\n').length;
    for (const string of declaration[1].matchAll(/(['"])((?:\\.|(?!\1).)*)\1/g)) {
      const value = string[2];
      if (hasWord(value.replace(/\\[0-9a-fA-F]{1,6}\s?/g, ''))) {
        out.push({ line, value, coverage: 'uncovered' });
      }
    }
  }
  return out;
}

/**
 * @param {ts.Node} node the literal
 * @param {ts.SourceFile} sf
 * @param {boolean} isOverrideSource
 * @returns {StringCoverage}
 */
const classify = (node, sf, isOverrideSource) => {
  if (isDevOnly(node, sf)) {
    return 'dev-message';
  }
  if (isOverrideSource) {
    return 'override-source';
  }
  if (isConfigFallback(node, sf)) {
    return 'config-fallback';
  }
  return 'uncovered';
};

/** TypeScript sources, external `templateUrl` templates and stylesheets. */
const SCANNED_EXTENSION = /\.(?:ts|html|css|scss)$/;

/**
 * @param {string} file repo-relative path
 * @returns {readonly StringFinding[]}
 */
const scanFile = (file) => {
  const text = readFileSync(resolve(REPO_ROOT, file), 'utf-8');
  if (file.endsWith('.html')) {
    return scanTemplate(text, file);
  }
  if (/\.s?css$/.test(file)) {
    return scanStylesheet(text);
  }
  return scanSource(text, file);
};

/**
 * @param {string} relDir
 * @returns {string[]}
 */
const walkSources = (relDir) => {
  const out = [];
  for (const entry of readdirSync(resolve(REPO_ROOT, relDir))) {
    const rel = `${relDir}/${entry}`;
    if (statSync(resolve(REPO_ROOT, rel)).isDirectory()) {
      if (!SKIPPED_DIRS.has(entry)) {
        out.push(...walkSources(rel));
      }
    } else if (
      SCANNED_EXTENSION.test(entry) &&
      !entry.includes('.spec.') &&
      !entry.includes('.fixtures.') &&
      !entry.endsWith('.d.ts')
    ) {
      out.push(rel);
    }
  }
  return out;
};

const SOURCES = walkSources('projects');
const FINDINGS = SOURCES.flatMap((file) => scanFile(file).map((finding) => ({ file, ...finding })));
const UNCOVERED = FINDINGS.filter((finding) => finding.coverage === 'uncovered');
const UNSCANNABLE = FINDINGS.filter((finding) => finding.coverage === 'unscannable');

/**
 * The ratchet's shrink rules as a pure check, so each rule carries a negative
 * self-test below. Returns one message per violation.
 *
 * (a) the length equals the ceiling exactly - no padded headroom;
 * (b) every row names the phase that closes it (2, 3 or 4);
 * (c) no row outlives its phase;
 * (d) after Phase 1 every row is one of the frozen Phase 1 keys - fixed rows
 *     leave, no row enters, not even in exchange for a fixed one.
 *
 * @param {{
 *   ratchet: readonly import('./user-facing-string-coverage.fixtures.mjs').StringManifestEntry[];
 *   ceiling: number;
 *   completedPhase: number;
 *   phase1Keys: ReadonlySet<string>;
 * }} input
 * @returns {string[]}
 */
export function checkRatchet({ ratchet, ceiling, completedPhase, phase1Keys }) {
  const violations = [];
  if (ratchet.length !== ceiling) {
    violations.push(`(a) RATCHET has ${ratchet.length} rows, ceiling is ${ceiling}`);
  }
  for (const row of ratchet) {
    if (![2, 3, 4].includes(row.closesIn)) {
      violations.push(`(b) ${row.file}: ${row.value} has closesIn ${row.closesIn}`);
    } else if (row.closesIn <= completedPhase) {
      violations.push(`(c) ${row.file}: ${row.value} outlived phase ${row.closesIn}`);
    }
    if (completedPhase >= 1 && !phase1Keys.has(key(row))) {
      violations.push(`(d) ${row.file}: ${row.value} entered after Phase 1`);
    }
  }
  return violations;
}

/** @param {{ file: string; value: string }} entry */
const key = (entry) => `${entry.file}\t${entry.value}`;
const manifested = new Set([...RATCHET, ...ALREADY_COVERED, ...EXCLUDED].map(key));
const found = new Set(UNCOVERED.map(key));

/** @param {readonly import('./user-facing-string-coverage.fixtures.mjs').StringManifestEntry[]} manifest */
const stale = (manifest) =>
  manifest
    .filter((entry) => !found.has(key(entry)))
    .map((entry) => `${entry.file}: ${entry.value}`);

describe('user-facing string coverage', () => {
  it('finds sources to scan', () => {
    expect(SOURCES.length).toBeGreaterThan(300);
  });

  it('parses every template it meets - an unparsed template is not a green one', () => {
    expect(UNSCANNABLE.map((f) => `${f.file}:${f.line}: ${f.value}`)).toEqual([]);
  });

  it('routes every user-facing string through an override or a manifest', () => {
    const unmanifested = UNCOVERED.filter((finding) => !manifested.has(key(finding))).map(
      (finding) => `${finding.file}:${finding.line}: ${finding.value}`,
    );
    expect(unmanifested).toEqual([]);
  });
});

describe('user-facing string ratchet', () => {
  it('only shrinks, through an exact ceiling and a closing phase per row', () => {
    expect(
      checkRatchet({
        ratchet: RATCHET,
        ceiling: RATCHET_CEILING,
        completedPhase: COMPLETED_PHASE,
        phase1Keys: PHASE_1_KEYS,
      }),
    ).toEqual([]);
  });

  it('freezes the Phase 1 keys as a sorted, duplicate-free snapshot', () => {
    const keys = [...PHASE_1_KEYS];
    expect(keys).toEqual([...new Set(keys)].sort());
  });

  it('carries no ratchet row that is already fixed', () => {
    expect(stale(RATCHET)).toEqual([]);
  });

  it('carries no allow-list row that no longer exists', () => {
    expect(stale(ALREADY_COVERED)).toEqual([]);
    expect(stale(EXCLUDED)).toEqual([]);
  });

  it('gives every row a reason', () => {
    const unreasoned = [...RATCHET, ...ALREADY_COVERED, ...EXCLUDED]
      .filter((entry) => entry.note.trim().length < 10)
      .map((entry) => `${entry.file}: ${entry.value}`);
    expect(unreasoned).toEqual([]);
  });
});

describe('user-facing string ratchet rules', () => {
  const row = (closesIn, value = 'Close') => ({
    file: 'x.ts',
    value,
    note: 'fixture row',
    closesIn,
  });
  const phase1Keys = new Set(['x.ts\tClose', 'x.ts\tOpen']);
  const base = { ratchet: [row(2), row(3, 'Open')], ceiling: 2, completedPhase: 0, phase1Keys };

  it('passes an exact ceiling with a closing phase per row', () => {
    expect(checkRatchet(base)).toEqual([]);
  });

  it('(a) fails a ceiling above the length', () => {
    expect(checkRatchet({ ...base, ceiling: 3 })).toHaveLength(1);
  });

  it('(b) fails a row without closesIn and a row closing in an unknown phase', () => {
    const ratchet = [row(undefined), row(5)];
    expect(checkRatchet({ ...base, ratchet })).toHaveLength(2);
  });

  it('(c) fails a row that outlived its phase', () => {
    expect(checkRatchet({ ...base, completedPhase: 2 })).toHaveLength(1);
  });

  it('(d) fails a row that entered after Phase 1, even in exchange for a fixed one', () => {
    const ratchet = [row(2), row(3, 'Dismiss')];
    expect(checkRatchet({ ...base, ratchet, completedPhase: 1 })).toEqual([
      '(d) x.ts: Dismiss entered after Phase 1',
    ]);
  });

  it('(d) passes a Phase 1 row once Phase 1 is done', () => {
    expect(checkRatchet({ ...base, completedPhase: 1 })).toEqual([]);
  });
});

describe('user-facing string scanner', () => {
  it('reports a hardcoded host aria-label', () => {
    const source = "@Component({ host: { 'aria-label': 'Alerts' } }) class X {}";
    expect(scanSource(source, 'alert-stack.ts')).toEqual([
      { line: 1, value: 'Alerts', coverage: 'uncovered' },
    ]);
  });

  it('treats a literal in an i18n module as the EN default', () => {
    const source = "export const D = { previousStep: 'Previous step' };";
    expect(scanSource(source, 'projects/common/stepper/i18n/stepper-i18n.ts')[0].coverage).toBe(
      'override-source',
    );
  });

  it('treats a config coalesce as covered', () => {
    const source = "const label = this.config.ariaLabels?.clearButton ?? 'Clear selection';";
    expect(scanSource(source, 'select.component.ts')[0].coverage).toBe('config-fallback');
  });

  it('reports a bare input default', () => {
    const source = "readonly removeAriaLabel = input<string>('Remove');";
    expect(scanSource(source, 'chip.component.ts')[0].coverage).toBe('uncovered');
  });

  it("treats input(cfg.x ?? 'X') as config-fallback", () => {
    const source = "readonly ariaLabel = input(this.cfg.ariaLabel ?? 'Breadcrumb');";
    expect(scanSource(source, 'breadcrumb.ts')[0].coverage).toBe('config-fallback');
  });

  it("treats input(this.i18n.x ?? 'X') as config-fallback", () => {
    const source = "class X { readonly label = input(this.i18n.loadingLabel ?? 'Loading'); }";
    expect(scanSource(source, 'loading.ts')[0].coverage).toBe('config-fallback');
  });

  it("treats input(this.i18n().x ?? 'X') as config-fallback", () => {
    const source = "class X { readonly label = input(this.i18n().loadingLabel ?? 'Loading'); }";
    expect(scanSource(source, 'loading.ts')[0].coverage).toBe('config-fallback');
  });

  it('does not take a config word on a neighbouring line for a fallback', () => {
    const source = [
      'const config = inject(CONFIG);',
      "const label = this.fallback() ?? 'Close panel';",
    ].join('\n');
    expect(scanSource(source, 'panel.ts')[0].coverage).toBe('uncovered');
  });

  it('does not take an unrelated throw two lines above for dev copy', () => {
    const source = [
      'class X {',
      '  check() { if (!this.el) { throw y; } }',
      "  readonly closeLabel = input('Close panel');",
      '}',
    ].join('\n');
    expect(scanSource(source, 'panel.ts')[0].coverage).toBe('uncovered');
  });

  it('classifies copy behind an isDevMode() guard as dev copy', () => {
    const source = "if (isDevMode()) { report('Missing label on the trigger'); }";
    expect(scanSource(source, 'x.ts')[0].coverage).toBe('dev-message');
  });

  it('keeps copy in the production branch of an isDevMode() guard', () => {
    const source = "if (isDevMode()) { check(); } else { show('Close panel'); }";
    expect(scanSource(source, 'x.ts')[0].coverage).toBe('uncovered');
  });

  it('(c) reports a lowercase default on a label-sink model()', () => {
    const source = "class X { readonly plural = model<string>('results'); }";
    expect(scanSource(source, 'count.ts')).toEqual([
      { line: 1, value: 'results', coverage: 'uncovered' },
    ]);
  });

  it('classifies a literal on the fourth line of a console.warn chain as dev copy', () => {
    const source = [
      'console.warn(',
      "  '[cngxMatTabs] aggregator-content slot half-wired - ' +",
      "    'The projector falls back to textContent. ' +",
      "    'Wire both halves on the directive (or neither).',",
      ');',
    ].join('\n');
    expect(scanSource(source, 'half-wired-slot-sink.ts').map((f) => f.coverage)).toEqual([
      'dev-message',
      'dev-message',
    ]);
  });

  it('ignores event-key names and token debug names', () => {
    const source = [
      "if (event.key === 'ArrowDown') {}",
      "new InjectionToken('CngxSelectPanelHost');",
    ].join('\n');
    expect(scanSource(source, 'x.ts')).toEqual([]);
  });

  it('ignores a literal that is compared against, not shown', () => {
    const source = "const isMac = navigator.userAgent.includes('Mac');";
    expect(scanSource(source, 'sidenav.ts')).toEqual([]);
  });

  it('reports a double-quoted phrase', () => {
    const source = 'const title = "Close panel";';
    expect(scanSource(source, 'panel.ts')).toEqual([
      { line: 1, value: 'Close panel', coverage: 'uncovered' },
    ]);
  });

  it('reports a backtick phrase with its substitutions normalised', () => {
    const source = 'const label = `${done} of ${total}`;';
    expect(scanSource(source, 'goal.ts')).toEqual([
      { line: 1, value: '{} of {}', coverage: 'uncovered' },
    ]);
  });

  it('ignores a word glued to a substitution', () => {
    const source = ['const d = `${ms}ms`;', 'const k = `${key}State`;'].join('\n');
    expect(scanSource(source, 'x.ts')).toEqual([]);
  });

  it('reports a digit-leading phrase', () => {
    const source = "const one = count === 1 ? '1 row selected' : other;";
    expect(scanSource(source, 'table.ts')).toEqual([
      { line: 1, value: '1 row selected', coverage: 'uncovered' },
    ]);
  });

  it('ignores SVG path data', () => {
    const source = "const d = 'M12 2 L22 22 H2 Z'; const e = `M${x} ${y} L${x2} ${y2}`;";
    expect(scanSource(source, 'icon.ts')).toEqual([]);
  });

  it('classifies a literal with a {placeholder} as a phrase', () => {
    const source = "const tpl = 'Sorted by {label} ascending';";
    expect(scanSource(source, 'sort.ts')).toEqual([
      { line: 1, value: 'Sorted by {label} ascending', coverage: 'uncovered' },
    ]);
  });

  it('ignores a lone placeholder', () => {
    expect(scanSource("const tpl = '{x}';", 'x.ts')).toEqual([]);
  });

  it('reports a static sink attribute in an inline template', () => {
    const source = [
      '@Component({',
      '  template: `',
      '    <button label="Dismiss"></button>',
      '  `,',
      '})',
      'class X {}',
    ].join('\n');
    expect(scanSource(source, 'alert.ts')).toEqual([
      { line: 3, value: 'Dismiss', coverage: 'uncovered' },
    ]);
  });

  it('reports a text node', () => {
    expect(scanTemplate('<span role="status">Refreshing content</span>', 'x.html')).toEqual([
      { line: 1, value: 'Refreshing content', coverage: 'uncovered' },
    ]);
  });

  it('reports the static parts of an interpolation', () => {
    expect(scanTemplate('<button>+ {{ n }} more</button>', 'x.html')).toEqual([
      { line: 1, value: '+ {} more', coverage: 'uncovered' },
    ]);
  });

  it('ignores bound attributes and non-sink attributes', () => {
    expect(scanTemplate('<div class="foo" [attr.aria-label]="x()"></div>', 'x.html')).toEqual([]);
  });

  it('reports the static parts of an interpolated sink attribute', () => {
    expect(scanTemplate('<button aria-label="Remove {{ name }}"></button>', 'x.html')).toEqual([
      { line: 1, value: 'Remove {}', coverage: 'uncovered' },
    ]);
  });

  it('reports a literal bound into a sink', () => {
    expect(scanTemplate(`<button [attr.aria-label]="'Close panel'"></button>`, 'x.html')).toEqual([
      { line: 1, value: 'Close panel', coverage: 'uncovered' },
    ]);
  });

  it('reports literal branches of an interpolation', () => {
    const findings = scanTemplate(`<span>{{ open ? 'Collapse' : 'Expand' }}</span>`, 'x.html');
    expect(findings.map((f) => f.value)).toEqual(['Collapse', 'Expand']);
  });

  it('treats a config coalesce inside a binding as covered', () => {
    const template = `<div [attr.aria-label]="host.ariaLabels.loading ?? 'Loading options'"></div>`;
    expect(scanTemplate(template, 'x.html')).toEqual([]);
  });

  it('ignores pipe and call arguments', () => {
    const template = `<span>{{ d | date: 'short' }}</span><b [title]="fmt(x, 'long')"></b>`;
    expect(scanTemplate(template, 'x.html')).toEqual([]);
  });

  it('reports lowercase copy on a static host sink, not on other host keys', () => {
    const source = [
      '@Directive({',
      "  host: { role: 'region', 'aria-live': 'polite', 'aria-roledescription': 'carousel' },",
      '})',
      'class X {}',
    ].join('\n');
    expect(scanSource(source, 'carousel.ts')).toEqual([
      { line: 2, value: 'carousel', coverage: 'uncovered' },
    ]);
  });

  it('reports literals in a host sink binding', () => {
    const source = [
      '@Component({',
      `  host: { '[attr.aria-label]': "open() ? 'Collapse' : 'Expand'" },`,
      '})',
      'class X {}',
    ].join('\n');
    expect(scanSource(source, 'toggle.ts')).toEqual([
      { line: 2, value: 'Collapse', coverage: 'uncovered' },
      { line: 2, value: 'Expand', coverage: 'uncovered' },
    ]);
  });

  it('reports a sink nested in a control-flow block', () => {
    const template = ['@if (x) {', '  <cngx-popover-close label="Close" />', '}'].join('\n');
    expect(scanTemplate(template, 'x.html')).toEqual([
      { line: 2, value: 'Close', coverage: 'uncovered' },
    ]);
  });

  it('scans a template held in a same-file const', () => {
    const source = [
      'const T = `',
      '  <button label="Dismiss"></button>',
      '`;',
      '@Component({ template: T })',
      'class X {}',
    ].join('\n');
    expect(scanSource(source, 'alert.ts')).toEqual([
      { line: 2, value: 'Dismiss', coverage: 'uncovered' },
    ]);
  });

  it('reports a template it cannot scan instead of skipping it', () => {
    const source = '@Component({ template: `<b>${label}</b>` }) class X {}';
    expect(scanSource(source, 'x.ts').map((f) => f.coverage)).toEqual(['unscannable']);
  });

  it('reports a template parse error instead of returning green', () => {
    expect(
      scanTemplate('<div><span>Close panel</div>', 'x.html').some(
        (f) => f.coverage === 'unscannable',
      ),
    ).toBe(true);
  });

  it('scans external .html templates', () => {
    expect(SOURCES.some((file) => file.endsWith('.html'))).toBe(true);
  });

  it('reports stylesheet content copy', () => {
    const stylesheet = ['.x::before {', "  content: 'NOTE';", '}'].join('\n');
    expect(scanStylesheet(stylesheet)).toEqual([{ line: 2, value: 'NOTE', coverage: 'uncovered' }]);
  });

  it('reports the alt text after a glyph and a string after counter()', () => {
    const stylesheet = [
      ".a::after { content: '\\25BC' / 'Expand'; }",
      ".b::after { content: counter(n) ' items'; }",
    ].join('\n');
    expect(scanStylesheet(stylesheet).map((f) => [f.line, f.value])).toEqual([
      [1, 'Expand'],
      [2, ' items'],
    ]);
  });

  it('ignores a CSS escape glyph and an attr() name', () => {
    const stylesheet = [
      ".a::after { content: '\\25BC'; }",
      ".b::after { content: attr(data-x) / ''; }",
    ].join('\n');
    expect(scanStylesheet(stylesheet)).toEqual([]);
  });

  it('(c) reports a lowercase default on a label-sink input', () => {
    const source = "class X { readonly plural = input<string>('results'); }";
    expect(scanSource(source, 'count.ts')).toEqual([
      { line: 1, value: 'results', coverage: 'uncovered' },
    ]);
  });

  it('(c) ignores an enum default on a non-label input', () => {
    expect(scanSource("class X { readonly orientation = input('horizontal'); }", 'x.ts')).toEqual(
      [],
    );
  });

  it('(c) reads a const-indirected default through to its literal', () => {
    const source = [
      "const NOT_SORTED = 'not sorted';",
      'class X {',
      '  readonly notSortedLabel = input(NOT_SORTED);',
      '}',
    ].join('\n');
    expect(scanSource(source, 'sort.ts')).toEqual([
      { line: 3, value: 'not sorted', coverage: 'uncovered' },
    ]);
  });

  it('(d) reports a value of a word-map const', () => {
    const source = "const SENTIMENT_WORD = { good: 'improved' };";
    expect(scanSource(source, 'delta.ts')).toEqual([
      { line: 1, value: 'improved', coverage: 'uncovered' },
    ]);
  });

  it('(d) ignores providedIn, array consts and key maps', () => {
    const source = [
      "const TOKEN_LABEL = { providedIn: 'root' };",
      "const TEXT_SCALE_VALUES = ['sm', 'md'];",
      "const SCORE_LABELS: Record<Score, PasswordStrengthLabel> = { 0: 'weak' };",
    ].join('\n');
    expect(scanSource(source, 'x.ts')).toEqual([]);
  });

  it('(e) reports a literal a label computed() resolves to', () => {
    const source =
      "class X { readonly resolvedLabel = computed(() => (this.dir() === 'up' ? 'up' : '')); }";
    expect(scanSource(source, 'trend.ts')).toEqual([
      { line: 1, value: 'up', coverage: 'uncovered' },
    ]);
  });

  it('(e) ignores an attribute name inside a label computed()', () => {
    const source =
      "class X { readonly ariaLabel = computed(() => this.el.hasAttribute('aria-label')); }";
    expect(scanSource(source, 'x.ts')).toEqual([]);
  });

  it('ignores strings inside comments', () => {
    const source = "/* host: { 'aria-label': 'Alerts' } */ const x = 1;";
    expect(scanSource(source, 'x.ts')).toEqual([]);
  });
});
