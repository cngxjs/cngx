import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'MediaQuery',
  navLabel: 'MediaQuery',
  navCategory: 'layout',
  description:
    'Reactive media query directive for viewport breakpoints and user preferences. Exposes a matches signal that updates live — use when CSS alone cannot drive component logic.',
  apiComponents: ['CngxMediaQuery'],
  moduleImports: ["import { CngxMediaQuery } from '@cngx/common';"],
  sections: [
    {
      title: 'CngxMediaQuery — Viewport Breakpoints',
      subtitle:
        '<code>[cngxMediaQuery]</code> wraps <code>window.matchMedia()</code> as a reactive signal with automatic cleanup. ' +
        'Use this when component logic (not just CSS) needs to respond to viewport or preference changes — e.g. switching between a chart and a table on mobile, ' +
        'or loading different data on narrow screens. For pure styling, CSS <code>@media</code> or <code>@container</code> queries are preferred. ' +
        'Resize your browser to see the signals update live.',
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
