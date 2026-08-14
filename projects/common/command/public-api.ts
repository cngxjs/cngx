/**
 * @module @cngx/common/command
 */
export { type CngxCommand, type CommandGroup } from './command';
export {
  CNGX_COMMAND_SOURCE,
  provideCommands,
  injectCommands,
  type CngxCommandSource,
} from './provide-commands';
