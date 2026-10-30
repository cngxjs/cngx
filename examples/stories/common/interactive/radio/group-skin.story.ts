import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioGroup: Group skin',
  subtitle: '<code>skin="tinted"</code> on the group reaches every radio; <code>skin="check"</code> on one radio wins over it.',
  description: 'The indicator skin resolves per radio: its own <code>[skin]</code>, then the group\'s <code>[skin]</code>, then <code>provideRadioConfigAt</code> / <code>provideRadioConfig</code>, then <code>default</code>. Here the group is tinted and "Business" overrides to the check skin. Arrow through the group to see both skins checked.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxRadioGroup',
    'CngxRadio',
    'CngxRadioIndicator',
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly plan = signal<'starter' | 'team' | 'business' | undefined>('team');`,
  template: `
  <cngx-radio-group [(value)]="plan" label="Plan" skin="tinted">
    <cngx-radio value="starter">Starter</cngx-radio>
    <cngx-radio value="team">Team</cngx-radio>
    <cngx-radio value="business" skin="check">Business</cngx-radio>
  </cngx-radio-group>
  <p class="demo-radio-bound">Bound: <code>{{ plan() ?? '(none)' }}</code></p>`,
};
