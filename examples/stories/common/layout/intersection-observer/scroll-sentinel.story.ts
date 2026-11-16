import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIntersectionObserver: Scroll sentinel',
  subtitle:
    '<code>[cngxIntersectionObserver]</code> wraps the IntersectionObserver API. <code>isIntersecting()</code> is true when any pixel of the host is visible, <code>intersectionRatio()</code> is a 0-1 fraction. <code>(entered)</code> and <code>(left)</code> fire on edge transitions; <code>[root]</code> scopes the observer to a scroll container.',
  description:
    'Observes a sentinel inside a scroll container with a granular threshold ladder. The host signals isIntersecting() and intersectionRatio() drive the background swap, while (entered) and (left) increment the counters in the readout.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxIntersectionObserver'],
  moduleImports: ["import { DecimalPipe } from '@angular/common';"],
  imports: ['CngxIntersectionObserver', 'DecimalPipe'],
  setup: `protected enterCount = signal(0);
  protected leaveCount = signal(0);
  protected readonly thresholds = Array.from({ length: 21 }, (_, i) => i / 20);`,
  template: `  <div class="io-scroll-root demo-io-frame">
    <div class="demo-io-spacer demo-io-spacer--top">
      Scroll down to reach the sentinel
    </div>

    <div
      cngxIntersectionObserver
      #io="cngxIntersectionObserver"
      [root]="'.io-scroll-root'"
      [rootMargin]="'0px'"
      [threshold]="thresholds"
      (entered)="enterCount.update(n => n + 1)"
      (left)="leaveCount.update(n => n + 1)"
      class="demo-io-sentinel"
      [class.demo-io-sentinel--visible]="io.isIntersecting()"
    >
      {{ io.isIntersecting() ? 'Visible!' : 'Hidden' }}
      - ratio: {{ io.intersectionRatio() | number:'1.2-2' }}
    </div>

    <div class="demo-io-spacer demo-io-spacer--bottom">
      Scroll back up
    </div>
  </div>`,
  css: `.demo-io-frame {
  height: 200px;
  overflow-y: auto;
  border: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #d0d5dd));
  border-radius: var(--cngx-radius-md, 6px);
  padding: 0 16px;
}

.demo-io-spacer {
  height: 400px;
  display: flex;
  color: var(--cngx-color-text-muted, var(--cngx-ex-muted, #6b7280));
}

.demo-io-spacer--top {
  align-items: flex-end;
  padding-bottom: 16px;
}

.demo-io-spacer--bottom {
  align-items: flex-start;
  padding-top: 16px;
}

.demo-io-sentinel {
  padding: 16px;
  text-align: center;
  border-radius: var(--cngx-radius-md, 6px);
  background: var(--cngx-color-surface-alt, var(--cngx-ex-surface-alt, #f8f9fa));
  transition: background 0.3s;
}

.demo-io-sentinel--visible {
  background: var(--cngx-color-primary, var(--cngx-ex-focus, #2563eb));
  color: var(--cngx-color-on-primary, #ffffff);
}`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">entered</span>
      <span class="event-value">{{ enterCount() }}x</span>
    </div>
    <div class="event-row">
      <span class="event-label">left</span>
      <span class="event-value">{{ leaveCount() }}x</span>
    </div>
  </div>`,
};
