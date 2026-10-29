// The README check as pure functions over the README text, so readme.spec.ts can
// run each direction against the real file and against a planted defect. The
// README must document every command and flag, and nothing the CLI lacks.

/** Every `cngx <word>` the README names as a command (backticked usages and code blocks). */
export function documentedCommands(readme: string): string[] {
  return unique([
    ...[...readme.matchAll(/`cngx ([a-z][\w-]*)/g)].map((match) => match[1]),
    ...[...readme.matchAll(/^npx (?:cngx|@cngx\/cli) ([a-z][\w-]*)/gm)].map((match) => match[1]),
  ]);
}

/**
 * Every flag the README shows inside inline code or a code block: a `-x` or
 * `--name` token not glued to a word, so `0.2.0-rc.1` and `cngx-version` alone
 * never count.
 */
export function documentedFlags(readme: string): string[] {
  const code = [...readme.matchAll(/```[\s\S]*?```|`[^`\n]+`/g)].map((match) => match[0]);
  return unique(code.flatMap((span) => [...span.matchAll(/(?<![\w-])(--?[a-z][\w-]*)/g)].map((match) => match[1])));
}

/** The flags the README documents that are not in `known`. */
export function unknownFlags(readme: string, known: ReadonlySet<string>): string[] {
  return documentedFlags(readme).filter((flag) => !known.has(flag));
}

const unique = (words: readonly string[]): string[] => words.filter((word, i, all) => all.indexOf(word) === i);
