import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stacked Bar',
  navLabel: 'Stacked Bar',
  navCategory: 'chart',
  description:
    'Single-bar composition visualising proportional shares of a fixed total. Pure DOM; ARIA enumerates segments + total.',
  apiComponents: ['CngxStackedBar'],
  moduleImports: [
    "import { CngxStackedBar } from '@cngx/common/chart';",
  ],
  sections: [
    {
      title: 'Proportional share strips',
      subtitle: 'Each segment is a labelled coloured slice; ARIA lists them in order with the total.',
      imports: ['CngxStackedBar'],
      template: `
  <div style="display:flex;flex-direction:column;gap:16px;max-width:400px">
    <div>
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">Storage usage</div>
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
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">Browser breakdown</div>
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
    },
  ],
};
