import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'MediaQuery',
  description:
    'Reactive media query directive. Exposes a matches signal that updates live when the viewport or preference changes.',
  apiComponents: ['CngxMediaQuery'],
  moduleImports: ["import { CngxMediaQuery } from '@cngx/common';"],
  sections: [
    {
      title: 'CngxMediaQuery — Viewport Breakpoints',
      subtitle:
        '<code>[cngxMediaQuery]</code> wraps <code>window.matchMedia()</code> with automatic cleanup. ' +
        'Resize your browser to see the signals update in real time.',
      imports: ['CngxMediaQuery'],
      template: `
  <div cngxMediaQuery="(min-width: 768px)" #tablet="cngxMediaQuery"></div>
  <div cngxMediaQuery="(min-width: 1024px)" #desktop="cngxMediaQuery"></div>
  <div cngxMediaQuery="(min-width: 1440px)" #wide="cngxMediaQuery"></div>
  <div cngxMediaQuery="(prefers-reduced-motion: reduce)" #motion="cngxMediaQuery"></div>
  <div cngxMediaQuery="(prefers-color-scheme: dark)" #darkPref="cngxMediaQuery"></div>

  <div class="status-row">
    <span class="status-badge" [class.active]="tablet.matches()">
      tablet (768px+): {{ tablet.matches() }}
    </span>
    <span class="status-badge" [class.active]="desktop.matches()">
      desktop (1024px+): {{ desktop.matches() }}
    </span>
    <span class="status-badge" [class.active]="wide.matches()">
      wide (1440px+): {{ wide.matches() }}
    </span>
  </div>

  <div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="motion.matches()">
      reduced-motion: {{ motion.matches() }}
    </span>
    <span class="status-badge" [class.active]="darkPref.matches()">
      prefers-dark: {{ darkPref.matches() }}
    </span>
  </div>`,
    },
  ],
};
