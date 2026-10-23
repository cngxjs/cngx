import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonGroup: With addon',
  subtitle: '<code>cngxButtonGroupAddon</code> gives an avatar, an icon or a short text a segment of its own.',
  description: 'Content that is not a box of its own gets a segment through <code>cngxButtonGroupAddon</code>: the group border, the row height of the group <code>size</code>, centred content and inline padding from <code>--cngx-space-md</code>. The addon is not interactive and adds no role; its text is read in document order between the buttons, so keep it short and meaningful ("3 open", not a decorative label).',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxButtonGroup', 'CngxButtonGroupAddon', 'CngxButton', 'CngxAvatar'],
  moduleImports: [
    "import { CngxButton, CngxButtonGroup, CngxButtonGroupAddon } from '@cngx/common/button';",
    "import { CngxAvatar } from '@cngx/common/display';",
  ],
  imports: ['CngxButton', 'CngxButtonGroup', 'CngxButtonGroupAddon', 'CngxAvatar'],
  template: `
  <div style="display:flex; flex-direction:column; align-items:flex-start; gap:16px">
    <div cngxButtonGroup variant="outline" aria-label="Assignee">
      <span cngxButtonGroupAddon><cngx-avatar initials="AL" size="xs" />Ada Lovelace</span>
      <button cngxButton>Reassign</button>
    </div>
    <div cngxButtonGroup variant="outline" size="sm" aria-label="Issues">
      <span cngxButtonGroupAddon>3 open</span>
      <button cngxButton>Show</button>
      <button cngxButton tone="primary">New issue</button>
    </div>
  </div>`,
};
