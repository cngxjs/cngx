import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCardMedia: Card with image',
  subtitle:
    '<code>[cngxCardMedia]</code> wraps a full-bleed image with <code>aspectRatio</code> and a <code>decorative</code> flag. Toggle the flag to switch the image between <code>role="img"</code> (alt is announced) and <code>role="presentation"</code> (alt suppressed, image is purely visual).',
  description:
    'Visual-vs-decorative split for card media: the same <code>&lt;img&gt;</code> markup carries different ARIA semantics depending on whether the image conveys meaning. Consumers flip <code>[decorative]</code> per use case; the directive paints the right role on the host and on the image so screen readers do the right thing.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxCardMedia'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody, CngxCardMedia } from '@cngx/common/card';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardMedia',
  ],
  references: [
    {
      label: 'WAI-ARIA 1.2: presentation role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#presentation',
    },
    {
      label: 'W3C: Decorative images',
      href: 'https://www.w3.org/WAI/tutorials/images/decorative/',
    },
  ],
  setup: `protected readonly decorativeMedia = signal(false);`,
  template: `  <div style="max-width:320px">
    <cngx-card>
      <div cngxCardMedia [decorative]="decorativeMedia()" aspectRatio="16/9">
        <img src="https://picsum.photos/seed/cngx/640/360" alt="Landscape photo" />
      </div>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Beautiful place</h3>
        <span cngxCardSubtitle>Somewhere in the mountains</span>
      </header>
      <div cngxCardBody>
        <p style="margin:0">A scenic view with full-bleed image using aspect-ratio 16/9.</p>
      </div>
    </cngx-card>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <label style="display:flex;align-items:center;gap:6px;font-size:0.875rem">
      <input type="checkbox"
             [checked]="decorativeMedia()"
             (change)="decorativeMedia.set($any($event.target).checked)" />
      decorative
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">decorative</span>
      <span class="event-value">{{ decorativeMedia() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Image role</span>
      <span class="event-value">{{ decorativeMedia() ? 'presentation (alt suppressed)' : 'img (alt announced)' }}</span>
    </div>
  </div>`,
};
