import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Treetable',
  moduleImports: [
    "import { ORG_TREE, type Employee } from '../../../fixtures';",
    "import { CngxTreetable, CngxMaterialTreetable, CngxCellTpl, CngxHeaderTpl, CngxEmptyTpl, filterTree, sortTree, nodeMatchesSearch } from '@cngx/data-display/treetable';",
    "import type { FlatNode, Node } from '@cngx/data-display/treetable';",
  ],
  controls: [
    {
      key: 'selectionMode',
      type: 'select',
      label: 'Selection Mode',
      options: [
        { label: 'none', value: 'none' },
        { label: 'single', value: 'single' },
        { label: 'multi', value: 'multi' },
      ],
      default: 'none',
    },
    { key: 'showCheckboxes', type: 'bool', label: 'Show Checkboxes', default: false },
    { key: 'highlightRowOnHover', type: 'bool', label: 'Highlight Row On Hover', default: true },
    { key: 'capitaliseHeader', type: 'bool', label: 'Capitalise Header', default: true },
  ],
  setup: `
  protected readonly tree = signal<Node<Employee>>(ORG_TREE);
  protected readonly lastClickedCdk = signal<FlatNode<Employee> | null>(null);
  protected readonly lastClickedMat = signal<FlatNode<Employee> | null>(null);

  // ── Single selection ─────────────────────────────────────────────────────
  protected readonly singleSelected = signal<readonly string[]>([]);

  // ── Multi selection ──────────────────────────────────────────────────────
  protected readonly multiSelected = signal<readonly string[]>([]);

  // ── Controlled selection ──────────────────────────────────────────────────
  protected readonly controlledIds = signal<ReadonlySet<string>>(new Set(['0-0', '0-1']));

  protected controlledIdsLabel(): string {
    return [...this.controlledIds()].join(', ') || '—';
  }

  protected selectLevel1(): void {
    this.controlledIds.set(new Set(['0', '0-0', '0-1', '0-2']));
  }

  protected clearSelection(): void {
    this.controlledIds.set(new Set());
  }

  // ── Controlled expand ────────────────────────────────────────────────────
  protected readonly controlledExpandedIds = signal<ReadonlySet<string>>(new Set(['0']));

  protected expandedIdsLabel(): string {
    return [...this.controlledExpandedIds()].join(', ') || '—';
  }

  protected expandAll(): void {
    this.controlledExpandedIds.set(new Set(['0', '0-0', '0-1', '0-2']));
  }

  protected collapseAll(): void {
    this.controlledExpandedIds.set(new Set());
  }

  // ── Expand / collapse outputs ─────────────────────────────────────────────
  protected readonly lastExpanded = signal<FlatNode<Employee> | null>(null);
  protected readonly lastCollapsed = signal<FlatNode<Employee> | null>(null);

  // ── Search ───────────────────────────────────────────────────────────────
  protected readonly searchTerm = signal('');

  protected readonly searchFilteredTree = computed((): Node<Employee>[] => {
    const term = this.searchTerm();
    if (!term) return [ORG_TREE];
    return filterTree([ORG_TREE], (v) => nodeMatchesSearch(v, term));
  });

  // ── Sort ─────────────────────────────────────────────────────────────────
  protected readonly activeSortState = signal<{ active: string; direction: 'asc' | 'desc' } | null>(null);

  protected readonly sortedTree = computed((): Node<Employee>[] => {
    const state = this.activeSortState();
    if (!state) return [ORG_TREE];
    return sortTree([ORG_TREE], state.active, state.direction);
  });
  `,
  sections: [
    {
      title: 'Playground — CDK Variant',
      subtitle: 'CDK <code>&lt;cngx-treetable&gt;</code> with all presenter inputs wired. Toggle controls to explore selection modes, checkboxes, hover highlight.',
      imports: ['CngxTreetable', 'CngxCellTpl', 'CngxHeaderTpl', 'CngxEmptyTpl', 'CngxSort', 'CngxSortHeader', 'CngxSearch'],
      template: `
  <cngx-treetable
    [tree]="[tree()]"
    [selectionMode]="selectionMode.value()"
    [showCheckboxes]="showCheckboxes.value()"
    [options]="{ highlightRowOnHover: highlightRowOnHover.value() }"
    (nodeClicked)="lastClickedCdk.set($event)"
  >
    <ng-template cngxHeaderTpl="name">{{ capitaliseHeader.value() ? 'NAME' : 'Name' }}</ng-template>
    <ng-template cngxHeaderTpl="role">{{ capitaliseHeader.value() ? 'ROLE' : 'Role' }}</ng-template>
    <ng-template cngxHeaderTpl="location">{{ capitaliseHeader.value() ? 'LOCATION' : 'Location' }}</ng-template>
    <ng-template cngxCellTpl="name" let-node>{{ node.value.name }}</ng-template>
    <ng-template cngxCellTpl="role" let-node>{{ node.value.role }}</ng-template>
    <ng-template cngxCellTpl="location" let-node>{{ node.value.location }}</ng-template>
    <ng-template cngxEmptyTpl>No nodes.</ng-template>
  </cngx-treetable>
  @if (lastClickedCdk()) {
    <div class="output-badge">clicked: {{ lastClickedCdk()!.value.name }}</div>
  }`,
    },
    {
      title: 'Selection — Single',
      subtitle: 'Controlled single selection via <code>[selectedIds]</code> + <code>(selectedIdsChange)</code>.',
      template: `
  <cngx-treetable
    [tree]="[tree()]"
    selectionMode="single"
    [selectedIds]="singleSelected()"
    (selectedIdsChange)="singleSelected.set($event)"
  >
    <ng-template cngxHeaderTpl="name">Name</ng-template>
    <ng-template cngxHeaderTpl="role">Role</ng-template>
    <ng-template cngxHeaderTpl="location">Location</ng-template>
    <ng-template cngxCellTpl="name" let-node>{{ node.value.name }}</ng-template>
    <ng-template cngxCellTpl="role" let-node>{{ node.value.role }}</ng-template>
    <ng-template cngxCellTpl="location" let-node>{{ node.value.location }}</ng-template>
  </cngx-treetable>
  <div class="output-badge">selected: {{ singleSelected().join(', ') || '—' }}</div>`,
    },
    {
      title: 'Search + Sort',
      subtitle: '<code>filterTree</code> + <code>sortTree</code> utilities process the tree before passing it to the presenter.',
      imports: ['CngxSort', 'CngxSortHeader', 'CngxSearch'],
      template: `
  <div class="search-row">
    <input cngxSearch (searchChange)="searchTerm.set($event)" placeholder="Search…" class="search-input" />
  </div>
  <div cngxSort #sort="cngxSort" (sortChange)="activeSortState.set($event)">
    <cngx-treetable [tree]="searchFilteredTree()">
      <ng-template cngxHeaderTpl="name">
        <button cngxSortHeader="name" [cngxSortRef]="sort" #nH="cngxSortHeader" class="sort-btn">
          Name @if (nH.isActive()) {<span>{{ nH.isAsc() ? '↑' : '↓' }}</span>}
        </button>
      </ng-template>
      <ng-template cngxHeaderTpl="role">Role</ng-template>
      <ng-template cngxHeaderTpl="location">Location</ng-template>
      <ng-template cngxCellTpl="name" let-node>{{ node.value.name }}</ng-template>
      <ng-template cngxCellTpl="role" let-node>{{ node.value.role }}</ng-template>
      <ng-template cngxCellTpl="location" let-node>{{ node.value.location }}</ng-template>
      <ng-template cngxEmptyTpl>No results.</ng-template>
    </cngx-treetable>
  </div>`,
    },
  ],
};
