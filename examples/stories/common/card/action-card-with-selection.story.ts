import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Action Card with Selection',
  subtitle: 'Each card maintains its own selection state via <code>[(selected)]</code>. Toggle on click and keyboard (<kbd>Space</kbd> / <kbd>Enter</kbd>). Try clicking and tabbing between cards.',
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
    'import { CngxCard, CngxCardHeader, CngxCardBody } from \'@cngx/common/card\';',
  ],
  imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody'],
  setup: `protected selectedMaria = signal(false);
  protected selectedHans = signal(false);
  protected selectedLisa = signal(false);`,
  template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:660px">
    <cngx-card as="button" [selectable]="true" [(selected)]="selectedMaria"
               ariaLabel="Select patient Maria Muster">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:0.9375rem">Maria Muster</h3>
      </header>
      <div cngxCardBody>
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Room 12</span>
      </div>
    </cngx-card>
    <cngx-card as="button" [selectable]="true" [(selected)]="selectedHans"
               ariaLabel="Select patient Hans Huber">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:0.9375rem">Hans Huber</h3>
      </header>
      <div cngxCardBody>
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Room 7</span>
      </div>
    </cngx-card>
    <cngx-card as="button" [selectable]="true" [(selected)]="selectedLisa"
               ariaLabel="Select patient Lisa Lang">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:0.9375rem">Lisa Lang</h3>
      </header>
      <div cngxCardBody>
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Room 3</span>
      </div>
    </cngx-card>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Maria</span>
      <span class="event-value">{{ selectedMaria() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Hans</span>
      <span class="event-value">{{ selectedHans() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Lisa</span>
      <span class="event-value">{{ selectedLisa() }}</span>
    </div>
  </div>`,
};
