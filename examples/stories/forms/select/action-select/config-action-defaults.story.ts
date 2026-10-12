import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionSelect: config action defaults',
  subtitle:
    "One <code>provideActionSelectConfigAt(...)</code> moves the action-slot defaults for every action select below it: <code>withActionPosition('top')</code> renders the <code>*cngxSelectAction</code> slot above the options, <code>withCloseOnCreate(false)</code> keeps the panel open after a quick create, and <code>withActionAriaLabel('Create a tag')</code> renames the slot's <code>role=\"group\"</code>.",
  description:
    'Both panes render the same action select; only the right pane sits under the scoped config. Open each panel, type a tag that is not in the list (for example "Security") and press the create button. The left panel closes, the single-select baseline. The right panel stays open with the new tag selected, so you can keep typing. A per-instance <code>[actionPosition]</code> or <code>[closeOnCreate]</code> still beats the config. The group name is not visible, so the readout mirrors each slot\'s <code>aria-label</code> from the DOM. A <code>viewProviders</code> entry would reach both panes, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxActionSelect', 'CngxSelectAction'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxActionSelect, CngxSelectAction, provideActionSelectConfigAt, withActionAriaLabel, withActionPosition, withCloseOnCreate, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['NgTemplateOutlet', 'CngxActionSelect', 'CngxSelectAction'],
  setup: `private readonly injector = inject(Injector);

  protected readonly actionScope = Injector.create({
    parent: this.injector,
    providers: provideActionSelectConfigAt(
      withActionPosition('top'),
      withCloseOnCreate(false),
      withActionAriaLabel('Create a tag'),
    ),
  });

  protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'qa', label: 'QA' },
    { value: 'docs', label: 'Docs' },
  ];
  protected readonly tag = [signal<string | undefined>(undefined), signal<string | undefined>(undefined)];
  protected readonly createTag: CngxSelectCreateAction<string> = (_term, draft) =>
    draft.label.trim();
  protected readonly panelOpen = [signal(false), signal(false)];`,
  template: `  <ng-template #tagPicker let-side>
    <cngx-action-select
      [label]="'Tag'"
      [options]="tags"
      [quickCreateAction]="createTag"
      [value]="tag[side]()"
      (valueChange)="tag[side].set($event)"
      (openedChange)="panelOpen[side].set($event)"
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
    </cngx-action-select>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Library defaults</h3>
      <ng-container *ngTemplateOutlet="tagPicker; context: { $implicit: 0 }" />
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="tagPicker; context: { $implicit: 1 }; injector: actionScope" />
    </div>
  </div>`,
  setupChrome: `private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly groupNames = signal('- | -');

  private readonly observer = new MutationObserver(() => this.readGroupNames());
  private readonly startObserving = afterNextRender(() => {
    this.readGroupNames();
    this.observer.observe(this.hostEl.nativeElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label'] });
  });
  private readonly stopObserving = inject(DestroyRef).onDestroy(() => this.observer.disconnect());

  private readGroupNames(): void {
    const panes = Array.from(this.hostEl.nativeElement.querySelectorAll('.demo-config-compare-pane'));
    const names = panes.map(
      (pane) => pane.querySelector('.cngx-select__action[role="group"]')?.getAttribute('aria-label') ?? '-',
    );
    this.groupNames.set(names.join(' | '));
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Defaults: panel</span><span class="event-value">{{ panelOpen[0]() ? 'open' : 'closed' }}, value {{ tag[0]() ?? '-' }}</span></div>
    <div class="event-row"><span class="event-label">Scoped: panel</span><span class="event-value">{{ panelOpen[1]() ? 'open' : 'closed' }}, value {{ tag[1]() ?? '-' }}</span></div>
    <div class="event-row"><span class="event-label">Slot group name (defaults | scoped)</span><span class="event-value">{{ groupNames() }}</span></div>
  </div>`,
};
