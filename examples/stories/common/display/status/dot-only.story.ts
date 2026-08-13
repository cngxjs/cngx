import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStatus: Dot-only',
  subtitle:
    'Set [glyph]="false" for a bare coloured dot next to the label (GitHub-style). The visible label carries the meaning, so the dot stays a pure colour accent.',
  description:
    'With the glyph hidden the coloured dot alone cannot be told apart by a colour-blind reader, so the label is what communicates the state. Keep a visible label whenever the glyph is off; a dev-mode warning fires if you drop it.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxStatus'],
  moduleImports: ["import { CngxStatus } from '@cngx/common/display';"],
  imports: ['CngxStatus'],
  template: `<div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">
    <cngx-status tone="success" label="Operational" [glyph]="false" />
    <cngx-status tone="warning" label="Degraded performance" [glyph]="false" />
    <cngx-status tone="danger" label="Outage" [glyph]="false" />
    <cngx-status tone="info" label="Maintenance scheduled" [glyph]="false" />
    <cngx-status tone="neutral" label="Unknown" [glyph]="false" />
  </div>`,
};
