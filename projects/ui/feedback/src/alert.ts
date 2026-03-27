import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxCloseButton } from '@cngx/common/interactive';

import { CNGX_FEEDBACK_CONFIG } from './feedback-config';

/** Severity level for the alert — determines visual style, icon, and ARIA role. */
export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

/** Content slot directive for custom alert icons. */
@Directive({ selector: '[cngxAlertIcon]', standalone: true })
export class CngxAlertIcon {
  readonly templateRef = inject(TemplateRef, { optional: true });
}

/**
 * Inline alert atom — persistent, no timeout.
 *
 * Communicates contextual messages: form errors, warnings, confirmations.
 * Each severity has a default icon — color is never the only indicator (WCAG 1.4.1).
 *
 * With `[state]`: auto-shows on error, auto-hides on success (after 3s minimum
 * display time per WCAG 2.2.1). Error alert stays visible during retry.
 *
 * @usageNotes
 *
 * ### Static alert
 * ```html
 * <cngx-alert severity="warning" title="Unsaved changes">
 *   Your changes will be lost if you leave.
 *   <button cngxAlertAction (click)="save()">Save now</button>
 * </cngx-alert>
 * ```
 *
 * ### State-driven alert
 * ```html
 * <cngx-alert [state]="saveState" severity="error" title="Save failed" [dismissible]="true" />
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-alert',
  standalone: true,
  imports: [NgComponentOutlet, CngxCloseButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-alert',
    '[class.cngx-alert--info]': 'severity() === "info"',
    '[class.cngx-alert--success]': 'severity() === "success"',
    '[class.cngx-alert--warning]': 'severity() === "warning"',
    '[class.cngx-alert--error]': 'severity() === "error"',
    '[attr.role]': 'isVisible() ? ariaRole() : null',
    '[attr.aria-atomic]': 'isVisible() ? "true" : null',
    '[attr.aria-label]': 'isVisible() ? (title() || null) : null',
    '[attr.hidden]': '!isVisible() || null',
  },
  template: `
    <div class="cngx-alert__icon">
      <ng-content select="[cngxAlertIcon]" />
      @if (globalIcon(); as iconCmp) {
        @if (!customIcon()) {
          <ng-container *ngComponentOutlet="iconCmp" />
        }
      } @else if (!customIcon()) {
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="cngx-alert__default-icon"
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
      }
    </div>
    <div class="cngx-alert__body">
      @if (title()) {
        <strong class="cngx-alert__title">{{ title() }}</strong>
      }
      <div class="cngx-alert__content">
        <ng-content />
      </div>
      <div class="cngx-alert__actions">
        <ng-content select="[cngxAlertAction]" />
      </div>
    </div>
    @if (dismissible()) {
      <cngx-close-button label="Dismiss" class="cngx-alert__dismiss" (click)="handleDismiss()" />
    }
  `,
  styles: `
    .cngx-alert {
      display: flex;
      align-items: flex-start;
      gap: var(--cngx-alert-gap, 12px);
      padding: var(--cngx-alert-padding, 12px 16px);
      border-radius: var(--cngx-alert-border-radius, 8px);
      border: 1px solid var(--cngx-alert-border-color, transparent);
      background: var(--cngx-alert-bg, #f8fafc);
      color: var(--cngx-alert-color, inherit);
    }

    .cngx-alert--info {
      --cngx-alert-bg: var(--cngx-alert-info-bg, #eff6ff);
      --cngx-alert-border-color: var(--cngx-alert-info-border, #bfdbfe);
      --cngx-alert-icon-color: var(--cngx-alert-info-icon, #3b82f6);
    }

    .cngx-alert--success {
      --cngx-alert-bg: var(--cngx-alert-success-bg, #f0fdf4);
      --cngx-alert-border-color: var(--cngx-alert-success-border, #bbf7d0);
      --cngx-alert-icon-color: var(--cngx-alert-success-icon, #22c55e);
    }

    .cngx-alert--warning {
      --cngx-alert-bg: var(--cngx-alert-warning-bg, #fffbeb);
      --cngx-alert-border-color: var(--cngx-alert-warning-border, #fde68a);
      --cngx-alert-icon-color: var(--cngx-alert-warning-icon, #f59e0b);
    }

    .cngx-alert--error {
      --cngx-alert-bg: var(--cngx-alert-error-bg, #fef2f2);
      --cngx-alert-border-color: var(--cngx-alert-error-border, #fecaca);
      --cngx-alert-icon-color: var(--cngx-alert-error-icon, #ef4444);
    }

    .cngx-alert__icon {
      flex-shrink: 0;
      color: var(--cngx-alert-icon-color, currentColor);
    }

    .cngx-alert__default-icon {
      width: var(--cngx-alert-icon-size, 20px);
      height: var(--cngx-alert-icon-size, 20px);
    }

    .cngx-alert__body {
      flex: 1;
      min-width: 0;
    }

    .cngx-alert__title {
      display: block;
      font-weight: var(--cngx-alert-title-weight, 600);
      margin-bottom: var(--cngx-alert-title-gap, 4px);
    }

    .cngx-alert__actions:empty {
      display: none;
    }

    .cngx-alert__actions {
      margin-top: var(--cngx-alert-actions-gap, 8px);
    }

    .cngx-alert__dismiss {
      flex-shrink: 0;
    }

    .cngx-alert--hidden {
      display: none;
    }
  `,
})
export class CngxAlert {
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /** Alert severity — determines visual style, default icon, and ARIA role. */
  readonly severity = input<AlertSeverity>('info');

  /** Optional title displayed above the content. */
  readonly title = input<string | undefined>(undefined);

  /** Shows a dismiss button. */
  readonly dismissible = input<boolean>(false);

  /** Bind an async state — auto-shows on error, auto-hides on success. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Emitted when the dismiss button is clicked. */
  readonly dismissed = output<void>();

  /** @internal — detects projected custom icon to hide default/global icon. */
  protected readonly customIcon = contentChild(CngxAlertIcon);

  /** @internal — global icon component for the current severity (from provideFeedback config). */
  protected readonly globalIcon = computed(
    () => this.config?.alertIcons?.[this.severity()] ?? null,
  );

  // ── State-driven visibility ─────────────────────────────────────────

  private readonly manualDismissed = signal(false);
  private readonly minDisplayHold = signal(false);
  private minDisplayTimer: ReturnType<typeof setTimeout> | undefined;

  /** @internal — ARIA role: 'alert' for error/warning, 'status' for info/success. */
  protected readonly ariaRole = computed(() => {
    const s = this.severity();
    return s === 'error' || s === 'warning' ? 'alert' : 'status';
  });

  /**
   * @internal — visibility logic:
   * - No state binding: always visible (static alert)
   * - State bound: visible on error OR success (with 3s min-display for success)
   * - Manual dismiss overrides everything
   * - minDisplayHold keeps visible during the 3s window after success
   */
  protected readonly isVisible = computed(() => {
    if (this.manualDismissed()) {
      return false;
    }

    const s = this.state();
    if (!s) {
      return true;
    }

    const status = s.status();

    // Error/warning: always show
    if (status === 'error') {
      return true;
    }

    // Success: show briefly (minDisplayHold manages the 3s window)
    if (status === 'success' && this.minDisplayHold()) {
      return true;
    }

    // Loading after error: keep error alert visible during retry
    if (status === 'loading' && this.minDisplayHold()) {
      return true;
    }

    return false;
  });

  constructor() {
    // Reset manual dismiss and start min-display timer on state transitions
    effect(() => {
      const s = this.state();
      if (!s) {
        return;
      }
      const status = s.status();

      if (status === 'error') {
        this.manualDismissed.set(false);
        this.minDisplayHold.set(true);
        this.clearMinDisplayTimer();
      }

      if (status === 'success') {
        // Start 3s min-display timer — alert stays visible then auto-hides
        this.clearMinDisplayTimer();
        this.minDisplayHold.set(true);
        this.minDisplayTimer = setTimeout(() => {
          this.minDisplayTimer = undefined;
          this.minDisplayHold.set(false);
        }, 3000);
      }
    });
  }

  private clearMinDisplayTimer(): void {
    if (this.minDisplayTimer !== undefined) {
      clearTimeout(this.minDisplayTimer);
      this.minDisplayTimer = undefined;
    }
  }

  /** @internal */
  protected handleDismiss(): void {
    this.manualDismissed.set(true);
    this.clearMinDisplayTimer();
    this.dismissed.emit();
  }
}
