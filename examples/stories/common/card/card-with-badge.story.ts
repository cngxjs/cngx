import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card with Badge',
  subtitle: '<code>[cngxCardBadge]</code> positions any element at a corner. Works on <code>&lt;span&gt;</code>, <code>&lt;button&gt;</code>, or <code>&lt;a&gt;</code>. Clickable badge on a button card: does the click bubble to the card or stay on the badge?',
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
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardBadge'],
  setup: `protected cardClicked = signal(0);
  protected badgeClicked = signal(0);
  protected handleBadgeClick(e: MouseEvent): void {
    e.stopPropagation();
    this.badgeClicked.update(n => n + 1);
  }`,
  template: `  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;max-width:760px">
    <cngx-card style="overflow:visible">
      <span cngxCardBadge position="top-end" intent="danger" size="md">P</span>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Static Badge</h3>
      </header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">
        Non-interactive span badge
      </div>
    </cngx-card>

    <cngx-card as="button" (clicked)="cardClicked.update(n => n + 1)"
               ariaLabel="Open care plan" style="overflow:visible">
      <button cngxCardBadge position="top-end" intent="danger" size="md"
              (click)="handleBadgeClick($event)"
              aria-label="Open permissions dialog">
        P
      </button>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Clickable Badge</h3>
      </header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">
        Button card + button badge. Click each to test event bubbling.
      </div>
    </cngx-card>

    <cngx-card style="overflow:visible">
      <span cngxCardBadge position="top-start" intent="success" size="sm"
            role="status" aria-label="Online"></span>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Status Dot</h3>
      </header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--cngx-color-text-muted)">
        Badge at top-start
      </div>
    </cngx-card>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Card clicked</span>
      <span class="event-value">{{ cardClicked() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Badge clicked</span>
      <span class="event-value">{{ badgeClicked() }}</span>
    </div>
  </div>`,
};
