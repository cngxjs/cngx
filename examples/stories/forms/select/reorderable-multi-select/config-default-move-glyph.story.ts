import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: default move glyph via withDefaultMoveGlyph',
  subtitle:
    '<code>provideReorderableSelectConfigAt(withDefaultMoveGlyph(glyph))</code> registers the move-up / move-down glyph for every reorder list in the subtree, so both lists below draw the config arrows without a per-instance <code>[moveGlyph]</code>. A projected <code>*cngxMultiSelectMoveGlyph</code> still wins on its own instance; <code>let-direction</code> says which button renders it.',
  description:
    'The list only renders under the touch floor, forced on here with <code>[cngxTouchTarget]</code>. A <code>TemplateRef</code> exists only once the view has rendered, so the scope is a <code>computed()</code> over the rendered glyph, built with <code>Injector.create</code> and handed to <code>ngTemplateOutlet</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxReorderableMultiSelect', 'CngxTouchTarget'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxReorderableMultiSelect, provideReorderableSelectConfigAt, withDefaultMoveGlyph, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['NgTemplateOutlet', 'CngxTouchTarget', 'CngxReorderableMultiSelect'],
  setup: `private readonly injector = inject(Injector);
  private readonly configGlyph = viewChild.required<TemplateRef<{ $implicit: 'up' | 'down'; direction: 'up' | 'down' }>>('configGlyph');

  protected readonly reorderScope = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: provideReorderableSelectConfigAt(withDefaultMoveGlyph(this.configGlyph())),
    }),
  );

  protected readonly stops: CngxSelectOptionDef<string>[] = [
    'Amsterdam', 'Berlin', 'Prague', 'Vienna', 'Budapest',
  ].map((name) => ({ value: name, label: name }));
  protected readonly configRoute = signal<string[]>(['Berlin', 'Prague', 'Vienna']);`,
  template: `  <ng-template #configGlyph let-direction>
    <span class="demo-move-glyph">
      @if (direction === 'up') { &#x25B2; } @else { &#x25BC; }
    </span>
  </ng-template>

  <div [cngxTouchTarget]="'on'" style="max-inline-size: 24rem">
    <ng-container *ngTemplateOutlet="list; injector: reorderScope()" />
  </div>

  <ng-template #list>
    <cngx-reorderable-multi-select
      label="Route (config glyph)"
      [options]="stops"
      [(values)]="configRoute"
    />
  </ng-template>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Order</span><span class="event-value">{{ configRoute().join(' > ') || '-' }}</span></div>
  </div>`,
};
