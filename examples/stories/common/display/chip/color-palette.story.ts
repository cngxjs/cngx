import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChip: Color palette',
  subtitle: '<code>[attr.data-color]="info | success | warning | danger"</code> switches the chip onto a semantic tone family. Default (no attribute) renders the neutral palette.',
  description: 'Each semantic value maps to its own <code>--cngx-chip-&lt;tone&gt;-bg</code> / <code>--cngx-chip-&lt;tone&gt;-color</code> token pair, so re-themeing a tone (e.g. tuning <code>success</code> for a colour-blind-safe palette) is one variable override, not a fork. The atom emits the value verbatim as <code>data-color</code>, so consumer styles author against <code>[data-color="my-brand"]</code> selectors when they need additional tones.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxChip',
  ],
  moduleImports: [
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChip'],
  template: `
  <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
    <cngx-chip>neutral</cngx-chip>
    <cngx-chip [attr.data-color]="'info'">info</cngx-chip>
    <cngx-chip [attr.data-color]="'success'">success</cngx-chip>
    <cngx-chip [attr.data-color]="'warning'">warning</cngx-chip>
    <cngx-chip [attr.data-color]="'danger'">danger</cngx-chip>
  </div>`,
};
