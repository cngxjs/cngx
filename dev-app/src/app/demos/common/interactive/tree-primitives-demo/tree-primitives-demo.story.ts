import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tree Primitives',
  navLabel: 'Tree (raw)',
  navCategory: 'interactive',
  description:
    'Raw building blocks for hierarchical UIs: CngxExpandable, createTreeController, CngxActiveDescendant + CngxHierarchicalNav, and cascade selection via SelectionController.childrenFn. No CngxTreeSelect.',
  apiComponents: [
    'CngxExpandable',
    'CngxTreeController',
    'CngxHierarchicalNav',
    'CngxActiveDescendant',
    'createTreeAdItems',
  ],
  overview:
    '<p>Four levels of composition, ending with a fully-keyboard-navigable treeview:</p>' +
    '<ol>' +
    '<li><strong>CngxExpandable</strong> — mirrors <code>aria-expanded</code> + <code>aria-controls</code> onto a host whose open state is driven externally. Pure atom.</li>' +
    '<li><strong>createTreeController</strong> — pure-derivation tree controller. Exposes <code>flatNodes</code> / <code>visibleNodes</code> / <code>expandedIds</code> signals + imperative expand/collapse.</li>' +
    '<li><strong>+ CngxActiveDescendant + CngxHierarchicalNav</strong> — adds W3C APG tree keyboard: ArrowUp/Down + typeahead via AD, ArrowLeft/Right expand/collapse + parent/child traversal via HierarchicalNav.</li>' +
    '<li><strong>+ SelectionController with childrenFn</strong> — cascade-toggle + indeterminate-parent propagation as pure computeds.</li>' +
    '</ol>' +
    '<p>Build your own tree UI from these four primitives when <code>CngxTreeSelect</code> is the wrong packaging — for example, a standalone checklist tree in a sidebar, a drag-and-drop org-chart editor, or a read-only audit view. Everything shown here is the exact same machinery <code>CngxTreeSelect</code> uses internally.</p>',
  moduleImports: [
    "import { CngxExpandable, createTreeController, CngxHierarchicalNav, createTreeAdItems, type CngxTreeController as TreeCtrl } from '@cngx/common/interactive';",
    "import { CngxActiveDescendant } from '@cngx/common/a11y';",
    "import { createSelectionController, type SelectionController } from '@cngx/core/utils';",
    "import { TestBed } from '@angular/core/testing';",
    "import type { CngxTreeNode, FlatTreeNode } from '@cngx/utils';",
    "interface Task { readonly id: string; readonly name: string; }",
  ],
  setup: `
  protected readonly projectTree: CngxTreeNode<Task>[] = [
    {
      value: { id: 'p', name: 'Project Alpha' },
      children: [
        {
          value: { id: 'p-design', name: 'Design' },
          children: [
            { value: { id: 'p-design-wires', name: 'Wireframes' } },
            { value: { id: 'p-design-visuals', name: 'Visual design' } },
          ],
        },
        {
          value: { id: 'p-dev', name: 'Development' },
          children: [
            { value: { id: 'p-dev-fe', name: 'Frontend' } },
            { value: { id: 'p-dev-be', name: 'Backend' } },
            { value: { id: 'p-dev-qa', name: 'QA' } },
          ],
        },
        { value: { id: 'p-launch', name: 'Launch' } },
      ],
    },
  ];

  // Section 1 — CngxExpandable standalone
  protected readonly singleExpanded = signal<boolean | undefined>(undefined);
  protected toggleSingleExpanded(): void {
    this.singleExpanded.update((v) => (v === true ? false : true));
  }

  // Section 2 — bare tree-controller, no keyboard, no selection
  protected readonly ctrlPlain: TreeCtrl<Task> = TestBed.runInInjectionContext(() =>
    createTreeController<Task>({
      nodes: signal(this.projectTree),
      nodeIdFn: (v) => v.id,
      labelFn: (v) => v.name,
      initiallyExpanded: ['p'],
    }),
  );

  // Section 3 — tree-controller + AD + HierarchicalNav keyboard
  protected readonly ctrlKbd: TreeCtrl<Task> = TestBed.runInInjectionContext(() =>
    createTreeController<Task>({
      nodes: signal(this.projectTree),
      nodeIdFn: (v) => v.id,
      labelFn: (v) => v.name,
      initiallyExpanded: 'all',
    }),
  );
  protected readonly kbdAdItems = TestBed.runInInjectionContext(() =>
    createTreeAdItems(this.ctrlKbd),
  );

  // Section 4 — cascade selection
  protected readonly ctrlSel: TreeCtrl<Task> = TestBed.runInInjectionContext(() =>
    createTreeController<Task>({
      nodes: signal(this.projectTree),
      nodeIdFn: (v) => v.id,
      labelFn: (v) => v.name,
      keyFn: (v) => v.id,
      initiallyExpanded: 'all',
    }),
  );
  protected readonly selValues = signal<Task[]>([
    { id: 'p-design-wires', name: 'Wireframes' },
  ]);
  protected readonly selection: SelectionController<Task> = TestBed.runInInjectionContext(
    () =>
      createSelectionController<Task>(this.selValues, {
        keyFn: (v) => v.id,
        childrenFn: (v) => this.ctrlSel.childrenOfValue(v),
      }),
  );
  protected readonly selAdItems = TestBed.runInInjectionContext(() =>
    createTreeAdItems(this.ctrlSel),
  );
  protected cascadeToggle(node: FlatTreeNode<Task>): void {
    const value = node.value;
    const wasSelected = this.selection.isSelected(value)();
    if (node.hasChildren) {
      // Parent toggle flips the parent + every descendant atomically.
      const all: Task[] = [value, ...this.ctrlSel.descendantsOfValue(value)];
      if (wasSelected) {
        for (const v of all) this.selection.deselect(v);
      } else {
        for (const v of all) this.selection.select(v);
      }
    } else {
      this.selection.toggle(value);
    }
  }
  protected handleSelActivate(event: Event, activeId: string | null): void {
    if (!activeId) return;
    event.preventDefault();
    const flat = this.ctrlSel.findById(activeId);
    if (flat && !flat.disabled) this.cascadeToggle(flat);
  }
  `,
  sections: [
    {
      title: 'CngxExpandable — passive expansion atom',
      subtitle:
        'Host-level <code>[attr.aria-expanded]</code> + <code>[attr.aria-controls]</code> mirror — ' +
        'no click/key handlers of its own. Consumer wires the interaction (button click here). ' +
        'Use this when a row is a selection target (not a toggle target) and expand/collapse ' +
        'lives on a separate affordance. For self-triggering FAQ/accordion use ' +
        '<code>CngxDisclosure</code>.',
      imports: ['CngxExpandable'],
      template: `
  <div
    cngxExpandable
    #e="cngxExpandable"
    [cngxExpandableOpen]="singleExpanded()"
    [controls]="'exp-panel-1'"
    style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border:1px solid #ddd;border-radius:0.25rem"
  >
    <button type="button" (click)="toggleSingleExpanded()" class="chip">
      {{ e.expanded() ? '▾' : '▸' }} Details
    </button>
    <span>Row label — click the twisty to toggle.</span>
  </div>
  <div
    id="exp-panel-1"
    [hidden]="!e.expanded()"
    style="margin-top:0.5rem;padding:0.75rem;background:#f5f5f5;border-radius:0.25rem"
  >
    Content panel — rendered when <code>expanded()</code> is true.
    <code>aria-expanded</code>/<code>aria-controls</code> are set on the row above.
  </div>`,
    },
    {
      title: 'createTreeController — flat projection + expansion state',
      subtitle:
        'Pure signal-native controller. <code>visibleNodes()</code> recomputes when ' +
        '<code>expandedIds</code> or the source tree changes; every expand/collapse is a ' +
        'single <code>Set</code> write. No keyboard / selection yet — just the data layer.',
      imports: [],
      template: `
  <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
    <button type="button" class="chip" (click)="ctrlPlain.expandAll()">Expand all</button>
    <button type="button" class="chip" (click)="ctrlPlain.collapseAll()">Collapse all</button>
  </div>
  <ul style="list-style:none;padding:0;margin:0;border:1px solid #ddd;border-radius:0.25rem">
    @for (node of ctrlPlain.visibleNodes(); track node.id) {
      <li
        [style.padding-inline-start.rem]="0.5 + node.depth * 1.5"
        style="display:flex;align-items:center;gap:0.5rem;padding-block:0.375rem;border-bottom:1px solid #f0f0f0"
      >
        @if (node.hasChildren) {
          <button type="button" class="chip"
                  style="inline-size:1.5rem;padding:0"
                  (click)="ctrlPlain.toggle(node.id)">
            {{ ctrlPlain.isExpanded(node.id)() ? '▾' : '▸' }}
          </button>
        } @else {
          <span style="inline-size:1.5rem"></span>
        }
        <span>{{ node.label }}</span>
        <span style="opacity:0.45;font-size:0.75rem">level {{ node.depth + 1 }}</span>
      </li>
    }
  </ul>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Flat count</span><span class="event-value">{{ ctrlPlain.flatNodes().length }}</span></div>
    <div class="event-row"><span class="event-label">Visible count</span><span class="event-value">{{ ctrlPlain.visibleNodes().length }}</span></div>
    <div class="event-row"><span class="event-label">Expanded ids</span><span class="event-value" style="font-family:monospace;font-size:0.75rem">{{ ctrlPlain.expandedIds().size }} of {{ ctrlPlain.flatNodes().length }}</span></div>
  </div>`,
    },
    {
      title: 'Full W3C treeview keyboard — AD + HierarchicalNav',
      subtitle:
        'Focus the list and use the arrows: <kbd>↑</kbd>/<kbd>↓</kbd> move through visible rows (via <code>CngxActiveDescendant</code>), ' +
        '<kbd>→</kbd> expands / moves to first child, <kbd>←</kbd> collapses / moves to parent (via ' +
        '<code>CngxHierarchicalNav</code>). <kbd>Home</kbd>/<kbd>End</kbd> jump to first/last visible row. ' +
        'Typing matches a row by label. Exactly the same wiring <code>CngxTreeSelect</code> uses.',
      imports: ['CngxActiveDescendant', 'CngxHierarchicalNav'],
      template: `
  <div
    role="tree"
    cngxActiveDescendant
    #ad="cngxActiveDescendant"
    [items]="kbdAdItems()"
    [autoHighlightFirst]="true"
    [cngxHierarchicalNav]="ctrlKbd"
    tabindex="0"
    style="border:1px solid #ddd;border-radius:0.25rem;padding:0.25rem;outline:none"
    [style.box-shadow]="'0 0 0 2px transparent'"
    (focus)="$any($event.currentTarget).style.boxShadow = '0 0 0 2px rgb(25 118 210 / 0.4)'"
    (blur)="$any($event.currentTarget).style.boxShadow = '0 0 0 2px transparent'"
  >
    @for (node of ctrlKbd.visibleNodes(); track node.id) {
      <div
        role="treeitem"
        [attr.id]="node.id"
        [attr.aria-level]="node.depth + 1"
        [attr.aria-posinset]="node.posinset"
        [attr.aria-setsize]="node.setsize"
        [attr.aria-expanded]="node.hasChildren ? ctrlKbd.isExpanded(node.id)() : null"
        [style.padding-inline-start.rem]="0.5 + node.depth * 1.5"
        [style.background]="ad.activeId() === node.id ? 'rgb(25 118 210 / 0.1)' : 'transparent'"
        style="display:flex;align-items:center;gap:0.5rem;min-height:1.75rem;cursor:pointer"
      >
        @if (node.hasChildren) {
          <span aria-hidden="true" style="inline-size:1rem;display:inline-flex;justify-content:center">
            {{ ctrlKbd.isExpanded(node.id)() ? '▾' : '▸' }}
          </span>
        } @else {
          <span aria-hidden="true" style="inline-size:1rem"></span>
        }
        <span>{{ node.label }}</span>
      </div>
    }
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active</span><span class="event-value">{{ ad.activeId() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Expanded</span><span class="event-value">{{ ctrlKbd.expandedIds().size }} branches open</span></div>
  </div>`,
    },
    {
      title: 'Cascade selection — SelectionController + childrenFn',
      subtitle:
        'Feed <code>treeController.childrenOfValue</code> to <code>createSelectionController</code>\'s ' +
        '<code>childrenFn</code> and indeterminate-parent propagation is free. Toggling a parent in the ' +
        'handler below iterates <code>descendantsOfValue</code> to flip the whole subtree. Selected rows ' +
        'carry <code>aria-selected</code>; partially-selected parents render a <code>◐</code> indicator.',
      imports: ['CngxActiveDescendant', 'CngxHierarchicalNav'],
      template: `
  <div
    role="tree"
    aria-multiselectable="true"
    cngxActiveDescendant
    #adSel="cngxActiveDescendant"
    [items]="selAdItems()"
    [autoHighlightFirst]="true"
    [cngxHierarchicalNav]="ctrlSel"
    tabindex="0"
    (keydown.enter)="handleSelActivate($event, adSel.activeId())"
    (keydown.space)="handleSelActivate($event, adSel.activeId())"
    style="border:1px solid #ddd;border-radius:0.25rem;padding:0.25rem;outline:none"
    (focus)="$any($event.currentTarget).style.boxShadow = '0 0 0 2px rgb(25 118 210 / 0.4)'"
    (blur)="$any($event.currentTarget).style.boxShadow = '0 0 0 2px transparent'"
  >
    @for (node of ctrlSel.visibleNodes(); track node.id) {
      @let isSel = selection.isSelected(node.value)();
      @let isInd = selection.isIndeterminate(node.value)();
      <div
        role="treeitem"
        [attr.id]="node.id"
        [attr.aria-level]="node.depth + 1"
        [attr.aria-posinset]="node.posinset"
        [attr.aria-setsize]="node.setsize"
        [attr.aria-expanded]="node.hasChildren ? ctrlSel.isExpanded(node.id)() : null"
        [attr.aria-selected]="isSel"
        [style.padding-inline-start.rem]="0.5 + node.depth * 1.5"
        [style.background]="adSel.activeId() === node.id ? 'rgb(25 118 210 / 0.1)' : (isSel ? 'rgb(46 125 50 / 0.08)' : 'transparent')"
        style="display:flex;align-items:center;gap:0.5rem;min-height:1.75rem;cursor:pointer"
        (click)="cascadeToggle(node)"
      >
        @if (node.hasChildren) {
          <button type="button" tabindex="-1"
                  (click)="$event.stopPropagation(); ctrlSel.toggle(node.id)"
                  style="border:0;background:transparent;cursor:pointer;inline-size:1rem">
            {{ ctrlSel.isExpanded(node.id)() ? '▾' : '▸' }}
          </button>
        } @else {
          <span aria-hidden="true" style="inline-size:1rem"></span>
        }
        <span aria-hidden="true"
              [style.color]="isInd ? '#ef6c00' : isSel ? '#2e7d32' : '#9e9e9e'">
          {{ isSel ? '●' : (isInd ? '◐' : '○') }}
        </span>
        <span>{{ node.label }}</span>
      </div>
    }
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">
        @for (t of selValues(); track t.id; let last = $last) {
          {{ t.name }}{{ last ? '' : ', ' }}
        }
        @if (!selValues().length) { — }
      </span>
    </div>
    <div class="event-row">
      <span class="event-label">Count</span>
      <span class="event-value">{{ selValues().length }} / {{ ctrlSel.flatNodes().length }}</span>
    </div>
    <div class="event-row" style="gap:8px">
      <button type="button" class="chip" (click)="selection.clear()">Clear</button>
    </div>
  </div>`,
    },
  ],
};
