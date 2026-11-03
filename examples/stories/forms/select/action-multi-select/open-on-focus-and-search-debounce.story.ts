import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionMultiSelect: open on focus and search debounce',
  subtitle:
    "The left select binds <code>[searchDebounceMs]=\"0\"</code>, so the filter and <code>searchTermChange</code> follow every keystroke. The right one sits under <code>provideSelectConfigAt(withOpenOn('focus'), withSearchDebounce(800))</code>: focusing the input opens the panel, and the term waits 800 ms after the last keystroke.",
  description:
    'Type the same word into both inputs and compare the readout: one emit per keystroke on the left, one per pause on the right. The create button reads the live input text, so a fast click inside the debounce window still creates what you typed. <code>withSearchDebounce</code> sets only the search wait of the input variants and the shell search; a bound <code>[searchDebounceMs]</code> beats it. A <code>viewProviders</code> entry would reach both panes, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  framework: 'template-only',
  apiComponents: ['CngxActionMultiSelect', 'CngxSelectAction'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxActionMultiSelect, CngxSelectAction, provideSelectConfigAt, withOpenOn, withSearchDebounce, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['NgTemplateOutlet', 'CngxActionMultiSelect', 'CngxSelectAction'],
  setup: `private readonly injector = inject(Injector);

  protected readonly configScope = Injector.create({
    parent: this.injector,
    providers: provideSelectConfigAt(withOpenOn('focus'), withSearchDebounce(800)),
  });

  protected readonly options: CngxSelectOptionDef<string>[] = [
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'devops', label: 'DevOps' },
    { value: 'docs', label: 'Docs' },
    { value: 'qa', label: 'QA' },
  ];
  protected readonly tags = [signal<string[]>([]), signal<string[]>([])];
  protected readonly create: CngxSelectCreateAction<string> = (_term, draft) => draft.label.trim();
  protected readonly termLog = [signal<string[]>([]), signal<string[]>([])];
  protected logTerm(side: number, term: string): void {
    this.termLog[side].update((log) => [...log, term]);
  }`,
  template: `  <ng-template #tagPickerScoped>
    <cngx-action-multi-select
      [label]="'Tags'"
      [options]="options"
      [quickCreateAction]="create"
      [values]="tags[1]()"
      (valuesChange)="tags[1].set($event)"
      (searchTermChange)="logTerm(1, $event)"
      placeholder="Choose or type a tag"
    >
      <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
        <button type="button" class="demo-action-slot-button" [disabled]="!term || pending" (click)="commit()">
          @if (term) {
            Create tag "{{ term }}"
          } @else {
            Type to create a tag
          }
        </button>
      </ng-template>
    </cngx-action-multi-select>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Per-instance [searchDebounceMs]="0"</h3>
      <cngx-action-multi-select
        [label]="'Tags'"
        [options]="options"
        [quickCreateAction]="create"
        [searchDebounceMs]="0"
        [values]="tags[0]()"
        (valuesChange)="tags[0].set($event)"
        (searchTermChange)="logTerm(0, $event)"
        placeholder="Choose or type a tag"
      >
        <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
          <button type="button" class="demo-action-slot-button" [disabled]="!term || pending" (click)="commit()">
            @if (term) {
              Create tag "{{ term }}"
            } @else {
              Type to create a tag
            }
          </button>
        </ng-template>
      </cngx-action-multi-select>
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">withOpenOn('focus') + withSearchDebounce(800)</h3>
      <ng-container *ngTemplateOutlet="tagPickerScoped; injector: configScope" />
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
