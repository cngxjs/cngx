import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Card with Ripple',
  subtitle: 'Apply to any container element. The directive sets <code>position: relative</code> and <code>overflow: hidden</code> on the host automatically.',
  description: 'Touch/click ripple feedback without Material dependency. CSS-var positioned, consumer-styled.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxRipple',
  ],
  moduleImports: [
    'import { CngxRipple } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRipple'],
  template: `
  <div cngxRipple #rp="cngxRipple"
       style="padding:20px;border:1px solid var(--cngx-color-border,#ddd);
              border-radius:8px;cursor:pointer;max-width:280px;user-select:none">
    <strong>Tappable Card</strong>
    <p style="margin:8px 0 0;font-size:0.875rem;color:var(--cngx-text-secondary,#666)">
      Click anywhere on this card.
    </p>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Ripple active</span>
      <span class="event-value">{{ rp.active() }}</span>
    </div>
  </div>`,
};
