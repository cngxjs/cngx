import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Overflow Collapse',
  subtitle: 'When alerts exceed <code>[maxVisible]</code>, overflow is collapsed with a "+ N more" button. Click to expand. <code>aria-expanded</code> + <code>aria-controls</code> on the overflow button.',
  description: 'Scoped inline alert stack with programmatic service, overflow collapse, and DI-scoped nesting for dialogs and forms.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxAlertStack',
    'CngxAlerter',
  ],
  moduleImports: [
    'import { CngxAlertStack } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxAlertStack'],
  setup: `protected readonly overflowStack = viewChild<CngxAlertStack>('overflowStack');
  private overflowCounter = 0;
  protected addMany(): void {
    for (let i = 0; i < 7; i++) {
      this.overflowStack()?.alerter.show({
        message: 'Error in field #' + (++this.overflowCounter),
        severity: 'error',
        scope: 'overflow',
      });
    }
  }
  protected clearOverflow(): void {
    this.overflowStack()?.alerter.dismissAll('overflow');
    this.overflowCounter = 0;
  }`,
  template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="addMany()" class="chip">Add 7 Errors</button>
    <button (click)="clearOverflow()" class="chip">Clear</button>
  </div>

  <cngx-alert-stack #overflowStack scope="overflow" [maxVisible]="3" />`,
};
