import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composition: Custom button host',
  subtitle: 'Build your own button on <code>CngxButtonBrain</code>: declare it in <code>hostDirectives</code>, name the host with <code>provideButtonHost</code>, keep only the template and the skin.',
  description: 'Every cngx button renders on one host directive. <code>demoChipButton</code> is a pill-shaped chip written in the app: it forwards <code>variant</code>, <code>tone</code>, <code>disabled</code> and <code>disabledReason</code> to <code>CngxButtonBrain</code>, pins its size with <code>provideButtonHost(..., { fixed: { size: \'sm\' } })</code>, and paints itself from the attributes the brain sets (<code>data-variant</code>, <code>data-tone</code>, <code>aria-disabled</code>, <code>data-busy</code>). The disabled chip stays focusable and reads its reason through <code>aria-describedby</code>; activation is swallowed by the brain, not by the host. The Refresh chip co-hosts <code>cngxAsyncClick</code>: the brain reads its run through <code>CNGX_ASYNC_RUN_STATE</code>, so the busy layer and <code>aria-disabled</code> follow the run with no wiring in the host, and the result is spoken by the live region <code>cngxAsyncClick</code> renders. The fixture sits next to this story as <code>_chip-button.component.ts</code>.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxButtonBrain', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { ChipButton } from './_chip-button.component';",
  ],
  imports: ['ChipButton', 'CngxAsyncClick'],
  setup: `
  protected readonly canArchive = signal(false);
  protected readonly refreshed = signal(0);

  protected readonly refresh = (): Promise<void> =>
    new Promise((resolve) =>
      setTimeout(() => {
        this.refreshed.update((n) => n + 1);
        resolve();
      }, 1500),
    );`,
  template: `
  <div class="demo-inline-actions">
    <button demoChipButton>Filter</button>
    <button demoChipButton="solid" tone="primary">Active</button>
    <button
      demoChipButton
      tone="danger"
      [disabled]="!canArchive()"
      disabledReason="Only owners can archive this view."
    >Archive</button>
    <button demoChipButton tone="primary" [cngxAsyncClick]="refresh">Refresh</button>
  </div>`,
  setupChrome: `
  protected handleToggle(): void {
    this.canArchive.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggle()">{{ canArchive() ? 'Revoke' : 'Grant' }} owner role</button>
  </div>
  <div class="status-row">Refreshed {{ refreshed() }} time(s)</div>`,
};
