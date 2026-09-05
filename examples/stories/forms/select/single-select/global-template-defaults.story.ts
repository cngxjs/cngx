import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: global template defaults via withTemplates',
  subtitle:
    '<code>provideSelectConfig(withTemplates({ placeholder, empty }))</code> sets default slot templates for every select below the provider - the per-slot cascade stays: a projected <code>*cngxSelectPlaceholder</code> still wins over the config default, and unset slots keep the library built-ins. <code>TemplateRef</code>s need a live view, so in an app the templates live in a shell component and the selects in routed content rendered after it; the <code>@defer</code> block stands in for that here.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect', 'CngxSelectPlaceholder'],
  moduleImports: [
    "import { forwardRef, TemplateRef } from '@angular/core';",
    "import { CNGX_SELECT_CONFIG, CngxSelect, CngxSelectPlaceholder, makeSelectConfig, withTemplates, type CngxSelectOptionDef, type CngxSelectEmptyContext, type CngxSelectPlaceholderContext } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect', 'CngxSelectPlaceholder'],
  viewProviders: [
    '{ provide: CNGX_SELECT_CONFIG, useFactory: (host: SingleSelectGlobalTemplateDefaults) => makeSelectConfig(withTemplates({ placeholder: host.configPlaceholder(), empty: host.configEmpty() })), deps: [forwardRef(() => SingleSelectGlobalTemplateDefaults)] }',
  ],
  setup: `readonly configPlaceholder = viewChild.required<TemplateRef<CngxSelectPlaceholderContext>>('configPlaceholder');
  readonly configEmpty = viewChild.required<TemplateRef<CngxSelectEmptyContext>>('configEmpty');
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly defaultValue = signal<string | undefined>(undefined);
  protected readonly projectedValue = signal<string | undefined>(undefined);`,
  template: `  <ng-template #configPlaceholder let-text>
    <span class="demo-placeholder-muted"><span aria-hidden="true">🌐</span> <em>{{ text }}</em></span>
  </ng-template>
  <ng-template #configEmpty>
    <em>No options loaded yet</em>
  </ng-template>

  @defer (on timer(1ms)) {
    <cngx-select
      [label]="'Config defaults apply'"
      [options]="[]"
      [(value)]="defaultValue"
      placeholder="Pick a color…"
    />
    <cngx-select
      [label]="'Projected slot wins'"
      [options]="colors"
      [(value)]="projectedValue"
      placeholder="Pick a color…"
    >
      <ng-template cngxSelectPlaceholder let-text>
        <strong>{{ text }}</strong> (projected)
      </ng-template>
    </cngx-select>
  }`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">First select</span><span class="event-value">config placeholder template; open it for the config empty template</span></div>
    <div class="event-row"><span class="event-label">Second select</span><span class="event-value">projected placeholder beats the config default - value: {{ projectedValue() || '-' }}</span></div>
  </div>`,
};
