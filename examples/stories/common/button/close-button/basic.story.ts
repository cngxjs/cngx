import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Basic',
  subtitle: 'Sits on the native <code>&lt;button&gt;</code>: the name is <code>aria-label</code>, the click is the button\'s own <code>(click)</code>.',
  description: '<code>button[cngxCloseButton]</code> is the icon button with the cngx X glyph. Every attribute you write lands on the real button, so <code>aria-label</code>, <code>(click)</code> and <code>data-*</code> need no forwarding. Name what closes ("Close message"), not just that it closes; without a name it warns <code>CNGX1071</code> in development. It rests in the muted hint colour and lifts to the text colour on hover. Click the X to hide the message; press Show to restore. The dashed box below mirrors the role and name a screen reader gets for the X: the name is exposed, not painted.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxCloseButton'],
  moduleImports: [
    "import { CngxButton, CngxCloseButton } from '@cngx/common/button';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxCloseButton', 'CngxButton'],
  setup: `
  protected readonly visible = signal(true);

  protected handleClose(): void {
    this.visible.set(false);
  }`,
  setupChrome: `
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'close', selector: 'button[cngxclosebutton]' },
  ]);

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
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
      } @empty {
        <dt>close</dt>
        <dd>not rendered</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes; the name is not painted, the X glyph is aria-hidden. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
