import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'FAQ Accordion',
  subtitle: 'Multiple independent disclosures. Each manages its own state — no coordination by default.',
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
  template: `
  @for (q of ['What is cngx?', 'Is it free?', 'How do I install it?']; track q; let i = $index) {
    <div style="border-bottom: 1px solid var(--cngx-color-border);">
      <button cngxDisclosure #faq="cngxDisclosure" [controls]="'faq-' + i"
              style="width: 100%; text-align: left; padding: 0.75rem 0; font-weight: 600; font-size: 0.875rem; background: none; border: none; cursor: pointer; color: var(--cngx-color-text);">
        {{ faq.opened() ? '−' : '+' }} {{ q }}
      </button>
      @if (faq.opened()) {
        <div [id]="'faq-' + i" style="padding: 0 0 0.75rem; font-size: 0.875rem; color: var(--cngx-color-text-muted);">
          Answer to "{{ q }}" goes here.
        </div>
      }
    </div>
  }`,
};
