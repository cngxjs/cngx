import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDisclosure: controlled mode',
  subtitle: 'Bind <code>[cngxDisclosureOpened]</code> to a signal for external state control.',
  description: 'Controlled mode: parent owns the state, the directive mirrors it. Useful when one signal must drive multiple disclosures, or when external UI (a master switch, a route guard) needs to force-open/close the panel without going through the trigger.',
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
  setup: `protected readonly controlledOpen = signal(false);`,
  template: `  <button cngxDisclosure #cd="cngxDisclosure"
          [cngxDisclosureOpened]="controlledOpen()"
          (openedChange)="controlledOpen.set($event)"
          [controls]="'ctrl-content'"
          class="sort-btn" style="margin-top: 0.5rem;">
    Trigger: {{ cd.opened() ? 'expanded' : 'collapsed' }}
  </button>
  @if (cd.opened()) {
    <div id="ctrl-content" class="demo-disclosure-panel" style="margin-top: 0.5rem;">
      Controlled content: state owned by parent signal.
    </div>
  }`,
  templateChrome: `<div class="button-row">
    <button type="button" class="sort-btn" (click)="controlledOpen.set(!controlledOpen())">
      External: {{ controlledOpen() ? 'open' : 'closed' }}
    </button>
  </div>`,
};
