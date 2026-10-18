import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterChips: Multi-role filter wired to a list',
  subtitle: 'The <code>&lt;cngx-filter-chips&gt;</code> bridge synchronises with the parent <code>CngxFilter</code>. The list reads <code>filter.predicate()</code> in a <code>computed</code>; toggling chips re-runs the filter without any <code>effect()</code> write-back.',
  description: 'End-to-end wiring: a chip strip drives a <code>CngxFilter</code> predicate; a sibling <code>&lt;ul&gt;</code> reads that predicate to decide which items to render. The bridge renders the required <code>label</code> ("Tags") as a visible caption above the strip - no consumer-drawn facet label - and keeps naming the inner listbox with the same string. A <code>role="status"</code> live region announces the new count whenever chips toggle, so screen-reader users hear the result change.',
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
  protected readonly tasks: readonly unknown[] = [
    { title: 'Fix login timeout', tags: ['urgent', 'blocker'] },
    { title: 'Proofread release notes', tags: ['review'] },
    { title: 'Update API docs', tags: ['follow-up'] },
    { title: 'Migrate CI runners', tags: ['on-hold', 'blocker'] },
    { title: 'Plan Q4 roadmap', tags: ['follow-up', 'on-hold'] },
  ];
  protected readonly tagLabel = (t: unknown): string =>
    (t as { readonly label: string }).label;
  protected readonly tagId = (t: unknown): string =>
    (t as { readonly id: string }).id;
  // The list is shaped unlike the chip options: a task carries several tag ids,
  // and it matches when any of them is selected.
  protected readonly taskTags = (task: unknown): readonly string[] =>
    (task as { readonly tags: readonly string[] }).tags;
  protected readonly taskTitle = (task: unknown): string =>
    (task as { readonly title: string }).title;
  protected readonly tagLabels = (task: unknown): string =>
    this.taskTags(task)
      .map((id) => this.tagLabel(this.tagItems.find((t) => this.tagId(t) === id)))
      .join(', ');
  protected readonly visibleTasks = (predicate: ((t: unknown) => boolean) | null): readonly unknown[] =>
    predicate === null ? this.tasks : this.tasks.filter(predicate);`,
  template: `
  <ng-container [cngxFilter]="null" #filter="cngxFilter">
    <cngx-filter-chips
      label="Tags"
      [options]="tagItems"
      [optionLabel]="tagLabel"
      [optionValue]="tagId"
      [itemValue]="taskTags"
      [filterRef]="filter"
      filterKey="tags"
    />
    <p role="status" aria-live="polite">
      Showing {{ visibleTasks(filter.predicate()).length }} of {{ tasks.length }} tasks
    </p>
    <ul aria-label="Tagged items">
      @for (task of visibleTasks(filter.predicate()); track taskTitle(task)) {
        <li>
          <strong>{{ taskTitle(task) }}</strong>
          ({{ tagLabels(task) }})
        </li>
      }
    </ul>
  </ng-container>`,
};
