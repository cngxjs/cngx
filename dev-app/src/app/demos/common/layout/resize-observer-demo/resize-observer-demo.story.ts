import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'ResizeObserver',
  navLabel: 'ResizeObserver',
  navCategory: 'layout',
  description: 'Tracks the size of the host element via the ResizeObserver API and exposes width, height, and contentRect as signals.',
  apiComponents: ['CngxResizeObserver'],
  sections: [
    {
      title: 'CngxResizeObserver — Live Size',
      subtitle: '<code>[cngxResizeObserver]</code> wraps the ResizeObserver API. <code>width()</code>, <code>height()</code>, and <code>isReady()</code> are readonly signals updated on every resize.',
      imports: ['CngxResizeObserver', 'DecimalPipe'],
      template: `
  <p style="margin-bottom: 8px; color: var(--cngx-text-secondary, #666);">
    Drag the handle to resize the box below.
  </p>
  <div
    cngxResizeObserver
    #ro="cngxResizeObserver"
    style="
      resize: horizontal;
      overflow: auto;
      min-width: 200px;
      max-width: 100%;
      width: 300px;
      height: 120px;
      background: var(--cngx-surface-alt, #f8f9fa);
      border: 1px solid var(--cngx-border, #ddd);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      color: var(--cngx-text-secondary, #666);
    "
  >
    @if (ro.isReady()) {
      {{ ro.width() | number:'1.0-0' }} × {{ ro.height() | number:'1.0-0' }} px
    } @else {
      Waiting for first measurement…
    }
  </div>

  <div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">isReady</span>
      <span class="event-value">{{ ro.isReady() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">width</span>
      <span class="event-value">{{ ro.width() | number:'1.2-2' }} px</span>
    </div>
    <div class="event-row">
      <span class="event-label">height</span>
      <span class="event-value">{{ ro.height() | number:'1.2-2' }} px</span>
    </div>
  </div>`,
    },
  ],
  moduleImports: [
    "import { DecimalPipe } from '@angular/common';",
  ],
};
