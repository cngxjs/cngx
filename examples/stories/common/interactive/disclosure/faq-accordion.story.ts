import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDisclosure: FAQ accordion',
  subtitle: 'Multiple independent disclosures. Each manages its own state, no coordination by default.',
  description: 'Composing the atom into a list of questions: every trigger is its own <code>cngxDisclosure</code> instance with a unique <code>controls</code> id. Matches the APG "Disclosure" recommendation for FAQ-style content - independent open/close, no single-open enforcement.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG: Disclosure (FAQ)', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/' },
    { label: 'WCAG 2.1.1 Keyboard (Level A)', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  apiComponents: [
    'CngxDisclosure',
  ],
  moduleImports: [
    'import { CngxDisclosure } from \'@cngx/common\';',
  ],
  imports: ['CngxDisclosure'],
  template: `
  @for (q of ['What is cngx?', 'Is it free?', 'How do I install it?']; track q; let i = $index) {
    <div class="demo-disclosure-faq-row">
      <button cngxDisclosure #faq="cngxDisclosure" [controls]="'faq-' + i"
              type="button"
              class="demo-disclosure-faq-trigger"
              style="width: 100%;">
        {{ faq.opened() ? '−' : '+' }} {{ q }}
      </button>
      @if (faq.opened()) {
        <div [id]="'faq-' + i" class="demo-disclosure-faq-answer">
          Answer to "{{ q }}" goes here.
        </div>
      }
    </div>
  }`,
};
