import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Cascade selection with indeterminate propagation',
  subtitle:
    'A multi-select <code>role="tree"</code> where each node\'s state is <em>derived</em>, never stored: a parent is full (<code>●</code>) when every leaf under it is picked, indeterminate (<code>◐</code>) when only some are, empty (<code>○</code>) otherwise. Clicking a parent cascades the toggle to its whole subtree; the mixed state propagates up the ancestors as a pure <code>computed()</code>. <code>aria-checked</code> tracks the same derivation - <code>true</code> / <code>mixed</code> / <code>false</code>.',
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
  setup: `protected readonly nodes: readonly { id: string; name: string; level: number; leafIds: readonly string[] }[] = [
    { id: 'alpha', name: 'Project Alpha', level: 1, leafIds: ['wireframes', 'visual', 'api', 'database'] },
    { id: 'design', name: 'Design', level: 2, leafIds: ['wireframes', 'visual'] },
    { id: 'wireframes', name: 'Wireframes', level: 3, leafIds: ['wireframes'] },
    { id: 'visual', name: 'Visual design', level: 3, leafIds: ['visual'] },
    { id: 'engineering', name: 'Engineering', level: 2, leafIds: ['api', 'database'] },
    { id: 'api', name: 'API', level: 3, leafIds: ['api'] },
    { id: 'database', name: 'Database', level: 3, leafIds: ['database'] },
  ];
  protected readonly selected = signal<ReadonlySet<string>>(new Set(['wireframes']));
  protected state(node: { leafIds: readonly string[] }): 'full' | 'mixed' | 'empty' {
    const sel = this.selected();
    const hit = node.leafIds.filter((id) => sel.has(id)).length;
    if (hit === 0) {
      return 'empty';
    }
    return hit === node.leafIds.length ? 'full' : 'mixed';
  }
  protected glyph(node: { leafIds: readonly string[] }): string {
    const s = this.state(node);
    return s === 'full' ? '●' : s === 'mixed' ? '◐' : '○';
  }
  protected ariaChecked(node: { leafIds: readonly string[] }): 'true' | 'false' | 'mixed' {
    const s = this.state(node);
    return s === 'full' ? 'true' : s === 'mixed' ? 'mixed' : 'false';
  }
  protected toggle(node: { leafIds: readonly string[] }): void {
    const sel = new Set(this.selected());
    const isFull = node.leafIds.every((id) => sel.has(id));
    for (const id of node.leafIds) {
      if (isFull) {
        sel.delete(id);
      } else {
        sel.add(id);
      }
    }
    this.selected.set(sel);
  }
  protected readonly fullCount = computed(() => this.nodes.filter((n) => this.state(n) === 'full').length);`,
  template: `  <div role="tree" aria-multiselectable="true" aria-label="Project scope"
       style="display:flex;flex-direction:column;gap:2px">
    @for (node of nodes; track node.id; let i = $index) {
      <div role="treeitem"
           [attr.aria-level]="node.level"
           [attr.aria-setsize]="nodes.length"
           [attr.aria-posinset]="i + 1"
           [attr.aria-checked]="ariaChecked(node)"
           tabindex="0"
           class="chip"
           style="justify-content:flex-start;gap:8px;cursor:pointer"
           [style.margin-inline-start.px]="(node.level - 1) * 20"
           (click)="toggle(node)"
           (keydown.enter)="toggle(node); $event.preventDefault()"
           (keydown.space)="toggle(node); $event.preventDefault()">
        <span aria-hidden="true">{{ glyph(node) }}</span>
        <span>{{ node.name }}</span>
      </div>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ fullCount() }} / {{ nodes.length }}</span></div>
  </div>`,
};
