import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Placement Variants',
  subtitle: 'All 12 PopoverPlacement values render edge-aligned via position-area.',
  description:
    'A 4x3 matrix of every PopoverPlacement value against a single anchor. Each popover renders auto-open so the layout proves the position-area mapping table is spec-correct. Hover or click the central anchor to toggle the matrix.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: ['CngxPopover', 'CngxPopoverTrigger'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import type { PopoverPlacement } from '@cngx/common/popover';",
  ],
  imports: ['CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly placements: readonly PopoverPlacement[] = [
    'top-start', 'top', 'top-end',
    'left-start', 'right-start', 'right',
    'left', 'right-end', 'left-end',
    'bottom-start', 'bottom', 'bottom-end',
  ];

  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((v) => !v);
  }`,
  template: `
  <div style="display:flex;justify-content:center;align-items:center;min-height:320px;padding:80px 16px">
    <div style="position:relative">
      <button type="button" (click)="toggle()" class="chip">
        {{ open() ? 'Hide all 12' : 'Show all 12' }}
      </button>
      @for (p of placements; track p) {
        <div cngxPopover
             [cngxPopoverOpen]="open()"
             [placement]="p"
             style="padding:6px 10px;font-size:0.75rem;border:1px solid currentColor;border-radius:4px;background:Canvas">
          {{ p }}
        </div>
      }
    </div>
  </div>`,
};
