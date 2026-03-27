import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tooltip',
  navLabel: 'Tooltip',
  navCategory: 'popover',
  description:
    'String-input tooltip directive using the native Popover API. CSS Anchor Positioning, WCAG 1.4.13 compliant, SR-friendly.',
  apiComponents: ['CngxTooltip'],
  overview:
    '<p><code>[cngxTooltip]</code> adds a tooltip to any element via a single attribute. ' +
    'The tooltip element is created internally — no extra template markup needed. ' +
    'Opens on hover (with delay) and focus (with debounce to prevent SR storms). ' +
    'Escape closes without bubbling to parent overlays.</p>',
  moduleImports: [
    "import { CngxTooltip } from '@cngx/common/popover';",
  ],
  sections: [
    {
      title: 'Basic Tooltip',
      subtitle:
        'Hover or focus the button to see the tooltip. Default placement is <code>top</code>, default delay is 300ms.',
      imports: ['CngxTooltip'],
      template: `
  <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding-top:40px">
    <button cngxTooltip="Save your changes (Ctrl+S)" class="chip">Save</button>
    <button cngxTooltip="Undo last action (Ctrl+Z)" class="chip">Undo</button>
    <button cngxTooltip="Redo last action (Ctrl+Y)" class="chip">Redo</button>
  </div>`,
    },
    {
      title: 'Placement',
      subtitle:
        'Set <code>tooltipPlacement</code> to position the tooltip relative to the trigger.',
      imports: ['CngxTooltip'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(3,auto);gap:16px;justify-content:center;
              padding:60px 20px">
    <span></span>
    <button cngxTooltip="Top tooltip" tooltipPlacement="top" class="chip">Top</button>
    <span></span>
    <button cngxTooltip="Left tooltip" tooltipPlacement="left" class="chip">Left</button>
    <span></span>
    <button cngxTooltip="Right tooltip" tooltipPlacement="right" class="chip">Right</button>
    <span></span>
    <button cngxTooltip="Bottom tooltip" tooltipPlacement="bottom" class="chip">Bottom</button>
    <span></span>
  </div>`,
    },
    {
      title: 'Custom Delay',
      subtitle:
        'Set <code>[tooltipDelay]</code> for open delay and <code>[closeDelay]</code> for close delay.',
      imports: ['CngxTooltip'],
      template: `
  <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding-top:40px">
    <button cngxTooltip="Instant tooltip" [tooltipDelay]="0" class="chip">No delay</button>
    <button cngxTooltip="Slow tooltip (1s)" [tooltipDelay]="1000" class="chip">1s delay</button>
    <button cngxTooltip="Sticky tooltip" [closeDelay]="500" class="chip">500ms close delay</button>
  </div>`,
    },
    {
      title: 'Keyboard Navigation',
      subtitle:
        'Tab through the buttons — tooltips appear on focus with a 50ms debounce to prevent screen reader announcement storms. ' +
        'Press Escape to dismiss without closing parent overlays.',
      imports: ['CngxTooltip'],
      template: `
  <p style="font-size:0.875rem;color:var(--cngx-text-secondary,#666);margin-bottom:12px">
    Use Tab/Shift+Tab to navigate. Each button shows its tooltip on focus.
  </p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:20px">
    <button cngxTooltip="Bold text" class="chip">B</button>
    <button cngxTooltip="Italic text" class="chip">I</button>
    <button cngxTooltip="Underline text" class="chip">U</button>
    <button cngxTooltip="Strikethrough" class="chip">S</button>
    <button cngxTooltip="Insert link" class="chip">Link</button>
    <button cngxTooltip="Insert image" class="chip">Img</button>
  </div>`,
    },
    {
      title: 'Disabled State',
      subtitle:
        'Set <code>[enabled]="false"</code> to disable the tooltip. The <code>aria-describedby</code> is cleared.',
      imports: ['CngxTooltip'],
      template: `
  <div style="display:flex;gap:16px;align-items:center;padding-top:40px">
    <button cngxTooltip="This tooltip is active" class="chip">Enabled</button>
    <button cngxTooltip="This tooltip is suppressed" [enabled]="false" class="chip"
            style="opacity:0.5">Disabled</button>
  </div>`,
    },
    {
      title: 'Programmatic Control',
      subtitle:
        'Use <code>#tip="cngxTooltip"</code> to access <code>show()</code>, <code>hide()</code>, and <code>state()</code>.',
      imports: ['CngxTooltip'],
      template: `
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding-top:40px">
    <button cngxTooltip="Programmatically controlled" #tip="cngxTooltip" class="chip">
      Target
    </button>
    <button (click)="tip.show()" class="chip" type="button">Show</button>
    <button (click)="tip.hide()" class="chip" type="button">Hide</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ tip.state() }}</span>
    </div>
  </div>`,
    },
  ],
};
