import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: config default handle and slot',
  subtitle:
    "One <code>provideReorderableSelectConfigAt(...)</code> sets the reorder defaults for a subtree: <code>withDefaultDragHandle</code> registers a grip template for every chip, <code>withReorderKeyboardModifier('ctrl')</code> swaps the modifier for keyboard moves, and <code>withReorderAriaLabel</code> renames the chip strip to match. A projected <code>*cngxMultiSelectChipHandle</code> still beats the config grip on its own instance.",
  description:
    "The first select reads the library defaults: no grip, the whole chip is the drag surface, and Alt plus an arrow key moves the focused chip. The two selects under the scoped config draw the config grip and move chips with Ctrl plus an arrow key; the third projects its own handle through <code>*cngxMultiSelectChipHandle</code>, which wins over the config. The modifier and the strip name are not visible, so the readout mirrors each strip's <code>aria-label</code> from the DOM. Change the modifier and the label together: the default name says Alt. A <code>TemplateRef</code> exists only once the view has rendered, so the scope is a <code>computed()</code> over the rendered grip, built with <code>Injector.create</code> and handed to <code>ngTemplateOutlet</code>. On macOS, Ctrl plus an arrow key may switch desktops before the page sees it.",
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxReorderableMultiSelect', 'CngxMultiSelectChipHandle'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxMultiSelectChipHandle, CngxReorderableMultiSelect, provideReorderableSelectConfigAt, withDefaultDragHandle, withReorderAriaLabel, withReorderKeyboardModifier, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['NgTemplateOutlet', 'CngxReorderableMultiSelect', 'CngxMultiSelectChipHandle'],
  setup: `private readonly injector = inject(Injector);
  private readonly configGrip = viewChild.required<TemplateRef<void>>('configGrip');

  protected readonly reorderScope = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: provideReorderableSelectConfigAt(
        withDefaultDragHandle(this.configGrip()),
        withReorderKeyboardModifier('ctrl'),
        withReorderAriaLabel('Reorder with Ctrl + arrow keys'),
      ),
    }),
  );

  protected readonly teams: CngxSelectOptionDef<string>[] = [
    { value: 'ops', label: 'Operations' },
    { value: 'eng', label: 'Engineering' },
    { value: 'legal', label: 'Legal' },
    { value: 'sales', label: 'Sales' },
    { value: 'support', label: 'Support' },
  ];
  protected readonly defaultOrder = signal<string[]>(['ops', 'eng', 'sales']);
  protected readonly configOrder = signal<string[]>(['ops', 'eng', 'sales']);
  protected readonly slotOrder = signal<string[]>(['ops', 'eng', 'sales']);`,
  template: `  <ng-template #configGrip>
    <span class="demo-grip-glyph">&#x22EE;&#x22EE;</span>
  </ng-template>

  <ng-template #scoped>
    <cngx-reorderable-multi-select
      [label]="'Config grip'"
      [options]="teams"
      [(values)]="configOrder"
    />
    <cngx-reorderable-multi-select
      [label]="'Projected handle wins'"
      [options]="teams"
      [(values)]="slotOrder"
    >
      <ng-template cngxMultiSelectChipHandle>
        <span class="demo-grip-glyph">&equiv;</span>
      </ng-template>
    </cngx-reorderable-multi-select>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Library defaults</h3>
      <cngx-reorderable-multi-select
        [label]="'Defaults'"
        [options]="teams"
        [(values)]="defaultOrder"
      />
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="scoped; injector: reorderScope()" />
    </div>
  </div>`,
  setupChrome: `private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly stripNames = signal('-');

  private readonly observer = new MutationObserver(() => this.readStripNames());
  private readonly startObserving = afterNextRender(() => {
    this.readStripNames();
    this.observer.observe(this.hostEl.nativeElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label'] });
  });
  private readonly stopObserving = inject(DestroyRef).onDestroy(() => this.observer.disconnect());

  private readStripNames(): void {
    const strips = Array.from(this.hostEl.nativeElement.querySelectorAll('.cngx-select__chip-list[role="group"]'));
    this.stripNames.set(strips.map((strip) => strip.getAttribute('aria-label') ?? '-').join(' | '));
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Defaults order</span><span class="event-value">{{ defaultOrder().join(', ') }}</span></div>
    <div class="event-row"><span class="event-label">Config grip order</span><span class="event-value">{{ configOrder().join(', ') }}</span></div>
    <div class="event-row"><span class="event-label">Projected handle order</span><span class="event-value">{{ slotOrder().join(', ') }}</span></div>
    <div class="event-row"><span class="event-label">Strip names, in page order</span><span class="event-value">{{ stripNames() }}</span></div>
  </div>`,
};
