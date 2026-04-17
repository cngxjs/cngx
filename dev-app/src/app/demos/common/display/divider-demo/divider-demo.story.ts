import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Divider',
  navLabel: 'Divider',
  navCategory: 'display',
  description:
    'Presentational separator with proper ARIA semantics. Horizontal or vertical, optionally inset.',
  apiComponents: ['CngxDivider'],
  overview:
    '<p><code>cngx-divider</code> renders <code>role="separator"</code> + <code>aria-orientation</code>. ' +
    'Visual style is driven by CSS custom properties so consumers can restyle without subclassing.</p>',
  moduleImports: ["import { CngxDivider } from '@cngx/common/display';"],
  sections: [
    {
      title: 'Horizontal vs vertical',
      subtitle:
        'Default orientation is horizontal. Use vertical in flex rows to split inline content.',
      imports: ['CngxDivider'],
      template: `
  <div class="section">First row</div>
  <cngx-divider></cngx-divider>
  <div class="section">Second row</div>
  <div class="inline-row">
    <span>left</span>
    <cngx-divider orientation="vertical"></cngx-divider>
    <span>right</span>
  </div>`,
      css: `.section { padding: 8px 0; }
.inline-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.cngx-divider {
  display: block;
  background: var(--cngx-divider-color, #d0d5dd);
  align-self: stretch;
}
.cngx-divider[aria-orientation="horizontal"] {
  height: var(--cngx-divider-thickness, 1px);
  width: 100%;
  margin: 4px 0;
}
.cngx-divider[aria-orientation="vertical"] {
  width: var(--cngx-divider-thickness, 1px);
  min-height: 1em;
}
.cngx-divider--inset {
  margin-inline: var(--cngx-divider-inset, 16px);
}`,
    },
    {
      title: 'Inset',
      subtitle:
        'The <code>inset</code> modifier adds margin on the inline axis — useful inside lists.',
      imports: ['CngxDivider'],
      template: `
  <div class="section">Item A</div>
  <cngx-divider [inset]="true"></cngx-divider>
  <div class="section">Item B</div>`,
    },
  ],
};
