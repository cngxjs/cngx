import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: radio indicator with the check skin',
  subtitle: '<code>provideRadioConfigAt(withRadioSkin(\'check\'))</code> in <code>viewProviders</code> reaches the radio indicators the panel renders. No input on the select.',
  description: 'The panel composes <code>cngx-radio-indicator</code> for <code>selectionIndicatorVariant="radio"</code>, and the indicator reads <code>CNGX_RADIO_CONFIG</code>, so a scoped config re-skins every panel below it. Arrow through the options with the panel open: the keyboard-highlighted row keeps a visible ring and check, also under forced colors.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxRadioIndicator',
  ],
  moduleImports: [
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { provideRadioConfigAt, withRadioSkin } from \'@cngx/common/display\';',
  ],
  imports: ['CngxSelect'],
  viewProviders: ['provideRadioConfigAt(withRadioSkin(\'check\'))'],
  setup: `protected readonly plans: CngxSelectOptionDef<string>[] = [
    { value: 'starter', label: 'Starter' },
    { value: 'team', label: 'Team' },
    { value: 'business', label: 'Business' },
    { value: 'legacy', label: 'Legacy', disabled: true },
  ];
  protected readonly plan = signal<string | undefined>('team');`,
  template: `  <cngx-select
    [label]="'Plan'"
    [options]="plans"
    [(value)]="plan"
    placeholder="Pick a plan…"
    selectionIndicatorVariant="radio"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Skin</span><span class="event-value">check (scoped config)</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ plan() || '-' }}</span></div>
  </div>`,
};
