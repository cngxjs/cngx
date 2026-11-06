import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composition: Custom button host',
  subtitle: 'Build your own button on <code>CngxButtonBrain</code>: declare it in <code>hostDirectives</code>, name the host with <code>provideButtonHost</code>, keep only the template and the skin.',
  description: 'Every cngx button renders on one host directive. <code>demoChipButton</code> is a pill-shaped chip written in the app: it forwards <code>variant</code>, <code>tone</code>, <code>disabled</code> and <code>disabledReason</code> to <code>CngxButtonBrain</code>, pins its size with <code>provideButtonHost(..., { fixed: { size: \'sm\' } })</code>, and paints itself from the attributes the brain sets (<code>data-variant</code>, <code>data-tone</code>, <code>aria-disabled</code>, <code>data-busy</code>). The disabled chip stays focusable and reads its reason through <code>aria-describedby</code>; activation is swallowed by the brain, not by the host. The Refresh chip co-hosts <code>cngxAsyncClick</code>: the brain reads its run through <code>CNGX_ASYNC_RUN_STATE</code>, so the busy layer and <code>aria-disabled</code> follow the run with no wiring in the host, and the result is spoken by the live region <code>cngxAsyncClick</code> renders. The fixture sits next to this story as <code>_chip-button.component.ts</code>. The dashed box below mirrors what a screen reader gets for the Archive and Refresh chips: role, name, description, state and the announcements are exposed or spoken, not painted.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxButtonBrain', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { ChipButton } from './_chip-button.component';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
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
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'archive chip', selector: '.demo-inline-actions > button:nth-of-type(3)' },
    { label: 'refresh chip', selector: '.demo-inline-actions > button:nth-of-type(4)' },
  ]);

  protected handleToggle(): void {
    this.canArchive.update((v) => !v);
  }`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleToggle()">{{ canArchive() ? 'Revoke' : 'Grant' }} owner role</button>
  </div>
  <div class="status-row">Refreshed {{ refreshed() }} time(s)</div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}{{ row.popup ? ', ' + row.popup : '' }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} description</dt>
        <dd>{{ row.description }}</dd>
        <dt>{{ row.label }} state</dt>
        <dd>aria-disabled {{ row.disabled }}, aria-busy {{ row.busy }}</dd>
      }
      @for (entry of sr.heard(); track entry.n) {
        <dt>announced #{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes, plus the last five texts written to a live region, newest last; none of it is painted. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
