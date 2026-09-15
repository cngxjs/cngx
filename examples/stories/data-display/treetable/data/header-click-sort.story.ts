import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Header click sort',
  subtitle:
    'The canonical wiring: <code>[cngxSort]</code> on the grid tracks active field and direction, a <code>cngxSortHeader</code> button with an explicit <code>[cngxSortRef]</code> sits inside each <code>[cngxHeader]</code> slot template, and the tree is derived from <code>sort.sort()</code> through <code>sortTree</code>. The sort atom owns the state; the table renders what you pass.',
  description:
    'Click a header to cycle ascending, descending, cleared. <code>CngxSortHeader</code> hosts the <code>aria-sort</code> attribute and the active/direction classes; nothing is injected from an ancestor - the <code>[cngxSortRef]</code> binding is explicit. Sorting is per level: siblings reorder, children stay grouped under their parent.',
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
  setup: `protected sortedTree(entry: SortEntry | null): Node<Employee>[] {
    if (!entry) {
      return [ORG_TREE];
    }
    return sortTree([ORG_TREE], entry.active, entry.direction);
  }`,
  template: `  <cngx-treetable cngxSort #sort="cngxSort" [tree]="sortedTree(sort.sort())">
    <ng-template [cngxHeader]="'name'">
      <button type="button" cngxSortHeader="name" [cngxSortRef]="sort" #hName="cngxSortHeader">
        Name
        @if (hName.isActive()) {
          <span aria-hidden="true">{{ hName.isAsc() ? '↑' : '↓' }}</span>
        }
      </button>
    </ng-template>
    <ng-template [cngxHeader]="'role'">
      <button type="button" cngxSortHeader="role" [cngxSortRef]="sort" #hRole="cngxSortHeader">
        Role
        @if (hRole.isActive()) {
          <span aria-hidden="true">{{ hRole.isAsc() ? '↑' : '↓' }}</span>
        }
      </button>
    </ng-template>
    <ng-template [cngxHeader]="'location'">
      <button type="button" cngxSortHeader="location" [cngxSortRef]="sort" #hLoc="cngxSortHeader">
        Location
        @if (hLoc.isActive()) {
          <span aria-hidden="true">{{ hLoc.isAsc() ? '↑' : '↓' }}</span>
        }
      </button>
    </ng-template>
  </cngx-treetable>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active field</span>
      <span class="event-value">{{ sort.active() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Direction</span>
      <span class="event-value">{{ sort.direction() ?? '-' }}</span>
    </div>
  </div>`,
};
