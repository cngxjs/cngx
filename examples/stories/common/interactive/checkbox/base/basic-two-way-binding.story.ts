import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckbox: basic two-way binding',
  subtitle:
    'Click the box, or focus and press <strong>Space</strong>/<strong>Enter</strong>. The same <code>[(value)]</code> binding flows in both directions, so the consumer signal is the single source of truth.',
  description:
    'Demonstrates the canonical <code>model&lt;boolean&gt;</code> contract on <code>CngxCheckbox</code>. The host carries <code>role="checkbox"</code>, a stable <code>id</code>, and a reactive <code>aria-checked</code> derived as a <code>computed()</code> off <code>value()</code>. Click, Space, and Enter all run the same <code>advance()</code> path; there is no parallel keyboard branch that can drift from the click semantics.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Checkbox Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxCheckbox'],
  moduleImports: [
    "import { CngxCheckbox } from '@cngx/common/interactive';",
  ],
  imports: ['CngxCheckbox'],
  setup: `protected readonly accept = signal(false);`,
  template: `
  <cngx-checkbox [(value)]="accept">I accept the terms</cngx-checkbox>
  <p class="demo-checkbox-caption">Bound: <code>{{ accept() }}</code></p>`,
};
