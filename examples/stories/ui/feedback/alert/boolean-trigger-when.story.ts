import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlert: boolean trigger when',
  subtitle: '<code>[when]</code> controls visibility directly. Enter/exit animations play on transitions.',
  description: 'Imperative show/hide via a plain boolean signal. Use this binding when there is no underlying async state to derive visibility from; enter/exit animations still play on every transition.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
  apiComponents: [
    'CngxAlert',
    'CngxAlertAction',
    'CngxAlertIcon',
  ],
  moduleImports: [
    'import { CngxAlert } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxAlert'],
  setup: `protected readonly showAlert = signal(false);`,
  template: `
  <cngx-alert [when]="showAlert()" severity="info" title="Triggered Alert">
    This alert is controlled by a boolean signal.
  </cngx-alert>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button (click)="showAlert.set(true)" class="chip" type="button">Show</button>
    <button (click)="showAlert.set(false)" class="chip" type="button">Hide</button>
  </div>`,
};
