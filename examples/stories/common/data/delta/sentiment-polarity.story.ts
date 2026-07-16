import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDelta: Sentiment vs. direction',
  subtitle:
    'The same <code>-2.1%</code> reads red under <code>higher-is-better</code> and green under <code>lower-is-better</code> — while the arrow keeps pointing down. Colour is never the only signal.',
  description:
    'Sentiment is derived from direction × polarity in the computed graph. The arrow tracks raw direction; the colour and the screen-reader word track sentiment, so the two can diverge for KPIs where a drop is good (churn, latency, error rate).',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxDelta'],
  moduleImports: ["import { CngxDelta } from '@cngx/common/data';"],
  imports: ['CngxDelta'],
  template: `<div style="display:flex;gap:40px;align-items:flex-start">
    <div style="display:flex;flex-direction:column;gap:6px">
      <span class="demo-card-label">Revenue growth (higher-is-better)</span>
      <cngx-delta [value]="-2.1" polarity="higher-is-better" />
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span class="demo-card-label">Churn rate (lower-is-better)</span>
      <cngx-delta [value]="-2.1" polarity="lower-is-better" />
    </div>
  </div>`,
};
