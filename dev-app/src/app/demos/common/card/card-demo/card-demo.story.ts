import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card',
  navLabel: 'Card',
  navCategory: 'card',
  description:
    'Semantic card component with three archetypes: display (article), action (button), and link. Supports selection, loading, disabled with reason, and SR live announcements.',
  apiComponents: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardBody',
    'CngxCardMedia',
    'CngxCardFooter',
    'CngxCardActions',
    'CngxCardBadge',
  ],
  overview:
    '<p><code>cngx-card</code> uses the host element as the semantic role — no inner wrapper. ' +
    'The <code>as</code> input sets the archetype: <code>"article"</code> (display), <code>"button"</code> (action), or <code>"link"</code> (navigation).</p>' +
    '<p>Selection is a two-way <code>model()</code>. Disabled cards communicate <em>why</em> via <code>aria-describedby</code>.</p>',
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardBody, CngxCardFooter, CngxCardActions } from '@cngx/common/card';",
  ],
  setup: `
  protected selected = signal(false);
  protected loading = signal(false);
  `,
  sections: [
    {
      title: 'Display Card (article)',
      subtitle:
        'Default archetype. No primary action — <code>role="article"</code> on the host.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody', 'CngxCardFooter'],
      template: `
  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:1rem">Patient Overview</h3>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--text-muted)">Maria Muster, Room 12</p>
        <p style="margin:4px 0 0;font-size:0.875rem;color:var(--text-muted)">Status: Active</p>
      </div>
      <footer cngxCardFooter>
        <small style="color:var(--text-muted)">Last updated: today</small>
      </footer>
    </cngx-card>
  </div>`,
    },
    {
      title: 'Action Card with Selection',
      subtitle:
        'The entire card is clickable. <code>[(selected)]</code> toggles on click and keyboard. Try clicking the cards.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:660px">
    <cngx-card as="button" [selectable]="true" [(selected)]="selected"
               ariaLabel="Select patient Maria Muster">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:0.9375rem">Maria Muster</h3>
      </header>
      <div cngxCardBody>
        <span style="font-size:0.8125rem;color:var(--text-muted)">Room 12</span>
      </div>
    </cngx-card>
    <cngx-card as="button" ariaLabel="View patient Hans Huber">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:0.9375rem">Hans Huber</h3>
      </header>
      <div cngxCardBody>
        <span style="font-size:0.8125rem;color:var(--text-muted)">Room 7</span>
      </div>
    </cngx-card>
    <cngx-card as="button" ariaLabel="View patient Lisa Lang">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:0.9375rem">Lisa Lang</h3>
      </header>
      <div cngxCardBody>
        <span style="font-size:0.8125rem;color:var(--text-muted)">Room 3</span>
      </div>
    </cngx-card>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">selected</span>
      <span class="event-value">{{ selected() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Loading State',
      subtitle:
        'Sets <code>aria-busy="true"</code> and announces "Loading" via SR live region. Toggle to see the visual effect.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody'],
      template: `
  <div class="button-row" style="margin-bottom:12px">
    <button (click)="loading.update(v => !v)">Toggle loading</button>
  </div>
  <div style="max-width:300px">
    <cngx-card [loading]="loading()">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:1rem">Vitals</h3>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--text-muted)">Heart rate, blood pressure, SpO2</p>
      </div>
    </cngx-card>
  </div>`,
    },
    {
      title: 'Disabled with Reason',
      subtitle:
        'Communicates <em>why</em> via <code>aria-describedby</code>. Inspect the card in devtools — the disabled-reason span is always in the DOM.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody'],
      template: `
  <div style="max-width:400px">
    <cngx-card as="button" [disabled]="true"
               disabledReason="Only nursing staff can edit residents"
               ariaLabel="Edit resident">
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:1rem">Edit Resident</h3>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--text-muted)">This card is disabled with a reason</p>
      </div>
    </cngx-card>
  </div>`,
    },
    {
      title: 'Interactive Card with Actions',
      subtitle:
        'Multiple independent actions inside. The card itself is <code>role="article"</code> — the buttons carry the interaction.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardBody', 'CngxCardActions'],
      template: `
  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 style="margin:0;font-weight:600;font-size:1rem">Pflegeplan</h3>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--text-muted)">Next evaluation: 18.07.2025</p>
      </div>
      <div cngxCardActions align="end">
        <button class="chip">Edit</button>
        <button class="chip">Delete</button>
      </div>
    </cngx-card>
  </div>`,
    },
  ],
};
