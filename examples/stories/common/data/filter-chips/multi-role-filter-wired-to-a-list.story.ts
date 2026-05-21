import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterChips: Multi-role filter wired to a list',
  subtitle: 'The <code>&lt;cngx-filter-chips&gt;</code> bridge synchronises with the parent <code>CngxFilter</code>. The list reads <code>filter.predicate()</code> in a <code>computed</code>; toggling chips re-runs the filter without any <code>effect()</code> write-back.',
  description: 'End-to-end wiring: a chip strip drives a <code>CngxFilter</code> predicate; a sibling <code>&lt;ul&gt;</code> reads that predicate to decide which items to render. A <code>role="status"</code> live region announces the new count whenever chips toggle, so screen-reader users hear the result change.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA: status role', href: 'https://www.w3.org/TR/wai-aria-1.2/#status' },
    { label: 'WCAG 4.1.3 Status Messages', href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html' },
  ],
  apiComponents: [
    'CngxFilterChips',
    'CngxFilterChip',
    'CngxFilter',
  ],
  moduleImports: [
    'import { CngxFilter, CngxFilterChips } from \'@cngx/common/data\';',
  ],
  imports: ['CngxFilter', 'CngxFilterChips'],
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
    (t as { readonly id: string }).id;
  protected readonly visibleTags = (predicate: ((t: unknown) => boolean) | null): readonly unknown[] =>
    predicate === null ? this.tagItems : this.tagItems.filter(predicate);`,
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
    <p role="status" aria-live="polite">
      Showing {{ visibleTags(filter.predicate()).length }} of {{ tagItems.length }} tags
    </p>
    <ul aria-label="Tagged items">
      @for (item of visibleTags(filter.predicate()); track tagId(item)) {
        <li>
          <strong>{{ tagLabel(item) }}</strong>
          (id: <code>{{ tagId(item) }}</code>)
        </li>
      }
    </ul>
  </ng-container>`,
};
