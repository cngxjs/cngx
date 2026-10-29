import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxIconSvg } from '@cngx/common/display';
import {
  CNGX_ICON_ALERT,
  CNGX_ICON_CHECK_CIRCLE,
  CNGX_ICON_INFO_CIRCLE,
  CNGX_ICON_X_CIRCLE,
  type CngxIconData,
} from '@cngx/utils';

import type { AlertSeverity } from '../alert/alert';

/** Glyph per severity: a distinct shape each, so colour is never the only cue. */
const SEVERITY_ICON: Record<AlertSeverity, CngxIconData> = {
  info: CNGX_ICON_INFO_CIRCLE,
  success: CNGX_ICON_CHECK_CIRCLE,
  warning: CNGX_ICON_ALERT,
  error: CNGX_ICON_X_CIRCLE,
};

/**
 * Shared default SVG icon for alert severity.
 *
 * Renders the built-in severity icons used by `CngxAlert`, `CngxAlertStack`,
 * and `CngxBannerOutlet`. Each severity has a distinct icon shape so color
 * is never the only indicator (WCAG 1.4.1).
 *
 * @internal
 */
@Component({
  selector: 'cngx-severity-icon',
  standalone: true,
  imports: [CngxIconSvg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `<svg [class]="iconClass()" [cngxIconSvg]="icon()"></svg>`,
})
export class CngxSeverityIcon {
  /** Which severity icon to render. */
  readonly severity = input.required<AlertSeverity>();

  /** CSS class applied to the SVG element. */
  readonly iconClass = input<string>('');

  /** @internal */
  protected readonly icon = computed(() => SEVERITY_ICON[this.severity()]);
}
