import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Panel with Automatic Restore',
  subtitle: 'Click "Open Panel" — focus moves into the panel. Close it — focus returns to the button that opened it.',
  description: 'Captures the previously focused element and restores focus when the host is destroyed. Prevents focus loss to body.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxFocusRestore',
  ],
  moduleImports: [
    'import { CngxFocusRestore } from \'@cngx/common/a11y\';',
  ],
  imports: ['CngxFocusRestore'],
  setup: `protected readonly panelOpen = signal(false);`,
  template: `  <button (click)="panelOpen.set(true)" class="chip">Open Panel</button>

  @if (panelOpen()) {
    <div cngxFocusRestore
         style="margin-top:12px;padding:16px;border:1px solid var(--cngx-color-border,#ddd);border-radius:8px">
      <p style="margin:0 0 12px">Panel content. Focus will restore on close.</p>
      <button (click)="panelOpen.set(false)" class="chip">Close Panel</button>
    </div>
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Panel open</span>
      <span class="event-value">{{ panelOpen() }}</span>
    </div>
  </div>`,
};
