import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Inline Details',
  subtitle: 'A collapsible detail section. When collapsed, focus returns to the toggle button.',
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
  setup: `protected readonly detailsOpen = signal(false);`,
  template: `
  <button (click)="detailsOpen.set(!detailsOpen())" class="chip"
          [attr.aria-expanded]="detailsOpen()">
    {{ detailsOpen() ? 'Hide Details' : 'Show Details' }}
  </button>

  @if (detailsOpen()) {
    <div cngxFocusRestore
         style="margin-top:8px;padding:12px;background:var(--cngx-surface-alt,#f9f9f9);border-radius:6px">
      <p style="margin:0">Extra details that appear dynamically. Tab through these fields, then close.</p>
      <input placeholder="Name" style="margin-top:8px;padding:6px 10px;border:1px solid var(--cngx-color-border,#ddd);border-radius:4px" />
    </div>
  }`,
};
