import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeController: Basic expand collapse',
  subtitle: 'Call <code>createTreeController({ nodes, nodeIdFn })</code> in an injection context. Bind <code>ctrl.visibleNodes()</code> to <code>@for</code> and call <code>ctrl.toggle(id)</code> from a twisty button.',
  description: 'Signal-native tree controller. Reads a <code>Signal&lt;CngxTreeNode&lt;T&gt;[]&gt;</code> source and produces flat / visible projections plus an expansion-set; every accessor is a <code>computed()</code> or pure fn, no <code>effect()</code>, no subscriptions. <code>nodeIdFn</code> is required on purpose: the controller hands its ids out to <code>isExpanded(id)</code>, selection memoization, and the AD-items adapter, so a non-stable id silently breaks every downstream cache the moment the tree is sorted or filtered. The library forces consumers to think about identity at construction so that whole class of heisenbugs disappears.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'createTreeController',
  ],
  moduleImports: [
    'import { createTreeController } from \'@cngx/common/interactive\';',
    'import type { CngxTreeNode } from \'@cngx/utils\';',
  ],
  imports: [],
  setup: `
  protected readonly nodes = signal<readonly CngxTreeNode<{ id: string; label: string }>[]>([
    {
      value: { id: 'root-a', label: 'Documents' },
      children: [
        { value: { id: 'a-1', label: 'Resume.pdf' } },
        {
          value: { id: 'a-2', label: 'Projects' },
          children: [
            { value: { id: 'a-2-1', label: 'cngx.md' } },
            { value: { id: 'a-2-2', label: 'README.md' } },
          ],
        },
      ],
    },
    {
      value: { id: 'root-b', label: 'Photos' },
      children: [
        { value: { id: 'b-1', label: 'beach.jpg' } },
        { value: { id: 'b-2', label: 'mountain.jpg' } },
      ],
    },
  ]);

  protected readonly ctrl = createTreeController<{ id: string; label: string }>({
    nodes: this.nodes,
    nodeIdFn: (v) => v.id,
    labelFn: (v) => v.label,
    initiallyExpanded: ['root-a'],
  });`,
  template: `
  <ul role="list" style="display:flex; flex-direction:column; gap:2px; max-width:24rem; list-style:none; padding:0; margin:0">
    @for (node of ctrl.visibleNodes(); track node.id) {
      <li
        [style.padding-inline-start.rem]="node.depth * 1.5"
        style="display:flex; align-items:center; gap:6px"
      >
        @if (node.hasChildren) {
          <button
            type="button"
            [attr.aria-label]="(ctrl.isExpanded(node.id)() ? 'Collapse ' : 'Expand ') + node.label"
            (click)="ctrl.toggle(node.id)"
          >{{ ctrl.isExpanded(node.id)() ? '▾' : '▸' }}</button>
        } @else {
          <span aria-hidden="true" style="display:inline-block; width:1.5em">·</span>
        }
        <span>{{ node.label }}</span>
      </li>
    }
  </ul>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="ctrl.expandAll()">Expand all</button>
    <button type="button" (click)="ctrl.collapseAll()">Collapse all</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">visibleNodes()</span>
      <span class="event-value">{{ ctrl.visibleNodes().length }} of {{ ctrl.flatNodes().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">expandedIds()</span>
      <span class="event-value">{{ expandedIdsLabel() }}</span>
    </div>
  </div>`,
  setupChrome: `
  protected readonly expandedIdsLabel = computed<string>(() => {
    const ids = [...this.ctrl.expandedIds()].sort();
    return ids.length === 0 ? '—' : ids.join(', ');
  });`,
};
