import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Focus Restore',
  navLabel: 'FocusRestore',
  navCategory: 'a11y',
  description:
    'Captures the previously focused element and restores focus when the host is destroyed. Prevents focus loss to body.',
  apiComponents: ['CngxFocusRestore'],
  overview:
    '<p><code>[cngxFocusRestore]</code> solves the focus-loss problem when dynamic content is removed. ' +
    'Without it, focus falls to <code>&lt;body&gt;</code> and screen reader users lose their place.</p>',
  moduleImports: [
    "import { CngxFocusRestore } from '@cngx/common/a11y';",
  ],
  setup: `
  protected readonly panelOpen = signal(false);
  protected readonly detailsOpen = signal(false);
  `,
  sections: [
    {
      title: 'Panel with Automatic Restore',
      subtitle:
        'Click "Open Panel" — focus moves into the panel. Close it — focus returns to the button that opened it.',
      imports: ['CngxFocusRestore'],
      template: `
  <button (click)="panelOpen.set(true)" class="chip">Open Panel</button>

  @if (panelOpen()) {
    <div cngxFocusRestore
         style="margin-top:12px;padding:16px;border:1px solid var(--cngx-border,#ddd);border-radius:8px">
      <p style="margin:0 0 12px">Panel content. Focus will restore on close.</p>
      <button (click)="panelOpen.set(false)" class="chip">Close Panel</button>
    </div>
  }

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Panel open</span>
      <span class="event-value">{{ panelOpen() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Inline Details',
      subtitle:
        'A collapsible detail section. When collapsed, focus returns to the toggle button.',
      imports: ['CngxFocusRestore'],
      template: `
  <button (click)="detailsOpen.set(!detailsOpen())" class="chip"
          [attr.aria-expanded]="detailsOpen()">
    {{ detailsOpen() ? 'Hide Details' : 'Show Details' }}
  </button>

  @if (detailsOpen()) {
    <div cngxFocusRestore
         style="margin-top:8px;padding:12px;background:var(--cngx-surface-alt,#f9f9f9);border-radius:6px">
      <p style="margin:0">Extra details that appear dynamically. Tab through these fields, then close.</p>
      <input placeholder="Name" style="margin-top:8px;padding:6px 10px;border:1px solid var(--cngx-border,#ddd);border-radius:4px" />
    </div>
  }`,
    },
  ],
};
