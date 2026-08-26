// get_theme_tokens - one job: a resolved component/directive's theming tokens
// (per-component `themeTokens`) plus its theme overview. Split out from the old
// dual-mode get_tokens so the return shape is predictable - an agent always gets
// theme tokens here, never a DI-token list.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import { answerVersioned } from '../data/docs-resolver.js';
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
  name: string;
  themeOverview: string | null;
  themeTokens: ThemeTokenView[];
}

/** Pure query behind the tool - returns `null` when the name resolves to nothing. */
export function getThemeTokens(docs: DocsIndex, name: string): ThemeTokensResult | null {
  const match = resolveEntry(docs, name);
  if (!match) {
    return null;
  }
  return {
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

export function registerGetThemeTokens(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'get_theme_tokens',
    {
      title: 'Get cngx component theming tokens',
      description:
        "Return a component's theming tokens (the CSS custom properties it exposes) and its theme " +
        'overview, by class name or selector. An empty themeTokens array means the component exposes ' +
        'none. Returns null when the name resolves to nothing. For DI tokens, use get_di_tokens.',
      inputSchema: {
        name: z.string().describe('A component/directive class name or selector, e.g. "CngxSelect".'),
        version: z
          .string()
          .optional()
          .describe(
            'Optional cngx version to ground the answer against, e.g. "0.2.0". Omit to answer from the ' +
              'bundled snapshot offline; a non-bundled version fetches that release snapshot via gh (fail-safe).',
          ),
      },
    },
    ({ name, version }) => jsonResult(answerVersioned(docs, version, (resolved) => getThemeTokens(resolved, name))),
  );
}
