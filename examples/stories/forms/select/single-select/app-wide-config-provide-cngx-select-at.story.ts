import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: app-wide config with provideCngxSelectAt',
  subtitle:
    "One <code>provideCngxSelectAt(...)</code> retunes every select in its subtree: <code>withPanelWidth(400)</code> gives every panel a 400px minimum width instead of the trigger width, <code>withCaret(false)</code> drops the trigger caret, <code>withSelectionIndicator</code> plus <code>withSelectionIndicatorPosition('before')</code> move the checkmark ahead of the label, <code>withChipOverflow('truncate')</code> with <code>withMaxVisibleChips(2)</code> folds extra chips into a <code>+N</code> badge, and <code>withDismissOn('escape')</code> keeps the panel open on an outside click.",
  description:
    'Both panes render the same single select and multi select; only the right pane sits under the scoped config. <code>provideCngxSelect</code> returns <code>EnvironmentProviders</code> for bootstrap, so a subtree uses the <code>At</code> twin, which returns plain providers. A <code>viewProviders</code> entry would reach both panes, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>. Open a right-pane panel and click elsewhere on the page: it stays open until you press Escape or pick an option. The left pane closes on either. The toggle below rebuilds the scope with <code>withSelectionIndicator(false)</code>, which hides the checkmark entirely.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxSelect', 'CngxMultiSelect'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxMultiSelect, CngxSelect, provideCngxSelectAt, withCaret, withChipOverflow, withDismissOn, withMaxVisibleChips, withPanelWidth, withSelectionIndicator, withSelectionIndicatorPosition, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['NgTemplateOutlet', 'CngxSelect', 'CngxMultiSelect'],
  setup: `private readonly injector = inject(Injector);
  protected readonly showIndicator = signal(true);

  protected readonly selectScope = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: provideCngxSelectAt(
        withPanelWidth(400),
        withCaret(false),
        withSelectionIndicator(this.showIndicator()),
        withSelectionIndicatorPosition('before'),
        withChipOverflow('truncate'),
        withMaxVisibleChips(2),
        withDismissOn('escape'),
      ),
    }),
  );

  protected readonly sizes: CngxSelectOptionDef<string>[] = [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' },
  ];
  protected readonly toppings: CngxSelectOptionDef<string>[] = [
    { value: 'basil', label: 'Basil' },
    { value: 'olives', label: 'Olives' },
    { value: 'onion', label: 'Onion' },
    { value: 'pepper', label: 'Pepper' },
    { value: 'tomato', label: 'Tomato' },
  ];
  protected readonly size = [signal<string | undefined>('m'), signal<string | undefined>('m')];
  protected readonly picked = [
    signal<string[]>(['basil', 'olives', 'onion', 'pepper']),
    signal<string[]>(['basil', 'olives', 'onion', 'pepper']),
  ];
  protected readonly panelOpen = [signal(false), signal(false)];`,
  template: `  <ng-template #order let-side>
    <cngx-select
      [label]="'Size'"
      [options]="sizes"
      [value]="size[side]()"
      (valueChange)="size[side].set($event)"
      (openedChange)="panelOpen[side].set($event)"
    />
    <cngx-multi-select
      [label]="'Toppings'"
      [options]="toppings"
      [values]="picked[side]()"
      (valuesChange)="picked[side].set($event)"
    />
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Library defaults</h3>
      <ng-container *ngTemplateOutlet="order; context: { $implicit: 0 }" />
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="order; context: { $implicit: 1 }; injector: selectScope()" />
    </div>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="showIndicator()" (change)="showIndicator.set(!showIndicator())" />
      Scoped checkmark shown (withSelectionIndicator)
    </label>
  </div>
  <div class="event-grid">
    <div class="event-row"><span class="event-label">Defaults: size panel</span><span class="event-value">{{ panelOpen[0]() ? 'open' : 'closed' }}, closes on outside click and Escape</span></div>
    <div class="event-row"><span class="event-label">Scoped: size panel</span><span class="event-value">{{ panelOpen[1]() ? 'open' : 'closed' }}, closes on Escape only</span></div>
    <div class="event-row"><span class="event-label">Defaults: toppings</span><span class="event-value">{{ picked[0]().join(', ') || '-' }}</span></div>
    <div class="event-row"><span class="event-label">Scoped: toppings</span><span class="event-value">{{ picked[1]().join(', ') || '-' }}</span></div>
  </div>`,
};
