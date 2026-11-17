import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRipple: Card with ripple',
  subtitle: 'Apply <code>cngxRipple</code> to any container, here a tappable card tile. The wave renders into a clipping layer that inherits the tile radius, so it stays inside the card frame while the card itself is never clipped.',
  description: 'Same directive as the button demo, mounted on a tappable card. Exporting the directive as cngxRipple gives the template a reference to its active() signal, which the event-row below echoes - useful for wiring downstream feedback (haptics, log, analytics) without reimplementing the press lifecycle.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxRipple'],
  moduleImports: [
    'import { CngxRipple } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRipple'],
  template: `  <button
    type="button"
    class="demo-card-tile"
    cngxRipple
    #rp="cngxRipple"
    style="display:grid;gap:4px;max-width:280px;padding:16px;border:1px solid currentColor;font:inherit;text-align:start;cursor:pointer">
    <strong>Tappable card</strong>
    <span>Click anywhere on this card.</span>
  </button>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Ripple active</span>
      <span class="event-value">{{ rp.active() }}</span>
    </div>
  </div>`,
};
