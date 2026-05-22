import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHierarchicalNav: With active descendant',
  subtitle: 'Compose <code>CngxActiveDescendant</code> + <code>[cngxHierarchicalNav]="ctrl"</code> on a <code>role="tree"</code>. ArrowUp / ArrowDown / Home / End drive the cursor; ArrowRight / ArrowLeft expand or collapse and traverse parent / child.',
  description: 'W3C-tree keyboard extension. The default strategy implements the WAI-ARIA APG treeview pattern: ArrowRight on a collapsed parent expands it; on an open parent it moves the cursor to the first child; on a leaf it is a no-op. ArrowLeft is the mirror: collapse an open parent, otherwise move to the parent. The directive injects <code>CngxActiveDescendant</code> from the same host (<code>host: true</code>, optional) and leaves vertical navigation, Home / End, and typeahead to AD\'s own handler. <code>createTreeAdItems(ctrl)</code> is the adapter that projects <code>ctrl.visibleNodes()</code> into the <code>ActiveDescendantItem[]</code> shape AD wants. Swap the strategy via <code>CNGX_HIERARCHICAL_NAV_STRATEGY</code> for expand-only / never-traverse / drag-drop variants without forking the directive.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: [
    'CngxHierarchicalNav',
    'createTreeController',
    'createTreeAdItems',
    'CngxActiveDescendant',
  ],
  moduleImports: [
    'import { createTreeController, createTreeAdItems, CngxHierarchicalNav } from \'@cngx/common/interactive\';',
    'import { CngxActiveDescendant } from \'@cngx/common/a11y\';',
    'import type { CngxTreeNode } from \'@cngx/utils\';',
  ],
  imports: ['CngxHierarchicalNav', 'CngxActiveDescendant'],
  references: [
    { label: 'WAI-ARIA APG: Treeview pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/' },
    { label: 'WAI-ARIA 1.2: `tree` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#tree' },
    { label: 'WAI-ARIA 1.2: `aria-activedescendant`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant' },
  ],
  setup: `
  protected readonly nodes = signal<readonly CngxTreeNode<{ id: string; label: string }>[]>([
    {
      value: { id: 'src', label: 'src' },
      children: [
        {
          value: { id: 'src-app', label: 'app' },
          children: [
            { value: { id: 'src-app-main', label: 'main.ts' } },
            { value: { id: 'src-app-component', label: 'app.component.ts' } },
          ],
        },
        { value: { id: 'src-styles', label: 'styles.scss' } },
      ],
    },
    {
      value: { id: 'tests', label: 'tests' },
      children: [
        { value: { id: 'tests-spec', label: 'app.spec.ts' } },
      ],
    },
  ]);

  protected readonly ctrl = createTreeController<{ id: string; label: string }>({
    nodes: this.nodes,
    nodeIdFn: (v) => v.id,
    labelFn: (v) => v.label,
    initiallyExpanded: ['src'],
  });

  protected readonly adItems = createTreeAdItems(this.ctrl);`,
  template: `
  <ul
    role="tree"
    aria-label="File explorer"
    cngxActiveDescendant
    [items]="adItems()"
    [cngxHierarchicalNav]="ctrl"
    tabindex="0"
    #ad="cngxActiveDescendant"
    style="display:flex; flex-direction:column; gap:2px; max-width:24rem; list-style:none; padding:0; margin:0"
  >
    @for (node of ctrl.visibleNodes(); track node.id) {
      <li
        role="treeitem"
        [id]="node.id"
        [attr.aria-level]="node.depth + 1"
        [attr.aria-posinset]="node.posinset"
        [attr.aria-setsize]="node.setsize"
        [attr.aria-expanded]="node.hasChildren ? ctrl.isExpanded(node.id)() : null"
        [attr.aria-selected]="ad.activeId() === node.id ? 'true' : 'false'"
        [style.padding-inline-start.rem]="node.depth * 1.5"
        style="display:flex; align-items:center; gap:6px"
      >
        @if (node.hasChildren) {
          <span aria-hidden="true">{{ ctrl.isExpanded(node.id)() ? '▾' : '▸' }}</span>
        } @else {
          <span aria-hidden="true" style="display:inline-block; width:1ch">·</span>
        }
        <span>{{ node.label }}</span>
      </li>
    }
  </ul>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">Tab into the tree. Use <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> to move the cursor, <kbd>Home</kbd> / <kbd>End</kbd> for first / last. <kbd>ArrowRight</kbd> expands a closed parent or steps into its first child; <kbd>ArrowLeft</kbd> collapses an open parent or steps out to its parent.</p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">aria-activedescendant</span>
      <span class="event-value">{{ ad.activeId() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">expandedIds().size</span>
      <span class="event-value">{{ ctrl.expandedIds().size }}</span>
    </div>
  </div>`,
};
