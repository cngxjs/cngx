import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: custom move glyphs',
  subtitle:
    'Under the touch floor the panel lists the selected values with a move-up and a move-down button per row. A projected <code>*cngxMultiSelectMoveGlyph</code> replaces the default triangles in both buttons; <code>let-direction</code> says which one it renders in.',
  description:
    'The slot wins over the <code>[moveGlyph]</code> input, whose app-wide default comes from <code>withDefaultMoveGlyph</code>; with neither the list draws its triangles. The glyph renders inside the button in an <code>aria-hidden</code> wrapper, so the button keeps its accessible name (for example "Berlin: move up") and the arrows add nothing to it. The wrapper takes <code>--cngx-select-reorder-move-size</code> (default <code>0.75em</code>) as its font size, the same token that sizes the default triangles; here it is set to <code>1em</code>, so the arrows draw at the list font size. The slot only renders under the touch floor, forced on here with <code>[cngxTouchTarget]</code>; on a fine pointer without it the chip strip reorders by drag and keyboard instead. Pick <strong>sheet</strong> to see the list in the mobile sheet on a desktop.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxReorderableMultiSelect', 'CngxMultiSelectMoveGlyph', 'CngxTouchTarget'],
  moduleImports: [
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxMultiSelectMoveGlyph, CngxReorderableMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxTouchTarget', 'CngxReorderableMultiSelect', 'CngxMultiSelectMoveGlyph'],
  setup: `protected readonly stops: CngxSelectOptionDef<string>[] = [
    'Amsterdam', 'Berlin', 'Prague', 'Vienna', 'Budapest', 'Zagreb',
  ].map((name) => ({ value: name, label: name }));
  protected readonly route = signal<string[]>(['Berlin', 'Prague', 'Vienna']);`,
  setupChrome: `protected readonly presentation = signal<'anchored' | 'sheet'>('anchored');`,
  template: `<div [cngxTouchTarget]="'on'" style="max-inline-size: 24rem; --cngx-select-reorder-move-size: 1em">
    <cngx-reorderable-multi-select
      label="Route"
      [options]="stops"
      [(values)]="route"
      [presentation]="presentation()"
    >
      <ng-template cngxMultiSelectMoveGlyph let-direction>
        <span class="demo-move-glyph">
          @if (direction === 'up') { &uarr; } @else { &darr; }
        </span>
      </ng-template>
    </cngx-reorderable-multi-select>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="move-glyph-presentation" value="anchored"
        [checked]="presentation() === 'anchored'" (change)="presentation.set('anchored')" />
      anchored
    </label>
    <label>
      <input type="radio" name="move-glyph-presentation" value="sheet"
        [checked]="presentation() === 'sheet'" (change)="presentation.set('sheet')" />
      sheet
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ route().join(' > ') || 'none' }}</span>
    </div>
  </div>`,
};
