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
 * Banner outlet — renders the global banner stack at the top of the page.
 *
 * Place once in the app shell, above `<router-outlet>`.
 * Requires `provideFeedback(withBanners())`.
 *
 * Banners present at first render appear without animation to avoid
 * layout jump on page load.
 *
 * @usageNotes
 * ```html
 * <cngx-banner-outlet />
 * <router-outlet />
 * ```
 *
 * @category feedback
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
  styles: `
    .cngx-banner-outlet {
      display: block;
      position: sticky;
      top: 0;
      z-index: var(--cngx-banner-z-index, 900);
      width: 100%;
    }

    .cngx-banner-outlet:empty {
      display: none;
    }

    .cngx-banner {
      display: flex;
      align-items: center;
      gap: var(--cngx-banner-gap, 12px);
      padding: var(--cngx-banner-padding, 10px 16px);
      background: var(--cngx-banner-bg, #f8fafc);
      color: var(--cngx-banner-color, inherit);
      border-bottom: 1px solid var(--cngx-banner-border-color, transparent);
    }

    .cngx-banner--animate {
      animation: cngx-banner-enter var(--cngx-banner-enter-duration, 200ms) ease-out both;
    }

    .cngx-banner--info {
      --cngx-banner-bg: var(--cngx-banner-info-bg, #eff6ff);
      --cngx-banner-border-color: var(--cngx-banner-info-border, #bfdbfe);
      --cngx-banner-icon-color: var(--cngx-banner-info-icon, #3b82f6);
      --cngx-banner-accent: var(--cngx-banner-info-icon, #3b82f6);
    }

    .cngx-banner--success {
      --cngx-banner-bg: var(--cngx-banner-success-bg, #f0fdf4);
      --cngx-banner-border-color: var(--cngx-banner-success-border, #bbf7d0);
      --cngx-banner-icon-color: var(--cngx-banner-success-icon, #22c55e);
      --cngx-banner-accent: var(--cngx-banner-success-icon, #22c55e);
    }

    .cngx-banner--warning {
      --cngx-banner-bg: var(--cngx-banner-warning-bg, #fffbeb);
      --cngx-banner-border-color: var(--cngx-banner-warning-border, #fde68a);
      --cngx-banner-icon-color: var(--cngx-banner-warning-icon, #f59e0b);
      --cngx-banner-accent: var(--cngx-banner-warning-icon, #f59e0b);
    }

    .cngx-banner--error {
      --cngx-banner-bg: var(--cngx-banner-error-bg, #fef2f2);
      --cngx-banner-border-color: var(--cngx-banner-error-border, #fecaca);
      --cngx-banner-icon-color: var(--cngx-banner-error-icon, #ef4444);
      --cngx-banner-accent: var(--cngx-banner-error-icon, #ef4444);
    }

    .cngx-banner--pending {
      opacity: var(--cngx-banner-pending-opacity, 0.85);
      pointer-events: none;
    }

    .cngx-banner__icon {
      flex-shrink: 0;
      color: var(--cngx-banner-icon-color, currentColor);
    }

    .cngx-banner__default-icon {
      width: var(--cngx-banner-icon-size, 20px);
      height: var(--cngx-banner-icon-size, 20px);
    }

    .cngx-banner__body {
      flex: 1;
      min-width: 0;
    }

    .cngx-banner__message {
      font-size: var(--cngx-banner-font-size, 0.9375rem);
      line-height: var(--cngx-banner-line-height, 1.5);
    }

    .cngx-banner__error {
      display: block;
      font-size: var(--cngx-banner-error-font-size, 0.875rem);
      color: var(--cngx-banner-error-color, #ef4444);
      margin-top: 2px;
    }

    .cngx-banner__action {
      appearance: none;
      background: var(--cngx-banner-action-bg, transparent);
      border: 1px solid var(--cngx-banner-accent, currentColor);
      border-radius: var(--cngx-banner-action-radius, 4px);
      padding: var(--cngx-banner-action-padding, 6px 12px);
      min-width: var(--cngx-banner-action-min-size, 44px);
      min-height: var(--cngx-banner-action-min-size, 44px);
      cursor: pointer;
      font-size: var(--cngx-banner-action-font-size, 0.875rem);
      font-weight: var(--cngx-banner-action-font-weight, 600);
      color: var(--cngx-banner-accent, currentColor);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .cngx-banner__action:hover:not(:disabled) {
      background: var(--cngx-banner-action-hover-bg, rgba(0, 0, 0, 0.04));
    }

    .cngx-banner__action:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    .cngx-banner__action:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .cngx-banner__dismiss {
      flex-shrink: 0;
    }

    @keyframes cngx-banner-enter {
      from {
        opacity: 0;
        transform: translateY(calc(-1 * var(--cngx-banner-enter-offset, 100%)));
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cngx-banner--animate {
        animation: none;
      }
    }
  `,
})
export class CngxBannerOutlet {
  protected readonly service = inject(CngxBanner);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /**
   * @internal — skip enter animation for banners present at first render.
   * Prevents layout jump when banners are known before first paint (e.g., offline state).
   */
  protected readonly pastFirstRender = signal(false);

  constructor() {
    afterNextRender(() => this.pastFirstRender.set(true));
  }

  /** @internal — resolve icon from global config. */
  protected iconFor(banner: BannerState) {
    return this.config?.alertIcons?.[banner.config.severity] ?? null;
  }
}
