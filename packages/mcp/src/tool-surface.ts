// The MCP tool surface an agent sees: the server instructions plus, per tool,
// name, title, description and input schema. `diffSurface` compares a live
// surface with the pinned fixture and names every difference, so a refactor
// that claims to keep the surface cannot change it silently.

export interface ToolSurfaceEntry {
  name: string;
  title?: string;
  description?: string;
  inputSchema: unknown;
}

export interface ToolSurface {
  instructions: string | undefined;
  tools: ToolSurfaceEntry[];
}

const TOOL_FIELDS = ['title', 'description', 'inputSchema'] as const;

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Every difference between `actual` and `pinned`, one line each; empty when identical. */
export function diffSurface(actual: ToolSurface, pinned: ToolSurface): string[] {
  const diffs: string[] = [];
  if (actual.instructions !== pinned.instructions) {
    diffs.push('instructions changed');
  }

  const actualByName = new Map(actual.tools.map((tool) => [tool.name, tool]));
  const pinnedByName = new Map(pinned.tools.map((tool) => [tool.name, tool]));

  for (const name of pinnedByName.keys()) {
    if (!actualByName.has(name)) {
      diffs.push(`tool ${name} missing`);
    }
  }
  for (const [name, tool] of actualByName) {
    const pinnedTool = pinnedByName.get(name);
    if (!pinnedTool) {
      diffs.push(`tool ${name} not pinned`);
      continue;
    }
    for (const field of TOOL_FIELDS) {
      if (!sameJson(tool[field], pinnedTool[field])) {
        diffs.push(`tool ${name}: ${field} changed`);
      }
    }
  }

  const actualOrder = actual.tools.map((tool) => tool.name).join(',');
  const pinnedOrder = pinned.tools.map((tool) => tool.name).join(',');
  if (diffs.length === 0 && actualOrder !== pinnedOrder) {
    diffs.push('tool order changed');
  }
  return diffs;
}
