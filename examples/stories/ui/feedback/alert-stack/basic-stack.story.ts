import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic Stack',
  subtitle: 'Each <code>CngxAlertStack</code> provides its own <code>CngxAlerter</code> via <code>viewProviders</code>. Access via <code>viewChild</code> to add alerts programmatically. <code>role="log"</code> with <code>aria-live="polite"</code>.',
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
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    <button (click)="addError()" class="chip">Add Error</button>
    <button (click)="addWarning()" class="chip">Add Warning</button>
    <button (click)="addInfo()" class="chip">Add Info</button>
    <button (click)="clearAll()" class="chip">Clear All</button>
  </div>

  <cngx-alert-stack #basicStack scope="basic" [maxVisible]="5" />`,
};
