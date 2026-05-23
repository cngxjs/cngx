import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDisclosure: basic uncontrolled',
  subtitle: 'Click the trigger or press <strong>Enter</strong>/<strong>Space</strong> to toggle. <code>aria-expanded</code> and <code>aria-controls</code> are set automatically.',
  description: 'Default uncontrolled mode: the directive owns its open/closed state internally. No signal binding needed - just attach <code>cngxDisclosure</code> to a trigger and let the consumer render content conditionally on <code>opened()</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG: Disclosure (Show/Hide)', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/' },
    { label: 'WCAG 2.1.1 Keyboard (Level A)', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
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
    <div id="faq-1" class="demo-disclosure-panel" style="margin-top: 0.5rem;">
      <p style="margin: 0;">This content is revealed by the disclosure trigger above.</p>
    </div>
  }`,
  templateChrome: `<div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="d.opened()">{{ d.opened() ? 'expanded' : 'collapsed' }}</span>
  </div>`,
};
