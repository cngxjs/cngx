import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: unbound defaults',
  subtitle:
    'Every surface here renders its library default copy: no <code>label</code>, <code>placeholder</code> or <code>valueTextFormat</code> is bound. Open the page with <code>?lang=de</code> and the German pack replaces each string through its DI token.',
  description:
    'The i18n surfaces whose defaults no other story shows unbound: the loading indicator and overlay label, the progress label, the goal value text, the select-search placeholder and the banner action-failure message.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  apiComponents: [
    'CngxLoadingIndicator',
    'CngxLoadingOverlay',
    'CngxProgress',
    'CngxGoal',
    'CngxSelectShell',
    'CngxSelectSearch',
    'CngxSelectOption',
  ],
  moduleImports: [
    "import { CngxBanner, CngxLoadingIndicator, CngxLoadingOverlay, CngxProgress } from '@cngx/ui/feedback';",
    "import { CngxGoal } from '@cngx/common/data';",
    "import { CngxSelectShell, CngxSelectOption, CngxSelectSearch } from '@cngx/forms/select';",
  ],
  imports: [
    'CngxLoadingIndicator',
    'CngxLoadingOverlay',
    'CngxProgress',
    'CngxGoal',
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectSearch',
  ],
  setup: `protected readonly fruit = signal<string | undefined>(undefined);`,
  template: `
  <div class="demo-stack">
    <cngx-loading-indicator [loading]="true" />
    <cngx-loading-overlay [loading]="true">
      <div class="demo-frame-padded">Overlaid content</div>
    </cngx-loading-overlay>
    <cngx-progress />
    <cngx-goal [value]="73" [max]="100" />
    <cngx-select-shell [label]="'Fruit'" [(value)]="fruit">
      <cngx-select-search />
      <cngx-option [value]="'Apple'">Apple</cngx-option>
      <cngx-option [value]="'Banana'">Banana</cngx-option>
      <cngx-option [value]="'Cherry'">Cherry</cngx-option>
    </cngx-select-shell>
  </div>`,
  setupChrome: `private readonly banner = inject(CngxBanner);
  protected showFailingBanner(): void {
    this.banner.show({
      message: 'Sync paused.',
      id: 'i18n:failing',
      severity: 'warning',
      action: {
        label: 'Retry sync',
        handler: () => Promise.reject(new Error('offline')),
      },
    });
  }`,
  templateChrome: `
  <div class="button-row">
    <button (click)="showFailingBanner()" class="chip" type="button">Show failing banner</button>
  </div>`,
};
