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
  overview:
    '<p><code>cngx-card</code> uses the host element as the semantic role — no inner wrapper. ' +
    'The <code>as</code> input sets the archetype: <code>"article"</code> (display), <code>"button"</code> (action), or <code>"link"</code> (navigation).</p>' +
    '<p>Selection is a two-way <code>model()</code>. Disabled cards communicate <em>why</em> via <code>aria-describedby</code>.</p>',
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardSubtitle, CngxCardBody, CngxCardMedia, CngxCardFooter, CngxCardActions, CngxCardAccent, CngxCardSkeleton } from '@cngx/common/card';",
    "import { CngxExpandableText, CngxExpandableToggle } from '@cngx/common/layout';",
    "import { CngxDisclosure } from '@cngx/common/interactive';",
  ],
  setup: `
  protected selected = signal(false);
  protected loading = signal(false);
  `,
  sections: [
    {
      title: 'Title + Subtitle + Footer',
      subtitle:
        '<code>[cngxCardTitle]</code> and <code>[cngxCardSubtitle]</code> provide consistent typography inside the header.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxCardFooter'],
      template: `
  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Patient Overview</h3>
        <span cngxCardSubtitle>Maria Muster, Room 12</span>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--text-muted)">Status: Active. Last vitals normal.</p>
      </div>
      <footer cngxCardFooter>
        <small style="color:var(--text-muted)">Last updated: today</small>
      </footer>
    </cngx-card>
  </div>`,
    },
    {
      title: 'Card with Image',
      subtitle:
        '<code>[cngxCardMedia]</code> handles full-bleed images with <code>aspectRatio</code> and <code>decorative</code> inputs.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxCardMedia'],
      template: `
  <div style="max-width:320px">
    <cngx-card>
      <div cngxCardMedia [decorative]="false" aspectRatio="16/9">
        <img src="https://picsum.photos/seed/cngx/640/360" alt="Landscape photo" />
      </div>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Beautiful Place</h3>
        <span cngxCardSubtitle>Somewhere in the mountains</span>
      </header>
      <div cngxCardBody>
        <p style="margin:0;color:var(--text-muted);font-size:0.875rem">
          A scenic view with full-bleed image using aspect-ratio 16/9.
        </p>
      </div>
    </cngx-card>
  </div>`,
    },
    {
      title: 'Severity Accent',
      subtitle:
        '<code>[cngxCardAccent]</code> adds a colored top border + tinted background. Five severity levels.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardAccent'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
    <cngx-card cngxCardAccent="danger">
      <header cngxCardHeader><h3 cngxCardTitle>Danger</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">Critical alert</div>
    </cngx-card>
    <cngx-card cngxCardAccent="warning">
      <header cngxCardHeader><h3 cngxCardTitle>Warning</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">Needs attention</div>
    </cngx-card>
    <cngx-card cngxCardAccent="success">
      <header cngxCardHeader><h3 cngxCardTitle>Success</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">All clear</div>
    </cngx-card>
    <cngx-card cngxCardAccent="info">
      <header cngxCardHeader><h3 cngxCardTitle>Info</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">For your information</div>
    </cngx-card>
    <cngx-card cngxCardAccent="neutral">
      <header cngxCardHeader><h3 cngxCardTitle>Neutral</h3></header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">Default state</div>
    </cngx-card>
  </div>`,
    },
    {
      title: 'Skeleton Loading',
      subtitle:
        '<code>cngx-card-skeleton</code> replaces content during loading. Toggle to compare skeleton vs. real content.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardSkeleton'],
      template: `
  <div class="button-row" style="margin-bottom:12px">
    <button (click)="loading.update(v => !v)">Toggle loading</button>
  </div>
  <div style="max-width:320px">
    <cngx-card [loading]="loading()">
      @if (loading()) {
        <cngx-card-skeleton [lines]="2" />
      } @else {
        <header cngxCardHeader>
          <h3 cngxCardTitle>Vitals Overview</h3>
        </header>
        <div cngxCardBody>
          <p style="margin:0;color:var(--text-muted)">Heart rate, blood pressure, SpO2 values from the last 24 hours.</p>
        </div>
      }
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
    {
      title: 'Card with Expandable Text',
      subtitle:
        'Long card content with <code>cngx-expandable-text</code> — truncated to 3 lines with a read-more toggle.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxExpandableText', 'CngxExpandableToggle'],
      template: `
  <div style="max-width:400px">
    <cngx-card>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Patient Notes</h3>
      </header>
      <div cngxCardBody>
        <cngx-expandable-text [lines]="3" #exp="cngxExpandableText">
          Patient Maria Muster was admitted on 15.03.2026 with recurring lower back pain.
          Initial assessment shows limited range of motion in lumbar spine. Prescribed
          physiotherapy 3x weekly. Follow-up MRI scheduled for 01.04.2026. Patient reports
          pain level 6/10 on admission, reduced to 4/10 after initial treatment.
          Medication adjusted: Ibuprofen 400mg 3x daily, Pantoprazol 20mg 1x daily.
          Social history: lives alone, needs home care support for daily activities.
          Next evaluation planned for 22.03.2026.
          <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
            <button (click)="toggle()" class="chip" style="margin-top:8px">
              {{ expanded ? 'Show less' : 'Read more' }}
            </button>
          </ng-template>
        </cngx-expandable-text>
      </div>
    </cngx-card>
  </div>`,
    },
    {
      title: 'Card with Disclosure (Expand/Collapse)',
      subtitle:
        'Card header as disclosure trigger — click to expand/collapse the body content. Uses <code>cngxDisclosure</code> from interactive.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxDisclosure'],
      template: `
  <div style="max-width:400px;display:flex;flex-direction:column;gap:12px">
    <cngx-card>
      <header cngxCardHeader cngxDisclosure #d1="cngxDisclosure" [controls]="'detail-1'"
              style="cursor:pointer;user-select:none">
        <h3 cngxCardTitle>1000004: Angst</h3>
        <span cngxCardSubtitle>Status: Aktiv | {{ d1.opened() ? 'Expanded' : 'Collapsed' }}</span>
      </header>
      @if (d1.opened()) {
        <div cngxCardBody id="detail-1">
          <p style="margin:0;color:var(--text-muted);font-size:0.875rem">
            Hat vorbeugende/therapeutische Massnahmen erlernt und wendet sie an.
            Evaluierungsdatum: 17.10.2025. Setzt Hilfsmittel fachgerecht und
            selbststaendig ein. Evaluierungsdatum: 27.03.2026.
          </p>
        </div>
      }
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader cngxDisclosure #d2="cngxDisclosure" [controls]="'detail-2'"
              style="cursor:pointer;user-select:none">
        <h3 cngxCardTitle>3000004: Denkprozess veraendert</h3>
        <span cngxCardSubtitle>Status: Aktiv | {{ d2.opened() ? 'Expanded' : 'Collapsed' }}</span>
      </header>
      @if (d2.opened()) {
        <div cngxCardBody id="detail-2">
          <p style="margin:0;color:var(--text-muted);font-size:0.875rem">
            Gefahrenquellen in der Wohnung sind reduziert/ausgeschaltet.
            Kann Tagesablauf selbst gestalten.
          </p>
        </div>
      }
    </cngx-card>
  </div>`,
    },
  ],
};
