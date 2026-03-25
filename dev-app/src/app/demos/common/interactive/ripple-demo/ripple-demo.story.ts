import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Ripple',
  navLabel: 'Ripple',
  navCategory: 'interactive',
  description:
    'Touch/click ripple feedback without Material dependency. CSS-var positioned, consumer-styled.',
  apiComponents: ['CngxRipple'],
  overview:
    '<p><code>[cngxRipple]</code> creates ripple waves on pointer contact. Position is set via CSS custom ' +
    'properties (<code>--cngx-ripple-x</code>, <code>--cngx-ripple-y</code>, <code>--cngx-ripple-size</code>). ' +
    'All visual treatment — color, duration, shape — is consumer CSS. Ships companion <code>_ripple.scss</code>.</p>',
  moduleImports: [
    "import { CngxRipple } from '@cngx/common/interactive';",
  ],
  sections: [
    {
      title: 'Button Ripples',
      subtitle:
        'Click each button to see the ripple expand from the pointer position. ' +
        'The ripple color follows <code>currentColor</code> by default.',
      imports: ['CngxRipple'],
      template: `
  <div class="button-row" style="gap:12px">
    <button cngxRipple class="chip" >
      Default Ripple
    </button>

    <button cngxRipple [rippleColor]="'rgba(245,166,35,0.3)'" class="chip"
            >
      Custom Color
    </button>

    <button cngxRipple [rippleCentered]="true" class="chip"
            style="position:relative;overflow:hidden;width:48px;height:48px;border-radius:50%;padding:0">
      C
    </button>
  </div>`,
    },
    {
      title: 'Card with Ripple',
      subtitle:
        'Apply to any container element. The directive sets <code>position: relative</code> and ' +
        '<code>overflow: hidden</code> on the host automatically.',
      imports: ['CngxRipple'],
      template: `
  <div cngxRipple #rp="cngxRipple"
       style="padding:20px;border:1px solid var(--cngx-border,#ddd);
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
    },
  ],
};
