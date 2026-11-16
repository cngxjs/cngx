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
  css: `.demo-scroll-edges-frame {
  max-inline-size: 420px;
  border-radius: var(--cngx-radius-md, 8px);
}

.demo-scroll-edges-frame:has(> .demo-scroll-edges-box:focus-visible) {
  outline: 2px solid var(--cngx-color-focus, var(--cngx-ex-accent, #2563eb));
  outline-offset: 2px;
}

.demo-scroll-edges-box {
  --demo-scroll-edges-shadow-colour: color-mix(
    in oklab,
    var(--cngx-color-text, #0f1320) 35%,
    transparent
  );
  --demo-scroll-edges-shadow-start: inset 0 0 0 0 transparent;
  --demo-scroll-edges-shadow-end: inset 0 0 0 0 transparent;
  --demo-scroll-edges-fade-start: 0px;
  --demo-scroll-edges-fade-end: 0px;
  --demo-scroll-edges-alpha-start: 1;
  --demo-scroll-edges-alpha-end: 1;
  block-size: 220px;
  overflow: auto;
  border: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #d0d5dd));
  border-radius: var(--cngx-radius-md, 8px);
  box-shadow:
    var(--demo-scroll-edges-shadow-start),
    var(--demo-scroll-edges-shadow-end);
  transition: box-shadow var(--cngx-duration-fast, 150ms) ease;
}

.demo-scroll-edges-box:focus-visible {
  outline: none;
}

.demo-scroll-edges-box[data-scroll-block-start] {
  --demo-scroll-edges-shadow-start: inset 0 12px 10px -10px var(--demo-scroll-edges-shadow-colour);
}

.demo-scroll-edges-box[data-scroll-block-end] {
  --demo-scroll-edges-shadow-end: inset 0 -12px 10px -10px var(--demo-scroll-edges-shadow-colour);
}

.demo-scroll-edges-box[data-scroll-inline-start] {
  --demo-scroll-edges-fade-start: 40px;
  --demo-scroll-edges-alpha-start: 0.25;
}

.demo-scroll-edges-box[data-scroll-inline-end] {
  --demo-scroll-edges-fade-end: 40px;
  --demo-scroll-edges-alpha-end: 0.25;
}

.demo-scroll-edges-box:is([data-scroll-inline-start], [data-scroll-inline-end]) {
  mask-image: linear-gradient(
    to right,
    rgb(0 0 0 / var(--demo-scroll-edges-alpha-start)),
    rgb(0 0 0) var(--demo-scroll-edges-fade-start),
    rgb(0 0 0) calc(100% - var(--demo-scroll-edges-fade-end)),
    rgb(0 0 0 / var(--demo-scroll-edges-alpha-end))
  );
}

.demo-scroll-edges-box:dir(rtl):is([data-scroll-inline-start], [data-scroll-inline-end]) {
  mask-image: linear-gradient(
    to left,
    rgb(0 0 0 / var(--demo-scroll-edges-alpha-start)),
    rgb(0 0 0) var(--demo-scroll-edges-fade-start),
    rgb(0 0 0) calc(100% - var(--demo-scroll-edges-fade-end)),
    rgb(0 0 0 / var(--demo-scroll-edges-alpha-end))
  );
}

.demo-scroll-edges-sheet {
  display: grid;
  grid-template-columns: repeat(10, 96px);
}

.demo-scroll-edges-cell {
  padding: 10px 12px;
  border-block-end: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #f0f0f0));
  font-size: 0.875rem;
  white-space: nowrap;
}

@media (forced-colors: active) {
  .demo-scroll-edges-box {
    mask-image: none;
  }
}`,
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
