// get_theme_tokens - one job: a resolved component/directive's theming tokens
// (per-component `themeTokens`) plus its theme overview. Split out from the old
// dual-mode get_tokens so the return shape is predictable - an agent always gets
// theme tokens here, never a DI-token list.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { AmbiguousMatch, EntryKind } from '../query.js';
import { foundUnlessAmbiguous, isAmbiguous, resolveEntry } from '../query.js';
import { ambiguousMarkdown, blocks, cell, code, docText, table, textCell } from './markdown.js';

export interface ThemeTokenView {
  name: string;
  kind: string | null;
  type: string | null;
  defaultValue: string | null;
  description: string | null;
}

export interface ThemeTokensResult {
  name: string;
  kind: EntryKind;
  selector: string | null;
  themeOverview: string | null;
  themeTokens: ThemeTokenView[];
}

/** Pure query behind the tool - `null` when the name resolves to nothing, the ambiguity when a selector matches several entries. */
export function getThemeTokens(docs: DocsIndex, name: string): ThemeTokensResult | AmbiguousMatch | null {
  const match = resolveEntry(docs, name);
  if (!match || isAmbiguous(match)) {
    return match ?? null;
  }
  return {
    name: match.entry.name,
    kind: match.kind,
    selector: match.entry.selector ?? null,
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

/** The theme overview and the tokens as one table under the component name. */
export function themeTokensMarkdown(theme: ThemeTokensResult | AmbiguousMatch | null): string {
  if (!theme) {
    return 'No component or directive by that name.\n';
  }
  if (isAmbiguous(theme)) {
    return ambiguousMarkdown(theme);
  }
  const rows = theme.themeTokens.map((t) => [code(t.name), cell(t.kind), code(t.type), code(t.defaultValue), textCell(t.description)]);
  return blocks(
    `# ${theme.name} theme tokens`,
    docText(theme.themeOverview),
    rows.length ? table(['Token', 'Kind', 'Type', 'Default', 'Description'], rows) : 'No theming tokens.',
  );
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'Which custom properties theme CngxChip?';

export const getThemeTokensCommand = defineCommand({
  name: 'get_theme_tokens',
  title: 'Get cngx component theming tokens',
  description:
    "Return a component's theming tokens (the CSS custom properties it exposes) and its theme " +
    'overview, by class name or selector. An empty themeTokens array means the component exposes ' +
    'none. `result` is null when the name matches nothing, and `{ ambiguous: true, candidates }` when a selector matches several entries. For DI tokens, use get_di_tokens.',
  cliSummary:
    'Print the CSS custom properties a component exposes, with its theme overview. Exits 1 when the name matches nothing or a selector matches several entries. For DI tokens use `cngx di`.',
  cliName: 'theme',
  input: {
    name: z.string().trim().min(1).describe('A component/directive class name or selector, e.g. "CngxSelect".'),
    version: versionInput,
  },
  positional: 'name',
  cliFlags: { version: 'cngx-version' },
  run: (ctx, { name, version }) => answerVersioned(ctx.resolve, version, (resolved) => getThemeTokens(resolved, name)),
  found: foundUnlessAmbiguous,
  toMarkdown: (theme: ThemeTokensResult | AmbiguousMatch | null) => themeTokensMarkdown(theme),
});
