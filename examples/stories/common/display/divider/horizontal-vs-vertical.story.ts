import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Horizontal vs vertical',
  subtitle: 'Default orientation is horizontal. Use vertical in flex rows to split inline content.',
  description: 'Presentational separator with proper ARIA semantics. Horizontal or vertical, optionally inset.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxDivider',
  ],
  moduleImports: [
    'import { CngxDivider } from \'@cngx/common/display\';',
  ],
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
};
