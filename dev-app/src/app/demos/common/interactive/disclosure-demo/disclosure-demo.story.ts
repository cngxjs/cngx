import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disclosure',
  navLabel: 'Disclosure',
  navCategory: 'interactive',
  description:
    'Generic expand/collapse atom. Manages aria-expanded, keyboard interaction (Enter, Space, click), and controlled+uncontrolled state. Usable for accordions, FAQs, nav groups, collapsible panels.',
  apiComponents: ['CngxDisclosure'],
  moduleImports: ["import { CngxDisclosure } from '@cngx/common';"],
  setup: `
  protected readonly controlledOpen = signal(false);
  `,
  sections: [
    {
      title: 'Basic — Uncontrolled',
      subtitle:
        'Click the trigger or press <strong>Enter</strong>/<strong>Space</strong> to toggle. ' +
        '<code>aria-expanded</code> and <code>aria-controls</code> are set automatically.',
      imports: ['CngxDisclosure'],
      template: `
  <button cngxDisclosure #d="cngxDisclosure" [controls]="'faq-1'" class="sort-btn">
    {{ d.opened() ? 'Collapse' : 'Expand' }} answer
  </button>
  @if (d.opened()) {
    <div id="faq-1" style="padding: 0.75rem; margin-top: 0.5rem; border-left: 3px solid var(--interactive, #f5a623); background: var(--cngx-surface-alt, #f9fafb);">
      <p style="margin: 0; font-size: 0.875rem;">This content is revealed by the disclosure trigger above.</p>
    </div>
  }
  <div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="d.opened()">{{ d.opened() ? 'expanded' : 'collapsed' }}</span>
  </div>`,
    },
    {
      title: 'FAQ Accordion',
      subtitle:
        'Multiple independent disclosures. Each manages its own state — no coordination by default.',
      imports: ['CngxDisclosure'],
      template: `
  @for (q of ['What is cngx?', 'Is it free?', 'How do I install it?']; track q; let i = $index) {
    <div style="border-bottom: 1px solid var(--border-color, #e0e0e0);">
      <button cngxDisclosure #faq="cngxDisclosure" [controls]="'faq-' + i"
              style="width: 100%; text-align: left; padding: 0.75rem 0; font-weight: 600; font-size: 0.875rem; background: none; border: none; cursor: pointer; color: var(--text-primary, #333);">
        {{ faq.opened() ? '−' : '+' }} {{ q }}
      </button>
      @if (faq.opened()) {
        <div [id]="'faq-' + i" style="padding: 0 0 0.75rem; font-size: 0.875rem; color: var(--text-muted, #666);">
          Answer to "{{ q }}" goes here.
        </div>
      }
    </div>
  }`,
    },
    {
      title: 'Controlled Mode',
      subtitle:
        'Bind <code>[cngxDisclosureOpened]</code> to a signal for external state control.',
      imports: ['CngxDisclosure'],
      template: `
  <div class="button-row">
    <button class="sort-btn" (click)="controlledOpen.set(!controlledOpen())">
      External: {{ controlledOpen() ? 'open' : 'closed' }}
    </button>
  </div>
  <button cngxDisclosure #cd="cngxDisclosure"
          [cngxDisclosureOpened]="controlledOpen()"
          (openedChange)="controlledOpen.set($event)"
          [controls]="'ctrl-content'"
          class="sort-btn" style="margin-top: 0.5rem;">
    Trigger: {{ cd.opened() ? 'expanded' : 'collapsed' }}
  </button>
  @if (cd.opened()) {
    <div id="ctrl-content" style="padding: 0.75rem; margin-top: 0.5rem; background: var(--cngx-surface-alt, #f9fafb); border-radius: 4px; font-size: 0.875rem;">
      Controlled content — state owned by parent signal.
    </div>
  }`,
    },
  ],
};
