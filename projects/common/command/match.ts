import type { CngxCommand } from './command';

/**
 * A command paired with its match score for a given query. Higher scores rank
 * first. The palette renders these in order; the row slot reads `command` and
 * the term to highlight.
 *
 * @category common/command
 * @since 0.1.0
 */
export interface CngxRankedCommand {
  /** The matched command. */
  readonly command: CngxCommand;
  /** Relevance score for the query; higher ranks first. `0` for an empty query. */
  readonly score: number;
}

/**
 * @deprecated Use {@link CngxRankedCommand}. Published under the unprefixed
 * name by mistake; the alias remains for compatibility and will be removed in
 * a future major.
 * @category common/command
 * @since 0.1.0
 */
export type RankedCommand = CngxRankedCommand;

/**
 * Ranks and filters a command set against a query and optional scope. Swappable
 * via {@link CNGX_COMMAND_MATCH_FACTORY} - a consumer drops in Levenshtein or a
 * fuzzy engine without touching the panel.
 *
 * @category common/command
 * @since 0.1.0
 */
export type CngxCommandMatcher = (
  commands: readonly CngxCommand[],
  term: string,
  scope?: string,
) => readonly CngxRankedCommand[];

/**
 * Builds the default matcher: a pure label/keyword ranker. An empty query
 * returns every (scoped) command at score `0` in registration order; a
 * non-empty query keeps only commands that match label or keyword, ranked
 * label-exact > label-prefix > label-substring > keyword. The optional scope
 * filters to commands whose `group` equals it.
 *
 * @category common/command
 * @since 0.1.0
 */
export function createDefaultCommandMatcher(): CngxCommandMatcher {
  return (commands, term, scope) => {
    const scoped = scope ? commands.filter((command) => command.group === scope) : commands;
    const query = term.trim().toLowerCase();
    if (query.length === 0) {
      return scoped.map((command) => ({ command, score: 0 }));
    }

    const ranked: CngxRankedCommand[] = [];
    for (const command of scoped) {
      const score = scoreCommand(command, query);
      if (score > 0) {
        ranked.push({ command, score });
      }
    }
    // Stable within equal scores: the sort is stable in V8, so registration
    // order breaks ties.
    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  };
}

/** @internal Scores one command against a lower-cased query; `0` means no match. */
function scoreCommand(command: CngxCommand, query: string): number {
  const label = command.label.toLowerCase();
  if (label === query) {
    return 100;
  }
  if (label.startsWith(query)) {
    return 80;
  }
  if (label.includes(query)) {
    return 60;
  }
  for (const keyword of command.keywords ?? []) {
    const value = keyword.toLowerCase();
    if (value === query) {
      return 50;
    }
    if (value.startsWith(query)) {
      return 40;
    }
    if (value.includes(query)) {
      return 20;
    }
  }
  return 0;
}
