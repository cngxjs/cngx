import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Provided icon',
  subtitle: 'Swap the close glyph of every close button in a subtree with <code>provideButtonCloseIcon</code>.',
  description: 'Provide a component with <code>provideButtonCloseIcon</code> (the <code>CNGX_BUTTON_CLOSE_ICON</code> token) and every <code>cngxCloseButton</code> below the provider that projects nothing renders it in place of the default X. Here it sits in <code>viewProviders</code>, so only this demo is affected; at the app root it reaches alerts, toasts, banners and popovers too (<code>provideFeedback(withCloseIcon(...))</code> forwards to it). The order is projected glyph, then provided glyph, then the default X: the first two buttons project nothing and render the provided circled X, the third projects a <code>cngx-icon</code> and keeps it, and the reference button in the legend sits outside the provider and renders the default X. Every glyph stays in the <code>aria-hidden</code> span, so <code>aria-label</code> on the host remains the name. The fixture sits next to this story as <code>_circle-close.component.ts</code>. The dashed box mirrors the role, the name and the glyph exposure a screen reader gets for each button: the name is the same whichever glyph renders.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxCloseButton', 'CngxIcon'],
  moduleImports: [
    "import { CngxCloseButton, provideButtonCloseIcon } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CircleClose } from './_circle-close.component';",
    "import { DefaultCloseReference } from './_default-close-reference.component';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxCloseButton', 'CngxIcon', 'DefaultCloseReference'],
  viewProviders: ['provideButtonCloseIcon(CircleClose)'],
  template: `
  <div class="demo-inline-actions">
    <button cngxCloseButton aria-label="Close panel"></button>
    <button cngxCloseButton aria-label="Dismiss notice"></button>
    <button cngxCloseButton aria-label="Collapse">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z" /></svg>
      </cngx-icon>
    </button>
  </div>`,
  setupChrome: `
  private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);

  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'provided 1', selector: '.demo-inline-actions button[cngxclosebutton]:nth-of-type(1)' },
    { label: 'provided 2', selector: '.demo-inline-actions button[cngxclosebutton]:nth-of-type(2)' },
    { label: 'projected', selector: '.demo-inline-actions button[cngxclosebutton]:nth-of-type(3)' },
    { label: 'default', selector: 'demo-default-close-reference button' },
  ]);

  // Whether each button keeps its glyph out of the name, read from the DOM.
  protected readonly glyphs = signal<readonly string[]>([]);
  private readonly readGlyphs = afterNextRender(() => {
    const spans = this.hostEl.nativeElement.querySelectorAll('button[cngxclosebutton] .cngx-icon-button__glyph');
    this.glyphs.set(
      Array.from(spans, (span) =>
        span.getAttribute('aria-hidden') === 'true' ? 'aria-hidden, not in the name' : 'exposed',
      ),
    );
  });`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">1st: Close panel</span><span class="event-value">provided glyph (CircleClose), nothing projected</span></div>
    <div class="event-row"><span class="event-label">2nd: Dismiss notice</span><span class="event-value">provided glyph (CircleClose), nothing projected</span></div>
    <div class="event-row"><span class="event-label">3rd: Collapse</span><span class="event-value">projected cngx-icon, wins over the provider</span></div>
    <div class="event-row"><span class="event-label">Reference: Close preview</span><span class="event-value"><demo-default-close-reference /> default X, outside the provider</span></div>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label; let i = $index) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} glyph</dt>
        <dd>{{ glyphs()[i] ?? '-' }}</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes; the names are not painted, and the provided, the projected and the default glyph all sit in the aria-hidden span. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
