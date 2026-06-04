import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBadge: Inline and hidden',
  subtitle: 'Inline renders after the host content. Hidden removes the indicator without collapsing the host.',
  description: 'Three hosts contrast positioning and visibility. The first uses <code>position="inline"</code> so the badge renders after the host text as a <code>NEW</code> chip on a feature label. The second and third have an identical <code>[cngxBadge]="3"</code>, but the third adds <code>[hidden]="true"</code>, which Angular routes to the directive (not to the native <code>hidden</code> HTML attribute). The host stays visible; only the indicator is detached from the DOM.',
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
    <span [cngxBadge]="'NEW'" position="inline" color="warning">Feature</span>
    <button type="button" class="chip" [cngxBadge]="3">Visible</button>
    <button type="button" class="chip" [cngxBadge]="3" [hidden]="true">Hidden</button>
  </div>`,
};
