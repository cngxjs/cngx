import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxExpandable: Controlled by external state',
  subtitle: 'Bind <code>[expanded]</code> to a parent signal; the host <code>aria-expanded</code> mirrors the bound value, so several rows can coordinate from a shared source.',
  description: 'When the parent owns the expansion state (typically a <code>CngxTreeController</code>, a Map of expanded keys, or a URL-driven state slice), bind <code>[expanded]</code> to that signal, or <code>[(expanded)]</code> when the directive\'s own <code>expand()</code> / <code>collapse()</code> should write back. Each row is a toggle button that carries the directive and drives the consumer signal directly; its <code>aria-expanded</code> mirrors that signal. Useful when several rows must coordinate (e.g. accordion with single-open enforcement, tree with persisted expansion across navigation).',
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
  <div>
    @for (row of ['row-a', 'row-b', 'row-c']; track row) {
      <div style="margin-bottom:12px">
        <button
          type="button"
          cngxExpandable
          [expanded]="isExpanded(row)"
          [controls]="row + '-content'"
          (click)="toggleRow(row)"
          style="display:flex; align-items:center; gap:8px"
        >
          <span aria-hidden="true">{{ isExpanded(row) ? '▾' : '▸' }}</span>
          {{ row }}
        </button>
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
