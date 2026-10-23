import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: reorder in the panel under the touch floor',
  subtitle:
    'Under the touch floor the trigger shows a one-line summary, so the sorting moves into the panel: a list of the selected values sits above the options, in the sheet and in the anchored panel alike. Drag a row by its handle, or use the up and down buttons.',
  description:
    "The list reuses the select's reorder path: a drag, the move buttons and Alt+Arrow all write <code>[(values)]</code> through the same commit handler, so <code>[commitAction]</code> and the move announcements apply unchanged. The move buttons are the single-pointer alternative to the drag (WCAG 2.5.7); the first row's up and the last row's down button stay focusable with <code>aria-disabled</code> and say why. While a commit is pending the list is frozen and <code>aria-busy</code>. On a fine pointer the chips in the trigger stay draggable as before. Pick <strong>sheet</strong> to see the list in the mobile sheet on a desktop.",
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxReorderableMultiSelect', 'CngxTouchTarget'],
  moduleImports: [
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxReorderableMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxTouchTarget', 'CngxReorderableMultiSelect'],
  setup: `protected readonly stops: CngxSelectOptionDef<string>[] = [
    'Amsterdam', 'Berlin', 'Prague', 'Vienna', 'Budapest', 'Zagreb',
  ].map((name) => ({ value: name, label: name }));
  protected readonly route = signal<string[]>(['Berlin', 'Prague', 'Vienna']);`,
  setupChrome: `protected readonly presentation = signal<'anchored' | 'sheet'>('anchored');`,
  template: `<div [cngxTouchTarget]="'on'" style="max-inline-size: 24rem">
    <cngx-reorderable-multi-select
      label="Route"
      [options]="stops"
      [(values)]="route"
      [presentation]="presentation()"
    />
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="reorder-panel-presentation" value="anchored"
        [checked]="presentation() === 'anchored'" (change)="presentation.set('anchored')" />
      anchored
    </label>
    <label>
      <input type="radio" name="reorder-panel-presentation" value="sheet"
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
