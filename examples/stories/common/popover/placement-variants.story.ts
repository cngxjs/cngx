import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopover: Placement variants',
  subtitle:
    'Twelve trigger and popover pairs, one per <code>PopoverPlacement</code> value. Click any chip to open its placement and verify the <code>position-area</code> mapping.',
  description:
    'A 3x4 grid grouped by direction (top, left, right, bottom). Each pair proves one entry of the <code>POSITION_AREA</code> table: cardinal placements resolve to the edge-centred case via <code>span-all</code>; <code>*-start</code> / <code>*-end</code> resolve to a <code>&lt;direction&gt; &lt;span-*&gt;</code> pair. Convention matches Floating UI: <code>*-start</code> aligns the popover\'s start edge with the anchor\'s start edge (popover extends inward), <code>*-end</code> aligns the end edge. The demo tile is wider than the trigger chip so the alignment edge is visible.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxPopover', 'CngxPopoverTrigger'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import type { PopoverPlacement } from '@cngx/common/popover';",
  ],
  imports: ['CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly placements: readonly PopoverPlacement[] = [
    'top-start', 'top', 'top-end',
    'left-start', 'left', 'left-end',
    'right-start', 'right', 'right-end',
    'bottom-start', 'bottom', 'bottom-end',
  ];`,
  template: `
  <div class="demo-popover-placement-grid">
    @for (p of placements; track p) {
      <div class="demo-popover-placement-cell">
        <button type="button" [cngxPopoverTrigger]="pop" (click)="pop.toggle()" class="chip">
          {{ p }}
        </button>
        <div cngxPopover #pop="cngxPopover" [placement]="p" class="demo-popover-tile">
          {{ p }}
        </div>
      </div>
    }
  </div>`,
};
