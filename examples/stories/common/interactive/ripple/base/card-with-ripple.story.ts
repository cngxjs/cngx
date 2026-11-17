import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRipple: Card with ripple',
  subtitle: 'Apply <code>cngxRipple</code> to any container, here an action <code>cngx-card</code>. The wave renders into a clipping layer that inherits the card radius, so it stays inside the card frame while the card itself is never clipped.',
  description: 'Same directive as the button demo, mounted on a tappable card. Exporting the directive as cngxRipple gives the template a reference to its active() signal, which the event-row below echoes - useful for wiring downstream feedback (haptics, log, analytics) without reimplementing the press lifecycle.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxRipple',
    'CngxCard',
  ],
  moduleImports: [
    'import { CngxRipple } from \'@cngx/common/interactive\';',
    'import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody } from \'@cngx/common/card\';',
  ],
  imports: ['CngxRipple', 'CngxCard', 'CngxCardHeader', 'CngxCardTitle', 'CngxCardBody'],
  template: `  <cngx-card as="button" cngxRipple #rp="cngxRipple" style="max-width:280px">
    <header cngxCardHeader>
      <h3 cngxCardTitle>Tappable card</h3>
    </header>
    <p cngxCardBody>Click anywhere on this card.</p>
  </cngx-card>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Ripple active</span>
      <span class="event-value">{{ rp.active() }}</span>
    </div>
  </div>`,
};
