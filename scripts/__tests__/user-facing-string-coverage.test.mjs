import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { parseTemplate, TmplAstRecursiveVisitor, tmplAstVisitAll } from '@angular/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  ALREADY_COVERED,
  COMPLETED_PHASE,
  EXCLUDED,
  PHASE_1_CEILING,
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
//
// A bare `input('X')` default is NOT covered: a per-instance binding alone is
// not translatable, the app-wide path is the token.
//   3. It is a dev-only message (`console.warn`, `new Error`, an `isDevMode()`
//      block). Never reaches an end user, never translated.
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

/** Markers of a message that only ever reaches a developer's console. */
const DEV_MARKER = /console\.|new Error|isDevMode|ngDevMode|\bthrow\b|\bwarn[A-Z]/;

/** Reads that make a following `??` / `||` literal a mere fallback. */
const CONFIG_READ = /\b(?:config|cfg|i18n|labels|messages|glyphs|defaults|ariaLabels)\b/i;

/**
 * @typedef {'override-source' | 'config-fallback' | 'dev-message' | 'uncovered'} StringCoverage
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
 * `@example` block is full of `aria-label="Price range"` prose, and the
 * classification context must not see it.
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
 * Walks back over a `'a' + 'b'` concatenation so a literal on the fifth line of
 * a `console.warn(...)` chain is classified by the head of the chain, not by
 * its own line.
 *
 * @param {readonly string[]} lines
 * @param {number} index
 * @returns {number}
 */
const expressionHead = (lines, index) => {
  let head = index;
  while (head > 0) {
    const previous = lines[head - 1].trimEnd();
    if (!/[+(,]$/.test(previous)) {
      break;
    }
    head -= 1;
  }
  return head;
};

/**
 * A `template:` initializer of an `@Component` decorator. Its content is
 * markup, not TypeScript copy.
 *
 * @param {ts.Node} node
 * @returns {boolean}
 */
const isComponentTemplate = (node) => {
  const prop = node.parent;
  if (!prop || !ts.isPropertyAssignment(prop) || prop.initializer !== node) {
    return false;
  }
  if (!ts.isIdentifier(prop.name) || prop.name.text !== 'template') {
    return false;
  }
  const call = prop.parent?.parent;
  return (
    !!call &&
    ts.isCallExpression(call) &&
    ts.isIdentifier(call.expression) &&
    call.expression.text === 'Component'
  );
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
 * (c) the default of an `input()` whose field name is a label sink, read
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
    if (!isCallTo(init, 'input') || !LABEL_INPUT_FIELD.test(node.name.text)) {
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

  const report = (node, value) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    const before = lines[line].slice(0, character);
    if (COMPARISON_BEFORE.test(before)) {
      return;
    }
    const head = expressionHead(lines, line);
    const context = lines.slice(Math.max(0, head - 2), line + 1).join('\n');
    findings.push({
      line: line + 1,
      value,
      coverage: classify({ before, context, isOverrideSource }),
    });
    reported.add(node);
  };

  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      return;
    }
    if (isComponentTemplate(node)) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        findings.push(...scanTemplate(node.text, fileName, line));
      }
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

/** @param {string} text */
const hasWord = (text) => /[A-Za-z]{2,}/.test(text);

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
    const isSink = ATTRIBUTE_SINKS.has(attribute.name) || attribute.name.endsWith('Label');
    if (isSink && hasWord(attribute.value)) {
      this.add(normaliseWhitespace(attribute.value), attribute.sourceSpan);
    }
  }

  visitText(text) {
    const value = normaliseWhitespace(text.value);
    if (hasWord(value)) {
      this.add(value, text.sourceSpan);
    }
  }

  visitBoundText(text) {
    const strings = text.value.ast.strings ?? [];
    if (hasWord(strings.join(' '))) {
      this.add(normaliseWhitespace(strings.join('{}')), text.sourceSpan);
    }
  }
}

/**
 * Static copy in an Angular template: sink attributes (`aria-label`, `title`,
 * `placeholder`, `*Label`, ...), text nodes, and the static parts of an
 * interpolation (`+ {{ n }} more` is reported as `+ {} more`). Template copy
 * has no override path by construction, so every finding is `uncovered`.
 *
 * @param {string} template
 * @param {string} fileName
 * @param {number} [lineOffset] 0-based line of the template's first line
 * @returns {readonly StringFinding[]}
 */
export function scanTemplate(template, fileName, lineOffset = 0) {
  const parsed = parseTemplate(template, fileName, { preserveWhitespaces: false });
  /** @type {StringFinding[]} */
  const out = [];
  tmplAstVisitAll(new TemplateSinkVisitor(out, lineOffset), parsed.nodes);
  return out;
}

/**
 * Generated `content:` copy in a stylesheet. Screen readers read it, and no
 * token reaches it. CSS escapes (`'\25BC'`) are glyphs, not words;
 * `content: attr(x) / ''` carries no string copy at all.
 *
 * @param {string} stylesheet
 * @returns {readonly StringFinding[]}
 */
export function scanStylesheet(stylesheet) {
  const code = stylesheet.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  /** @type {StringFinding[]} */
  const out = [];
  for (const match of code.matchAll(/content\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/g)) {
    const value = match[2];
    if (hasWord(value.replace(/\\[0-9a-fA-F]{1,6}\s?/g, ''))) {
      const line = code.slice(0, match.index).split('\n').length;
      out.push({ line, value, coverage: 'uncovered' });
    }
  }
  return out;
}

/**
 * @param {{ before: string; context: string; isOverrideSource: boolean }} input
 * @returns {StringCoverage}
 */
const classify = (input) => {
  if (DEV_MARKER.test(input.context)) {
    return 'dev-message';
  }
  if (input.isOverrideSource) {
    return 'override-source';
  }
  if (/(?:\?\?|\|\|)\s*$/.test(input.before.trimEnd()) && CONFIG_READ.test(input.context)) {
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
const UNCOVERED = SOURCES.flatMap((file) =>
  scanFile(file)
    .filter((finding) => finding.coverage === 'uncovered')
    .map((finding) => ({ file, ...finding })),
);

/**
 * The ratchet's shrink rules as a pure check, so each rule carries a negative
 * self-test below. Returns one message per violation.
 *
 * (a) the length equals the ceiling exactly - no padded headroom;
 * (b) every row names the phase that closes it (2, 3 or 4);
 * (c) no row outlives its phase;
 * (d) after Phase 1 the ceiling never rises above the frozen Phase 1 ceiling.
 *
 * @param {{
 *   ratchet: readonly import('./user-facing-string-coverage.fixtures.mjs').StringManifestEntry[];
 *   ceiling: number;
 *   completedPhase: number;
 *   phase1Ceiling: number;
 * }} input
 * @returns {string[]}
 */
export function checkRatchet({ ratchet, ceiling, completedPhase, phase1Ceiling }) {
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
  }
  if (completedPhase >= 1 && ceiling > phase1Ceiling) {
    violations.push(`(d) ceiling ${ceiling} exceeds the Phase 1 ceiling ${phase1Ceiling}`);
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
        phase1Ceiling: PHASE_1_CEILING,
      }),
    ).toEqual([]);
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
  const row = (closesIn) => ({ file: 'x.ts', value: 'Close', note: 'fixture row', closesIn });
  const base = { ratchet: [row(2), row(3)], ceiling: 2, completedPhase: 0, phase1Ceiling: 2 };

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

  it('(d) fails a ceiling above the Phase 1 ceiling once Phase 1 is done', () => {
    const ratchet = [row(2), row(3), row(4)];
    expect(checkRatchet({ ...base, ratchet, ceiling: 3, completedPhase: 1 })).toHaveLength(1);
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

  it('treats input(this.i18n.x) as config-fallback', () => {
    const source = 'class X { readonly label = input(this.i18n.loadingLabel); }';
    expect(scanSource(source, 'loading.ts').filter((f) => f.coverage === 'uncovered')).toEqual([]);
  });

  it('treats input(this.i18n().x) as config-fallback', () => {
    const source = 'class X { readonly label = input(this.i18n().loadingLabel); }';
    expect(scanSource(source, 'loading.ts').filter((f) => f.coverage === 'uncovered')).toEqual([]);
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

  it('reports a sink nested in a control-flow block', () => {
    const template = ['@if (x) {', '  <cngx-popover-close label="Close" />', '}'].join('\n');
    expect(scanTemplate(template, 'x.html')).toEqual([
      { line: 2, value: 'Close', coverage: 'uncovered' },
    ]);
  });

  it('scans external .html templates', () => {
    expect(SOURCES.some((file) => file.endsWith('.html'))).toBe(true);
  });

  it('reports stylesheet content copy', () => {
    const stylesheet = ['.x::before {', "  content: 'NOTE';", '}'].join('\n');
    expect(scanStylesheet(stylesheet)).toEqual([{ line: 2, value: 'NOTE', coverage: 'uncovered' }]);
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
