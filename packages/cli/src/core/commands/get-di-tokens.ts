// get_di_tokens - one job: the top-level DI `tokens[]`, optionally filtered by a
// name fragment. Split out from the old dual-mode get_tokens so the return shape
// is predictable - always a token list, never a component's theming block.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import { cell, code, table, textCell } from './markdown.js';

export interface DiTokenView {
  name: string;
  file: string | null;
  description: string | null;
}

/** Pure query behind the tool - an empty/absent query returns the full list. */
export function getDiTokens(docs: DocsIndex, query?: string): DiTokenView[] {
  const needle = query?.trim().toLowerCase() ?? '';
  return docs.tokens
    .filter((token) => needle === '' || token.name.toLowerCase().includes(needle))
    .map((token) => ({
      name: token.name,
      file: token.file ?? null,
      description: token.description ?? null,
    }));
}

/** The DI tokens as one table, or a no-match line. */
export function diTokensMarkdown(tokens: DiTokenView[] | null): string {
  if (!tokens || tokens.length === 0) {
    return 'No DI token matches.\n';
  }
  const rows = tokens.map((t) => [code(t.name), cell(t.file), textCell(t.description)]);
  return `${table(['Token', 'File', 'Description'], rows)}\n`;
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'Which DI tokens configure the select family?';

export const getDiTokensCommand = defineCommand({
  name: 'get_di_tokens',
  title: 'Get cngx DI tokens',
  description:
    'Return the top-level DI injection tokens, optionally filtered by a name fragment. Omit the ' +
    "argument for the full list. For a component's theming tokens, use get_theme_tokens.",
  cliName: 'di',
  input: {
    query: z.string().optional().describe('A DI-token name fragment, e.g. "SELECT". Omit for all DI tokens.'),
    version: versionInput,
  },
  positional: 'query',
  cliFlags: { version: 'cngx-version' },
  run: (ctx, { query, version }) => answerVersioned(ctx.resolve, version, (resolved) => getDiTokens(resolved, query)),
  toMarkdown: (tokens: DiTokenView[] | null) => diTokensMarkdown(tokens),
});
