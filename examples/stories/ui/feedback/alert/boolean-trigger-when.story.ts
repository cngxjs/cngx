import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Boolean Trigger ([when])',
  subtitle: '<code>[when]</code> controls visibility directly. Enter/exit animations play on transitions.',
  description: 'Inline alert atom with enter/exit animations, state-driven visibility, auto-dismiss with pause-on-hover/focus, auto-collapse, and action buttons.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
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
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="showAlert.set(true)" class="chip">Show</button>
    <button (click)="showAlert.set(false)" class="chip">Hide</button>
  </div>

  <cngx-alert [when]="showAlert()" severity="info" title="Triggered Alert">
    This alert is controlled by a boolean signal.
  </cngx-alert>`,
};
