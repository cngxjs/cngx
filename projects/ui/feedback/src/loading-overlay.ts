import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CNGX_FEEDBACK_CONFIG } from './feedback-config';
import { CngxLoadingIndicator } from './loading-indicator';
import { createVisibilityTimer } from './visibility-timer';

/**
 * Loading overlay — content container that blocks interaction while loading.
 *
 * Projects content inside a wrapper that receives `inert` during loading.
 * Renders a centered spinner over a semi-transparent backdrop.
 * Manages focus save/restore across the inert lifecycle.
 *
 * Uses `display: contents` on the host — no extra DOM wrapper for layout.
 *
 * @usageNotes
 *
 * ### With async state
 * ```html
 * <cngx-loading-overlay [state]="tableData">
 *   <table>...</table>
 * </cngx-loading-overlay>
 * ```
 *
 * ### Manual boolean
 * ```html
 * <cngx-loading-overlay [loading]="isSaving()">
 *   <form>...</form>
 * </cngx-loading-overlay>
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-loading-overlay',
  standalone: true,
  imports: [CngxLoadingIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    style: 'display: contents',
    class: 'cngx-loading-overlay',
  },
  template: `
    <div
      class="cngx-loading-overlay__content"
      #contentWrapper
      [attr.inert]="isActive() || null"
      [attr.aria-busy]="isActive() || null"
    >
      <ng-content />
    </div>
    @if (visible()) {
      <div class="cngx-loading-overlay__backdrop" aria-hidden="true">
        <div
          class="cngx-loading-overlay__spinner-wrapper"
          #spinnerEl
          tabindex="-1"
          role="status"
          [attr.aria-label]="label()"
        >
          <cngx-loading-indicator [loading]="true" variant="spinner" />
        </div>
      </div>
    }
  `,
  styles: `
    .cngx-loading-overlay__content {
      position: relative;
    }

    .cngx-loading-overlay__backdrop {
      position: absolute;
      inset: 0;
      z-index: var(--cngx-loading-overlay-z-index, 10);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--cngx-loading-overlay-backdrop-bg, rgba(255, 255, 255, 0.5));
      opacity: var(--cngx-loading-overlay-backdrop-opacity, 1);
      transition: opacity 150ms ease;
    }

    .cngx-loading-overlay__spinner-wrapper {
      outline: none;
    }

    .cngx-loading-overlay__spinner-wrapper:focus-visible {
      outline: 2px solid var(--cngx-loading-indicator-color, currentColor);
      outline-offset: 2px;
      border-radius: 50%;
    }

    @media (prefers-reduced-motion: reduce) {
      .cngx-loading-overlay__backdrop {
        transition: none;
      }
    }
  `,
})
export class CngxLoadingOverlay {
  private readonly doc = inject(DOCUMENT);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /** Bind an async state — shows overlay when `isBusy()`. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Direct boolean control — alternative to `[state]`. */
  readonly loading = input<boolean>(false);

  /** Screen reader label for the spinner. */
  readonly label = input<string>('Loading');

  /** Delay in ms before showing the overlay. Falls back to global config, then 200ms. */
  readonly delay = input<number>(this.config?.loadingDelay ?? 200);

  /** Minimum display time in ms once visible. Falls back to global config, then 500ms. */
  readonly minDuration = input<number>(this.config?.loadingMinDuration ?? 500);

  /** @internal */
  protected readonly isActive = computed(() => this.state()?.isBusy() ?? this.loading());

  /** @internal — debounced visibility via shared timer factory. */
  readonly visible = createVisibilityTimer(this.isActive, this.delay, this.minDuration);

  // ── Focus management ────────────────────────────────────────────────

  private readonly savedFocus = signal<HTMLElement | null>(null);

  private readonly contentWrapper =
    viewChild.required<ElementRef<HTMLElement>>('contentWrapper');

  private readonly spinnerEl =
    viewChild<ElementRef<HTMLElement>>('spinnerEl');

  constructor() {
    effect(() => {
      const active = this.isActive();

      if (active) {
        // Phase 1: save focus if it's inside the content wrapper
        const activeEl = this.doc.activeElement as HTMLElement | null;
        const wrapper = this.contentWrapper().nativeElement;
        if (activeEl && wrapper.contains(activeEl)) {
          this.savedFocus.set(activeEl);
        }
        // Phase 2: move focus to spinner after a tick (needs to be in DOM)
        queueMicrotask(() => {
          const spinner = this.spinnerEl()?.nativeElement;
          if (spinner && this.isActive()) {
            spinner.focus({ preventScroll: true });
          }
        });
      } else {
        // Phase 3: restore focus
        const saved = this.savedFocus();
        if (saved) {
          this.savedFocus.set(null);
          queueMicrotask(() => {
            if (saved.isConnected && typeof saved.focus === 'function') {
              saved.focus({ preventScroll: true });
            } else {
              const wrapper = this.contentWrapper().nativeElement;
              wrapper.setAttribute('tabindex', '-1');
              wrapper.focus({ preventScroll: true });
              wrapper.removeAttribute('tabindex');
            }
          });
        }
      }
    });
  }
}
