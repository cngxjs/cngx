import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTrend: Direction variants',
  subtitle: 'Positive (green, up arrow), negative (red, down arrow), and zero (neutral, right arrow). Direction is communicated through icon + color + screen-reader label, never color alone.',
  description: 'Direction is derived from the numeric value: positive uses the up arrow plus the positive accent token, negative uses the down arrow plus the negative accent token, zero uses the neutral arrow. The percentage is formatted locale-aware; the arrow icon is aria-hidden so AT only reads the host aria-label, which is auto-generated from value + direction and overridable via [label].',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  references: [
    { label: 'WCAG 2.1: 1.4.1 Use of Color', href: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html' },
    { label: 'WCAG 2.1: 1.1.1 Non-text Content', href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html' },
  ],
  apiComponents: [
    'CngxTrend',
  ],
  moduleImports: [
    'import { CngxTrend } from \'@cngx/common/data\';',
  ],
  imports: ['CngxTrend'],
  template: `  <div style="display:flex;gap:32px;align-items:center">
    <div style="text-align:center">
      <div class="demo-metric-label" style="margin-bottom:4px">Positive</div>
      <cngx-trend [value]="5.3" />
    </div>
    <div style="text-align:center">
      <div class="demo-metric-label" style="margin-bottom:4px">Negative</div>
      <cngx-trend [value]="-2.1" />
    </div>
    <div style="text-align:center">
      <div class="demo-metric-label" style="margin-bottom:4px">Flat</div>
      <cngx-trend [value]="0" />
    </div>
  </div>`,
  templateChrome: `<div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
    <span class="demo-metric-label">Screen reader reads the host aria-label; the arrow span is aria-hidden so it is never spoken twice.</span>
    <dl class="demo-sr-transcript">
      <dt>Positive <span class="demo-sr-tag">value 5.3</span></dt>
      <dd>&ldquo;+5.3&nbsp;% up&rdquo;</dd>
      <dt>Negative <span class="demo-sr-tag">value -2.1</span></dt>
      <dd>&ldquo;-2.1&nbsp;% down&rdquo;</dd>
      <dt>Flat <span class="demo-sr-tag">value 0</span></dt>
      <dd>&ldquo;0.0&nbsp;% unchanged&rdquo;</dd>
    </dl>
  </div>`,
};
