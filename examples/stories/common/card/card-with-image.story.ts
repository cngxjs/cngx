import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card with Image',
  subtitle: '<code>[cngxCardMedia]</code> handles full-bleed images with <code>aspectRatio</code> and <code>decorative</code> inputs. Toggle <code>decorative</code> to switch between <code>role="img"</code> (alt is read) and <code>role="presentation"</code> (alt ignored, image becomes purely visual).',
  description: 'Semantic card component with three archetypes: display (article), action (button), and link. Supports selection, loading, disabled with reason, and SR live announcements.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
    'CngxCardMedia',
    'CngxCardFooter',
    'CngxCardActions',
    'CngxCardBadge',
    'CngxCardAccent',
    'CngxCardSkeleton',
  ],
  moduleImports: [
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody, CngxCardMedia } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxCardMedia'],
  setup: `protected decorativeMedia = signal(false);`,
  template: `  <div style="max-width:320px">
    <cngx-card>
      <div cngxCardMedia [decorative]="decorativeMedia()" aspectRatio="16/9">
        <img src="https://picsum.photos/seed/cngx/640/360" alt="Landscape photo" />
      </div>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Beautiful Place</h3>
        <span cngxCardSubtitle>Somewhere in the mountains</span>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--cngx-color-text-muted);font-size:0.875rem">
          A scenic view with full-bleed image using aspect-ratio 16/9.
        </p>
      </div>
    </cngx-card>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <label style="display:flex;align-items:center;gap:6px;font-size:0.875rem">
      <input type="checkbox" [checked]="decorativeMedia()" (change)="decorativeMedia.set($any($event.target).checked)" />
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
      <span class="event-value">{{ decorativeMedia() ? 'presentation (alt ignored)' : 'img (alt read by SR)' }}</span>
    </div>
  </div>`,
};
