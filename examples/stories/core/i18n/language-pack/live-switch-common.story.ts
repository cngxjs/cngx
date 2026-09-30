import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: live switch, common',
  subtitle:
    'Card, chart, copy block, breadcrumb, chip, range slider, expandable text and timeline copy follow one language <code>Signal</code>: flip EN / DE and the labels switch at once, while a shown announcement keeps its text until the next change.',
  description:
    'The card, chart, interactive, display, layout and timeline copy is fed from computed signals through <code>viewProviders</code>. The copy inputs are left unbound, so each one follows its token; bind an input and it wins over the token as before.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: [
    'CngxCard',
    'CngxChart',
    'CngxCopyBlock',
    'CngxBreadcrumb',
    'CngxChip',
    'CngxRangeSlider',
    'CngxExpandableText',
    'CngxTimeline',
  ],
  moduleImports: [
    "import { CngxCard, provideCardI18n, withCardI18nLabels } from '@cngx/common/card';",
    "import { CngxChart, provideChartI18n } from '@cngx/common/chart';",
    "import { CngxChip, provideDisplayI18n, withDisplayI18nLabels } from '@cngx/common/display';",
    "import { CngxBreadcrumb, CngxCopyBlock, CngxRangeSlider, provideInteractiveI18n, withInteractiveI18nLabels } from '@cngx/common/interactive';",
    "import { CngxExpandableText, provideLayoutI18n, withLayoutI18nLabels } from '@cngx/common/layout';",
    "import { CngxTimelineItemTpl, provideTimelineConfigAt, withTimelineLabels } from '@cngx/common/timeline';",
    "import { CngxTimeline } from '@cngx/ui/timeline';",
    "import { buildAsyncStateView } from '@cngx/core/utils';",
    "import { DEMO_CARD_LABELS, DEMO_CHART_LABELS, DEMO_DISPLAY_LABELS, DEMO_INTERACTIVE_LABELS, DEMO_LANG, DEMO_LAYOUT_LABELS, DEMO_TIMELINE_LABELS } from '../../../../fixtures';",
  ],
  imports: [
    'CngxCard',
    'CngxChart',
    'CngxCopyBlock',
    'CngxBreadcrumb',
    'CngxChip',
    'CngxRangeSlider',
    'CngxExpandableText',
    'CngxTimeline',
    'CngxTimelineItemTpl',
  ],
  viewProviders: [
    'provideCardI18n(withCardI18nLabels(DEMO_CARD_LABELS))',
    'provideChartI18n(DEMO_CHART_LABELS)',
    'provideDisplayI18n(withDisplayI18nLabels(DEMO_DISPLAY_LABELS))',
    'provideInteractiveI18n(withInteractiveI18nLabels(DEMO_INTERACTIVE_LABELS))',
    'provideLayoutI18n(withLayoutI18nLabels(DEMO_LAYOUT_LABELS))',
    '...provideTimelineConfigAt(withTimelineLabels(DEMO_TIMELINE_LABELS))',
  ],
  setup: `protected readonly range = signal<[number, number]>([20, 80]);
  protected readonly noData = buildAsyncStateView<readonly number[]>({
    status: signal('success' as const),
    data: signal<readonly number[]>([]),
    error: signal(undefined),
  });
  protected readonly noEvents: readonly { readonly at: Date }[] = [];
  protected readonly at = (event: { readonly at: Date }): Date => event.at;`,
  template: `
  <div class="demo-stack">
    <cngx-card as="button" [selectable]="true">Selectable card</cngx-card>

    <cngx-chart [data]="[]" [state]="noData" [width]="240" [height]="80" />

    <cngx-copy-block [value]="'npm install @cngx/common'">
      <code>npm install &#64;cngx/common</code>
    </cngx-copy-block>

    <nav cngxBreadcrumb class="cngx-breadcrumb">
      <ol>
        <li><a href="#">Home</a></li>
        <li><a href="#" aria-current="page">Reports</a></li>
      </ol>
    </nav>

    <cngx-chip [removable]="true">Draft</cngx-chip>

    <cngx-range-slider [(value)]="range" [min]="0" [max]="100" />

    <cngx-expandable-text [lines]="1" [expanded]="true">
      A short note that stays expanded, so the toggle is always shown.
    </cngx-expandable-text>

    <cngx-timeline [items]="noEvents" [dateAccessor]="at">
      <ng-template cngxTimelineItem let-event>{{ event.at }}</ng-template>
    </cngx-timeline>
  </div>`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>`,
};
