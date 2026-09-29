import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: live switch',
  subtitle:
    'The reactive-ready surfaces take a <code>Signal</code>: flip EN / DE and their labels and number formats re-render without a reload. A live region keeps its shown text until the next status change, which then speaks German.',
  description:
    'KPI, display, interactive and popover-panel copy plus <code>CNGX_LOCALE</code> are fed from one language signal through <code>viewProviders</code>. Only these surfaces switch live; other tokens still resolve at construction.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: [
    'CngxDelta',
    'CngxTrend',
    'CngxGoal',
    'CngxAvatar',
    'CngxAvatarGroup',
    'CngxSegmentedProgress',
    'CngxPopoverPanel',
    'CngxActionButton',
    'CngxProgress',
  ],
  moduleImports: [
    "import { CngxDelta, CngxGoal, CngxTrend, provideKpiI18n, withKpiI18nLabels } from '@cngx/common/data';",
    "import { CngxAvatar, CngxAvatarGroup, CngxSegmentedProgress, provideDisplayI18n, withDisplayI18nLabels } from '@cngx/common/display';",
    "import { provideInteractiveI18n, withInteractiveI18nLabels } from '@cngx/common/interactive';",
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverBody, providePopoverPanel, withPopoverPanelLabels } from '@cngx/common/popover';",
    "import { provideLocaleAt } from '@cngx/core/utils';",
    "import { CngxActionButton } from '@cngx/ui/action-button';",
    "import { CngxProgress } from '@cngx/ui/feedback';",
    "import { DEMO_DISPLAY_LABELS, DEMO_INTERACTIVE_LABELS, DEMO_KPI_LABELS, DEMO_LANG, DEMO_LOCALE, DEMO_POPOVER_PANEL_LABELS } from '../../../../fixtures';",
  ],
  imports: [
    'CngxDelta',
    'CngxTrend',
    'CngxGoal',
    'CngxAvatar',
    'CngxAvatarGroup',
    'CngxSegmentedProgress',
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverBody',
    'CngxActionButton',
    'CngxProgress',
  ],
  viewProviders: [
    'provideKpiI18n(withKpiI18nLabels(DEMO_KPI_LABELS))',
    'provideDisplayI18n(withDisplayI18nLabels(DEMO_DISPLAY_LABELS))',
    'provideInteractiveI18n(withInteractiveI18nLabels(DEMO_INTERACTIVE_LABELS))',
    'providePopoverPanel(withPopoverPanelLabels(DEMO_POPOVER_PANEL_LABELS))',
    'provideLocaleAt(DEMO_LOCALE)',
  ],
  setup: `protected readonly save = () => new Promise<void>((resolve) => setTimeout(resolve, 200));`,
  template: `
  <div class="demo-stack">
    <cngx-delta [value]="-2.1" />
    <cngx-trend [value]="5.3" />
    <cngx-goal [value]="73" [max]="100" />
    <cngx-avatar initials="AL" status="busy" />
    <cngx-avatar-group>
      <cngx-avatar initials="AL" />
      <cngx-avatar initials="GH" />
    </cngx-avatar-group>
    <cngx-segmented-progress [value]="2" [total]="4" />
    <div>
      <button type="button" class="chip" [cngxPopoverTrigger]="info.popover" (click)="info.popover.toggle()">
        Details
      </button>
      <cngx-popover-panel #info [showClose]="true" placement="bottom">
        <p cngxPopoverBody>Quarterly figures.</p>
      </cngx-popover-panel>
    </div>
    <cngx-action-button [action]="save" [feedbackDuration]="30000">Save</cngx-action-button>
    <cngx-progress [progress]="42" />
  </div>`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>`,
};
