// Two invariants of the CLI surface, as pure checks the specs run: output is
// never ANSI-coloured (agents and CI read it; cli-accepted-debt §3 keeps colour
// out), and no CLI source imports the MCP SDK (the CLI ships without it).

const ANSI = /\u001b\[[0-9;?]*[A-Za-z]|\u001b\][^\u0007]*\u0007/;

/** Throws when `text` contains an ANSI escape sequence. */
export function assertNoAnsi(text: string): void {
  const match = ANSI.exec(text);
  if (match) {
    throw new Error(`ANSI escape sequence at offset ${match.index}: ${JSON.stringify(match[0])}`);
  }
}

/** A source file to scan. */
export interface SourceFile {
  readonly path: string;
  readonly source: string;
}

const SDK_IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)['"]@modelcontextprotocol\/sdk(?:\/[^'"]*)?['"]/;

/** The paths of `files` that import, re-export or require the MCP SDK. */
export function findSdkImports(files: readonly SourceFile[]): string[] {
  return files.filter((file) => SDK_IMPORT.test(file.source)).map((file) => file.path);
}
