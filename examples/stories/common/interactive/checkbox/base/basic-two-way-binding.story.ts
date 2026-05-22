import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — two-way binding',
  subtitle: 'Click the box or focus + press <strong>Space</strong>/<strong>Enter</strong>.',
  description: 'Single-value boolean checkbox atom with WAI-ARIA tristate semantics. Composes <code>cngx-checkbox-indicator</code> from @cngx/common/display for the visual state. Click on an indeterminate checkbox advances to <code>value=true, indeterminate=false</code> in a single step — there is no path that lands the checkbox back in <code>mixed</code> from a user click.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxCheckbox',
  ],
  moduleImports: [
    'import { CngxCheckbox } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCheckbox'],
  setup: `protected readonly accept = signal(false);`,
  template: `
  <cngx-checkbox [(value)]="accept">I accept the terms</cngx-checkbox>
  <p class="caption">Bound: <code>{{ accept() }}</code></p>`,
  css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 8px; }`,
};
