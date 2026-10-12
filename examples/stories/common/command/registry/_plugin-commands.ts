import { signal } from '@angular/core';
import type { CngxCommand } from '@cngx/common/command';

/**
 * A live command source for the `@cngx/common/command` registry story. A
 * plugin module owns this signal and registers it through
 * `provideCommands(pluginCommands)`; writing to it later adds or removes
 * commands in every `injectCommands()` reader under that provider.
 *
 * Internal demo fixture only - not part of any published bundle.
 */
export const pluginCommands = signal<readonly CngxCommand[]>([]);

/** The command the story's plugin toggle adds to and removes from `pluginCommands`. */
export const PUBLISH_COMMAND: CngxCommand = {
  id: 'publish',
  label: 'Publish to the web',
  keywords: ['release', 'deploy'],
  group: 'Plugin',
  run: () => {},
};
