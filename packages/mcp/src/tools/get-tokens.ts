// get_tokens - covers both token surfaces from one optional input:
//   - a name that resolves to a component/directive returns that entry's
//     theming tokens (per-component `themeTokens`) plus its theme overview;
//   - any other name is treated as a filter over the top-level DI `tokens[]`;
//   - no name returns the whole DI token list.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DocsIndex } from '../data/loader.js';
import { resolveEntry } from '../query.js';

export interface ThemeTokenView {
  name: string;
  kind: string | null;
  type: string | null;
  defaultValue: string | null;
  description: string | null;
}

export interface ThemeTokensResult {
  kind: 'theme';
  name: string;
  themeOverview: string | null;
  themeTokens: ThemeTokenView[];
}

export interface DiTokenView {
  name: string;
  file: string | null;
  description: string | null;
}

export interface DiTokensResult {
  kind: 'di';
  query: string | null;
  tokens: DiTokenView[];
}

export type TokensResult = ThemeTokensResult | DiTokensResult;

/** Pure query behind the tool. */
export function getTokens(docs: DocsIndex, name?: string): TokensResult {
  const trimmed = name?.trim() ?? '';

  if (trimmed !== '') {
    const match = resolveEntry(docs, trimmed);
    if (match) {
      return {
        kind: 'theme',
        name: match.entry.name,
        themeOverview: match.entry.themeOverview ?? null,
        themeTokens: (match.entry.themeTokens ?? []).map((token) => ({
          name: token.name,
          kind: token.kind ?? null,
          type: token.type ?? null,
          defaultValue: token.defaultValue ?? null,
          description: token.description ?? null,
        })),
      };
    }
    const needle = trimmed.toLowerCase();
    return { kind: 'di', query: trimmed, tokens: mapDiTokens(docs, (token) => token.name.toLowerCase().includes(needle)) };
  }

  return { kind: 'di', query: null, tokens: mapDiTokens(docs, () => true) };
}

function mapDiTokens(docs: DocsIndex, keep: (token: DocsIndex['tokens'][number]) => boolean): DiTokenView[] {
  return docs.tokens.filter(keep).map((token) => ({
    name: token.name,
    file: token.file ?? null,
    description: token.description ?? null,
  }));
}

export function registerGetTokens(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'get_tokens',
    {
      title: 'Get cngx theming or DI tokens',
      description:
        'With a component name or selector, return that component\'s theming tokens and theme overview. ' +
        'With any other string, filter the top-level DI token list by name. With no argument, return the ' +
        'full DI token list.',
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe('A component name/selector (theming tokens) or a DI-token name fragment. Omit for all DI tokens.'),
      },
    },
    ({ name }) => {
      const tokens = getTokens(docs, name);
      return { content: [{ type: 'text', text: JSON.stringify(tokens, null, 2) }] };
    },
  );
}
