// The ordered command registry. Every adapter loops `COMMANDS`; a command not
// listed here exists for no front end. The order is the MCP tool-list order.

import type { CngxCommand } from './command.js';
import { findComponentCommand } from './commands/find-component.js';
import { listComponentsCommand } from './commands/list-components.js';
import { getApiCommand } from './commands/get-api.js';
import { getSlotsCommand } from './commands/get-slots.js';
import { getThemeTokensCommand } from './commands/get-theme-tokens.js';
import { getDiTokensCommand } from './commands/get-di-tokens.js';
import { getConfigCommand } from './commands/get-config.js';
import { getStoryExampleCommand } from './commands/get-story-example.js';
import { migrateUsageCommand } from './commands/migrate-usage.js';

export type { CngxCommand, CommandContext, CommandInput, CommandShape } from './command.js';

export const COMMANDS: readonly CngxCommand[] = [
  findComponentCommand,
  listComponentsCommand,
  getApiCommand,
  getSlotsCommand,
  getThemeTokensCommand,
  getDiTokensCommand,
  getConfigCommand,
  getStoryExampleCommand,
  migrateUsageCommand,
];
