// A page that quotes the start of its message has to quote what the code
// prints. Otherwise a reader searches the console, or the source, for text
// that is not there.
//
// Q1  in a paragraph about the message (it contains the word "message"), a
//     backticked span right after "starts with", "message reads" / "it
//     reads", "for example", or after a colon, is a quote. It starts with the
//     page's own `CNGXnnnn: `. A bare `[selector]` or `fn()` there names the
//     owner and is not a quote.
// Q2  every backticked span on a page that starts with its own `CNGXnnnn: `
//     is a prefix of a message the library prints for that code. Messages
//     are the ones `collectMessages` in `scripts/dev-diagnostics.mjs`
//     extracts (the same rows the error-code manifest records), followed
//     into the callers of a dev wrapper whose message is a parameter. A
//     `${...}` part, or any operand that is not literal text, is a
//     wildcard: it matches any text, but the literal text after it must
//     then match the quote, so a wildcard ends the comparison only when it
//     is the last part of the message.
// Q3  a quote that cannot be checked this way is listed in
//     QUOTE_EXEMPT with a reason; a row that no longer matches a quote, or
//     whose quote now passes, fails.
//
// Q4  a page with no quote that starts with its own `CNGXnnnn: ` is checked
//     by nothing above. Those pages are listed in UNQUOTED_PAGES, exactly:
//     a listed page that gains such a quote, or a new page without one,
//     fails until the list is updated.
//
// Known limits, exactly what is not compared:
// - every page in UNQUOTED_PAGES (none today): its prose about the
//   message is not compared with the message at all;
// - the prose around a quote: a page is checked through its quotes, so a
//   sentence that paraphrases the message is not compared;
// - a backticked span that neither follows a Q1 lead-in in a paragraph
//   about the message nor starts with the page's own `CNGXnnnn: `;
// - the text a wildcard stands for, so a quote that invents the value of
//   a `${...}` part passes as long as the literal text after it matches;
// - a quote whose end falls inside a wildcard that is not the last part
//   fails, even when the invented value is plausible: quote up to the
//   next literal text, or stop before the `${...}` part;
// - a message whose first operand is not literal text is one wildcard
//   and matches every quote.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { WILD, collectMessages } from '../dev-diagnostics.mjs';
import { PAGES_DIR, readSources } from '../error-codes-manifest.mjs';

/**
 * Quotes the check cannot verify. Exact list; every row needs a reason a
 * reviewer can check.
 *
 * @type {{ code: string; quote: string; reason: string }[]}
 */
const QUOTE_EXEMPT = [
  {
    code: 'CNGX3006',
    quote: 'contentTemplate',
    reason: 'names the value of a part of the message, not its start',
  },
];

/**
 * Pages with no quote that starts with their own `CNGXnnnn: `: Q2 has
 * nothing to compare on them. Exact list (Q4), empty since every page
 * quotes its message start; a new page quotes its own instead of joining.
 */
/** @type {string[]} */
const UNQUOTED_PAGES = [];

const LEAD_IN = /(?:starts with|(?:message|it) reads|for example|:)\s*$/;
/** A bare `[selector]` or `fn()`: names the owner, does not quote the message. */
const OWNER_ONLY = /^(?:\[[^\]]+\]|[a-z][A-Za-z0-9]*\(\))$/;
/** A Markdown code span, also one fenced by two backticks to hold a backtick. */
const SPAN = /(`+)(?!`)([\s\S]*?[^`])\1(?!`)/g;

/** The text of a code span: one leading and trailing space stripped when both are there. */
const spanText = (raw) => (/^ .* $/s.test(raw) && raw.trim() ? raw.slice(1, -1) : raw);

/**
 * Is `quote` the start of some text that `segments` can produce? A WILD
 * part consumes the rest of the quote only when it is the last segment;
 * otherwise the literal text after it must match after the consumed text.
 */
export function isPrefixOf(quote, segments, at = 0, index = 0) {
  if (at === quote.length) {
    return true;
  }
  if (index === segments.length) {
    return false;
  }
  const part = segments[index];
  if (part === WILD) {
    if (index === segments.length - 1) {
      return true;
    }
    for (let next = at; next < quote.length; next++) {
      if (isPrefixOf(quote, segments, next, index + 1)) {
        return true;
      }
    }
    return false;
  }
  const rest = quote.slice(at);
  if (rest.length <= part.length) {
    return part.startsWith(rest);
  }
  return rest.startsWith(part) && isPrefixOf(quote, segments, at + part.length, index + 1);
}

/**
 * Every message the library prints, by code, as segment lists.
 *
 * @param {{ path: string; text: string }[]} files
 * @returns {Map<string, (string | symbol)[][]>}
 */
export function messagesByCode(files) {
  const out = new Map();
  for (const { code, segments } of collectMessages(files)) {
    out.set(code, [...(out.get(code) ?? []), segments]);
  }
  return out;
}

/**
 * Every problem with the quotes on `pages` ([{ code, text }]).
 *
 * @returns {{ code: string; quote: string; problem: string }[]}
 */
export function quoteProblems(pages, messages) {
  const out = [];
  for (const { code, text } of pages) {
    const prefix = `${code}: `;
    for (const paragraph of text.split(/\n\s*\n/)) {
      if (paragraph.startsWith('```')) {
        continue;
      }
      const aboutMessage = /\bmessage\b/i.test(paragraph);
      let previousEnd = 0;
      for (const match of paragraph.matchAll(SPAN)) {
        const quote = spanText(match[2]);
        const leadIn = LEAD_IN.test(paragraph.slice(previousEnd, match.index));
        previousEnd = match.index + match[0].length;
        if (aboutMessage && leadIn && !OWNER_ONLY.test(quote) && !quote.startsWith(prefix)) {
          out.push({ code, quote, problem: `does not start with "${prefix}"` });
          continue;
        }
        if (!quote.startsWith(prefix) || quote === prefix) {
          continue;
        }
        const body = quote.slice(prefix.length);
        const known = messages.get(code) ?? [];
        if (!known.some((segments) => isPrefixOf(body, segments))) {
          out.push({ code, quote, problem: 'is not the start of any message for this code' });
        }
      }
    }
  }
  return out;
}

/** Problems that QUOTE_EXEMPT does not cover, and rows that cover nothing. */
export function unexemptedProblems(problems, exempt = QUOTE_EXEMPT) {
  const covers = (row, p) => row.code === p.code && row.quote === p.quote;
  return [
    ...problems
      .filter((p) => !exempt.some((row) => covers(row, p)))
      .map((p) => `${p.code} \`${p.quote}\` ${p.problem}`),
    ...exempt
      .filter((row) => !problems.some((p) => covers(row, p)))
      .map((row) => `QUOTE_EXEMPT row ${row.code} \`${row.quote}\` matches no failing quote`),
  ];
}

/** Codes of `pages` that carry no quote starting with their own `CNGXnnnn: `, sorted. */
export function unquotedPages(pages) {
  return pages
    .filter(({ code, text }) => {
      const prefix = `${code}: `;
      return ![...text.matchAll(SPAN)].some((match) => {
        const quote = spanText(match[2]);
        return quote.startsWith(prefix) && quote !== prefix;
      });
    })
    .map(({ code }) => code)
    .sort();
}

function readCodePages() {
  return readdirSync(PAGES_DIR)
    .filter((name) => /^cngx\d{4}\.md$/.test(name))
    .map((name) => ({
      code: name.slice(0, 8).toUpperCase(),
      text: readFileSync(resolve(PAGES_DIR, name), 'utf8'),
    }));
}

const file = (text) => ({ path: 'projects/common/x/x.ts', text });
const guard = "typeof ngDevMode !== 'undefined' && ngDevMode";

describe('error-code page quotes - matcher', () => {
  it('matches literal text, template parts and concatenations as a prefix', () => {
    const messages = messagesByCode([
      file(`cngxDevWarn('CNGX1001', '[cngxMenu] has no label; ' + 'bind [aria-label].');`),
      file(
        `throw new CngxRuntimeError('CNGX1002', ${guard} && \`flattenTree(): duplicate id "\${id}" in tree\`);`,
      ),
    ]);
    const pages = [
      {
        code: 'CNGX1001',
        text: 'The message starts with `CNGX1001: [cngxMenu] has no label; bind`.',
      },
      {
        code: 'CNGX1002',
        text: 'The message reads `CNGX1002: flattenTree(): duplicate id "a" in`.',
      },
    ];
    expect(quoteProblems(pages, messages)).toEqual([]);
  });

  it('follows a dev wrapper into its callers', () => {
    const messages = messagesByCode([
      file(
        `function warn(message: string) { if (!(${guard})) { return; } cngxDevWarn('CNGX1003', message); }\n` +
          `function f() { if (${guard}) { warn('[cngxTab] lost its group.'); } }`,
      ),
    ]);
    const pages = [{ code: 'CNGX1003', text: 'The message reads `CNGX1003: [cngxTab] lost`.' }];
    expect(quoteProblems(pages, messages)).toEqual([]);
  });

  it('rejects a stale quote and a quote without the prefix', () => {
    const messages = messagesByCode([
      file(`cngxDevWarn('CNGX1004', 'tapHttpAsyncState(): body is null');`),
    ]);
    const pages = [
      {
        code: 'CNGX1004',
        text:
          'The message starts with `CNGX1004: tapHttpAsyncState: body`.\n\n' +
          'The message quotes it, for example `body is null`.',
      },
    ];
    expect(quoteProblems(pages, messages).map((p) => p.quote)).toEqual([
      'CNGX1004: tapHttpAsyncState: body',
      'body is null',
    ]);
  });

  it('compares the text after a template part', () => {
    const messages = messagesByCode([
      file(
        `cngxDevWarn('CNGX1005', \`[cngxMenu] item "\${id}" has no label; bind [aria-label].\`);`,
      ),
    ]);
    const pages = [
      {
        code: 'CNGX1005',
        text:
          'The message starts with `CNGX1005: [cngxMenu] item "save" has no label; bind`.\n\n' +
          'The message reads `CNGX1005: [cngxMenu] item "save" lacks a label`.',
      },
    ];
    expect(quoteProblems(pages, messages).map((p) => p.quote)).toEqual([
      'CNGX1005: [cngxMenu] item "save" lacks a label',
    ]);
  });

  it('names the pages without a prefixed quote', () => {
    const pages = [
      { code: 'CNGX1002', text: 'The message starts with `CNGX1002: [cngxMenu] has`.' },
      { code: 'CNGX1001', text: 'The menu warns when it has no label.' },
      { code: 'CNGX1003', text: 'Only the bare prefix `CNGX1003: ` and a name `[cngxTab]`.' },
    ];
    expect(unquotedPages(pages)).toEqual(['CNGX1001', 'CNGX1003']);
  });

  it('reports an exemption row that covers nothing', () => {
    expect(unexemptedProblems([], [{ code: 'CNGX1', quote: 'x', reason: 'r' }])).toEqual([
      'QUOTE_EXEMPT row CNGX1 `x` matches no failing quote',
    ]);
  });
});

describe('error-code page quotes - core-concepts/error-codes', () => {
  let problems;
  beforeAll(() => {
    problems = unexemptedProblems(quoteProblems(readCodePages(), messagesByCode(readSources())));
  });

  it('quotes every message start with its code and as the code prints it', () => {
    expect(
      problems,
      'Quote the message start as the library prints it, from `CNGXnnnn: ` on, or add a QUOTE_EXEMPT row with a reason',
    ).toEqual([]);
  });

  it('lists exactly the pages that quote no message start (UNQUOTED_PAGES)', () => {
    expect(
      unquotedPages(readCodePages()),
      'A page gained or lost a `CNGXnnnn: ` quote: update UNQUOTED_PAGES to match',
    ).toEqual(UNQUOTED_PAGES);
  });

  it('gives every exemption a reason', () => {
    expect(QUOTE_EXEMPT.filter((row) => !row.reason?.trim())).toEqual([]);
  });
});
