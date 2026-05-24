import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlertStack: basic stack',
  subtitle: 'Each <code>CngxAlertStack</code> provides its own <code>CngxAlerter</code> via <code>viewProviders</code>. Access via <code>viewChild</code> to add alerts programmatically. <code>role="log"</code> with <code>aria-live="polite"</code>.',
  description: 'Programmatic push API: a single stack with four buttons that show error, warning, info alerts and a clear-all. Each <code>show()</code> goes through the stack-local <code>CngxAlerter</code> picked up via <code>viewChild</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
    { label: 'WAI-ARIA log role', href: 'https://www.w3.org/TR/wai-aria-1.2/#log' },
  ],
  apiComponents: [
    'CngxAlertStack',
    'CngxAlerter',
  ],
  moduleImports: [
    'import { CngxAlertStack } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxAlertStack'],
  setup: `protected readonly basicStack = viewChild<CngxAlertStack>('basicStack');
  private basicCounter = 0;
  protected addError(): void {
    this.basicStack()?.alerter.show({
      message: 'Validation error #' + (++this.basicCounter),
      severity: 'error',
      scope: 'basic',
    });
  }
  protected addWarning(): void {
    this.basicStack()?.alerter.show({
      message: 'Warning: field "email" looks unusual',
      severity: 'warning',
      scope: 'basic',
    });
  }
  protected addInfo(): void {
    this.basicStack()?.alerter.show({
      message: 'Tip: use Tab to navigate between fields',
      severity: 'info',
      scope: 'basic',
    });
  }
  protected clearAll(): void {
    this.basicStack()?.alerter.dismissAll('basic');
  }`,
  template: `
  <cngx-alert-stack #basicStack scope="basic" [maxVisible]="5" />`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button (click)="addError()" class="chip" type="button">Add Error</button>
    <button (click)="addWarning()" class="chip" type="button">Add Warning</button>
    <button (click)="addInfo()" class="chip" type="button">Add Info</button>
    <button (click)="clearAll()" class="chip" type="button">Clear All</button>
  </div>`,
};
