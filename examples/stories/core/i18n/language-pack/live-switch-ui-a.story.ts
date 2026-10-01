import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: live switch, feedback and paginator',
  subtitle:
    'Feedback and paginator copy follow one language <code>Signal</code>: flip EN / DE and the region name, the nav buttons and the page status switch at once, while the spoken page change keeps its text until the next page.',
  description:
    'The feedback bundle and the paginator labels, announcements and status format are fed from computed signals through <code>viewProviders</code>. The paginator speaks page changes through a polite live region, so a language flip does not re-voice the current page; move to the next page and the announcement speaks German. Labels outside live regions switch immediately.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: ['CngxAlertStack', 'CngxPaginator', 'CngxPaginatorStatus'],
  moduleImports: [
    "import { CngxAlertStack, provideFeedbackI18n } from '@cngx/ui/feedback';",
    "import { CngxPaginator, CngxPaginatorNext, CngxPaginatorPrev, CngxPaginatorStatus, provideCngxPaginatorConfigAt, withPaginatorAnnouncements, withPaginatorAriaLabels, withPaginatorPageStatusFormat } from '@cngx/ui/paginator';",
    "import { DEMO_FEEDBACK_LABELS, DEMO_LANG, DEMO_PAGINATOR_ANNOUNCEMENTS, DEMO_PAGINATOR_ARIA_LABELS, DEMO_PAGINATOR_STATUS_FORMAT } from '../../../../fixtures';",
  ],
  imports: ['CngxAlertStack', 'CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorStatus', 'CngxPaginatorNext'],
  viewProviders: [
    'provideFeedbackI18n(DEMO_FEEDBACK_LABELS)',
    '...provideCngxPaginatorConfigAt(withPaginatorAriaLabels(DEMO_PAGINATOR_ARIA_LABELS), withPaginatorAnnouncements(DEMO_PAGINATOR_ANNOUNCEMENTS), withPaginatorPageStatusFormat(DEMO_PAGINATOR_STATUS_FORMAT))',
  ],
  setup: `protected readonly pageIndex = signal(0);`,
  template: `
  <div style="display:grid;gap:16px;max-width:420px">
    <cngx-alert-stack />
    <cngx-paginator [total]="100" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
      <cngx-pgn-prev />
      <cngx-pgn-status />
      <cngx-pgn-next />
    </cngx-paginator>
  </div>`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>`,
};
