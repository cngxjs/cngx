import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxResizable: Side panel',
  subtitle:
    '<code>[cngxResizable]</code> turns a handle into a window splitter. It reads and writes <code>[(size)]</code> in px; the panel applies it. Drag the handle, or focus it and use <strong>Arrow Left / Right</strong>, <strong>Home</strong> and <strong>End</strong>.',
  description:
    'A filter panel next to a results lane with a resize handle between them. The handle is a focusable vertical separator whose aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext follow the size; arrows step by 16px, Home and End jump to the 160px and 420px bounds, and a pointer drag writes the size once per animation frame.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Window Splitter Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/',
    },
  ],
  apiComponents: ['CngxResizable'],
  moduleImports: ["import { CngxResizable } from '@cngx/common/layout';"],
  imports: ['CngxResizable'],
  setup: `protected readonly width = signal(240);`,
  template: `
  <div style="display: flex; block-size: 14rem; border: 1px solid var(--cngx-border, currentColor); border-radius: 0.5rem; overflow: hidden;">
    <aside id="filters" aria-label="Filters"
           style="flex: none; padding: 0.75rem; overflow: auto;"
           [style.inline-size.px]="width()">
      <strong>Filters</strong>
      <p>Width follows the handle.</p>
    </aside>
    <div cngxResizable [(size)]="width" [min]="160" [max]="420" aria-controls="filters"
         style="flex: none; inline-size: 0.5rem; cursor: col-resize; touch-action: none; background: var(--cngx-border, currentColor); opacity: 0.4;"></div>
    <main style="flex: 1; padding: 0.75rem;">
      <p>Results lane.</p>
    </main>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">width()</span>
      <span class="event-value">{{ width() }}px</span>
    </div>
  </div>`,
};
