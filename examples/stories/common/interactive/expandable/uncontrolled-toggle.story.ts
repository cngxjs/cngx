import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxExpandable: Uncontrolled toggle',
  subtitle: 'Apply <code>[cngxExpandable]</code> + <code>[controls]="contentId"</code>; the directive mirrors <code>aria-expanded</code> and <code>aria-controls</code> onto the host while the template calls <code>toggle()</code> from a sibling button.',
  description: 'Passive expand/collapse ARIA contract. The directive is intentionally interaction-free: it carries no click handler, no keyboard binding, no built-in trigger. Consumers call <code>expand()</code>, <code>collapse()</code>, or <code>toggle()</code> on the exported reference, and the directive mirrors the resolved state into <code>aria-expanded</code>. Without a controlled input the directive owns the open/closed state internally. Use this for tree-item rows or any expander where click/Enter/Space already mean something else (selection); reach for <code>CngxDisclosure</code> when the trigger element IS the toggle.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxExpandable',
  ],
  moduleImports: [
    'import { CngxExpandable } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxExpandable'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-expanded`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-expanded' },
    { label: 'WAI-ARIA 1.2: `aria-controls`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-controls' },
    { label: 'WAI-ARIA APG: Disclosure pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/' },
  ],
  template: `
  <div role="tree" aria-label="Files">
    <div
      role="treeitem"
      aria-level="1"
      cngxExpandable
      #e="cngxExpandable"
      [controls]="'expandable-demo-children'"
      style="display:flex; align-items:center; gap:8px"
    >
      <button type="button" aria-label="Toggle children" (click)="e.toggle()">
        {{ e.expanded() ? '▾' : '▸' }}
      </button>
      <span>Parent row</span>
    </div>
    <ul
      id="expandable-demo-children"
      [hidden]="!e.expanded()"
      style="margin:8px 0 0 1.5rem"
    >
      <li>Child row A</li>
      <li>Child row B</li>
      <li>Child row C</li>
    </ul>
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">aria-expanded</span>
      <span class="event-value">{{ e.expanded() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-controls</span>
      <span class="event-value">expandable-demo-children</span>
    </div>
  </div>`,
};
