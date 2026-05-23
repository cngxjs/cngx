import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: Edge-shift arrow tracking',
  subtitle:
    'Visual regression for the arrow ornament under viewport-fit recovery. Every panel forces the browser to shift its position; the arrow stays pinned to its own trigger.',
  description:
    'CngxPopover writes a <code>--cngx-popover-arrow-offset</code> CSS custom property from the live trigger and panel geometry on every show, position update, and window resize. The four sections below force horizontal and vertical shift recovery on all four primary placements (<code>bottom</code>, <code>top</code>, <code>left</code>, <code>right</code>); the arrow tip should always land over the trigger that opened the panel, never over a neighbour.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxPopoverPanel'],
  moduleImports: [
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody } from '@cngx/common/popover';",
  ],
  imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody'],
  template: `
  <div class="demo-popover-stage demo-popover-stage--tall" style="display:flex;flex-direction:column;gap:40px">
    <section>
      <p style="margin:0 0 12px">
        <strong>Bottom placement</strong> — left / centre / right triggers force horizontal shift recovery.
      </p>
      <div style="display:flex;justify-content:space-between;gap:8px">
        <button [cngxPopoverTrigger]="bl.popover" (click)="bl.popover.toggle()" class="chip">left edge</button>
        <button [cngxPopoverTrigger]="bc.popover" (click)="bc.popover.toggle()" class="chip">centre</button>
        <button [cngxPopoverTrigger]="br.popover" (click)="br.popover.toggle()" class="chip">right edge</button>
      </div>
      <cngx-popover-panel #bl [showArrow]="true" placement="bottom">
        <span cngxPopoverHeader>Bottom · left edge</span>
        <p cngxPopoverBody>Panel cannot anchor-centre without clipping; the browser shifts it right. Arrow stays on the trigger.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #bc [showArrow]="true" placement="bottom">
        <span cngxPopoverHeader>Bottom · centre</span>
        <p cngxPopoverBody>No shift required — the arrow sits dead-centre on the trigger.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #br [showArrow]="true" placement="bottom">
        <span cngxPopoverHeader>Bottom · right edge</span>
        <p cngxPopoverBody>Mirror of the left case — panel shifts left, arrow follows the trigger.</p>
      </cngx-popover-panel>
    </section>

    <section>
      <p style="margin:0 0 12px">
        <strong>Top placement</strong> — same trigger row, panels open upward (give the demo card room above).
      </p>
      <div style="display:flex;justify-content:space-between;gap:8px">
        <button [cngxPopoverTrigger]="tl.popover" (click)="tl.popover.toggle()" class="chip">left edge</button>
        <button [cngxPopoverTrigger]="tc.popover" (click)="tc.popover.toggle()" class="chip">centre</button>
        <button [cngxPopoverTrigger]="tr.popover" (click)="tr.popover.toggle()" class="chip">right edge</button>
      </div>
      <cngx-popover-panel #tl [showArrow]="true" placement="top">
        <span cngxPopoverHeader>Top · left edge</span>
        <p cngxPopoverBody>Arrow on the bottom edge of the panel, pinned to the trigger.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #tc [showArrow]="true" placement="top">
        <span cngxPopoverHeader>Top · centre</span>
        <p cngxPopoverBody>Centre-aligned baseline for the row above.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #tr [showArrow]="true" placement="top">
        <span cngxPopoverHeader>Top · right edge</span>
        <p cngxPopoverBody>Panel shifts left to fit, arrow stays on the trigger.</p>
      </cngx-popover-panel>
    </section>

    <section>
      <p style="margin:0 0 12px">
        <strong>Right placement</strong> — vertical-axis triggers; tall panels force block-axis shift recovery.
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
        <button [cngxPopoverTrigger]="rt.popover" (click)="rt.popover.toggle()" class="chip">top trigger</button>
        <button [cngxPopoverTrigger]="rm.popover" (click)="rm.popover.toggle()" class="chip">middle trigger</button>
        <button [cngxPopoverTrigger]="rb.popover" (click)="rb.popover.toggle()" class="chip">bottom trigger</button>
      </div>
      <cngx-popover-panel #rt [showArrow]="true" placement="right">
        <span cngxPopoverHeader>Right · top trigger</span>
        <p cngxPopoverBody>Panel sits to the right of the trigger. Arrow on the left edge, pinned to the trigger row.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #rm [showArrow]="true" placement="right">
        <span cngxPopoverHeader>Right · middle trigger</span>
        <p cngxPopoverBody>Centre-aligned baseline.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #rb [showArrow]="true" placement="right">
        <span cngxPopoverHeader>Right · bottom trigger</span>
        <p cngxPopoverBody>Block-axis shift if the panel reaches the bottom of the viewport — arrow still on the trigger.</p>
      </cngx-popover-panel>
    </section>

    <section>
      <p style="margin:0 0 12px">
        <strong>Left placement</strong> — symmetric to the right column, panels open to the left.
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <button [cngxPopoverTrigger]="lt.popover" (click)="lt.popover.toggle()" class="chip">top trigger</button>
        <button [cngxPopoverTrigger]="lm.popover" (click)="lm.popover.toggle()" class="chip">middle trigger</button>
        <button [cngxPopoverTrigger]="lb.popover" (click)="lb.popover.toggle()" class="chip">bottom trigger</button>
      </div>
      <cngx-popover-panel #lt [showArrow]="true" placement="left">
        <span cngxPopoverHeader>Left · top trigger</span>
        <p cngxPopoverBody>Arrow on the right edge of the panel.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #lm [showArrow]="true" placement="left">
        <span cngxPopoverHeader>Left · middle trigger</span>
        <p cngxPopoverBody>Centre-aligned baseline.</p>
      </cngx-popover-panel>
      <cngx-popover-panel #lb [showArrow]="true" placement="left">
        <span cngxPopoverHeader>Left · bottom trigger</span>
        <p cngxPopoverBody>Block-axis shift recovery — arrow stays on the trigger.</p>
      </cngx-popover-panel>
    </section>

    <section>
      <p style="margin:0 0 12px">
        <strong>Flip recovery</strong> — requested <code>placement="bottom"</code> with <code>[positionTryFallbacks]="['flip-block']"</code>; if no space below, the browser flips to <code>top</code> and the arrow follows to the panel's opposite edge.
      </p>
      <div style="display:flex;justify-content:flex-start;gap:8px">
        <button [cngxPopoverTrigger]="flip.popover" (click)="flip.popover.toggle()" class="chip">flip if no room below</button>
      </div>
      <cngx-popover-panel #flip [showArrow]="true" placement="bottom"
                          [positionTryFallbacks]="['flip-block']">
        <span cngxPopoverHeader>Flip-block fallback</span>
        <p cngxPopoverBody>Scroll the demo card so the trigger is near the bottom of the viewport — the panel flips to render above, and the arrow moves to the panel's bottom edge so it still points at the trigger.</p>
        <p cngxPopoverBody>The library derives the arrow's edge from the live trigger/panel geometry, so no consumer wiring is required when the browser picks a fallback.</p>
      </cngx-popover-panel>
    </section>
  </div>`,
};
