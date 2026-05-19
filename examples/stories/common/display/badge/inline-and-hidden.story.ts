import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Inline and hidden',
  subtitle: 'Inline renders after the host content. Hidden tears the badge out of the DOM — useful for toggle states.',
  description: 'Floating counter / dot indicator attached to any host element. Purely visual — semantics live on the host via aria-label.',
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
  <div class="row">
    <span [cngxBadge]="'NEW'" position="inline" color="warning">Feature</span>
    <button type="button" class="chip" [cngxBadge]="3" [hidden]="true">Hidden</button>
  </div>`,
};
