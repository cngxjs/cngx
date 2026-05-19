import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom thumb glyph',
  subtitle: '<code>cngx-toggle</code> projects an optional <code>[thumbGlyph]</code> <code>TemplateRef&lt;void&gt;</code> inside the thumb span — useful for design-system icons or branded glyphs. The thumb wrapper stays <code>aria-hidden="true"</code>, so the glyph is decorative regardless of consumer markup.',
  description: 'Single-value boolean switch atom. role="switch" with reactive aria-checked, aria-disabled, aria-describedby for the consumer-supplied disabled reason. Click + Space + Enter all flip. Provides CNGX_CONTROL_VALUE so CngxFormBridge (Phase 7) can bind to it without per-atom CVA.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxToggle',
  ],
  moduleImports: [
    'import { CngxToggle } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxToggle'],
  setup: `protected readonly notifications = signal(false);`,
  template: `
  <ng-template #starGlyph><span aria-hidden="true">★</span></ng-template>
  <ng-template #checkGlyph><span aria-hidden="true">✓</span></ng-template>
  <cngx-toggle [(value)]="notifications" [thumbGlyph]="starGlyph">Star thumb</cngx-toggle>
  <cngx-toggle [(value)]="notifications" [thumbGlyph]="checkGlyph">Check thumb</cngx-toggle>
  <cngx-toggle [(value)]="notifications">Default thumb (no glyph)</cngx-toggle>`,
  css: `cngx-toggle { display: inline-flex; margin-right: 24px; }`,
};
