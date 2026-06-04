import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlertStack: overflow collapse',
  subtitle: 'When alerts exceed <code>[maxVisible]</code>, overflow is collapsed with a "+ N more" button. Click to expand. <code>aria-expanded</code> + <code>aria-controls</code> on the overflow button.',
  description: 'Density guard: push seven errors into a stack with <code>maxVisible=3</code>. The first three render inline, the rest collapse behind a counter button that exposes correct <code>aria-expanded</code> + <code>aria-controls</code> wiring.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Disclosure', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/' },
  ],
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
  <cngx-alert-stack #overflowStack scope="overflow" [maxVisible]="3" />`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button (click)="addMany()" class="chip" type="button">Add 7 Errors</button>
    <button (click)="clearOverflow()" class="chip" type="button">Clear</button>
  </div>`,
};
