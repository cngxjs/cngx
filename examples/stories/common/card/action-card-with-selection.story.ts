import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCard: Action card with selection',
  subtitle:
    'Each card carries its own selection state via <code>[(selected)]</code> with <code>[selectable]="true"</code>. The card paints <code>role="button"</code> + <code>aria-pressed</code>, accepts toggle on click and on <kbd>Space</kbd> / <kbd>Enter</kbd>.',
  description:
    'Three independent card-button toggles in a grid. Each card owns a boolean signal; clicking or pressing Space/Enter flips it. The directive does the keyboard + role + aria-pressed wiring, so the consumer only writes the two-way binding.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody } from '@cngx/common/card';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardSubtitle',
    'CngxCardBody',
  ],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-pressed',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-pressed',
    },
    {
      label: 'WAI-ARIA APG: Button pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    },
  ],
  setup: `protected readonly selectedPhoenix = signal(false);
  protected readonly selectedAtlas = signal(false);
  protected readonly selectedOrion = signal(false);`,
  template: `  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:660px">
    <cngx-card as="button"
               [selectable]="true"
               [(selected)]="selectedPhoenix"
               ariaLabel="Select project Phoenix">
      <header cngxCardHeader>
        <h3 cngxCardTitle>Phoenix</h3>
        <span cngxCardSubtitle>Release 4.2</span>
      </header>
    </cngx-card>
    <cngx-card as="button"
               [selectable]="true"
               [(selected)]="selectedAtlas"
               ariaLabel="Select project Atlas">
      <header cngxCardHeader>
        <h3 cngxCardTitle>Atlas</h3>
        <span cngxCardSubtitle>Release 2.0</span>
      </header>
    </cngx-card>
    <cngx-card as="button"
               [selectable]="true"
               [(selected)]="selectedOrion"
               ariaLabel="Select project Orion">
      <header cngxCardHeader>
        <h3 cngxCardTitle>Orion</h3>
        <span cngxCardSubtitle>Release 1.3</span>
      </header>
    </cngx-card>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Phoenix</span>
      <span class="event-value">{{ selectedPhoenix() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Atlas</span>
      <span class="event-value">{{ selectedAtlas() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Orion</span>
      <span class="event-value">{{ selectedOrion() }}</span>
    </div>
  </div>`,
};
