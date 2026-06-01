import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToggle: Basic two-way binding',
  subtitle:
    'Click anywhere on the row, or focus and press <strong>Space</strong>/<strong>Enter</strong>. The host signal updates via <code>[(value)]</code> and the host element carries <code>role="switch"</code> with reactive <code>aria-checked</code>.',
  description:
    'Smallest CngxToggle wiring: a model signal bound through [(value)], rendered by the element form (<cngx-toggle>) which ships a default track + thumb skin. Pointer click, Space, and Enter all flip the value because the host listens on click/keydown.space/keydown.enter. The element form is preferred over a native <button type="button"> with role="switch" since the browser would otherwise synthesize a Space-click and double-toggle the state.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxToggle'],
  moduleImports: ["import { CngxToggle } from '@cngx/common/interactive';"],
  imports: ['CngxToggle'],
  references: [
    { label: 'WAI-ARIA APG: Switch', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/' },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  setup: `protected readonly notifications = signal(false);`,
  template: `
  <cngx-toggle [(value)]="notifications">Receive e-mail notifications</cngx-toggle>
  <p class="demo-toggle-caption" style="margin-top: 8px;">Bound: <code>{{ notifications() }}</code></p>`,
};
