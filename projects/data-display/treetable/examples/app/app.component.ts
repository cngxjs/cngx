import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  CngxCellTpl,
  CngxEmptyTpl,
  CngxHeaderTpl,
  CngxTreetable,
  filterTree,
  nodeMatchesSearch,
  sortTree,
  type Node,
  type TreetableOptions,
} from '@cngx/data-display/treetable';

// Re-export forces compodocx to ship app.config.ts in the StackBlitz manifest.
export { appConfig } from './app.config';

interface ProjectNode {
  code: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  priority: 'low' | 'medium' | 'high';
  hours: number;
}

type SortField = 'name' | 'hours' | 'code';
type SortDirection = 'asc' | 'desc';
type SelectionMode = 'none' | 'single' | 'multi';

const PROJECT_TREE: Node<ProjectNode>[] = [
  {
    value: { code: 'PROJ-100', name: 'Mobile rewrite', status: 'active', priority: 'high', hours: 240 },
    children: [
      { value: { code: 'PROJ-100-1', name: 'Auth flow', status: 'active', priority: 'high', hours: 80 } },
      {
        value: { code: 'PROJ-100-2', name: 'Profile screen', status: 'paused', priority: 'medium', hours: 64 },
        children: [
          { value: { code: 'PROJ-100-2-1', name: 'Avatar upload', status: 'paused', priority: 'low', hours: 16 } },
        ],
      },
    ],
  },
  {
    value: { code: 'PROJ-200', name: 'API gateway', status: 'active', priority: 'medium', hours: 160 },
    children: [
      { value: { code: 'PROJ-200-1', name: 'Rate limiter', status: 'archived', priority: 'low', hours: 24 } },
      { value: { code: 'PROJ-200-2', name: 'Auth middleware', status: 'active', priority: 'high', hours: 56 } },
    ],
  },
  {
    value: { code: 'PROJ-300', name: 'Reporting v2', status: 'paused', priority: 'low', hours: 48 },
    children: [
      { value: { code: 'PROJ-300-1', name: 'PDF templates', status: 'paused', priority: 'low', hours: 16 } },
    ],
  },
];

interface ActivityEntry {
  readonly kind: string;
  readonly detail: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxTreetable, CngxCellTpl, CngxHeaderTpl, CngxEmptyTpl],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly search = signal('');
  protected readonly sortField = signal<SortField>('name');
  protected readonly sortDir = signal<SortDirection>('asc');
  protected readonly selectionMode = signal<SelectionMode>('multi');

  protected readonly expandedIds = signal<ReadonlySet<string>>(
    new Set(['PROJ-100', 'PROJ-200', 'PROJ-300']),
  );
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly events = signal<readonly ActivityEntry[]>([]);

  protected readonly nodeId = (value: ProjectNode): string => value.code;

  protected readonly options: TreetableOptions<ProjectNode> = {
    customColumnOrder: ['name', 'status', 'priority', 'hours'],
    highlightRowOnHover: true,
  };

  protected readonly filteredAndSorted = computed<Node<ProjectNode>[]>(() => {
    const term = this.search().trim();
    const filtered = term
      ? filterTree(PROJECT_TREE, (value) => nodeMatchesSearch(value, term))
      : PROJECT_TREE;
    return sortTree(filtered, this.sortField(), this.sortDir());
  });

  protected readonly allIds = computed<ReadonlySet<string>>(() => {
    const ids = new Set<string>();
    const visit = (nodes: Node<ProjectNode>[]): void => {
      for (const node of nodes) {
        ids.add(node.value.code);
        if (node.children) visit(node.children);
      }
    };
    visit(PROJECT_TREE);
    return ids;
  });

  protected readonly rootIds = computed<ReadonlySet<string>>(
    () => new Set(PROJECT_TREE.map((n) => n.value.code)),
  );

  protected log(kind: string, detail: string): void {
    this.events.update((entries) => [{ kind, detail }, ...entries].slice(0, 8));
  }

  protected asValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected asSortField(value: string): SortField {
    return value as SortField;
  }

  protected asSortDir(value: string): SortDirection {
    return value as SortDirection;
  }

  protected asSelectionMode(value: string): SelectionMode {
    return value as SelectionMode;
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }
}
