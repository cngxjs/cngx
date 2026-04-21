import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tree Select',
  navLabel: 'Tree Select',
  navCategory: 'field',
  description:
    'CngxTreeSelect — hierarchical multi-value picker with W3C APG treeview ARIA, cascade-children opt-in, and indeterminate-parent propagation.',
  apiComponents: ['CngxTreeSelect', 'CngxTreeSelectNode'],
  overview:
    '<p><code>&lt;cngx-tree-select&gt;</code> composes <code>CngxTreeController</code> + ' +
    '<code>SelectionController</code> (with <code>childrenFn</code>) + <code>CngxPopover</code> + ' +
    '<code>CngxTreeSelectPanel</code> (which itself hosts <code>CngxActiveDescendant</code> + ' +
    '<code>CngxHierarchicalNav</code>) into a multi-value tree picker. Provides ' +
    '<code>CNGX_FORM_FIELD_CONTROL</code> directly.</p>' +
    '<p><strong>Selection</strong>: default mode toggles single values. With ' +
    '<code>[cascadeChildren]="true"</code>, a parent toggle selects/deselects every descendant ' +
    'atomically and emits a single <code>selectionChange</code> with ' +
    '<code>action: \'cascade-toggle\'</code>. Indeterminate-parent state propagates automatically ' +
    'through the selection controller\'s <code>childrenFn</code> — no manual sync.</p>' +
    '<p><strong>Keyboard</strong>: ArrowUp/Down + Home/End + typeahead via ' +
    '<code>CngxActiveDescendant</code>; ArrowRight expands / moves to first child, ArrowLeft ' +
    'collapses / moves to parent via <code>CngxHierarchicalNav</code>; Enter / Space activate ' +
    'the highlighted row.</p>' +
    '<p><strong>ARIA</strong>: reactive <code>role="tree"</code> + per-row <code>role="treeitem"</code> ' +
    'with <code>aria-level</code> / <code>-posinset</code> / <code>-setsize</code> / ' +
    '<code>-expanded</code> / <code>-selected</code> / <code>-disabled</code> all wired to the ' +
    'reactive graph.</p>',
  moduleImports: [
    "import { CngxTreeSelect, CngxTreeSelectNode, type CngxTreeNode } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
    "import { ORG_TREE, type Employee } from '../../../fixtures/employees-tree.fixture';",
  ],
  setup: `
  /**
   * Domain data shaped as \`CngxTreeNode<Employee>\`. The fixture's
   * legacy \`Node<T>\` type from \`@cngx/data-display/treetable\`
   * is structurally identical — a runtime-free cast keeps the
   * demo free of adapter layers.
   */
  protected readonly orgTree: CngxTreeNode<Employee>[] = [ORG_TREE as CngxTreeNode<Employee>];

  protected readonly orgIdFn = (v: Employee): string => v.name;
  protected readonly orgLabelFn = (v: Employee): string =>
    v.name + ' — ' + v.role;
  protected readonly orgKeyFn = (v: Employee): unknown => v.name;

  // Basic
  protected readonly basicValues = signal<Employee[]>([]);

  // Cascade
  protected readonly cascadeValues = signal<Employee[]>([]);
  protected readonly cascadeOn = signal(true);

  // Indeterminate demo (pre-seeded with a partial subtree)
  protected readonly indeterminateValues = signal<Employee[]>([
    { name: 'Tom Fischer', role: 'Senior Dev', location: 'Berlin' },
  ]);

  // Custom slot
  protected readonly customSlotValues = signal<Employee[]>([]);

  // Commit-action
  protected readonly commitValues = signal<Employee[]>([]);
  protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitAction = (intended: Employee[] | undefined) => {
    const ts = new Date().toLocaleTimeString();
    const names = (intended ?? []).map((e) => e.name).join(', ');
    this.commitLog.update((l) => [...l.slice(-4), ts + ' → [' + names + ']']);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(600));
    }
    return of(intended).pipe(delay(600));
  };

  // Perf: 10k synthetic nodes (10 × 10 × 100)
  protected readonly perfTree: CngxTreeNode<{ id: string; label: string }>[] = (() => {
    const tree: CngxTreeNode<{ id: string; label: string }>[] = [];
    for (let a = 0; a < 10; a++) {
      const aChildren: CngxTreeNode<{ id: string; label: string }>[] = [];
      for (let b = 0; b < 10; b++) {
        const bChildren: CngxTreeNode<{ id: string; label: string }>[] = [];
        for (let c = 0; c < 100; c++) {
          bChildren.push({
            value: { id: a + '.' + b + '.' + c, label: 'Leaf ' + a + '.' + b + '.' + c },
          });
        }
        aChildren.push({
          value: { id: a + '.' + b, label: 'Branch ' + a + '.' + b },
          children: bChildren,
        });
      }
      tree.push({
        value: { id: String(a), label: 'Root ' + a },
        children: aChildren,
      });
    }
    return tree;
  })();
  protected readonly perfIdFn = (v: { id: string }): string => v.id;
  protected readonly perfLabelFn = (v: { label: string }): string => v.label;
  protected readonly perfKeyFn = (v: { id: string }): unknown => v.id;
  protected readonly perfValues = signal<{ id: string; label: string }[]>([]);
  `,
  sections: [
    {
      title: 'Basic — single-level toggle',
      subtitle:
        'Cascade off by default: each click toggles the individual row. Parents still receive ' +
        '<code>aria-indeterminate</code> via the selection controller\'s <code>childrenFn</code> — ' +
        'flip a leaf and watch the branch indicator change.',
      imports: ['CngxTreeSelect'],
      template: `
  <cngx-tree-select
    [nodes]="orgTree"
    [nodeIdFn]="orgIdFn"
    [labelFn]="orgLabelFn"
    [keyFn]="orgKeyFn"
    [initiallyExpanded]="'all'"
    [(values)]="basicValues"
    [clearable]="true"
    placeholder="Personen wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Count</span>
      <span class="event-value">{{ basicValues().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Names</span>
      <span class="event-value">{{ basicValues().length ? '' : '—' }}
        @for (e of basicValues(); track e.name; let last = $last) {
          {{ e.name }}{{ last ? '' : ', ' }}
        }
      </span>
    </div>
  </div>`,
    },
    {
      title: 'Cascade children — parent toggle selects the whole subtree',
      subtitle:
        '<code>[cascadeChildren]="true"</code> flips every descendant atomically on a single ' +
        '<code>selectionChange</code> event with <code>action: \'cascade-toggle\'</code>. The ' +
        'chip × button still removes a single value (no hidden mass-deselect from the chip strip).',
      imports: ['CngxTreeSelect'],
      template: `
  <label style="display:inline-flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
    <input type="checkbox" [checked]="cascadeOn()"
           (change)="cascadeOn.set($any($event.target).checked)" />
    cascadeChildren
  </label>
  <cngx-tree-select
    [nodes]="orgTree"
    [nodeIdFn]="orgIdFn"
    [labelFn]="orgLabelFn"
    [keyFn]="orgKeyFn"
    [initiallyExpanded]="'all'"
    [cascadeChildren]="cascadeOn()"
    [(values)]="cascadeValues"
    [clearable]="true"
    placeholder="Personen wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Count</span>
      <span class="event-value">{{ cascadeValues().length }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Indeterminate propagation (pre-seeded partial selection)',
      subtitle:
        'The selection controller\'s <code>childrenFn</code> is wired to ' +
        '<code>treeController.childrenOfValue</code> — any partial descendant selection surfaces ' +
        'as <code>aria-indeterminate</code> on the parent row with zero manual wiring. Open the ' +
        'panel to see <em>Lena Kovač</em> and <em>Marcus Vogel</em> show the half-state indicator.',
      imports: ['CngxTreeSelect'],
      template: `
  <cngx-tree-select
    [nodes]="orgTree"
    [nodeIdFn]="orgIdFn"
    [labelFn]="orgLabelFn"
    [keyFn]="orgKeyFn"
    [initiallyExpanded]="'all'"
    [(values)]="indeterminateValues"
    placeholder="Personen wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">
        @for (e of indeterminateValues(); track e.name; let last = $last) {
          {{ e.name }}{{ last ? '' : ', ' }}
        }
      </span>
    </div>
  </div>`,
    },
    {
      title: 'Custom *cngxTreeSelectNode template',
      subtitle:
        'Project a <code>*cngxTreeSelectNode</code> template to swap the default row markup. ' +
        'The context delivers the full <code>FlatTreeNode</code>, all reactive flags, and two ' +
        'pre-bound callbacks: <code>toggleExpand()</code> routes through the controller, ' +
        '<code>handleSelect()</code> routes through the cascade + commit flow.',
      imports: ['CngxTreeSelect', 'CngxTreeSelectNode'],
      template: `
  <cngx-tree-select
    [nodes]="orgTree"
    [nodeIdFn]="orgIdFn"
    [labelFn]="orgLabelFn"
    [keyFn]="orgKeyFn"
    [initiallyExpanded]="'all'"
    [(values)]="customSlotValues"
    [clearable]="true"
    placeholder="Personen wählen…"
  >
    <ng-template
      cngxTreeSelectNode
      let-node
      let-selected="selected"
      let-indeterminate="indeterminate"
      let-expanded="expanded"
      let-hasChildren="hasChildren"
      let-toggleExpand="toggleExpand"
      let-handleSelect="handleSelect"
    >
      <div
        role="treeitem"
        [attr.aria-level]="node.depth + 1"
        [attr.aria-posinset]="node.posinset"
        [attr.aria-setsize]="node.setsize"
        [attr.aria-expanded]="hasChildren ? expanded : null"
        [attr.aria-selected]="selected"
        [style.padding-inline-start.rem]="0.5 + node.depth * 1.25"
        [style.display]="'flex'"
        [style.align-items]="'center'"
        [style.gap]="'0.5rem'"
        [style.min-height]="'2rem'"
        [style.cursor]="'pointer'"
        (click)="handleSelect()"
      >
        @if (hasChildren) {
          <button type="button" tabindex="-1"
                  (click)="$event.stopPropagation(); toggleExpand()"
                  style="border:0;background:transparent;cursor:pointer">
            {{ expanded ? '▾' : '▸' }}
          </button>
        } @else {
          <span style="inline-size:1.25rem"></span>
        }
        <span [style.font-weight]="selected ? 600 : 400"
              [style.color]="indeterminate ? '#ef6c00' : selected ? '#2e7d32' : 'inherit'">
          @if (selected) { ● }
          @else if (indeterminate) { ◐ }
          @else { ○ }
        </span>
        <span style="flex:1">
          <strong>{{ node.value.name }}</strong>
          <span style="opacity:0.6; margin-inline-start:0.5rem">{{ node.value.role }}</span>
        </span>
        <span style="opacity:0.5; font-size:0.75rem">{{ node.value.location }}</span>
      </div>
    </ng-template>
  </cngx-tree-select>`,
    },
    {
      title: 'Commit action (optimistic / pessimistic + rollback)',
      subtitle:
        '<code>[commitAction]</code> turns every toggle into an async write. ' +
        '<code>optimistic</code> updates <code>values()</code> immediately and rolls back if the ' +
        'action rejects; <code>pessimistic</code> defers the visible change until the write ' +
        'resolves. Supersede semantics — a second toggle while the first is in-flight cancels ' +
        'the first\'s outcome callbacks.',
      imports: ['CngxTreeSelect'],
      template: `
  <div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px">
    <button type="button" class="chip"
            [style.background]="commitMode() === 'optimistic' ? '#c8e6c9' : ''"
            (click)="commitMode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="commitMode() === 'pessimistic' ? '#c8e6c9' : ''"
            (click)="commitMode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="commitShouldFail()"
             (change)="commitShouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
  </div>
  <cngx-tree-select
    [nodes]="orgTree"
    [nodeIdFn]="orgIdFn"
    [labelFn]="orgLabelFn"
    [keyFn]="orgKeyFn"
    [initiallyExpanded]="'all'"
    [(values)]="commitValues"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    [clearable]="true"
    placeholder="Personen wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Values</span>
      <span class="event-value">{{ commitValues().length }} selected</span>
    </div>
    <div class="event-row">
      <span class="event-label">Log</span>
      <span class="event-value" style="white-space:pre;font-family:monospace;font-size:0.75rem">
        {{ commitLog().slice(-4).join('\\n') || '—' }}
      </span>
    </div>
  </div>`,
    },
    {
      title: '10.000 nodes — perf smoke',
      subtitle:
        'Three-level fan-out: 10 roots × 10 branches × 100 leaves = 10,110 flat nodes. ' +
        'Open the panel; expand a root; scroll. Flatten + visibleNodes recomputes + rendering ' +
        'stay in the 16ms frame budget thanks to structural-equal computeds in the controller ' +
        'and memoised slot context + O(1) indexes in the panel.',
      imports: ['CngxTreeSelect'],
      template: `
  <cngx-tree-select
    [nodes]="perfTree"
    [nodeIdFn]="perfIdFn"
    [labelFn]="perfLabelFn"
    [keyFn]="perfKeyFn"
    [(values)]="perfValues"
    [clearable]="true"
    placeholder="10k nodes…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Count</span>
      <span class="event-value">{{ perfValues().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Tree size</span>
      <span class="event-value">10 × 10 × 100 = 10,000 leaves + 110 branches</span>
    </div>
  </div>`,
    },
  ],
};
