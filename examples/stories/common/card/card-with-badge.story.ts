import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCardBadge: Card with badge',
  subtitle:
    '<code>cngxCardBadge</code> positions any host element at a card corner. Works on <code>&lt;span&gt;</code>, <code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>; a clickable badge on a button card needs <code>event.stopPropagation()</code> so the click stays on the badge instead of bubbling to the card.',
  description:
    'Three badge use cases side by side: non-interactive label, clickable button-on-button-card with event bubbling control, and a tiny status dot at <code>top-start</code>. The counters in the readout confirm which handler fired when the badge is clicked.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxCardBadge'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody, CngxCardBadge } from '@cngx/common/card';",
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardBadge'],
  references: [
    {
      label: 'WAI-ARIA 1.2: button role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#button',
    },
    {
      label: 'WAI-ARIA 1.2: status role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#status',
    },
  ],
  setup: `protected readonly cardClicked = signal(0);
  protected readonly badgeClicked = signal(0);
  protected handleBadgeClick(e: MouseEvent): void {
    e.stopPropagation();
    this.badgeClicked.update((n) => n + 1);
  }`,
  template: `  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;max-width:760px">
    <cngx-card style="overflow:visible">
      <span cngxCardBadge position="top-end" intent="danger" size="md">P</span>
      <header cngxCardHeader><h3 cngxCardTitle>Static badge</h3></header>
      <div cngxCardBody>Non-interactive span badge</div>
    </cngx-card>

    <cngx-card as="button"
               (clicked)="cardClicked.update((n) => n + 1)"
               ariaLabel="Open project details"
               style="overflow:visible">
      <button type="button"
              cngxCardBadge
              position="top-end"
              intent="danger"
              size="md"
              aria-label="Open permissions dialog"
              (click)="handleBadgeClick($event)">P</button>
      <header cngxCardHeader><h3 cngxCardTitle>Clickable badge</h3></header>
      <div cngxCardBody>Button card + button badge. Click each to test event bubbling.</div>
    </cngx-card>

    <cngx-card style="overflow:visible">
      <span cngxCardBadge
            position="top-start"
            intent="success"
            size="sm"
            role="status"
            aria-label="Online"></span>
      <header cngxCardHeader><h3 cngxCardTitle>Status dot</h3></header>
      <div cngxCardBody>Badge at top-start</div>
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
