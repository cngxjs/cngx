import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Multi column sort',
  subtitle:
    '<code>[multiSort]="true"</code> on <code>[cngxSort]</code> keeps an ordered stack of sort entries in <code>sorts()</code>; each active header shows its 1-based rank via <code>sortHeader.priority()</code>. The tree is derived by applying <code>sortTree</code> once per entry in reverse priority order.',
  description:
    'A plain click sets the single primary sort and cycles it ascending, descending, cleared. Shift+click on another column appends it as a secondary key; Shift+click on an active column cycles ascending to descending, then removes it from the stack. The reverse-order <code>sortTree</code> chain works because <code>Array.prototype.sort</code> is stable: each higher-priority pass preserves the relative order the lower-priority passes established. Sorting stays per level - siblings reorder, children stay grouped.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxTreetable', 'CngxHeaderTpl', 'CngxSort', 'CngxSortHeader'],
  moduleImports: [
    "import { CngxTreetable, CngxHeaderTpl, sortTree, type Node } from '@cngx/data-display/treetable';",
    "import { CngxSort, CngxSortHeader, type SortEntry } from '@cngx/common/data';",
    "import { ORG_TREE, type Employee } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable', 'CngxHeaderTpl', 'CngxSort', 'CngxSortHeader'],
  setup: `protected sortedTree(entries: readonly SortEntry[]): Node<Employee>[] {
    // Lowest priority first: sortTree's underlying Array.sort is stable, so
    // each later (higher priority) pass preserves the order set before it.
    let tree: Node<Employee>[] = [ORG_TREE];
    for (const entry of [...entries].reverse()) {
      tree = sortTree(tree, entry.active, entry.direction);
    }
    return tree;
  }`,
  template: `  <cngx-treetable cngxSort [multiSort]="true" #sort="cngxSort" [tree]="sortedTree(sort.sorts())">
    <ng-template [cngxHeader]="'name'">
      <button type="button" cngxSortHeader="name" [cngxSortRef]="sort" #hName="cngxSortHeader">
        Name
        @if (hName.isActive()) {
          <span aria-hidden="true">{{ hName.isAsc() ? '↑' : '↓' }}</span>
          <sup aria-hidden="true">{{ hName.priority() }}</sup>
        }
      </button>
    </ng-template>
    <ng-template [cngxHeader]="'role'">
      <button type="button" cngxSortHeader="role" [cngxSortRef]="sort" #hRole="cngxSortHeader">
        Role
        @if (hRole.isActive()) {
          <span aria-hidden="true">{{ hRole.isAsc() ? '↑' : '↓' }}</span>
          <sup aria-hidden="true">{{ hRole.priority() }}</sup>
        }
      </button>
    </ng-template>
    <ng-template [cngxHeader]="'location'">
      <button type="button" cngxSortHeader="location" [cngxSortRef]="sort" #hLoc="cngxSortHeader">
        Location
        @if (hLoc.isActive()) {
          <span aria-hidden="true">{{ hLoc.isAsc() ? '↑' : '↓' }}</span>
          <sup aria-hidden="true">{{ hLoc.priority() }}</sup>
        }
      </button>
    </ng-template>
  </cngx-treetable>`,
  templateChromeBefore: `<p style="margin-bottom:12px">Click a header to set the primary sort. Hold Shift and click another header to stack secondary keys.</p>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    @for (entry of sort.sorts(); track entry.active; let i = $index) {
      <div class="event-row">
        <span class="event-label">Priority {{ i + 1 }}</span>
        <span class="event-value">{{ entry.active }} {{ entry.direction }}</span>
      </div>
    } @empty {
      <div class="event-row">
        <span class="event-label">Sort stack</span>
        <span class="event-value">empty</span>
      </div>
    }
  </div>`,
};
