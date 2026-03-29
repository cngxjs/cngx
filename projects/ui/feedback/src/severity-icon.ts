import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import type { AlertSeverity } from './alert/alert';

/**
 * @internal — shared default SVG icon for alert severity.
 *
 * Renders the built-in severity icons used by `CngxAlert`, `CngxAlertStack`,
 * and `CngxBannerOutlet`. Each severity has a distinct icon shape so color
 * is never the only indicator (WCAG 1.4.1).
 */
@Component({
  selector: 'cngx-severity-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class]="iconClass()"
    >
      @switch (severity()) {
        @case ('info') {
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        }
        @case ('success') {
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        }
        @case ('warning') {
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        }
        @case ('error') {
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        }
      }
    </svg>
  `,
})
export class CngxSeverityIcon {
  /** Which severity icon to render. */
  readonly severity = input.required<AlertSeverity>();

  /** CSS class applied to the SVG element. */
  readonly iconClass = input<string>('');
}
