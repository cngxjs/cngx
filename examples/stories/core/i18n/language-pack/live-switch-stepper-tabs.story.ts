import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: live switch, stepper and tabs',
  subtitle:
    'Stepper and tabs copy follows one language <code>Signal</code>: flip EN / DE while a commit is pending and the labels switch at once, the pending announcement keeps its text, and the landing announcement speaks German.',
  description:
    'The stepper and tab-group i18n tokens and the <code>ariaLabels</code> / <code>fallbackLabels</code> config keys are fed from computed signals through <code>viewProviders</code>. Both organisms commit pessimistically with a short delay, so a flip can land mid-commit.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxTabGroup', 'CngxTab'],
  moduleImports: [
    "import { CngxStep, provideStepperConfigAt, provideStepperI18n, withStepperAriaLabels, withStepperFallbackLabels, withStepperI18nLabels, type CngxStepperCommitAction } from '@cngx/common/stepper';",
    "import { CngxTab, CngxTabContent, provideTabsConfigAt, provideTabsI18n, withTabsAriaLabels, withTabsFallbackLabels, withTabsI18nLabels, type CngxTabsCommitAction } from '@cngx/common/tabs';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
    "import { DEMO_LANG, DEMO_STEPPER_ARIA_LABELS, DEMO_STEPPER_FALLBACK_LABELS, DEMO_STEPPER_LABELS, DEMO_TABS_ARIA_LABELS, DEMO_TABS_FALLBACK_LABELS, DEMO_TABS_LABELS } from '../../../../fixtures';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  viewProviders: [
    'provideStepperI18n(withStepperI18nLabels(DEMO_STEPPER_LABELS))',
    '...provideStepperConfigAt(withStepperAriaLabels(DEMO_STEPPER_ARIA_LABELS), withStepperFallbackLabels(DEMO_STEPPER_FALLBACK_LABELS))',
    'provideTabsI18n(withTabsI18nLabels(DEMO_TABS_LABELS))',
    '...provideTabsConfigAt(withTabsAriaLabels(DEMO_TABS_ARIA_LABELS), withTabsFallbackLabels(DEMO_TABS_FALLBACK_LABELS))',
  ],
  setup: `private readonly delay = (): Promise<boolean> =>
    new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1500));
  protected readonly stepCommit: CngxStepperCommitAction = () => this.delay();
  protected readonly tabCommit: CngxTabsCommitAction = () => this.delay();`,
  template: `
  <div class="demo-stack">
    <cngx-stepper [commitAction]="stepCommit" commitMode="pessimistic">
      <div cngxStep label="Customer"></div>
      <div cngxStep label="Payment"></div>
      <div cngxStep label="Review"></div>
    </cngx-stepper>
    <cngx-tab-group [commitAction]="tabCommit" commitMode="pessimistic">
      <div cngxTab [label]="'Profile'">
        <ng-template cngxTabContent><p>Profile content.</p></ng-template>
      </div>
      <div cngxTab [label]="'Account'">
        <ng-template cngxTabContent><p>Account content.</p></ng-template>
      </div>
      <div cngxTab [label]="'Notifications'">
        <ng-template cngxTabContent><p>Notification preferences.</p></ng-template>
      </div>
    </cngx-tab-group>
  </div>`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>`,
};
