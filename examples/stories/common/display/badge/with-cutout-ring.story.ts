import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBadge: With cut-out ring',
  subtitle: 'Set <code>--cngx-badge-border</code> to add a contrast ring around the indicator.',
  description: 'The default border is <code>0</code> so the indicator reads as a flat pill flush against its host. Set <code>--cngx-badge-border</code> at the consumer level when the badge needs to cut out from a busy or low-contrast host surface. Here the inline override paints a 2px ring matching the page background, so the badge reads as a stamped pill rather than blending into the chip border.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxBadge',
  ],
  moduleImports: [
    'import { CngxBadge } from \'@cngx/common/display\';',
  ],
  imports: ['CngxBadge'],
  template: `
  <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap">
    <button type="button" class="chip" [cngxBadge]="3">No ring (default)</button>
    <button
      type="button"
      class="chip"
      [cngxBadge]="3"
      style="--cngx-badge-border: 2px solid var(--cngx-color-surface, white)"
    >With ring</button>
    <button
      type="button"
      class="chip"
      [cngxBadge]="true"
      color="error"
      style="--cngx-badge-border: 2px solid var(--cngx-color-surface, white)"
      aria-label="new notifications"
    >Dot with ring</button>
  </div>`,
};
