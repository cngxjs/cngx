import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStatus: Tone matrix',
  subtitle:
    'Five semantic tones, each with a distinct glyph inside the dot — colour is never the only signal. The visible label carries the meaning; the dot is decorative.',
  description:
    'A semantic health indicator distinct from CngxBadge / CngxChip / CngxTag. Every tone pairs a colour with a tone glyph (✓ ! ✕ i •) so a colour-blind reader still tells the states apart. Set live for a status that changes in place.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxStatus'],
  moduleImports: ["import { CngxStatus } from '@cngx/common/data';"],
  imports: ['CngxStatus'],
  template: `<div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">
    <cngx-status tone="success" label="Operational" />
    <cngx-status tone="warning" label="Degraded performance" />
    <cngx-status tone="danger" label="Outage" />
    <cngx-status tone="info" label="Maintenance scheduled" />
    <cngx-status tone="neutral" label="Unknown" />
  </div>`,
};
