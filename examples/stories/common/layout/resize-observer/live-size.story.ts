import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxResizeObserver: Live size',
  subtitle:
    '<code>[cngxResizeObserver]</code> wraps the ResizeObserver API. <code>width()</code>, <code>height()</code>, and <code>isReady()</code> are readonly signals updated on every resize.',
  description:
    'Drag-resizable box (native CSS resize handle) bound to [cngxResizeObserver]. The directive emits each ResizeObserverEntry into width()/height()/isReady() so the live readout and the in-box label stay in sync without manual measurement.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxResizeObserver'],
  moduleImports: ["import { DecimalPipe } from '@angular/common';"],
  imports: ['CngxResizeObserver', 'DecimalPipe'],
  template: `  <p class="demo-resize-hint">
    Drag the handle to resize the box below.
  </p>
  <div
    cngxResizeObserver
    #ro="cngxResizeObserver"
    class="demo-resize-box"
    style="
      resize: horizontal;
      overflow: auto;
      min-width: 200px;
      max-width: 100%;
      width: 300px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    "
  >
    @if (ro.isReady()) {
      {{ ro.width() | number:'1.0-0' }} x {{ ro.height() | number:'1.0-0' }} px
    } @else {
      Waiting for first measurement...
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
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
};
