import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverSheet: Fullscreen search panel',
  subtitle:
    'A panel led by a search input opens fullscreen on a phone, with focus already in the input so the keyboard comes up with the tap.',
  description:
    'Set <code>autoPresentation="fullscreen"</code> for panels whose first job is typing. <code>cngxPopoverSheetInitialFocus</code> marks the input; the sheet focuses it synchronously inside <code>show()</code>, which runs within the opening tap, so iOS keeps the soft keyboard open. Below the fixed header only the result list scrolls. The match count is announced through <code>sheet.announce()</code>, which speaks from a live region inside the panel: under <code>aria-modal</code>, VoiceOver ignores regions on the page body. On a desktop the same markup stays an anchored panel.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxPopoverSheet', 'CngxPopoverSheetInitialFocus'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverSheet, CngxPopoverSheetHeader, CngxPopoverSheetInitialFocus, CngxPopoverSheetTitle, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import { CngxCloseButton } from '@cngx/common/button';",
  ],
  imports: [
    'CngxPopover',
    'CngxPopoverTrigger',
    'CngxPopoverSheet',
    'CngxPopoverSheetHeader',
    'CngxPopoverSheetTitle',
    'CngxPopoverSheetInitialFocus',
    'CngxCloseButton',
  ],
  setup: `protected readonly query = signal('');
  private readonly countries = [
    'Austria', 'Belgium', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia',
    'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy',
    'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland',
    'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  ];
  protected readonly matches = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.countries.filter((c) => c.toLowerCase().includes(q)) : this.countries;
  });
  protected handleQuery(value: string, sheet: CngxPopoverSheet): void {
    this.query.set(value);
    const count = this.matches().length;
    sheet.announce(count === 1 ? '1 country matches' : count + ' countries match');
  }`,
  template: `<button type="button" [cngxPopoverTrigger]="pop" (click)="pop.show()">Search countries</button>
  <div
    cngxPopover
    #pop="cngxPopover"
    class="demo-popover-surface"
    placement="bottom-start"
    [cngxPopoverSheet]="presentation()"
    autoPresentation="fullscreen"
    #sheet="cngxPopoverSheet"
  >
    <header cngxPopoverSheetHeader>
      <h2 cngxPopoverSheetTitle style="margin: 0; font-size: 1rem; flex: 1">Country</h2>
      <button cngxCloseButton aria-label="Close" (click)="sheet.requestClose('close')"></button>
      <input
        cngxPopoverSheetInitialFocus
        type="search"
        aria-label="Search countries"
        style="flex: 1 1 100%"
        [value]="query()"
        (input)="handleQuery($any($event.target).value, sheet)"
      />
    </header>
    <ul style="margin: 0; padding: 0; list-style: none">
      @for (name of matches(); track name) {
        <li style="padding: 12px 0">{{ name }}</li>
      } @empty {
        <li style="padding: 12px 0">No country matches.</li>
      }
    </ul>
  </div>`,
  setupChrome: `protected readonly presentation = signal<'auto' | 'fullscreen' | 'anchored'>('auto');`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Presentation">
    @for (mode of ['auto', 'fullscreen', 'anchored']; track mode) {
      <label>
        <input type="radio" name="search-presentation" [value]="mode"
          [checked]="presentation() === mode"
          (change)="presentation.set($any(mode))" />
        {{ mode }}
      </label>
    }
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">presentation</span>
      <span class="event-value">{{ sheet.presentation() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">matches</span>
      <span class="event-value">{{ matches().length }}</span>
    </div>
  </div>`,
};
