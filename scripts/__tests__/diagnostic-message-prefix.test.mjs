// Every diagnostic message names its owner first, in one shape, so a reader
// of the console finds the call site without guessing, and a spec or a page
// can quote the start of a message without it drifting between styles.
//
// P1  the message of every `cngxDevWarn` / `cngxDevError` call and every
//     `new CngxRuntimeError(...)` in library source (for a guarded message,
//     the text after the `ngDevMode` guard) starts with its owner:
//     - a directive or component: its public selector in brackets, an
//       attribute selector as written (`[cngxMenu]`), an element selector as
//       `[cngx-stepper]`;
//     - a function or provider: its name with parentheses (`flattenTree()`).
//     A template literal may build the selector from a parameter, as long as
//     the brackets are literal (`[${selector}]`).
// P2  a message names a `CNGX_*` token only when the consumer provides that
//     token to fix the problem (CONSUMER_TOKENS, each with a reason). A
//     contract token the library provides itself is internal wiring and
//     never appears.
//
// P3  when the brackets wrap a parameter of the enclosing named function
//     (`[${selector}]` in `injectPaginatorHost(selector)`), every library call
//     of that function that passes a string literal there passes a public
//     selector without brackets (`'cngx-pgn-pages'`, `'cngxLine'`).
//
// Known limits: a message passed as an identifier (the parameter of a
// guard-first dev wrapper) is not read; its wrapper's callers are. A message
// whose first part is a non-literal expression fails, because its start
// cannot be checked; that includes a concatenation starting with an
// identifier (`m + ' text'`), which only a whole-identifier message escapes. P3 follows calls in the declaring file and in files that
// import the function by a relative path, and checks only string-literal
// arguments: a selector handed through an object or another variable
// (`createPaginatorNavCore({ selector })`) is not traced, nor is a call
// through a re-export or a path alias.

import { posix } from 'node:path';

import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import { collectHelperCalls, collectRuntimeErrors, lineOf, unwrap } from '../dev-diagnostics.mjs';
import { readSources } from '../error-codes-manifest.mjs';

const SELECTOR_PREFIX = /^\[(cngx[A-Z][A-Za-z0-9]*|cngx(?:-[a-z0-9]+)+)\]/;
const SELECTOR_ARGUMENT = /^(cngx[A-Z][A-Za-z0-9]*|cngx(?:-[a-z0-9]+)+)$/;
const FUNCTION_PREFIX = /^[a-z][A-Za-z0-9]*\(\)/;
const TOKEN = /\bCNGX_[A-Z0-9_]+\b/g;

/**
 * Tokens a message may name, because providing them is the fix. Exact list;
 * every row needs a reason a reviewer can check.
 *
 * @type {{ token: string; reason: string }[]}
 */
const CONSUMER_TOKENS = [
  {
    token: 'CNGX_STATEFUL',
    reason: 'a wrapping component provides it so the bridge reads its state without [state]',
  },
  {
    token: 'CNGX_MENU_SUBMENU_WIRING',
    reason: 'a component shell provides it to wire the submenu without template inputs',
  },
  {
    token: 'CNGX_SUBMENU_TRY_FALLBACKS',
    reason: 'the app provides it to set the companion popover fallbacks',
  },
  {
    token: 'CNGX_COMMIT_CONTROLLER_FACTORY',
    reason: 'the app overrides it; CNGX1040 reports that override',
  },
];
const ALLOWED_TOKENS = new Set(CONSUMER_TOKENS.map((row) => row.token));

/** The right-most leaf of an `&&` chain: the message behind a guard. */
function guardedTail(node) {
  let current = unwrap(node);
  while (
    ts.isBinaryExpression(current) &&
    current.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  ) {
    current = unwrap(current.right);
  }
  return current;
}

/** The left-most operand of a `+` concatenation. */
function firstPart(node) {
  let current = unwrap(node);
  while (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    current = unwrap(current.left);
  }
  return current;
}

/** Every literal text piece of a message, for the token scan. */
function literalTexts(node) {
  const out = [];
  const visit = (child) => {
    if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) {
      out.push(child.text);
    } else if (ts.isTemplateExpression(child)) {
      out.push(child.head.text, ...child.templateSpans.map((span) => span.literal.text));
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return out;
}

/**
 * Why the message `node` breaks the prefix rule, or null when it conforms.
 * Returns null for a message that is an identifier as a whole (a wrapper
 * parameter); a concatenation that starts with one fails.
 */
export function prefixProblem(node) {
  if (ts.isIdentifier(unwrap(node))) {
    return null;
  }
  const first = firstPart(node);
  if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) {
    const ok = SELECTOR_PREFIX.test(first.text) || FUNCTION_PREFIX.test(first.text);
    return ok ? null : `starts with "${first.text.slice(0, 40)}"`;
  }
  if (ts.isTemplateExpression(first)) {
    const head = first.head.text;
    if (SELECTOR_PREFIX.test(head) || FUNCTION_PREFIX.test(head)) {
      return null;
    }
    const dynamicSelector = head === '[' && first.templateSpans[0].literal.text.startsWith(']');
    return dynamicSelector ? null : `starts with "${head.slice(0, 40)}\${...}"`;
  }
  return 'starts with a non-literal expression';
}

/**
 * The function and parameter position a `[${param}]` message reads its
 * selector from, or null when the bracketed expression is not a parameter of
 * the enclosing named function.
 */
function selectorParameter(message) {
  const first = firstPart(message);
  if (!ts.isTemplateExpression(first) || first.head.text !== '[') {
    return null;
  }
  const expression = unwrap(first.templateSpans[0].expression);
  if (!ts.isIdentifier(expression)) {
    return null;
  }
  let fn = message.parent;
  while (fn && !ts.isFunctionDeclaration(fn)) {
    fn = fn.parent;
  }
  const index = fn?.parameters.findIndex(
    (param) => ts.isIdentifier(param.name) && param.name.text === expression.text,
  );
  return fn?.name && index !== undefined && index >= 0
    ? { name: fn.name.text, index, file: message.getSourceFile().fileName }
    : null;
}

/** Does `sf` import `name` by a relative path that lands on `target`? */
function importsFrom(sf, name, target) {
  return sf.statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith('.')
    ) {
      return false;
    }
    const resolved = posix.join(posix.dirname(sf.fileName), statement.moduleSpecifier.text);
    const bindings = statement.importClause?.namedBindings;
    return (
      `${resolved}.ts` === target &&
      bindings !== undefined &&
      ts.isNamedImports(bindings) &&
      bindings.elements.some((element) => element.name.text === name)
    );
  });
}

/**
 * Every literal argument passed to `name` at `index` that is not a selector,
 * in the file that declares it (`file`) and in files importing it from there.
 */
function badSelectorArguments(files, { name, index, file: declaredIn }) {
  const out = [];
  for (const { path, text } of files) {
    if (!text.includes(`${name}(`)) {
      continue;
    }
    const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    if (path !== declaredIn && !importsFrom(sf, name, declaredIn)) {
      continue;
    }
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === name
      ) {
        const arg = node.arguments[index];
        if (arg && ts.isStringLiteralLike(arg) && !SELECTOR_ARGUMENT.test(arg.text)) {
          out.push(`${path}:${lineOf(sf, node)} passes "${arg.text}" to ${name}() as a selector`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

/**
 * Every message in `files` ([{ path, text }]) that breaks P1, P2 or P3.
 *
 * @returns {string[]} one `path:line reason` per violation
 */
export function messagePrefixViolations(files) {
  const messages = [
    ...collectHelperCalls(files).map((call) => ({ ...call, message: call.node.arguments[1] })),
    ...collectRuntimeErrors(files).map((call) => ({
      ...call,
      message: call.node.arguments[1] && guardedTail(call.node.arguments[1]),
    })),
  ];
  const out = [];
  for (const { file, sf, node, message } of messages) {
    if (!message) {
      continue;
    }
    const where = `${file}:${lineOf(sf, node)}`;
    const problem = prefixProblem(message);
    if (problem) {
      out.push(`${where} ${problem}`);
    }
    const tokens = literalTexts(message).flatMap((text) => text.match(TOKEN) ?? []);
    for (const token of tokens.filter((name) => !ALLOWED_TOKENS.has(name))) {
      out.push(`${where} names the internal token ${token}`);
    }
    const parameter = selectorParameter(message);
    if (parameter) {
      out.push(...badSelectorArguments(files, parameter));
    }
  }
  return [...new Set(out)];
}

const file = (text) => ({ path: 'projects/common/x/x.ts', text });
const guard = "typeof ngDevMode !== 'undefined' && ngDevMode";

describe('diagnostic message prefix - scanner', () => {
  it('accepts a selector prefix, a function prefix and a literal-bracket template', () => {
    const files = [
      file(`cngxDevWarn('CNGX1001', '[cngxMenu] has no label');`),
      file(`cngxDevWarn('CNGX1001', '[cngx-stepper] more than ' + count + ' steps');`),
      file(`cngxDevError('CNGX1001', \`flattenTree(): duplicate node id "\${id}"\`);`),
      file(`cngxDevWarn('CNGX1001', \`[\${selector}] must be placed inside <cngx-x>.\`);`),
      file(
        `throw new CngxRuntimeError('CNGX1001', ${guard} && '[cngxTab] must be placed inside <cngx-tab-group>.');`,
      ),
      file(`function warn(message: string) { cngxDevWarn('CNGX1001', message); }`),
    ];
    expect(messagePrefixViolations(files)).toEqual([]);
  });

  it('rejects a class name, a bare selector, a library tag and a dynamic start', () => {
    const files = [
      file(`cngxDevWarn('CNGX1001', 'CngxPopover: the native Popover API is missing');`),
      file(`cngxDevWarn('CNGX1001', 'cngx-status: no label');`),
      file(`cngxDevWarn('CNGX1001', '[cngx] flattenTree: duplicate');`),
      file(`cngxDevWarn('CNGX1001', '[CngxRecycler] layout');`),
      file(`cngxDevWarn('CNGX1001', \`\${name}: "\${key}" is already registered\`);`),
      file(
        `throw new CngxRuntimeError('CNGX1001', ${guard} && 'tapHttpAsyncState: body is null');`,
      ),
    ];
    expect(messagePrefixViolations(files)).toHaveLength(6);
  });

  it('rejects a concatenation that starts with an identifier', () => {
    const files = [
      `function f(m: string) { cngxDevWarn('CNGX1001', m + ' text'); }`,
      `function f(m: string) { cngxDevWarn('CNGX1001', m + ''); }`,
      `function f(m: string) { throw new CngxRuntimeError('CNGX1001', ${guard} && m + '!'); }`,
    ].map((text, i) => ({ path: `projects/common/x/x${i}.ts`, text }));
    expect(messagePrefixViolations(files)).toEqual([
      'projects/common/x/x0.ts:1 starts with a non-literal expression',
      'projects/common/x/x1.ts:1 starts with a non-literal expression',
      'projects/common/x/x2.ts:1 starts with a non-literal expression',
    ]);
  });

  it('accepts a token the consumer provides', () => {
    const files = [
      file(
        `cngxDevError('CNGX1005', '[cngxToastOn] no state source; provide CNGX_STATEFUL or bind [state].');`,
      ),
    ];
    expect(messagePrefixViolations(files)).toEqual([]);
  });

  it('rejects an internal token name in the message text', () => {
    const files = [
      file(
        `throw new CngxRuntimeError('CNGX1048', ${guard} && \`[\${name}] missing CNGX_CHART_CONTEXT\`);`,
      ),
    ];
    expect(messagePrefixViolations(files)).toEqual([
      'projects/common/x/x.ts:1 names the internal token CNGX_CHART_CONTEXT',
    ]);
  });
});

describe('diagnostic message prefix - selector arguments', () => {
  const helper = `export function injectHost(selector: string) {
    throw new CngxRuntimeError('CNGX1001', ${guard} && \`[\${selector}] must be placed inside <cngx-x>.\`);
  }`;

  const importHost = "import { injectHost } from './x';\n";

  it('accepts callers that pass a public selector, and ignores a same-named function elsewhere', () => {
    const files = [
      file(helper),
      {
        path: 'projects/common/x/a.ts',
        text: `${importHost}const a = injectHost('cngx-pgn-pages');`,
      },
      { path: 'projects/common/x/b.ts', text: `${importHost}const b = injectHost('cngxLine');` },
      { path: 'projects/common/y/c.ts', text: "const c = injectHost('another function');" },
    ];
    expect(messagePrefixViolations(files)).toEqual([]);
  });

  it('rejects a caller that passes a class name or a bracketed selector', () => {
    const files = [
      file(helper),
      { path: 'projects/common/x/a.ts', text: `${importHost}const a = injectHost('CngxLine');` },
      { path: 'projects/common/x/b.ts', text: `${importHost}const b = injectHost('[cngxLine]');` },
    ];
    expect(messagePrefixViolations(files)).toEqual([
      'projects/common/x/a.ts:2 passes "CngxLine" to injectHost() as a selector',
      'projects/common/x/b.ts:2 passes "[cngxLine]" to injectHost() as a selector',
    ]);
  });
});

describe('diagnostic message prefix - consumer tokens', () => {
  it('gives every allowed token a reason', () => {
    expect(CONSUMER_TOKENS.filter((row) => !row.reason?.trim())).toEqual([]);
  });
});

describe('diagnostic message prefix - projects/**', () => {
  let violations;
  beforeAll(() => {
    violations = messagePrefixViolations(readSources());
  });

  it('starts every literal message with its selector or function name', () => {
    expect(
      violations,
      'Start the message with the public selector in brackets ([cngxMenu], [cngx-stepper]) ' +
        'or the function name with parentheses (flattenTree()), and name no internal token',
    ).toEqual([]);
  });
});
