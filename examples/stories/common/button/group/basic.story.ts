import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonGroup: Basic',
  subtitle: 'Buttons joined into one framed, labelled row; <code>variant</code> and <code>size</code> set once on the group.',
  description: 'Every direct child of <code>cngxButtonGroup</code> is a segment: the seams collapse to one border and only the two outer ends keep their radius. The group hands <code>variant</code> and <code>size</code> to the buttons inside, and a child input still wins. The host is <code>role="group"</code> and needs a name (<code>aria-label</code> or <code>aria-labelledby</code>), or it warns <code>CNGX1072</code>. Tab through the segments: the focused one is lifted above its neighbours, so the ring is never clipped at a seam. A <code>cngxButtonGroupSeparator</code> keeps two clusters apart; it is decorative and hidden from assistive technology. For a pressed state use <code>CngxButtonToggleGroup</code> instead.',
  level: 'molecule',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'visual-variants'],
  apiComponents: ['CngxButtonGroup', 'CngxButtonGroupSeparator', 'CngxButton'],
  moduleImports: [
    "import { CngxButton, CngxButtonGroup, CngxButtonGroupSeparator } from '@cngx/common/button';",
  ],
  imports: ['CngxButton', 'CngxButtonGroup', 'CngxButtonGroupSeparator'],
  template: `
  <div style="display:flex; flex-direction:column; align-items:flex-start; gap:16px">
    <div cngxButtonGroup variant="outline" aria-label="History">
      <button cngxButton>Undo</button>
      <button cngxButton>Redo</button>
      <button cngxButton>Repeat</button>
    </div>
    <div cngxButtonGroup variant="solid" size="sm" aria-label="Review">
      <button cngxButton tone="primary">Approve</button>
      <button cngxButton tone="primary">Approve all</button>
      <button cngxButton="outline" tone="danger">Reject</button>
    </div>
    <div cngxButtonGroup variant="ghost" aria-label="Clipboard">
      <button cngxButton>Cut</button>
      <button cngxButton>Copy</button>
      <span cngxButtonGroupSeparator></span>
      <button cngxButton>Paste</button>
    </div>
  </div>`,
};
