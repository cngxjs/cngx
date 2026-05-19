import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Controlled Mode',
  subtitle: 'Bind <code>[cngxDisclosureOpened]</code> to a signal for external state control.',
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
  setup: `protected readonly controlledOpen = signal(false);`,
  template: `  <button cngxDisclosure #cd="cngxDisclosure"
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
  templateChrome: `<div class="button-row">
    <button class="sort-btn" (click)="controlledOpen.set(!controlledOpen())">
      External: {{ controlledOpen() ? 'open' : 'closed' }}
    </button>
  </div>`,
};
