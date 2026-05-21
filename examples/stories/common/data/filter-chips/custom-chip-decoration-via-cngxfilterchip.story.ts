import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterChips: Custom chip decoration via *cngxFilterChip',
  subtitle: 'The slot customizes <em>decoration</em> inside each chip. The bridge always wraps every option in <code>&lt;cngx-chip cngxChipInGroup [value]&gt;</code> itself, so the projected template never has to wire selection. Slot context exposes <code>$implicit</code>/<code>option</code>, <code>value</code>, and <code>label</code>.',
  description: 'Project a custom template into each chip via <code>*cngxFilterChip</code>. The bridge keeps ownership of the chip element, selection state, and ARIA wiring; the projected template only decorates the content. Decorative glyphs use <code>aria-hidden="true"</code> so the chip\'s accessible name stays the option label.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxFilterChips',
    'CngxFilterChip',
    'CngxFilter',
  ],
  moduleImports: [
    'import { CngxFilter, CngxFilterChips, CngxFilterChip } from \'@cngx/common/data\';',
  ],
  imports: ['CngxFilter', 'CngxFilterChips', 'CngxFilterChip'],
  setup: `protected readonly tagItems: readonly unknown[] = [
    { id: 'urgent', label: 'Urgent' },
    { id: 'review', label: 'Review' },
    { id: 'blocker', label: 'Blocker' },
    { id: 'follow-up', label: 'Follow-up' },
    { id: 'on-hold', label: 'On hold' },
  ];
  protected readonly tagLabel = (t: unknown): string =>
    (t as { readonly label: string }).label;
  protected readonly tagId = (t: unknown): string =>
    (t as { readonly id: string }).id;`,
  template: `
  <ng-container [cngxFilter]="null" #filter="cngxFilter">
    <cngx-filter-chips
      label="Tags (custom decoration)"
      [options]="tagItems"
      [optionLabel]="tagLabel"
      [optionValue]="tagId"
      [filterRef]="filter"
      filterKey="tags"
    >
      <ng-template cngxFilterChip let-label="label">
        <span aria-hidden="true">★</span> {{ label }}
      </ng-template>
    </cngx-filter-chips>
  </ng-container>`,
};
