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

/** The flags in the usage cell of the Commands-table row for `cngx <cliName>`; `null` without such a row. */
export function commandRowFlags(readme: string, cliName: string): string[] | null {
  const row = readme.split('\n').find((line) => line.startsWith(`|\`cngx ${cliName}\``) || line.startsWith(`|\`cngx ${cliName} `));
  if (row === undefined) {
    return null;
  }
  const usage = row.split('|')[1];
  return documentedFlags(usage);
}

/** The commands the Flags-table row of `flag` lists as a parenthesised backtick list, e.g. (`find`, `api`). */
export function flagRowCommands(readme: string, flag: string): string[] {
  const row = readme.split('\n').find((line) => line.startsWith(`|\`${flag}`));
  const list = row?.match(/\(((?:`[a-z][\w-]*`(?:,\s*)?)+)\)/);
  if (!list) {
    return [];
  }
  return unique([...list[1].matchAll(/`([a-z][\w-]*)`/g)].map((match) => match[1]));
}

/** The codes of the table rows under `## Exit codes`, in README order. */
export function documentedExitCodes(readme: string): number[] {
  const start = readme.indexOf('## Exit codes');
  if (start === -1) {
    return [];
  }
  const next = readme.indexOf('\n## ', start + 1);
  const section = readme.slice(start, next === -1 ? undefined : next);
  return [...section.matchAll(/^\|`(\d+)`\|/gm)].map((match) => Number(match[1]));
}

const unique = (words: readonly string[]): string[] => words.filter((word, i, all) => all.indexOf(word) === i);
