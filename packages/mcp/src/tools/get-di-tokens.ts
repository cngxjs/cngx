// get_di_tokens - one job: the top-level DI `tokens[]`, optionally filtered by a
// name fragment. Split out from the old dual-mode get_tokens so the return shape
// is predictable - always a token list, never a component's theming block.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import type { DocsIndex } from '../data/loader.js';

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

export function registerGetDiTokens(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'get_di_tokens',
    {
      title: 'Get cngx DI tokens',
      description:
        'Return the top-level DI injection tokens, optionally filtered by a name fragment. Omit the ' +
        "argument for the full list. For a component's theming tokens, use get_theme_tokens.",
      inputSchema: {
        query: z.string().optional().describe('A DI-token name fragment, e.g. "SELECT". Omit for all DI tokens.'),
      },
    },
    ({ query }) => jsonResult(getDiTokens(docs, query)),
  );
}
