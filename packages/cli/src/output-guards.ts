// Two invariants of the CLI surface, as pure checks the specs run: output is
// never ANSI-coloured (agents and CI read it; cli-accepted-debt §3 keeps colour
// out), and no CLI source imports the MCP SDK (the CLI ships without it).

// Every ECMA-48 sequence starts with ESC (7-bit: CSI `ESC [`, OSC `ESC ]`, DCS
// `ESC P`, two-byte `ESC <char>`) or with a C1 control (8-bit: CSI U+009B, OSC
// U+009D, DCS U+0090, ST U+009C). Neither ever belongs in plain output, so the
// introducer alone is the defect; matching whole sequences would miss whatever
// parameter or terminator shape the list forgot.
const ANSI = /[\u001b\u0080-\u009f]/;

/** Throws when `text` contains an ANSI escape sequence. */
export function assertNoAnsi(text: string): void {
  const match = ANSI.exec(text);
  if (match) {
    const sequence = text.slice(match.index, match.index + 12);
    throw new Error(`ANSI escape sequence at offset ${match.index}: ${JSON.stringify(sequence)}`);
  }
}

/** A source file to scan. */
export interface SourceFile {
  readonly path: string;
  readonly source: string;
}

// Module-loading forms: `from`, `import x`, `import()` (any quote, backticks
// included), `require()`, `require.resolve()` and `createRequire(url)(...)`.
const SDK_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire(?:\.resolve)?\s*\(\s*|\bcreateRequire\s*\([^)]*\)\s*\(\s*|\bimport\s+)['"`]@modelcontextprotocol\/sdk(?:\/[^'"`]*)?['"`]/;

/** The paths of `files` that import, re-export or require the MCP SDK. */
export function findSdkImports(files: readonly SourceFile[]): string[] {
  return files.filter((file) => SDK_IMPORT.test(file.source)).map((file) => file.path);
}
