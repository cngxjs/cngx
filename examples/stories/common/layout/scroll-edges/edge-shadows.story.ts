import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxScrollEdges: Edge shadows and fades',
  subtitle:
    'Scroll the sheet in either axis. A shadow appears above or below, and a fade on the inline sides, only while content is hidden toward that edge. Flip the direction to see inline start move to the right.',
  description:
    'CngxScrollEdges reads the scroll metrics once per frame and reflects four logical host attributes (data-scroll-block-start / -block-end / -inline-start / -inline-end), present only while content is hidden toward that edge. The directive paints nothing: the demo stylesheet keys an inset shadow on the block attributes and a mask fade on the inline attributes. RTL needs no direction lookup, so the same attributes stay correct inside a dir="rtl" subtree.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['behavior', 'rtl'],
  apiComponents: ['CngxScrollEdges'],
  moduleImports: ["import { CngxScrollEdges } from '@cngx/common/layout';"],
  imports: ['CngxScrollEdges'],
  setup: `protected readonly rows = Array.from({ length: 16 }, (_, i) => i + 1);
  protected readonly columns = Array.from({ length: 10 }, (_, i) => i + 1);`,
  template: `<div class="demo-scroll-edges-frame" [attr.dir]="dir()">
    <div
      cngxScrollEdges
      #edges="cngxScrollEdges"
      class="demo-scroll-edges-box"
      tabindex="0"
      role="region"
      aria-label="Quarterly sheet"
    >
      <div class="demo-scroll-edges-sheet">
        @for (row of rows; track row) {
          @for (col of columns; track col) {
            <span class="demo-scroll-edges-cell">R{{ row }} C{{ col }}</span>
          }
        }
      </div>
    </div>
  </div>`,
  setupChrome: `protected readonly dir = signal<'ltr' | 'rtl'>('ltr');`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Direction">
    <label>
      <input type="radio" name="scroll-edges-dir" value="ltr"
        [checked]="dir() === 'ltr'"
        (change)="dir.set('ltr')" />
      LTR
    </label>
    <label>
      <input type="radio" name="scroll-edges-dir" value="rtl"
        [checked]="dir() === 'rtl'"
        (change)="dir.set('rtl')" />
      RTL
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">canScrollBlockStart</span>
      <span class="event-value">{{ edges.canScrollBlockStart() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">canScrollBlockEnd</span>
      <span class="event-value">{{ edges.canScrollBlockEnd() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">canScrollInlineStart</span>
      <span class="event-value">{{ edges.canScrollInlineStart() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">canScrollInlineEnd</span>
      <span class="event-value">{{ edges.canScrollInlineEnd() }}</span>
    </div>
  </div>`,
};
