import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  CngxTreetable,
  CngxMaterialTreetable,
  CngxCellTpl,
  CngxHeaderTpl,
  CngxEmptyTpl,
  filterTree,
  sortTree,
  nodeMatchesSearch,
} from '@cngx/data-display/treetable';
import type { FlatNode, Node } from '@cngx/data-display/treetable';
import { CngxSort, CngxSortHeader, CngxSearch } from '@cngx/common';
import { ExampleCardComponent } from '../../../shared/example-card.component';
import { PlaygroundComponent } from '../../../shared/playground.component';
import { Playground } from '../../../shared/playground';

interface Employee {
  name: string;
  role: string;
  location: string;
}

const ORG_TREE: Node<Employee> = {
  value: { name: 'Sarah Chen', role: 'CEO', location: 'San Francisco' },
  children: [
    {
      value: { name: 'Marcus Vogel', role: 'CTO', location: 'Berlin' },
      children: [
        {
          value: { name: 'Lena Kovač', role: 'Engineering Lead', location: 'Berlin' },
          children: [
            { value: { name: 'Tom Fischer', role: 'Senior Dev', location: 'Berlin' } },
            { value: { name: 'Priya Nair', role: 'Senior Dev', location: 'Remote' } },
          ],
        },
        { value: { name: 'Diego Ruiz', role: 'DevOps Lead', location: 'Madrid' } },
      ],
    },
    {
      value: { name: 'Aisha Okonkwo', role: 'CFO', location: 'London' },
      children: [
        { value: { name: 'James Park', role: 'Controller', location: 'London' } },
        { value: { name: 'Nina Braun', role: 'Finance Analyst', location: 'Vienna' } },
      ],
    },
    {
      value: { name: 'Rafael Costa', role: 'CMO', location: 'São Paulo' },
      children: [{ value: { name: 'Yuki Tanaka', role: 'Brand Lead', location: 'Tokyo' } }],
    },
  ],
};

@Component({
  selector: 'app-treetable-demo',
  standalone: true,
  imports: [
    CngxTreetable,
    CngxMaterialTreetable,
    CngxCellTpl,
    CngxHeaderTpl,
    CngxEmptyTpl,
    CngxSort,
    CngxSortHeader,
    CngxSearch,
    ExampleCardComponent,
    PlaygroundComponent,
  ],
  templateUrl: './treetable-demo.component.html',
  styleUrl: './treetable-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreetableDemoComponent {
  protected readonly tree = signal<Node<Employee>>(ORG_TREE);

  // ── Playground ───────────────────────────────────────────────────────────
  protected readonly pgSelectionMode = Playground.select<'none' | 'single' | 'multi'>(
    'selectionMode',
    [
      { label: 'none', value: 'none' },
      { label: 'single', value: 'single' },
      { label: 'multi', value: 'multi' },
    ],
    'none',
    { description: 'Controls row selection behaviour.' },
  );
  protected readonly pgShowCheckboxes = Playground.bool('showCheckboxes', false, {
    description: 'Renders the _select column.',
  });
  protected readonly pgHighlightOnHover = Playground.bool('highlightRowOnHover', true, {
    description: 'Passed via [options] input.',
  });
  protected readonly pgCapitaliseHeader = Playground.bool('capitaliseHeader', true, {
    description: 'Uppercases header labels.',
  });
  protected readonly playground = new Playground([
    this.pgSelectionMode,
    this.pgShowCheckboxes,
    this.pgHighlightOnHover,
    this.pgCapitaliseHeader,
  ]);

  // ── Basic ────────────────────────────────────────────────────────────────
  protected readonly lastClickedCdk = signal<FlatNode<Employee> | null>(null);
  protected readonly lastClickedMat = signal<FlatNode<Employee> | null>(null);

  // ── Single selection (click-to-select, no checkboxes) ───────────────────
  protected readonly singleSelected = signal<readonly string[]>([]);

  // ── Multi selection (click-to-select, no checkboxes) ────────────────────
  protected readonly multiSelected = signal<readonly string[]>([]);

  // ── Single + checkboxes ──────────────────────────────────────────────────
  protected readonly singleCheckboxSelected = signal<readonly string[]>([]);

  // ── Multi + checkboxes ───────────────────────────────────────────────────
  protected readonly multiCheckboxSelected = signal<readonly string[]>([]);

  // ── Controlled selection (two-way binding via selectedIds) ───────────────
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

  // ── Controlled expand (two-way binding via expandedIds) ──────────────────
  // Pre-expand root only
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

  // ── Search / filterTree + nodeMatchesSearch ──────────────────────────────
  protected readonly searchTerm = signal('');

  protected readonly searchFilteredTree = computed((): Node<Employee>[] => {
    const term = this.searchTerm();
    if (!term) return [ORG_TREE];
    return filterTree([ORG_TREE], (v) => nodeMatchesSearch(v, term));
  });

  // ── Sort / sortTree + CngxSort + CngxSortHeader ──────────────────────────
  protected readonly activeSortState = signal<{ active: string; direction: 'asc' | 'desc' } | null>(
    null,
  );

  protected readonly sortedTree = computed((): Node<Employee>[] => {
    const state = this.activeSortState();
    if (!state) return [ORG_TREE];
    return sortTree([ORG_TREE], state.active, state.direction);
  });

  // ── Combined: sort + search ───────────────────────────────────────────────
  protected readonly combinedSearchTerm = signal('');
  protected readonly combinedSortState = signal<{
    active: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  protected readonly combinedTree = computed((): Node<Employee>[] => {
    let nodes: Node<Employee>[] = [ORG_TREE];
    const term = this.combinedSearchTerm();
    if (term) nodes = filterTree(nodes, (v) => nodeMatchesSearch(v, term));
    const sort = this.combinedSortState();
    if (sort) nodes = sortTree(nodes, sort.active, sort.direction);
    return nodes;
  });
}
