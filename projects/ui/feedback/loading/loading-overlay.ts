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
import { createVisibilityGate, injectLoadingConfig, type CngxAsyncState } from '@cngx/core/utils';

import { CngxLoadingIndicator } from './loading-indicator';

/**
 * Loading overlay - content container that blocks interaction while loading.
 *
 * Projects content inside a wrapper that receives `inert` during loading.
 * Renders a centered spinner over a semi-transparent backdrop.
 * Manages focus save/restore across the inert lifecycle.
 *
 * Uses `display: grid` with a shared grid cell - backdrop and content
 * overlap naturally without `position: absolute` or `display: contents`.
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
 * ### First load only (refresh uses the container's built-in bar)
 * ```html
 * <cngx-loading-overlay [state]="query" [firstLoadOnly]="true">
 *   <cngx-async-container [state]="query">...</cngx-async-container>
 * </cngx-loading-overlay>
 * ```
 *
 * @category ui/feedback/loading
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/loading/loading-overlay.ts
 * @since 0.1.0
 * @relatedTo CngxLoadingIndicator, CngxProgress, CngxAsyncContainer
 *
 * <example-url>http://localhost:4200/#/ui/feedback/loading-overlay/overlay-with-form</example-url>
 */
@Component({
  selector: 'cngx-loading-overlay',
  standalone: true,
  imports: [CngxLoadingIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
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
  styleUrls: ['./loading-overlay.css'],
})
export class CngxLoadingOverlay {
  private readonly doc = inject(DOCUMENT);
  private readonly loadingConfig = injectLoadingConfig();

  /** Bind an async state - shows overlay when `isBusy()`. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Direct boolean control - alternative to `[state]`. */
  readonly loading = input<boolean>(false);

  /** Screen reader label for the spinner. */
  readonly label = input<string>('Loading');

  /** Delay in ms before showing the overlay. Defaults to `CNGX_LOADING_CONFIG.showDelay`. */
  readonly delay = input<number>(this.loadingConfig.showDelay);

  /** Minimum display time in ms once visible. Defaults to `CNGX_LOADING_CONFIG.minDwell`. */
  readonly minDwell = input<number>(this.loadingConfig.minDwell);

  /**
   * @deprecated Use `minDwell`. Kept one release for migration; when set, it
   * takes precedence over `minDwell`.
   */
  readonly minDuration = input<number | undefined>(undefined);

  /**
   * When `true`, the overlay only activates during the first load (`isFirstLoad()`),
   * not during refreshes. Use the async container's built-in refresh bar for
   * subsequent loads to avoid content jumps under the backdrop.
   */
  readonly firstLoadOnly = input<boolean>(false);

  /** @internal */
  protected readonly isActive = computed(() => {
    const s = this.state();
    if (s) {
      return this.firstLoadOnly() ? s.isFirstLoad() : s.isBusy();
    }
    return this.loading();
  });

  /** @internal - deprecated `minDuration` alias forwards to `minDwell`. */
  protected readonly effectiveMinDwell = computed(() => this.minDuration() ?? this.minDwell());

  /** @internal - debounced visibility via shared gate factory. */
  protected readonly visible = createVisibilityGate(this.isActive, this.delay, this.effectiveMinDwell);

  private readonly savedFocus = signal<HTMLElement | null>(null);

  private readonly contentWrapper = viewChild.required<ElementRef<HTMLElement>>('contentWrapper');

  private readonly spinnerEl = viewChild<ElementRef<HTMLElement>>('spinnerEl');

  constructor() {
    // Capture focus on isActive, not visible - visible is debounced, by then the user may have tabbed away.
    effect(() => {
      const active = this.isActive();
      if (active) {
        const activeEl = this.doc.activeElement as HTMLElement | null;
        const wrapper = this.contentWrapper().nativeElement;
        if (activeEl && wrapper.contains(activeEl)) {
          this.savedFocus.set(activeEl);
        }
      }
    });

    effect(() => {
      const vis = this.visible();
      if (vis) {
        queueMicrotask(() => {
          const spinner = this.spinnerEl()?.nativeElement;
          if (spinner) {
            spinner.focus({ preventScroll: true });
          }
        });
      }
    });

    effect(() => {
      const active = this.isActive();
      if (!active) {
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
