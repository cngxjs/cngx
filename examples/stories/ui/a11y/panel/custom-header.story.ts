import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxA11yPanel: Custom header',
  subtitle:
    'The default heading is a projection slot. Project <code>[cngxA11yPanelHeader]</code> to replace it - your markup renders in the card header, the axis controls stay untouched.',
  description:
    'The panel renders its own default heading when nothing is projected (the inline demo shows that). Here the consumer projects a custom heading via the [cngxA11yPanelHeader] attribute; content projection means any markup works - a heading with an icon, a description, a link. Everything below the header is unchanged.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxA11yPanel'],
  moduleImports: ["import { CngxA11yPanel } from '@cngx/ui/a11y';"],
  imports: ['CngxA11yPanel'],
  template: `<cngx-a11y-panel style="max-width:32rem">
  <h2 cngxA11yPanelHeader style="margin:0;font-size:1.125rem">
    Display &amp; motion preferences
  </h2>
</cngx-a11y-panel>`,
};
