import { NgComponentOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { CngxCloseButton } from '@cngx/common/interactive';

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { CngxSeverityIcon } from '../config/severity-icon';
import { CngxBanner, type BannerState } from './banner.service';

/**
 * Banner outlet - renders the global banner stack at the top of the page.
 *
 * Place once in the app shell, above `<router-outlet>`.
 * Requires `provideFeedback(withBanners())`.
 *
 * Banners present at first render appear without animation to avoid
 * layout jump on page load.
 *
 * ```html
 * <cngx-banner-outlet />
 * <router-outlet />
 * ```
 *
 * @category ui/feedback/banner
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/banner/banner-outlet.ts
 * @since 0.1.0
 * @relatedTo CngxBanner, CngxBannerTrigger, CngxBannerOn
 *
 * <example-url>http://localhost:4200/#/ui/feedback/banner/async-action</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/banner/dedup-update</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/banner/system-banners</example-url>
 */
@Component({
  selector: 'cngx-banner-outlet',
  standalone: true,
  imports: [NgComponentOutlet, CngxCloseButton, CngxSeverityIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-banner-outlet',
  },
  template: `
    @for (banner of service.banners(); track banner.id) {
      <div
        class="cngx-banner"
        [class.cngx-banner--info]="banner.config.severity === 'info'"
        [class.cngx-banner--success]="banner.config.severity === 'success'"
        [class.cngx-banner--warning]="banner.config.severity === 'warning'"
        [class.cngx-banner--error]="banner.config.severity === 'error'"
        [class.cngx-banner--animate]="pastFirstRender()"
        [class.cngx-banner--pending]="banner.actionPending"
        [attr.role]="
          banner.config.severity === 'error' || banner.config.severity === 'warning'
            ? 'alert'
            : 'status'
        "
        [attr.aria-live]="banner.config.severity === 'error' ? 'assertive' : 'polite'"
        [attr.aria-busy]="banner.actionPending || null"
      >
        <div class="cngx-banner__icon">
          @if (iconFor(banner); as iconCmp) {
            <ng-container *ngComponentOutlet="iconCmp" />
          } @else {
            <cngx-severity-icon
              [severity]="banner.config.severity"
              iconClass="cngx-banner__default-icon"
            />
          }
        </div>
        <div class="cngx-banner__body">
          <span class="cngx-banner__message">{{ banner.config.message }}</span>
          @if (banner.actionError) {
            <span class="cngx-banner__error" role="alert">Action failed</span>
          }
        </div>
        @if (banner.config.action; as action) {
          <button
            type="button"
            class="cngx-banner__action"
            [disabled]="banner.actionPending"
            [attr.aria-busy]="banner.actionPending || null"
            (click)="service.executeAction(banner.id)"
          >
            {{ action.label }}
          </button>
        }
        @if (banner.config.dismissible && !banner.actionPending) {
          <cngx-close-button
            label="Dismiss"
            class="cngx-banner__dismiss"
            (click)="service.dismiss(banner.id)"
          />
        }
      </div>
    }
  `,
  styleUrls: ['./banner-outlet.css'],
})
export class CngxBannerOutlet {
  protected readonly service = inject(CngxBanner);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /**
   * @internal - skip enter animation for banners present at first render.
   * Prevents layout jump when banners are known before first paint (e.g., offline state).
   */
  protected readonly pastFirstRender = signal(false);

  constructor() {
    afterNextRender(() => this.pastFirstRender.set(true));
  }

  /** @internal - resolve icon from global config. */
  protected iconFor(banner: BannerState) {
    return this.config?.alertIcons?.[banner.config.severity] ?? null;
  }
}
