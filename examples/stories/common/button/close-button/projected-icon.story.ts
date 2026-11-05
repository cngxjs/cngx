import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Projected icon',
  subtitle: 'Project any glyph into <code>&lt;button cngxCloseButton&gt;</code> to replace the default X per instance. The name, the focus ring and the click stay with the button.',
  description: 'The default template renders a stroke-style X SVG. When you project content, it replaces the default; a <code>cngx-icon</code> sizes itself, a bare <code>svg</code> or <code>img</code> is sized to the button font. The first button projects nothing and shows the default X, the second and third project a <code>cngx-icon</code> and show it instead; the legend below names the source of each glyph. The glyph sits in an <code>aria-hidden</code> span, so projected content never becomes the name; <code>aria-label</code> on the host stays the only name, as the dashed box shows. A projected glyph also wins over an app-wide <code>provideButtonCloseIcon(MyIcon)</code> (the <code>CNGX_BUTTON_CLOSE_ICON</code> token; <code>provideFeedback(withCloseIcon(...))</code> forwards to it), which is the right tool when every alert, toast and popover should use the same icon. Per-instance projection is for one-off chrome that does not warrant a global override.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxCloseButton', 'CngxIcon'],
  moduleImports: [
    "import { CngxCloseButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxCloseButton', 'CngxIcon'],
  template: `
  <div style="display:flex; gap:16px; align-items:center">
    <button cngxCloseButton aria-label="Default close"></button>

    <button cngxCloseButton aria-label="Close with circle">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      </cngx-icon>
    </button>

    <button cngxCloseButton aria-label="Collapse">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13H5v-2h14v2z" />
        </svg>
      </cngx-icon>
    </button>
  </div>`,
  setupChrome: `
  private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);

  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'default', selector: 'button[cngxclosebutton]:nth-of-type(1)' },
    { label: 'circle', selector: 'button[cngxclosebutton]:nth-of-type(2)' },
    { label: 'collapse', selector: 'button[cngxclosebutton]:nth-of-type(3)' },
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
    <div class="event-row"><span class="event-label">1st: Default close</span><span class="event-value">default X, nothing projected</span></div>
    <div class="event-row"><span class="event-label">2nd: Close with circle</span><span class="event-value">projected cngx-icon, replaces the default</span></div>
    <div class="event-row"><span class="event-label">3rd: Collapse</span><span class="event-value">projected cngx-icon, replaces the default</span></div>
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
      Read live from the DOM attributes the accessibility layer exposes; the names are not painted, and the default and the projected glyphs all sit in the aria-hidden span. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
