import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select Family — pick-your-select',
  navLabel: 'Select compare',
  navCategory: 'field',
  description:
    'Side-by-side comparison of the nine CngxSelect-family variants with use-case guidance — pick the right one without re-reading the architecture doc.',
  apiComponents: [
    'CngxSelect',
    'CngxMultiSelect',
    'CngxCombobox',
    'CngxTypeahead',
    'CngxTreeSelect',
    'CngxReorderableMultiSelect',
    'CngxActionSelect',
    'CngxActionMultiSelect',
    'CngxSelectShell',
  ],
  overview:
    '<p>The Select family ships eight variants. They share commit, async-state, ARIA, and template-slot machinery — they differ in <em>value shape</em> (single vs array vs reorder vs tree) and in the <em>panel surface</em> (button trigger vs inline-input vs inline action).</p>' +
    '<p><strong>Decision tree:</strong></p>' +
    '<ul>' +
    '<li><code>CngxSelect</code> — single value, button trigger. Native <code>&lt;select&gt;</code> replacement.</li>' +
    '<li><code>CngxMultiSelect</code> — array of values, button trigger + chip strip.</li>' +
    '<li><code>CngxCombobox</code> — array of values, inline <code>&lt;input&gt;</code> trigger with type-to-filter.</li>' +
    '<li><code>CngxTypeahead</code> — single value, inline <code>&lt;input&gt;</code> with <code>displayWith</code> (server-driven autocomplete).</li>' +
    '<li><code>CngxTreeSelect</code> — array of values from a hierarchical option tree, button trigger + chip strip + tree panel.</li>' +
    '<li><code>CngxReorderableMultiSelect</code> — like Multi but the chip strip is reorderable (drag + Ctrl-Arrow keyboard).</li>' +
    '<li><code>CngxActionSelect</code> — single value with an inline action workflow (quick-create, filter-bar, "manage tags" pop-out).</li>' +
    '<li><code>CngxActionMultiSelect</code> — array of values with the same inline action workflow.</li>' +
    '<li><code>CngxSelectShell</code> — single value with declarative <code>&lt;cngx-option&gt;</code> projection. Pick this when consumers want native-feeling option markup instead of the data-driven <code>[options]</code> input.</li>' +
    '</ul>',
  moduleImports: [
    "import { CngxSelect, CngxMultiSelect, CngxCombobox, CngxTypeahead, CngxTreeSelect, CngxReorderableMultiSelect, CngxActionSelect, CngxActionMultiSelect, CngxSelectShell, CngxSelectOption, type CngxSelectOptionDef, type CngxTreeNode } from '@cngx/forms/select';",
  ],
  setup: `
  protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'A11y' },
  ];

  protected readonly users: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 'u1', name: 'Ada Lovelace' }, label: 'Ada Lovelace' },
    { value: { id: 'u2', name: 'Grace Hopper' }, label: 'Grace Hopper' },
    { value: { id: 'u3', name: 'Margaret Hamilton' }, label: 'Margaret Hamilton' },
  ];

  protected readonly userCompare = (a?: { id: string }, b?: { id: string }): boolean =>
    !!a && !!b && a.id === b.id;
  protected readonly userDisplay = (u?: { name: string }): string => u?.name ?? '';
  protected readonly treeNodeId = (v: string): string => v;

  protected readonly tree: CngxTreeNode<string>[] = [
    {
      value: 'frontend',
      label: 'Frontend',
      children: [
        { value: 'angular', label: 'Angular' },
        { value: 'react', label: 'React' },
      ],
    },
    {
      value: 'backend',
      label: 'Backend',
      children: [
        { value: 'node', label: 'Node' },
        { value: 'go', label: 'Go' },
      ],
    },
  ];

  protected readonly singleValue = signal<string | undefined>(undefined);
  protected readonly multiValues = signal<string[]>([]);
  protected readonly comboValues = signal<string[]>([]);
  protected readonly typeaheadValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected readonly treeValues = signal<string[]>([]);
  protected readonly reorderValues = signal<string[]>(['angular', 'signals']);
  protected readonly actionValue = signal<string | undefined>(undefined);
  protected readonly actionMultiValues = signal<string[]>([]);
  protected readonly shellValue = signal<string | undefined>(undefined);
  `,
  sections: [
    {
      title: 'Single button trigger — CngxSelect',
      subtitle:
        'Use when the value is a single primitive and you want the closest replacement for a native <code>&lt;select&gt;</code>. Button trigger, panel opens on click, ARIA combobox semantics.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Tag'"
    [options]="tags"
    [(value)]="singleValue"
    [clearable]="true"
    placeholder="Tag wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ singleValue() ?? '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Multi button trigger — CngxMultiSelect',
      subtitle:
        'Same trigger as CngxSelect but the value is an array. Selected options render as chips inside the trigger; PageUp/Down + typeahead-while-closed work without the panel open.',
      imports: ['CngxMultiSelect'],
      template: `
  <cngx-multi-select
    [label]="'Themen'"
    [options]="tags"
    [(values)]="multiValues"
    [clearable]="true"
    placeholder="Themen wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Combobox — CngxCombobox',
      subtitle:
        'Inline <code>&lt;input role="combobox"&gt;</code> with built-in filter. Like CngxMultiSelect but consumers can type to narrow the listbox; chip strip wraps the typed input.',
      imports: ['CngxCombobox'],
      template: `
  <cngx-combobox
    [label]="'Themen'"
    [options]="tags"
    [(values)]="comboValues"
    [clearable]="true"
    placeholder="Type to filter…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Typeahead — CngxTypeahead',
      subtitle:
        'Single-value autocomplete. Inline <code>&lt;input&gt;</code> with <code>displayWith</code> formatter so the input shows the picked label after commit. Use for server-driven autocomplete (subscribe to <code>(searchTermChange)</code> + push results via <code>[state]</code>).',
      imports: ['CngxTypeahead'],
      template: `
  <cngx-typeahead
    [label]="'User'"
    [options]="users"
    [compareWith]="userCompare"
    [displayWith]="userDisplay"
    [clearable]="true"
    placeholder="Search by name…"
    [(value)]="typeaheadValue"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ typeaheadValue()?.name || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Tree — CngxTreeSelect',
      subtitle:
        'Array of values picked from a hierarchical tree. Panel renders <code>role="tree"</code> with W3C-APG keyboard nav (ArrowLeft/Right collapse-and-traverse, ArrowUp/Down move). <code>[cascadeChildren]="true"</code> opt-in for select-all-descendants.',
      imports: ['CngxTreeSelect'],
      template: `
  <cngx-tree-select
    [label]="'Stack'"
    [nodes]="tree"
    [nodeIdFn]="treeNodeId"
    [(values)]="treeValues"
    placeholder="Stack wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ treeValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Reorderable — CngxReorderableMultiSelect',
      subtitle:
        'Same value shape as CngxMultiSelect, but the chip strip is reorderable. Pointer drag works; Ctrl-Arrow on a focused chip moves it (modifier configurable via <code>provideReorderableSelectConfig(withReorderKeyboardModifier(...))</code>).',
      imports: ['CngxReorderableMultiSelect'],
      template: `
  <cngx-reorderable-multi-select
    [label]="'Recipients'"
    [options]="tags"
    [(values)]="reorderValues"
    placeholder="Themen wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Order</span><span class="event-value">{{ reorderValues().join(' → ') }}</span></div>
  </div>`,
    },
    {
      title: 'Action — CngxActionSelect',
      subtitle:
        'Single-value variant with an inline <code>*cngxSelectAction</code> slot — render a quick-create form, a filter bar, or any inline workflow inside the panel without closing it. Action context exposes <code>{ close, commit, dirty, isPending, retry, error }</code>.',
      imports: ['CngxActionSelect'],
      template: `
  <cngx-action-select
    [label]="'Tag'"
    [options]="tags"
    [(value)]="actionValue"
    placeholder="Tag wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ actionValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Tip</span><span class="event-value">Project a <code>*cngxSelectAction</code> template — see the action-select demo.</span></div>
  </div>`,
    },
    {
      title: 'Action — CngxActionMultiSelect',
      subtitle:
        'Multi-value variant of the action-host. Same inline workflow capabilities (<code>*cngxSelectAction</code>) but the trigger is a chip strip + inline <code>&lt;input&gt;</code> like CngxCombobox.',
      imports: ['CngxActionMultiSelect'],
      template: `
  <cngx-action-multi-select
    [label]="'Themen'"
    [options]="tags"
    [(values)]="actionMultiValues"
    placeholder="Themen wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ actionMultiValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Declarative shell — CngxSelectShell',
      subtitle:
        'Same UX as CngxSelect, but options are projected as <code>&lt;cngx-option&gt;</code> children instead of fed via <code>[options]</code>. Pick this when consumers want native-feeling option markup; the data-driven CngxSelect is still the right call for server-driven option lists.',
      imports: ['CngxSelectShell', 'CngxSelectOption'],
      template: `
  <cngx-select-shell
    [label]="'Tag'"
    [(value)]="shellValue"
    [clearable]="true"
    placeholder="Tag wählen…"
  >
    <cngx-option [value]="'angular'">Angular</cngx-option>
    <cngx-option [value]="'signals'">Signals</cngx-option>
    <cngx-option [value]="'rxjs'">RxJS</cngx-option>
    <cngx-option [value]="'a11y'">A11y</cngx-option>
  </cngx-select-shell>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ shellValue() ?? '—' }}</span></div>
  </div>`,
    },
  ],
};
