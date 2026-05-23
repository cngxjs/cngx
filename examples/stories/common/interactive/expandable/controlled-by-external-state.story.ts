import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxExpandable: Controlled by external state',
  subtitle: 'Bind <code>[cngxExpandableOpen]</code> to a parent signal; the directive\'s internal state is bypassed and the host <code>aria-expanded</code> mirrors the bound value, so several rows can coordinate from a shared source.',
  description: 'When the parent owns the expansion state (typically a <code>CngxTreeController</code>, a Map of expanded keys, or a URL-driven state slice), bind <code>[cngxExpandableOpen]</code> to that signal. The directive\'s <code>expanded</code> computed resolves the controlled input first and falls back to internal state only when the input is <code>undefined</code>. A flat toggle button drives the consumer signal directly; the directive\'s host <code>aria-expanded</code> mirrors it. Useful when several rows must coordinate (e.g. accordion with single-open enforcement, tree with persisted expansion across navigation).',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxExpandable',
  ],
  moduleImports: [
    'import { CngxExpandable } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxExpandable'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-expanded`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-expanded' },
    { label: 'WAI-ARIA 1.2: `aria-controls`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-controls' },
  ],
  setup: `
  protected readonly expandedRows = signal<Set<string>>(new Set(['row-a']));

  protected isExpanded(rowId: string): boolean {
    return this.expandedRows().has(rowId);
  }

  protected toggleRow(rowId: string): void {
    this.expandedRows.update((set) => {
      const next = new Set(set);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }`,
  template: `
  <div role="tree" aria-label="Rows">
    @for (row of ['row-a', 'row-b', 'row-c']; track row) {
      <div style="margin-bottom:12px">
        <div
          role="treeitem"
          aria-level="1"
          cngxExpandable
          [cngxExpandableOpen]="isExpanded(row)"
          [controls]="row + '-content'"
          style="display:flex; align-items:center; gap:8px"
        >
          <button type="button" [attr.aria-label]="'Toggle ' + row" (click)="toggleRow(row)">
            {{ isExpanded(row) ? '▾' : '▸' }}
          </button>
          <span>{{ row }}</span>
        </div>
        <p
          [id]="row + '-content'"
          [hidden]="!isExpanded(row)"
          style="margin:4px 0 0 1.5rem"
        >Content of {{ row }}.</p>
      </div>
    }
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">expandedRows</span>
      <span class="event-value">{{ '[' + (expandedRowsLabel()) + ']' }}</span>
    </div>
  </div>`,
  setupChrome: `
  protected readonly expandedRowsLabel = computed<string>(() =>
    [...this.expandedRows()].sort().join(', ') || '-',
  );`,
};
