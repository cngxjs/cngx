import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'provideCommands: scoped sources inject commands',
  subtitle:
    "Two <code>provideCommands(...)</code> calls in one component's <code>viewProviders</code> contribute to the same <code>CNGX_COMMAND_SOURCE</code> multi-token: a static file list and a plugin's <code>Signal</code> source. <code>injectCommands()</code> merges both into one reactive <code>Signal</code>, and a <code>CNGX_COMMAND_MATCH_FACTORY</code> matcher ranks it for a hand-built list. No palette, no dialog: the registry draws nothing.",
  description:
    'Toggle the plugin to write to its signal source; the merged list and the result count follow without any re-registration. Type to filter (label and keyword ranking) or pick a scope, which the default matcher compares against <code>command.group</code>. Running a command calls its <code>run()</code>; this surface owns that call, so it records the last run below.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  moduleImports: [
    "import { CNGX_COMMAND_MATCH_FACTORY, injectCommands, provideCommands, type CngxCommand } from '@cngx/common/command';",
    "import { PUBLISH_COMMAND, pluginCommands } from './_plugin-commands';",
  ],
  viewProviders: [
    `provideCommands([
      { id: 'new-file', label: 'New file', keywords: ['create'], group: 'File', run: () => {} },
      { id: 'open-file', label: 'Open file', keywords: ['browse'], group: 'File', run: () => {} },
      { id: 'close-tab', label: 'Close tab', keywords: ['dismiss'], group: 'View', run: () => {} },
    ])`,
    'provideCommands(pluginCommands)',
  ],
  setup: `protected readonly commands = injectCommands();
  private readonly match = inject(CNGX_COMMAND_MATCH_FACTORY)();

  protected readonly term = signal('');
  protected readonly scope = signal<string | undefined>(undefined);
  protected readonly scopes = computed(() => [
    ...new Set(this.commands().flatMap((command) => (command.group ? [command.group] : []))),
  ]);
  protected readonly results = computed(() => this.match(this.commands(), this.term(), this.scope()));
  protected readonly pluginActive = computed(() => pluginCommands().includes(PUBLISH_COMMAND));
  protected readonly lastRun = signal<string | null>(null);

  protected handleTogglePlugin(): void {
    pluginCommands.update((list) =>
      list.includes(PUBLISH_COMMAND)
        ? list.filter((command) => command !== PUBLISH_COMMAND)
        : [...list, PUBLISH_COMMAND],
    );
  }

  protected handleRun(command: CngxCommand): void {
    void command.run();
    this.lastRun.set(command.label);
  }`,
  template: `  <div class="demo-command-registry">
    <div class="demo-inline-actions">
      <button
        type="button"
        class="chip"
        [class.chip--active]="pluginActive()"
        [attr.aria-pressed]="pluginActive()"
        (click)="handleTogglePlugin()"
      >
        Plugin command
      </button>
      <label>
        Filter
        <input type="search" [value]="term()" (input)="term.set($any($event.target).value)" />
      </label>
      <label>
        Scope
        <select (change)="scope.set($any($event.target).value || undefined)">
          <option value="">All groups</option>
          @for (group of scopes(); track group) {
            <option [value]="group" [selected]="scope() === group">{{ group }}</option>
          }
        </select>
      </label>
    </div>
    <p role="status" class="demo-hint">{{ results().length }} of {{ commands().length }} commands</p>
    <ul class="demo-command-registry__list" aria-label="Commands">
      @for (entry of results(); track entry.command.id) {
        <li>
          <button type="button" class="chip" (click)="handleRun(entry.command)">{{ entry.command.label }}</button>
          <span class="demo-hint demo-hint--small">{{ entry.command.group }}, score {{ entry.score }}</span>
        </li>
      } @empty {
        <li class="demo-hint">No command matches.</li>
      }
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Merged sources</span>
      <span class="event-value">static list + plugin signal ({{ pluginActive() ? 'publish on' : 'empty' }})</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last run</span>
      <span class="event-value">{{ lastRun() ?? '-' }}</span>
    </div>
  </div>`,
};
