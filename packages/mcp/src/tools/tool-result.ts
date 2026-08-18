// Every tool answers with one JSON-encoded text block. This wraps a query result
// in the MCP CallToolResult shape so the tool files carry query logic, not
// response plumbing.

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function jsonResult(value: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
