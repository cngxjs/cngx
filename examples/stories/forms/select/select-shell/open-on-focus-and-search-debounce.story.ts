import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectShell: open on focus and search debounce',
  subtitle:
    "The left shell binds <code>[searchDebounceMs]=\"0\"</code>, so its <code>&lt;cngx-select-search&gt;</code> writes the term on every keystroke. The right shell sits under <code>provideSelectConfigAt(withOpenOn('focus'), withSearchDebounce(800))</code>: focusing the trigger opens the panel, and the term waits 800 ms after the last keystroke.",
  description:
    'Type the same word into both search inputs and watch the readout: the left shell emits <code>searchTermChange</code> once per keystroke, the right one once per pause. Enter still picks against what you typed, because it writes a pending term at once; Escape and every other close drop it. <code>withSearchDebounce</code> sets only the search wait; <code>withTypeaheadDebounce</code> stays the buffer window of the closed-trigger typeahead. A bound <code>[searchDebounceMs]</code> beats the config. A <code>viewProviders</code> entry would reach both panes, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  framework: 'template-only',
  apiComponents: ['CngxSelectShell', 'CngxSelectSearch', 'CngxSelectOption'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxSelectOption, CngxSelectSearch, CngxSelectShell, provideSelectConfigAt, withOpenOn, withSearchDebounce } from '@cngx/forms/select';",
  ],
  imports: ['NgTemplateOutlet', 'CngxSelectShell', 'CngxSelectSearch', 'CngxSelectOption'],
  setup: `private readonly injector = inject(Injector);

  protected readonly configScope = Injector.create({
    parent: this.injector,
    providers: provideSelectConfigAt(withOpenOn('focus'), withSearchDebounce(800)),
  });

  protected readonly cities = ['Amsterdam', 'Berlin', 'Bern', 'Bratislava', 'Brussels', 'Budapest', 'Lisbon', 'Madrid', 'Vienna'];
  protected readonly city = [signal<string | undefined>(undefined), signal<string | undefined>(undefined)];
  protected readonly termLog = [signal<string[]>([]), signal<string[]>([])];
  protected logTerm(side: number, term: string): void {
    this.termLog[side].update((log) => [...log, term]);
  }`,
  template: `  <ng-template #cityPickerScoped>
    <cngx-select-shell
      [label]="'City (focus, 800 ms)'"
      [value]="city[1]()"
      (valueChange)="city[1].set($event)"
      (searchTermChange)="logTerm(1, $event)"
      placeholder="Pick a city"
    >
      <cngx-select-search [placeholder]="'Filter cities'" />
      @for (name of cities; track name) {
        <cngx-option [value]="name">{{ name }}</cngx-option>
      }
    </cngx-select-shell>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Per-instance [searchDebounceMs]="0"</h3>
      <cngx-select-shell
        [label]="'City (no debounce)'"
        [searchDebounceMs]="0"
        [value]="city[0]()"
        (valueChange)="city[0].set($event)"
        (searchTermChange)="logTerm(0, $event)"
        placeholder="Pick a city"
      >
        <cngx-select-search [placeholder]="'Filter cities'" />
        @for (name of cities; track name) {
          <cngx-option [value]="name">{{ name }}</cngx-option>
        }
      </cngx-select-shell>
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">withOpenOn('focus') + withSearchDebounce(800)</h3>
      <ng-container *ngTemplateOutlet="cityPickerScoped; injector: configScope" />
    </div>
  </div>`,
  setupChrome: `protected readonly emits = [
    computed(() => this.termLog[0]().length),
    computed(() => this.termLog[1]().length),
  ];
  protected readonly lastTerm = [
    computed(() => this.termLog[0]().at(-1) ?? '-'),
    computed(() => this.termLog[1]().at(-1) ?? '-'),
  ];`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Per-instance: searchTermChange</span><span class="event-value">{{ emits[0]() }} emits, last "{{ lastTerm[0]() }}"</span></div>
    <div class="event-row"><span class="event-label">Scoped config: searchTermChange</span><span class="event-value">{{ emits[1]() }} emits, last "{{ lastTerm[1]() }}"</span></div>
  </div>`,
};
