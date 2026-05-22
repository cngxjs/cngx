import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Basic',
  subtitle: 'Standalone use: required <code>[label]</code> for ARIA, click handled by bubbled <code>(click)</code> from the inner native button.',
  description: 'The atom renders a single <code>&lt;button type="button"&gt;</code> with the cngx X icon and propagates its native click event up through the host. There is no <code>(pressed)</code> output; bind <code>(click)</code> on the host element. The label is required and must describe the action in context (e.g. "Close dialog" rather than "Close"). Click the button below to hide it; press Show to restore.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: [
    'CngxCloseButton',
  ],
  moduleImports: [
    'import { CngxCloseButton } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCloseButton'],
  setup: `
  protected readonly visible = signal(true);

  protected handleClose(): void {
    this.visible.set(false);
  }`,
  setupChrome: `
  protected handleRestore(): void {
    this.visible.set(true);
  }`,
  template: `
  <div style="display:flex; align-items:center; gap:12px; min-height:2rem">
    @if (visible()) {
      <span>Some dismissible message.</span>
      <cngx-close-button label="Close message" (click)="handleClose()" />
    } @else {
      <span>Dismissed.</span>
    }
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleRestore()" [disabled]="visible()">Show</button>
  </div>`,
};
