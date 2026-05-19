import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — Uncontrolled',
  subtitle: 'Click the trigger or press <strong>Enter</strong>/<strong>Space</strong> to toggle. <code>aria-expanded</code> and <code>aria-controls</code> are set automatically.',
  description: 'Generic expand/collapse atom. Manages aria-expanded, keyboard interaction (Enter, Space, click), and controlled+uncontrolled state. Usable for accordions, FAQs, nav groups, collapsible panels.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDisclosure',
  ],
  moduleImports: [
    'import { CngxDisclosure } from \'@cngx/common\';',
  ],
  imports: ['CngxDisclosure'],
  template: `  <button cngxDisclosure #d="cngxDisclosure" [controls]="'faq-1'" class="sort-btn">
    {{ d.opened() ? 'Collapse' : 'Expand' }} answer
  </button>
  @if (d.opened()) {
    <div id="faq-1" style="padding: 0.75rem; margin-top: 0.5rem; border-left: 3px solid var(--interactive, #f5a623); background: var(--cngx-surface-alt, #f9fafb);">
      <p style="margin: 0; font-size: 0.875rem;">This content is revealed by the disclosure trigger above.</p>
    </div>
  }`,
  templateChrome: `<div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="d.opened()">{{ d.opened() ? 'expanded' : 'collapsed' }}</span>
  </div>`,
};
