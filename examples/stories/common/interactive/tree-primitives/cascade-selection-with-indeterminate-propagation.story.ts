import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Cascade selection with indeterminate propagation',
  subtitle:
    'A checkbox <code>role="tree"</code> where each node\'s tri-state is <em>derived</em>, never stored: a parent is full (<code>●</code>) when every leaf under it is picked, indeterminate (<code>◐</code>) when only some are, empty (<code>○</code>) otherwise. One <code>selected</code> set is the single source; the per-node states are a <code>computed()</code> map and <code>aria-checked</code> reads the same derivation. Clicking a node cascades the toggle to its whole subtree. Keyboard nav (ArrowUp / ArrowDown / Home / End, ArrowRight / ArrowLeft to expand / collapse and traverse) composes <code>CngxActiveDescendant</code> + <code>[cngxHierarchicalNav]</code>, so the tree carries correct per-level <code>aria-posinset</code> / <code>aria-setsize</code> / <code>aria-expanded</code>.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Tree View',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/',
    },
  ],
  moduleImports: [
    "import { createTreeController, createTreeAdItems, CngxHierarchicalNav } from '@cngx/common/interactive';",
    "import { CngxActiveDescendant } from '@cngx/common/a11y';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: ['CngxHierarchicalNav', 'CngxActiveDescendant'],
  setup: `protected readonly treeData = signal<readonly CngxTreeNode<{ id: string; name: string }>[]>([
    {
      value: { id: 'alpha', name: 'Project Alpha' },
      children: [
        {
          value: { id: 'design', name: 'Design' },
          children: [
            { value: { id: 'wireframes', name: 'Wireframes' } },
            { value: { id: 'visual', name: 'Visual design' } },
          ],
        },
        {
          value: { id: 'engineering', name: 'Engineering' },
          children: [
            { value: { id: 'api', name: 'API' } },
            { value: { id: 'database', name: 'Database' } },
          ],
        },
      ],
    },
  ]);
  protected readonly leavesById = this.buildLeaves(this.treeData());
  protected readonly selected = signal<ReadonlySet<string>>(new Set(['wireframes']));

  protected readonly ctrl = createTreeController<{ id: string; name: string }>({
    nodes: this.treeData,
    nodeIdFn: (v) => v.id,
    labelFn: (v) => v.name,
    initiallyExpanded: ['alpha', 'design', 'engineering'],
  });
  protected readonly adItems = createTreeAdItems(this.ctrl);

  protected readonly states = computed<ReadonlyMap<string, 'full' | 'mixed' | 'empty'>>(
    () => {
      const sel = this.selected();
      const map = new Map<string, 'full' | 'mixed' | 'empty'>();
      for (const [id, leaves] of this.leavesById) {
        const hit = leaves.filter((leaf) => sel.has(leaf)).length;
        map.set(id, hit === 0 ? 'empty' : hit === leaves.length ? 'full' : 'mixed');
      }
      return map;
    },
    { equal: (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v) },
  );
  protected readonly fullCount = computed(() => {
    let count = 0;
    for (const state of this.states().values()) {
      if (state === 'full') {
        count++;
      }
    }
    return count;
  });

  protected buildLeaves(
    nodes: readonly CngxTreeNode<{ id: string; name: string }>[],
  ): ReadonlyMap<string, readonly string[]> {
    const map = new Map<string, readonly string[]>();
    const walk = (node: CngxTreeNode<{ id: string; name: string }>): readonly string[] => {
      const children = node.children ?? [];
      if (children.length === 0) {
        map.set(node.value.id, [node.value.id]);
        return [node.value.id];
      }
      const leaves = children.flatMap((child) => walk(child));
      map.set(node.value.id, leaves);
      return leaves;
    };
    for (const node of nodes) {
      walk(node);
    }
    return map;
  }
  protected glyphFor(state: 'full' | 'mixed' | 'empty'): string {
    return state === 'full' ? '●' : state === 'mixed' ? '◐' : '○';
  }
  protected ariaCheckedFor(state: 'full' | 'mixed' | 'empty'): 'true' | 'false' | 'mixed' {
    return state === 'full' ? 'true' : state === 'mixed' ? 'mixed' : 'false';
  }
  protected toggleCascade(id: string): void {
    const leaves = this.leavesById.get(id) ?? [];
    const sel = new Set(this.selected());
    const isFull = leaves.every((leaf) => sel.has(leaf));
    for (const leaf of leaves) {
      if (isFull) {
        sel.delete(leaf);
      } else {
        sel.add(leaf);
      }
    }
    this.selected.set(sel);
  }`,
  template: `  <ul
    role="tree"
    aria-label="Project scope"
    cngxActiveDescendant
    [items]="adItems()"
    [cngxHierarchicalNav]="ctrl"
    tabindex="0"
    #ad="cngxActiveDescendant"
    style="display:flex;flex-direction:column;gap:2px;list-style:none;padding:0;margin:0;max-width:24rem"
  >
    @for (node of ctrl.visibleNodes(); track node.id) {
      @let state = states().get(node.id) ?? 'empty';
      <li
        role="treeitem"
        [id]="node.id"
        [attr.aria-level]="node.depth + 1"
        [attr.aria-posinset]="node.posinset"
        [attr.aria-setsize]="node.setsize"
        [attr.aria-expanded]="node.hasChildren ? ctrl.isExpanded(node.id)() : null"
        [attr.aria-checked]="ariaCheckedFor(state)"
        [style.padding-inline-start.rem]="node.depth * 1.5"
        style="display:flex;align-items:center;gap:6px;cursor:pointer"
        (click)="toggleCascade(node.id)"
      >
        <span aria-hidden="true">{{ glyphFor(state) }}</span>
        <span aria-hidden="true" style="display:inline-block;width:1ch">
          @if (node.hasChildren) {
            {{ ctrl.isExpanded(node.id)() ? '▾' : '▸' }}
          }
        </span>
        <span>{{ node.label }}</span>
      </li>
    }
  </ul>`,
  templateChromeBefore: `<p style="margin-bottom:12px">Click a node to cascade-select its subtree. Tab into the tree, then <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> move the cursor, <kbd>ArrowRight</kbd> / <kbd>ArrowLeft</kbd> expand / collapse.</p>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ fullCount() }} / {{ leavesById.size }}</span></div>
    <div class="event-row"><span class="event-label">Cursor</span><span class="event-value">{{ ad.activeId() ?? '-' }}</span></div>
  </div>`,
};
