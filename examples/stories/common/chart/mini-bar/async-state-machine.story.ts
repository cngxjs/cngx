import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMiniBar: Async state machine',
  subtitle:
    'Bind <code>[state]</code> to a <code>CngxAsyncState&lt;number&gt;</code> and the bar routes through skeleton / empty / error / content branches automatically.',
  description:
    'Single-value indicator with a four-state demo. Empty is reached by entering <code>success</code> without data (<code>state.reset()</code> + <code>state.set("success")</code>); the preset paints its empty fallback instead of a bar at 0%, so the reader can distinguish "no measurement yet" from "measured zero".',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxMiniBar'],
  references: [
    {
      label: 'WAI-ARIA: meter role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#meter',
    },
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
  ],
  moduleImports: [
    "import { CngxMiniBar } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxMiniBar'],
  setup: `protected readonly state = createManualState<number>();`,
  setupChrome: `protected showSkeleton(): void {
    this.state.reset();
    this.state.set('loading');
  }
  protected showSuccess(): void {
    this.state.setSuccess(64);
  }
  protected showEmpty(): void {
    this.state.reset();
    this.state.set('success');
  }
  protected showError(): void {
    this.state.reset();
    this.state.setError(new Error('Sensor offline'));
  }`,
  template: `  <cngx-mini-bar [value]="64" [state]="state" aria-label="Demo metric" />`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ state.status() }}</span>
  </div>`,
};
