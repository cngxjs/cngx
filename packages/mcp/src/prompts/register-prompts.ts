// MCP prompts - the pre-built HOW-starters a client exposes as slash-commands.
// Each is a single user-role message that frames one task and names the exact
// tools/resources to ground against; the argument interpolates into the text.
// Prompts carry no data: they point at the query surface, they do not read it.
// One framing message per prompt, never an embedded multi-step workflow - the
// consumer skills own the HOW; a prompt only kicks it off.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

function userMessage(text: string): GetPromptResult {
  return { messages: [{ role: 'user', content: { type: 'text', text } }] };
}

/** `wire_component` - frame wiring one component; ground via get_api / get_slots / get_config. */
export function wireComponentPrompt(component: string): GetPromptResult {
  return userMessage(
    `Wire the cngx component \`${component}\` into this app. Ground every symbol before writing code:\n` +
      `- Call \`get_api\` for \`${component}\` to get its inputs, outputs, and signal model.\n` +
      `- Call \`get_slots\` for \`${component}\` to see which template slots it projects.\n` +
      `- Call \`get_config\` for the app-wide config token and its provide*/with* functions.\n` +
      `Prefer Signal Forms (\`[field]\`) over ControlValueAccessor and two-way \`model()\` bindings over ` +
      `input+output. Do not invent inputs the API does not list.`,
  );
}

/** `theme_component` - frame theming one component; ground via get_theme_tokens / get_config. */
export function themeComponentPrompt(component: string): GetPromptResult {
  return userMessage(
    `Theme the cngx component \`${component}\`. Ground the token surface first:\n` +
      `- Call \`get_theme_tokens\` for \`${component}\` to list the CSS custom properties it exposes ` +
      `and its theme overview.\n` +
      `- Call \`get_config\` for \`${component}\` to find any provide*/with* theming hooks.\n` +
      `Set every value through the exposed \`--cngx-*\` custom properties with literal fallbacks; ` +
      `never hardcode a color. Delegate to \`--mat-sys-*\` only in the Material bridge, not in component CSS.`,
  );
}

/** `migrate_cngx` - frame a cross-version migration; ground via migrate_usage then per-symbol get_api. */
export function migrateCngxPrompt(from: string, to?: string): GetPromptResult {
  const target = to ? `\`${to}\`` : 'the bundled snapshot version';
  const migrateArgs = to ? `{ from: "${from}", to: "${to}" }` : `{ from: "${from}" }`;
  return userMessage(
    `Migrate this app's cngx usage from \`${from}\` to ${target}. Ground the delta first:\n` +
      `- Call \`migrate_usage ${migrateArgs}\` to get the structured API delta - removed / renamed / ` +
      `signature-changed components, inputs, outputs, slots, and DI tokens.\n` +
      `- For each changed symbol, call \`get_api\` (or \`get_slots\` / \`get_di_tokens\`) to confirm the ` +
      `new shape before editing.\n` +
      `Apply the delta mechanically; do not refactor beyond what the delta requires.`,
  );
}

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'wire_component',
    {
      title: 'Wire a cngx component',
      description: 'Frame wiring one cngx component and name the tools to ground against.',
      argsSchema: { component: z.string().describe('The component class name, e.g. "CngxSelect".') },
    },
    ({ component }) => wireComponentPrompt(component),
  );

  server.registerPrompt(
    'theme_component',
    {
      title: 'Theme a cngx component',
      description: 'Frame theming one cngx component through its exposed custom properties.',
      argsSchema: { component: z.string().describe('The component class name, e.g. "CngxSelect".') },
    },
    ({ component }) => themeComponentPrompt(component),
  );

  server.registerPrompt(
    'migrate_cngx',
    {
      title: 'Migrate cngx usage across versions',
      description: 'Frame a cross-version cngx migration grounded in migrate_usage.',
      argsSchema: {
        from: z.string().describe('The current cngx version, e.g. "0.1.0-rc.5".'),
        to: z.string().optional().describe('The target version. Omit to migrate to the bundled snapshot.'),
      },
    },
    ({ from, to }) => migrateCngxPrompt(from, to),
  );
}
