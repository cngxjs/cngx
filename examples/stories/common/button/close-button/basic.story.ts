import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Basic',
  subtitle: 'Sits on the native <code>&lt;button&gt;</code>: the name is <code>aria-label</code>, the click is the button\'s own <code>(click)</code>.',
  description: '<code>button[cngxCloseButton]</code> is the icon button with the cngx X glyph. Every attribute you write lands on the real button, so <code>aria-label</code>, <code>(click)</code> and <code>data-*</code> need no forwarding. Name what closes ("Close message"), not just that it closes; without a name it warns <code>CNGX1071</code> in development. It rests in the muted hint colour and lifts to the text colour on hover. Click the X to hide the message; press Show to restore.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxCloseButton'],
  moduleImports: [
    "import { CngxButton, CngxCloseButton } from '@cngx/common/button';",
  ],
  imports: ['CngxCloseButton', 'CngxButton'],
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
      <button cngxCloseButton aria-label="Close message" (click)="handleClose()"></button>
    } @else {
      <span>Dismissed.</span>
    }
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button cngxButton (click)="handleRestore()" [disabled]="visible()">Show</button>
  </div>`,
};
