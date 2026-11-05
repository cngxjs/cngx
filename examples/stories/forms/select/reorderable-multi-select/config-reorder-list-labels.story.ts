import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: reorder list labels via withReorderListLabels',
  subtitle:
    '<code>provideReorderableSelectConfigAt(withReorderListLabels({...}))</code> renames the touch reorder list for the subtree: the list group label, the per-row move-up / move-down names (each a <code>(label) =&gt; string</code>), and the reasons the end buttons are unavailable. Unset keys keep the select language section; each key also takes a <code>Signal</code> for a runtime language switch.',
  description:
    'The names are read by assistive technology, so the readout mirrors the list\'s <code>aria-label</code> from the DOM. The list renders under the touch floor, forced on here with <code>[cngxTouchTarget]</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxReorderableMultiSelect', 'CngxTouchTarget'],
  moduleImports: [
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxReorderableMultiSelect, provideReorderableSelectConfigAt, withReorderListLabels, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxTouchTarget', 'CngxReorderableMultiSelect'],
  viewProviders: [
    "...provideReorderableSelectConfigAt(withReorderListLabels({ listLabel: 'Reorder destinations', moveUp: (l) => 'Move ' + l + ' earlier', moveDown: (l) => 'Move ' + l + ' later', atStart: 'Already first', atEnd: 'Already last' }))",
  ],
  setup: `protected readonly stops: CngxSelectOptionDef<string>[] = [
    'Amsterdam', 'Berlin', 'Prague', 'Vienna', 'Budapest',
  ].map((name) => ({ value: name, label: name }));
  protected readonly route = signal<string[]>(['Berlin', 'Prague', 'Vienna']);`,
  setupChrome: `private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly listName = signal('-');
  private readonly observer = new MutationObserver(() => this.readListName());
  private readonly startObserving = afterNextRender(() => {
    this.readListName();
    this.observer.observe(this.hostEl.nativeElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label'] });
  });
  private readonly stopObserving = inject(DestroyRef).onDestroy(() => this.observer.disconnect());
  private readListName(): void {
    const list = this.hostEl.nativeElement.querySelector('.cngx-select-reorder-list__list');
    this.listName.set(list?.getAttribute('aria-label') ?? '-');
  }`,
  template: `<div [cngxTouchTarget]="'on'" style="max-inline-size: 24rem">
  <cngx-reorderable-multi-select
    label="Route"
    [options]="stops"
    [(values)]="route"
  />
</div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">List aria-label</span><span class="event-value">{{ listName() }}</span></div>
    <div class="event-row"><span class="event-label">Order</span><span class="event-value">{{ route().join(' > ') || '-' }}</span></div>
  </div>`,
};
