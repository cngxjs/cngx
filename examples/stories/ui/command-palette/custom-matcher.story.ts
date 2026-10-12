import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CNGX_COMMAND_MATCH_FACTORY: custom matcher',
  subtitle:
    'Overriding <code>CNGX_COMMAND_MATCH_FACTORY</code> in <code>viewProviders</code> swaps the ranking of every palette below it. The matcher here puts acronym hits first (<kbd>gts</kbd> finds "Go to settings") and keeps the default label and keyword ranking for everything else, by wrapping <code>createDefaultCommandMatcher()</code>.',
  description:
    'The panel calls the factory once, in an injection context, and runs the returned <code>(commands, term, scope) =&gt; CngxRankedCommand[]</code> inside its result <code>computed()</code>; the palette markup does not change. The default matcher only knows label and keyword substrings, so an acronym query returns nothing there. Type a query in the comparison field below, or open the palette and type <kbd>gts</kbd>, <kbd>np</kbd> or <kbd>orf</kbd>.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxCommandPalette'],
  moduleImports: [
    "import { forwardRef } from '@angular/core';",
    "import { CNGX_COMMAND_MATCH_FACTORY, createDefaultCommandMatcher, injectCommands, provideCommands, type CngxCommandMatcher } from '@cngx/common/command';",
    "import { CngxCommandPalette, CngxCommandPaletteTrigger } from '@cngx/ui/command-palette';",
  ],
  imports: ['CngxCommandPalette', 'CngxCommandPaletteTrigger'],
  viewProviders: [
    `provideCommands([
      { id: 'settings', label: 'Go to settings', keywords: ['preferences'], group: 'Navigation', run: () => {} },
      { id: 'recent', label: 'Open recent file', keywords: ['history'], group: 'Navigation', run: () => {} },
      { id: 'project', label: 'New project', keywords: ['create'], group: 'Workspace', run: () => {} },
      { id: 'sidebar', label: 'Toggle sidebar', keywords: ['panel'], group: 'Workspace', run: () => {} },
    ])`,
    `{
      provide: CNGX_COMMAND_MATCH_FACTORY,
      useFactory: (host: CommandPaletteCustomMatcher) => () => host.matchAcronymFirst,
      deps: [forwardRef(() => CommandPaletteCustomMatcher)],
    }`,
  ],
  setup: `private readonly defaultMatch = createDefaultCommandMatcher();

  readonly matchAcronymFirst: CngxCommandMatcher = (commands, term, scope) => {
    const ranked = this.defaultMatch(commands, term, scope);
    const query = term.trim().toLowerCase();
    if (query.length < 2) {
      return ranked;
    }
    const acronym = (label: string) =>
      label.split(/\\s+/).map((word) => word.charAt(0)).join('').toLowerCase();
    const hits = commands
      .filter((command) => (!scope || command.group === scope) && acronym(command.label).startsWith(query))
      .map((command) => ({ command, score: 90 }));
    const rest = ranked.filter((entry) => !hits.some((hit) => hit.command === entry.command));
    return [...hits, ...rest];
  };`,
  templateChromeBefore: `<p class="demo-hint">
    Open with <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> or the button, then type an acronym such as <kbd>gts</kbd>.
  </p>`,
  template: `  <button type="button" class="demo-cmdk-trigger" [cngxCommandPaletteTrigger]="palette">
    Search commands <kbd>Cmd K</kbd>
  </button>
  <cngx-command-palette #palette ariaLabel="Acronym-aware command palette" />`,
  setupChrome: `private readonly registry = injectCommands();
  protected readonly probe = signal('gts');
  protected readonly defaultResult = computed(() => this.labelsOf(this.defaultMatch(this.registry(), this.probe())));
  protected readonly customResult = computed(() => this.labelsOf(this.matchAcronymFirst(this.registry(), this.probe())));
  private labelsOf(ranked: readonly { command: { label: string } }[]): string {
    return ranked.map((entry) => entry.command.label).join(', ') || 'no match';
  }`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <label class="event-label" for="matcher-probe">Compare query</label>
      <input id="matcher-probe" type="text" class="event-value" [value]="probe()" (input)="probe.set($any($event.target).value)" />
    </div>
    <div class="event-row">
      <span class="event-label">Default matcher</span>
      <span class="event-value">{{ defaultResult() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Custom matcher</span>
      <span class="event-value">{{ customResult() }}</span>
    </div>
  </div>`,
};
