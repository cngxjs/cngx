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
    "import { CngxDisclosure, CngxSpeak } from '@cngx/common/interactive';",
    "import { CngxSpeakButton } from '@cngx/ui';",
  ],
  setup: `
  protected selected = signal(false);
  protected loading = signal(false);
  protected cardClicked = signal(0);
  protected badgeClicked = signal(0);

  protected handleBadgeClick(e: MouseEvent): void {
    e.stopPropagation();
    this.badgeClicked.update(n => n + 1);
  }
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
      title: 'Card with Badge',
      subtitle:
        '<code>[cngxCardBadge]</code> positions any element at a corner. Works on <code>&lt;span&gt;</code>, <code>&lt;button&gt;</code>, or <code>&lt;a&gt;</code>. ' +
        'Clickable badge on a button card: does the click bubble to the card or stay on the badge?',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody', 'CngxCardBadge'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;max-width:760px">
    <cngx-card style="overflow:visible">
      <span cngxCardBadge position="top-end"
            style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
                   border-radius:50%;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:700">
        P
      </span>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Static Badge</h3>
      </header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">
        Non-interactive span badge
      </div>
    </cngx-card>

    <cngx-card as="button" (clicked)="cardClicked.update(n => n + 1)"
               ariaLabel="Open care plan" style="overflow:visible">
      <button cngxCardBadge position="top-end"
              (click)="handleBadgeClick($event)"
              aria-label="Open permissions dialog"
              style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
                     border-radius:50%;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:700;
                     border:2px solid #fff;cursor:pointer;padding:0">
        P
      </button>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Clickable Badge</h3>
      </header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">
        Button card + button badge. Click each to test event bubbling.
      </div>
    </cngx-card>

    <cngx-card style="overflow:visible">
      <span cngxCardBadge position="top-start"
            style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e"
            role="status" aria-label="Online">
      </span>
      <header cngxCardHeader>
        <h3 cngxCardTitle>Status Dot</h3>
      </header>
      <div cngxCardBody style="font-size:0.875rem;color:var(--text-muted)">
        Badge at top-start
      </div>
    </cngx-card>
  </div>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Card clicked</span>
      <span class="event-value">{{ cardClicked() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Badge clicked</span>
      <span class="event-value">{{ badgeClicked() }}</span>
    </div>
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
        <h3 cngxCardTitle>Project Notes</h3>
      </header>
      <div cngxCardBody>
        <cngx-expandable-text [lines]="3" #exp="cngxExpandableText">
          The project was initialized on 15.03.2026 with a focus on improving user
          onboarding flows. Initial analysis shows a 34% drop-off rate on the second
          step. Proposed changes include simplifying the form layout, adding inline
          validation, and introducing a progress indicator. A/B testing is scheduled
          for 01.04.2026. Early user feedback indicates positive reception of the
          simplified layout. Additional requirements: SSO integration for enterprise
          customers, GDPR-compliant data handling for EU users.
          Next review planned for 22.03.2026.
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
        <h3 cngxCardTitle>Issue #1042: Anxiety Management</h3>
        <span cngxCardSubtitle>Status: Active | {{ d1.opened() ? 'Expanded' : 'Collapsed' }}</span>
      </header>
      @if (d1.opened()) {
        <div cngxCardBody id="detail-1">
          <p style="margin:0;color:var(--text-muted);font-size:0.875rem">
            Patient has learned preventive measures and applies them independently.
            Evaluation: 17.10.2025. Uses aids correctly. Next evaluation: 27.03.2026.
          </p>
        </div>
      }
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader cngxDisclosure #d2="cngxDisclosure" [controls]="'detail-2'"
              style="cursor:pointer;user-select:none">
        <h3 cngxCardTitle>Issue #3004: Cognitive Adjustment</h3>
        <span cngxCardSubtitle>Status: Active | {{ d2.opened() ? 'Expanded' : 'Collapsed' }}</span>
      </header>
      @if (d2.opened()) {
        <div cngxCardBody id="detail-2">
          <p style="margin:0;color:var(--text-muted);font-size:0.875rem">
            Hazard sources in the environment have been reduced.
            Can organize daily routine independently.
          </p>
        </div>
      }
    </cngx-card>
  </div>`,
    },
    {
      title: 'Card with Speak Badge',
      subtitle:
        'A <code>cngx-speak-button</code> positioned as a badge reads the card content aloud. ' +
        'The <code>[cngxSpeak]</code> directive on the card body provides the text; the button connects via <code>[speakRef]</code>.',
      imports: ['CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardSubtitle', 'CngxCardBody', 'CngxCardBadge', 'CngxSpeak', 'CngxSpeakButton'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;max-width:760px">
    <cngx-card style="overflow:visible">
      <cngx-speak-button cngxCardBadge position="top-end" [speakRef]="tts1"
                          class="speak-btn-round" />
      <header cngxCardHeader>
        <h3 cngxCardTitle>Project Summary</h3>
        <span cngxCardSubtitle>Q1 2026</span>
      </header>
      <div cngxCardBody
           [cngxSpeak]="'Project Summary, Q1 2026. 12 features shipped. 3 bugs resolved. 98 percent uptime. Next milestone: public beta in April.'"
           [enabled]="false"
           #tts1="cngxSpeak">
        <p style="margin:0 0 4px;color:var(--text-muted);font-size:0.875rem">
          12 features shipped
        </p>
        <p style="margin:0 0 4px;color:var(--text-muted);font-size:0.875rem">
          3 bugs resolved
        </p>
        <p style="margin:0;color:var(--text-muted);font-size:0.875rem">
          98% uptime &mdash; next: public beta
        </p>
      </div>
    </cngx-card>

    <cngx-card style="overflow:visible">
      <cngx-speak-button cngxCardBadge position="top-end" [speakRef]="tts2"
                          class="speak-btn-round" />
      <header cngxCardHeader>
        <h3 cngxCardTitle>Team Updates</h3>
        <span cngxCardSubtitle>Latest activity</span>
      </header>
      <div cngxCardBody
           [cngxSpeak]="'Team Updates. Anna completed the dashboard redesign. Ben merged the API refactor. Clara started the accessibility audit.'"
           [enabled]="false"
           #tts2="cngxSpeak">
        <p style="margin:0 0 4px;color:var(--text-muted);font-size:0.875rem">
          Anna: Dashboard redesign done
        </p>
        <p style="margin:0 0 4px;color:var(--text-muted);font-size:0.875rem">
          Ben: API refactor merged
        </p>
        <p style="margin:0;color:var(--text-muted);font-size:0.875rem">
          Clara: A11y audit started
        </p>
      </div>
    </cngx-card>
  </div>`,
    },
  ],
};
