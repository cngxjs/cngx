import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBadge: Counts with overflow',
  subtitle: 'Values over <code>max</code> render as <code>{max}+</code>.',
  description: 'Three button hosts illustrate how numeric values format. The first two show a single-digit and a double-digit count verbatim. The third clamps to the default <code>max</code> of <code>99</code>: the demo binds <code>[max]="99"</code> explicitly and passes <code>250</code>, so the indicator renders <code>99+</code>.',
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
    <button type="button" class="chip" [cngxBadge]="3">Inbox</button>
    <button type="button" class="chip" [cngxBadge]="12">Tasks</button>
    <button type="button" class="chip" [cngxBadge]="250" [max]="99">Notifications</button>
  </div>`,
};
