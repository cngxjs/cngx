import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Alert Stack',
  navLabel: 'Alert Stack',
  navCategory: 'feedback',
  description: 'Scoped inline alert stack with programmatic service, overflow collapse, and DI-scoped nesting for dialogs and forms.',
  apiComponents: ['CngxAlertStack', 'CngxAlerter'],
  moduleImports: [
    "import { CngxAlertStack } from '@cngx/ui/feedback';",
    "import { viewChild } from '@angular/core';",
  ],
  setup: `
  // Access stack alerters via viewChild — each stack provides its own CngxAlerter via viewProviders
  protected readonly basicStack = viewChild<CngxAlertStack>('basicStack');
  protected readonly overflowStack = viewChild<CngxAlertStack>('overflowStack');
  private basicCounter = 0;
  private overflowCounter = 0;

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
  }

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
  }
  `,
  sections: [
    {
      title: 'Basic Stack',
      subtitle: 'Each <code>CngxAlertStack</code> provides its own <code>CngxAlerter</code> via <code>viewProviders</code>. Access via <code>viewChild</code> to add alerts programmatically. <code>role="log"</code> with <code>aria-live="polite"</code>.',
      imports: ['CngxAlertStack'],
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    <button (click)="addError()" class="chip">Add Error</button>
    <button (click)="addWarning()" class="chip">Add Warning</button>
    <button (click)="addInfo()" class="chip">Add Info</button>
    <button (click)="clearAll()" class="chip">Clear All</button>
  </div>

  <cngx-alert-stack #basicStack scope="basic" [maxVisible]="5" />`,
    },
    {
      title: 'Overflow Collapse',
      subtitle: 'When alerts exceed <code>[maxVisible]</code>, overflow is collapsed with a "+ N more" button. Click to expand. <code>aria-expanded</code> + <code>aria-controls</code> on the overflow button.',
      imports: ['CngxAlertStack'],
      template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="addMany()" class="chip">Add 7 Errors</button>
    <button (click)="clearOverflow()" class="chip">Clear</button>
  </div>

  <cngx-alert-stack #overflowStack scope="overflow" [maxVisible]="3" />`,
    },
    {
      title: 'Dialog Use Case',
      subtitle: 'Each dialog gets its own <code>CngxAlertStack</code> with an independent <code>CngxAlerter</code>. Nested dialogs are fully isolated — closing a child destroys its alerts without affecting the parent.',
      template: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">Architecture</span>
      <span class="event-value">CngxAlertStack provides CngxAlerter via viewProviders</span>
    </div>
    <div class="event-row">
      <span class="event-label">Nesting</span>
      <span class="event-value">inject(CngxAlerter) resolves to nearest ancestor stack</span>
    </div>
    <div class="event-row">
      <span class="event-label">Cleanup</span>
      <span class="event-value">Dialog close destroys stack + all alerts automatically</span>
    </div>
  </div>`,
    },
  ],
};
