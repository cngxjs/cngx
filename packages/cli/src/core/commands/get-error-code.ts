// get_error_code - explain a CNGX error code. The snapshot step derives the
// `cngxErrorCodes` block from the error-code manifest (one source, Pillar 1), so
// this command only reads it; it never lists a code itself. No version, or the
// bundled one, answers from the bundled block offline; another version answers from
// that release's `error-codes.json` asset.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { defaultFound } from '../found.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { ErrorCodeIndex } from '../data/loader.js';
import type { ErrorCodeEntry } from '../data/types.js';
import { blocks, bullets, cell, section, table } from './markdown.js';
import { errorCodeVersionInput } from './version-input.js';

/** A parseable-but-unknown code: the lib its number falls in, the nearest codes, the doc URL it would have. */
export interface ExplainNotFound {
  code: string;
  lib: string | null;
  nearest: string[];
  url: string | null;
}

/** The entry when the code is known, a not-found view when it is parseable but absent, `null` when the input is not a code. */
export type ExplainErrorPayload = ErrorCodeEntry | ExplainNotFound | null;

const CODE_PATTERN = /CNGX(\d{4})/i;

/**
 * The first `CNGX\d{4}` anywhere in the input (case-insensitive, so a pasted
 * console line works), else a bare four-digit number, else `null`. A number is
 * never zero-padded: `12` is too ambiguous to guess, so `1` and `CNGX12` are not
 * codes.
 */
export function parseErrorCode(input: string): string | null {
  const tagged = CODE_PATTERN.exec(input);
  if (tagged) {
    return `CNGX${tagged[1]}`;
  }
  const trimmed = input.trim();
  return /^\d{4}$/.test(trimmed) ? `CNGX${trimmed}` : null;
}

/** The numeric part of a `CNGXnnnn` code. */
function codeNumber(code: string): number {
  return Number.parseInt(code.slice(4), 10);
}

/** The lib whose range contains `n`, or `null` when `n` is outside every range. */
function libForNumber(ranges: ErrorCodeIndex['ranges'], n: number): string | null {
  return ranges.find((range) => n >= range.from && n <= range.to)?.lib ?? null;
}

/** Up to three existing codes of `lib` nearest to `n`, closest first, code-sorted on ties. */
function nearestCodes(codes: readonly ErrorCodeEntry[], lib: string, n: number): string[] {
  return codes
    .filter((entry) => entry.lib === lib)
    .map((entry) => ({ code: entry.code, distance: Math.abs(codeNumber(entry.code) - n) }))
    .sort((a, b) => a.distance - b.distance || a.code.localeCompare(b.code))
    .slice(0, 3)
    .map((entry) => entry.code);
}

/**
 * Explain `input` against `block`: the entry when the code is known, a not-found
 * view when it is a parseable code the block does not carry, `null` when the input
 * is not a code at all. No readable block answers a not-found view with a `null`
 * url (nothing to link).
 */
export function explainError(block: ErrorCodeIndex | null, input: string): ExplainErrorPayload {
  const code = parseErrorCode(input);
  if (code === null) {
    return null;
  }
  if (block === null) {
    return { code, lib: null, nearest: [], url: null };
  }
  const entry = block.codes.find((candidate) => candidate.code === code);
  if (entry) {
    return entry;
  }
  const n = codeNumber(code);
  const lib = libForNumber(block.ranges, n);
  return { code, lib, nearest: lib === null ? [] : nearestCodes(block.codes, lib, n), url: `${block.docsBaseUrl}${code.toLowerCase()}.html` };
}

function isNotFound(payload: ExplainErrorPayload): payload is ExplainNotFound {
  return payload !== null && 'nearest' in payload;
}

/** Plain-language production behaviour for the table cell. */
function productionText(production: string): string {
  if (production === 'stripped') {
    return 'printed in development builds only';
  }
  if (production === 'code-only') {
    return 'thrown in production with the bare code as its message';
  }
  return production;
}

function entryMarkdown(entry: ErrorCodeEntry): string {
  return blocks(
    `## ${entry.code} - ${entry.title}`,
    // Defensive: every code is `active` today, but a retired one must render its status first.
    entry.status !== 'active' && `Status: ${entry.status}.`,
    table(
      ['Lib', 'Severity', 'Production', 'Status'],
      [[cell(entry.lib), cell(entry.severity), cell(productionText(entry.production)), cell(entry.status)]],
    ),
    section('Messages', bullets(entry.messages), 'No recorded messages.'),
    entry.body,
    `Docs: ${entry.url}`,
  );
}

function notFoundMarkdown(view: ExplainNotFound): string {
  if (view.url === null) {
    return blocks(`## ${view.code}`, 'This snapshot carries no readable error codes.');
  }
  const where =
    view.lib === null
      ? `${view.code} is outside every cngx error-code range.`
      : `${view.code} is a ${view.lib} error code, but this snapshot does not carry it.`;
  return blocks(
    `## ${view.code} not found`,
    where,
    view.nearest.length > 0 && view.lib !== null && section(`Nearest ${view.lib} codes`, bullets(view.nearest), ''),
    'It may come from another cngx release; pass --cngx-version to ask that release.',
    `Docs: ${view.url}`,
  );
}

/** The payload as markdown: the entry, the not-found view, or the accepted input forms. */
export function explainErrorMarkdown(payload: ExplainErrorPayload): string {
  if (payload === null) {
    return blocks(
      '## Not a CNGX error code',
      'Pass a code like CNGX0001, cngx0001, 0001, or a pasted console line that contains one.',
    );
  }
  return isNotFound(payload) ? notFoundMarkdown(payload) : entryMarkdown(payload);
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'What does CNGX0001 mean and how do I fix it?';

export const explainErrorCommand = defineCommand({
  name: 'get_error_code',
  title: 'Explain a cngx error code',
  description:
    'Explain a CNGX error code (e.g. CNGX0001): its title, owning lib, severity, production behaviour, the messages ' +
    'its call sites print, and its documentation page. Accepts a bare code, a zero-padded four-digit number, or a ' +
    'pasted console line that contains one. Pass `version` when the code comes from another release than the bundled ' +
    'one. `result` is null when the input is not a code, and a not-found view (the matching lib and its nearest codes) ' +
    'when the code is unknown.',
  cliSummary:
    "Print a CNGX error code's title, lib, severity, production behaviour, messages and doc page. " +
    'Accepts CNGX0001, cngx0001, 0001 or a pasted console line. Exits 1 for an unknown code, listing the nearest codes.',
  cliName: 'explain',
  input: {
    code: z.string().describe('A CNGX error code or a console line containing one, e.g. "CNGX0001".'),
    version: errorCodeVersionInput,
  },
  positional: 'code',
  cliFlags: { version: 'cngx-version' },
  // An input that is not a code has nothing to look up in any release, so it never pays for a fetch.
  run: (ctx, { code, version }) =>
    answerVersioned(ctx.resolveErrorCodes, parseErrorCode(code) === null ? undefined : version, (block) => explainError(block, code)),
  // Found only for a real entry: the not-found view and the null (not-a-code) payload both exit 1.
  found: (payload: ExplainErrorPayload) => defaultFound(payload) && !isNotFound(payload),
  toMarkdown: (payload: ExplainErrorPayload) => explainErrorMarkdown(payload),
});
