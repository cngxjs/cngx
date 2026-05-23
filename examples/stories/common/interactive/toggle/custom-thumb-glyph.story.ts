import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToggle: Custom thumb glyph',
  subtitle:
    '<code>cngx-toggle</code> projects an optional <code>[thumbGlyph]</code> <code>TemplateRef&lt;void&gt;</code> inside the thumb span - useful for design-system icons or branded marks. The thumb wrapper stays <code>aria-hidden="true"</code>, so the glyph is decorative regardless of consumer markup.',
  description:
    'Projects a TemplateRef<void> as the thumb\'s inner glyph. Default thumb is a circular fill; the component CSS uses :has(*) to drop that background once a glyph is projected so the consumer\'s icon stands alone instead of layering over a white circle. The glyph inherits currentColor and scales to the thumb box via font-size, so a plain <span>icon</span> fits without per-consumer sizing.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxToggle'],
  moduleImports: ["import { CngxToggle } from '@cngx/common/interactive';"],
  imports: ['CngxToggle'],
  references: [
    { label: 'WAI-ARIA APG: Switch', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/' },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  setup: `protected readonly notifications = signal(false);`,
  template: `
  <div style="display: flex; flex-wrap: wrap; gap: 24px;">
    <ng-template #starGlyph><span aria-hidden="true">&#9733;</span></ng-template>
    <ng-template #checkGlyph><span aria-hidden="true">&#10003;</span></ng-template>
    <cngx-toggle [(value)]="notifications" [thumbGlyph]="starGlyph">Star thumb</cngx-toggle>
    <cngx-toggle [(value)]="notifications" [thumbGlyph]="checkGlyph">Check thumb</cngx-toggle>
    <cngx-toggle [(value)]="notifications">Default thumb (no glyph)</cngx-toggle>
  </div>`,
};
