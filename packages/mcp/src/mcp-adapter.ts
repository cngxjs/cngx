// Turns the command registry into MCP tools: one `registerTool` per definition,
// with the definition's title, description and zod shape as the input schema.
// The only MCP-specific step is wrapping the answer in a CallToolResult.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CngxCommand, CommandContext } from './core/registry.js';
import { jsonResult } from './tools/tool-result.js';

export function registerCommands(
  server: McpServer,
  commands: readonly CngxCommand[],
  ctx: CommandContext,
): void {
  for (const def of commands) {
    server.registerTool(
      def.name,
      { title: def.title, description: def.description, inputSchema: def.input },
      async (args) => jsonResult(await def.run(ctx, args)),
    );
  }
}
