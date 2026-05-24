import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: With arrow slot',
  subtitle:
    '<code>*cngxPopoverArrow</code> overrides the default rotated-diamond arrow. The slot context exposes the resolved <code>edge</code> and the inline-axis <code>offsetPx</code>; the consumer rotates and positions a custom glyph to match.',
  description:
    'Three-stage cascade for the arrow ornament: per-instance <code>*cngxPopoverArrow</code> -> <code>CNGX_POPOVER_PANEL_CONFIG.templates.arrow</code> (via <code>providePopoverPanel(withArrowTemplate(...))</code>) -> default diamond markup. This demo wires the instance tier with an SVG caret glyph keyed off the slot context; click each trigger to see the glyph rotate to match the placement and stay pinned to the trigger.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverArrow'],
  moduleImports: [
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverArrow } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverArrow',
  ],
  template: `
  <div class="demo-popover-stage" style="display:flex;gap:48px;flex-wrap:wrap">
    @for (p of ['bottom', 'top', 'left', 'right']; track p) {
      <div>
        <button [cngxPopoverTrigger]="pop.popover" (click)="pop.popover.toggle()" class="chip">{{ p }}</button>
        <cngx-popover-panel #pop [placement]="p" [showArrow]="true">
          <span cngxPopoverHeader>Brand caret · {{ p }}</span>
          <p cngxPopoverBody>The default rotated-diamond is replaced by a slot-rendered SVG caret. The slot context exposes the resolved edge so the glyph rotates to match.</p>
          <ng-template cngxPopoverArrow let-edge="edge" let-offsetPx="offsetPx">
            <svg
              class="demo-arrow-glyph"
              [attr.data-edge]="edge"
              [style.--offset]="offsetPx === null ? '50%' : offsetPx + 'px'"
              viewBox="0 0 14 14"
              aria-hidden="true"
            >
              <path d="M 7 1 L 13 13 L 1 13 Z" fill="oklch(0.55 0.18 260)" />
            </svg>
          </ng-template>
        </cngx-popover-panel>
      </div>
    }
  </div>`,
};
