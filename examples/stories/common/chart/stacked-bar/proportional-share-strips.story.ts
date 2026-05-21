import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStackedBar: Proportional share strips',
  subtitle:
    'Each segment is a labelled coloured slice; ARIA enumerates them in order with the total so screen readers can read the breakdown without a separate legend.',
  description:
    'Two storage / browser breakdown bars use the same segment list shape: <code>{ value, color, label }</code>. Segments paint left-to-right in declaration order; the bar itself owns the proportional math, so consumers do not pre-compute percentages.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxStackedBar'],
  moduleImports: ["import { CngxStackedBar } from '@cngx/common/chart';"],
  imports: ['CngxStackedBar'],
  template: `  <div style="display:flex;flex-direction:column;gap:16px;max-width:400px">
    <div>
      <div class="cngx-ex-status-readout" style="margin-bottom:4px">Storage usage</div>
      <cngx-stacked-bar
        [segments]="[
          { value: 32, color: '#4c8bf5', label: 'Documents' },
          { value: 28, color: '#7d8997', label: 'Photos' },
          { value: 18, color: '#1f9d55', label: 'Apps' },
          { value: 12, color: '#d2452f', label: 'System' }
        ]"
      />
    </div>
    <div>
      <div class="cngx-ex-status-readout" style="margin-bottom:4px">Browser breakdown</div>
      <cngx-stacked-bar
        [segments]="[
          { value: 65, color: '#4c8bf5', label: 'Chrome' },
          { value: 18, color: '#1f9d55', label: 'Safari' },
          { value: 10, color: '#d2452f', label: 'Firefox' },
          { value: 7, color: '#7d8997', label: 'Other' }
        ]"
      />
    </div>
  </div>`,
};
