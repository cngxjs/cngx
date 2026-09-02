/**
 * @module @cngx/common/command
 */
export { type CngxCommand, type CngxCommandGroup, type CommandGroup } from './command';
export {
  CNGX_COMMAND_SOURCE,
  provideCommands,
  injectCommands,
  type CngxCommandSource,
} from './provide-commands';
export {
  createDefaultCommandMatcher,
  type CngxCommandMatcher,
  type CngxRankedCommand,
  type RankedCommand,
} from './match';
export {
  CNGX_COMMAND_MATCH_FACTORY,
  type CngxCommandMatchFactory,
} from './match-strategy.token';
