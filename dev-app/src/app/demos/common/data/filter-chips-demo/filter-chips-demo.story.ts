import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter chips',
  navLabel: 'Filter chips',
  navCategory: 'data',
  description:
    'Bridge between a multi-select chip strip and a parent <code>CngxFilter</code>. The ' +
    'bridge registers a single closure-style predicate ONCE on mount; chip toggles update ' +
    'the bridge\'s internal <code>selectedValues</code>; downstream filtered consumers ' +
    'recompute via the predicate\'s lazy read of <code>selectedValues()</code>. Pillar 1 ' +
    'derivation — no <code>effect()</code> write-back. Empty selection short-circuits to ' +
    '"no filter applied". <strong>Phase 5 limitation:</strong> the bridge\'s ' +
    '<code>[optionValue]</code> function extracts a key from each list item AND each ' +
    'chip option — they must share a shape. A future <code>[itemValue]</code> input will ' +
    'separate the two extractors; tracked as a follow-up.',
  apiComponents: ['CngxFilterChips', 'CngxFilterChip', 'CngxFilter'],
  moduleImports: [
    "import { CngxFilter, CngxFilterChips, CngxFilterChip } from '@cngx/common/data';",
  ],
  setup: `
  protected readonly tagItems: readonly unknown[] = [
    { id: 'urgent', label: 'Urgent' },
    { id: 'review', label: 'Review' },
    { id: 'blocker', label: 'Blocker' },
    { id: 'follow-up', label: 'Follow-up' },
    { id: 'on-hold', label: 'On hold' },
  ];

  protected readonly tagLabel = (t: unknown): string =>
    (t as { readonly label: string }).label;
  protected readonly tagId = (t: unknown): string =>
    (t as { readonly id: string }).id;
  `,
  sections: [
    {
      title: 'Custom chip decoration via *cngxFilterChip',
      subtitle:
        'The slot customizes <em>decoration</em> inside each chip. The ' +
        'bridge always wraps every option in <code>&lt;cngx-chip cngxChipInGroup ' +
        '[value]&gt;</code> itself, so the projected template never has ' +
        'to wire selection. Slot context exposes <code>$implicit</code>/' +
        '<code>option</code>, <code>value</code>, and <code>label</code>.',
      imports: ['CngxFilter', 'CngxFilterChips', 'CngxFilterChip'],
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
    },
    {
      title: 'Multi-role filter wired to a list',
      subtitle:
        'The <code>&lt;cngx-filter-chips&gt;</code> bridge synchronises with the parent ' +
        '<code>CngxFilter</code>. The list reads <code>filter.predicate()</code> in a ' +
        '<code>computed</code>; toggling chips re-runs the filter without any ' +
        '<code>effect()</code> write-back.',
      imports: ['CngxFilter', 'CngxFilterChips'],
      template: `
  <ng-container [cngxFilter]="null" #filter="cngxFilter">
    <cngx-filter-chips
      label="Tags"
      [options]="tagItems"
      [optionLabel]="tagLabel"
      [optionValue]="tagId"
      [filterRef]="filter"
      filterKey="tags"
    />
    <ul>
      @for (item of tagItems; track tagId(item)) {
        @if (filter.predicate() === null || filter.predicate()!(item)) {
          <li>
            <strong>{{ tagLabel(item) }}</strong>
            (id: <code>{{ tagId(item) }}</code>)
          </li>
        }
      }
    </ul>
  </ng-container>`,
    },
  ],
};
