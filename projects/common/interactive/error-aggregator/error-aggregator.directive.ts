import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  Injector,
  input,
  PLATFORM_ID,
  Renderer2,
  signal,
  untracked,
} from '@angular/core';
import { injectLocale } from '@cngx/core/utils';
import { createErrorAggregatorContract } from '../error-registry/aggregator-contract';
import { errorSourceMapEqual } from '../error-registry/equal-fns';
import { CngxErrorRegistry } from '../error-registry/error-registry';
import { registerByName } from '../error-registry/register-by-name';
import { CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { injectResolvedInteractiveI18n } from '../i18n/interactive-i18n';
import {
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
  type CngxErrorAggregatorSourceEntry,
} from './error-aggregator.token';

/**
 * Aggregates one-or-more {@link CngxErrorSource} children into a single
 * live A11y surface.
 *
 * Each registered source contributes a key + a live `Signal<boolean>` +
 * an optional label. Derived signals (`hasError`, `errorCount`,
 * `activeErrors`, `errorLabels`, `shouldShow`, `announcement`) are
 * `computed()` with structural `equal` fns so unrelated re-emissions
 * upstream do not cascade through descendants.
 *
 * ### Live region
 *
 * By default the directive appends a visually-hidden `<span>` to the
 * host element and writes {@link announcement} into its `textContent`
 * reactively, so an `aria-live` announcement fires the moment a source
 * toggles. The span carries `role="status"` (or `role="alert"` when
 * politeness is `'assertive'`), `aria-live`, `aria-atomic="true"`, and
 * `aria-relevant="additions text"`. Visually-hidden styling is applied
 * inline via `--cngx-sr-only-*` CSS custom properties - no global
 * stylesheet required.
 *
 * Set `[autoAnnounce]="false"` to take ownership of the live region in
 * consumer markup (for example, when routing announcements through
 * CDK's `LiveAnnouncer` service). Use `[announcePoliteness]` to switch
 * to `'assertive'` for safety-critical errors or `'off'` to suppress
 * announcements entirely while keeping the visual error surface.
 *
 * The region speaks the joined labels, or the `errorCountAnnouncement` count
 * message when no active source has a label, and speaks again on every
 * `reveal()` of the scope. A politeness change replaces the region.
 *
 * ```html
 * <fieldset cngxErrorAggregator #agg="cngxErrorAggregator">
 *   <span cngxErrorSource="format" [when]="email().invalid()" label="Format"></span>
 *   <span cngxErrorSource="taken"  [when]="taken()"          label="Already used"></span>
 *
 *   @if (agg.shouldShow()) {
 *     <ul>
 *       @for (label of agg.errorLabels(); track label) {
 *         <li>{{ label }}</li>
 *       }
 *     </ul>
 *   }
 * </fieldset>
 * ```
 *
 * Owning the region instead:
 *
 * ```html
 * <fieldset cngxErrorAggregator [autoAnnounce]="false" #agg="cngxErrorAggregator">...</fieldset>
 * <span class="cngx-sr-only" aria-live="polite" aria-atomic="true">{{ agg.announcement() }}</span>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/error-aggregator/error-aggregator.directive.ts
 * @since 0.1.0
 * @relatedTo CngxErrorSource, CngxErrorScope, CngxErrorState, CngxErrorRegistry
 * <example-url>/#/common/interactive/error/aggregator/cngx-card-host-no-scope-errors-visible-immediately</example-url>
 * <example-url>/#/common/interactive/error/aggregator/cngx-popover-panel-host</example-url>
 * <example-url>/#/common/interactive/error/aggregator/material-mat-tab-label-with-error-count-badge</example-url>
 * <example-url>/#/common/interactive/error/aggregator/native-form-scope-reveal-on-submit</example-url>
 * <example-url>/#/ui/stepper/stepper-error-aggregation/per-step-error-badges</example-url>
 * <example-url>/#/ui/tabs/tab-error-aggregation/per-tab-error-badges</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxErrorAggregator]',
  standalone: true,
  exportAs: 'cngxErrorAggregator',
  providers: [{ provide: CNGX_ERROR_AGGREGATOR, useExisting: CngxErrorAggregator }],
  host: {
    '[class.cngx-error]': 'shouldShow()',
    '[attr.aria-invalid]': 'shouldShow() ? "true" : "false"',
  },
})
export class CngxErrorAggregator implements CngxErrorAggregatorContract {
  /** External scope override; falls back to ancestor `CNGX_ERROR_SCOPE`. */
  readonly scope = input<CngxErrorScopeContract | undefined>(undefined);

  /** Optional name; enables programmatic lookup via {@link CngxErrorRegistry}. */
  readonly aggregatorName = input<string | undefined>(undefined, {
    alias: 'cngxErrorAggregatorName',
  });

  /**
   * When `true` (default), the directive appends its own visually-hidden
   * `<span>` to the host element and writes {@link announcement} into its
   * `textContent`. Set to `false` to take ownership of the live region in
   * consumer markup (e.g. when routing announcements through CDK's
   * `LiveAnnouncer`).
   */
  readonly autoAnnounce = input<boolean>(true);

  /**
   * Politeness of the auto-rendered live region. Mirrors the WAI-ARIA
   * `aria-live` value. `'polite'` queues after the current utterance,
   * `'assertive'` interrupts, `'off'` disables announcement (the span is
   * still rendered but is not announced).
   */
  readonly announcePoliteness = input<'polite' | 'assertive' | 'off'>('polite');

  /**
   * Live-region text while errors show but no active source has a label;
   * receives the active error count. Falls back to `errorCountAnnouncement`
   * of `CNGX_INTERACTIVE_I18N` (English: `1 error` / `2 errors`).
   */
  readonly errorCountAnnouncement = input<((count: number) => string) | undefined>(undefined);

  private readonly i18n = injectResolvedInteractiveI18n();

  private readonly ancestorScope = inject<CngxErrorScopeContract | null>(CNGX_ERROR_SCOPE, {
    optional: true,
  });

  private readonly sourcesState = signal<ReadonlyMap<string, CngxErrorAggregatorSourceEntry>>(
    new Map(),
    { equal: errorSourceMapEqual },
  );

  /** @internal - the resolved scope (input wins, else ancestor, else `null`). */
  protected readonly effectiveScope = computed<CngxErrorScopeContract | null>(
    () => this.scope() ?? this.ancestorScope,
  );

  private readonly contract = createErrorAggregatorContract({
    sourcesState: this.sourcesState,
    scope: this.effectiveScope,
    locale: injectLocale(),
    countAnnouncement: (count) =>
      untracked(() => (this.errorCountAnnouncement() ?? this.i18n().errorCountAnnouncement)(count)),
  });

  readonly hasError = this.contract.hasError;
  readonly errorCount = this.contract.errorCount;
  readonly activeErrors = this.contract.activeErrors;
  readonly errorLabels = this.contract.errorLabels;
  readonly shouldShow = this.contract.shouldShow;
  readonly announcement = this.contract.announcement;

  /**
   * Registers an error source by its `key`; an entry with an existing key replaces the old
   * one. Implements `addSource` of `CngxErrorAggregatorContract` (`CNGX_ERROR_AGGREGATOR`),
   * called by `CngxErrorSource` on init.
   */
  addSource(entry: CngxErrorAggregatorSourceEntry): void {
    this.contract.addSource(entry);
  }

  /**
   * Removes an error source; no-op when the key is absent. With `entry` only that
   * source leaves and a shadowed duplicate of the key takes over again.
   * Implements `removeSource` of `CngxErrorAggregatorContract` (`CNGX_ERROR_AGGREGATOR`),
   * called by `CngxErrorSource` on teardown.
   */
  removeSource(key: string, entry?: CngxErrorAggregatorSourceEntry): void {
    this.contract.removeSource(key, entry);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    const platformId = inject(PLATFORM_ID);

    if (isPlatformBrowser(platformId)) {
      const hostEl = (inject(ElementRef) as ElementRef<HTMLElement>).nativeElement;
      const renderer = inject(Renderer2);

      let span: HTMLSpanElement | null = null;
      let spanPoliteness: 'polite' | 'assertive' | 'off' | null = null;

      const removeSpan = (): void => {
        if (span?.parentNode === hostEl) {
          renderer.removeChild(hostEl, span);
        }
        span = null;
        spanPoliteness = null;
      };

      // role and aria-live are set before insertion and never swapped on a
      // live node; a politeness change replaces the region instead.
      const createSpan = (politeness: 'polite' | 'assertive' | 'off', text: string): void => {
        const el = renderer.createElement('span') as HTMLSpanElement;
        renderer.setStyle(el, 'position', 'var(--cngx-sr-only-position, absolute)');
        renderer.setStyle(el, 'width', 'var(--cngx-sr-only-size, 1px)');
        renderer.setStyle(el, 'height', 'var(--cngx-sr-only-size, 1px)');
        renderer.setStyle(el, 'overflow', 'var(--cngx-sr-only-overflow, hidden)');
        renderer.setStyle(el, 'clip', 'var(--cngx-sr-only-clip, rect(0, 0, 0, 0))');
        renderer.setStyle(el, 'white-space', 'var(--cngx-sr-only-white-space, nowrap)');
        renderer.setAttribute(el, 'aria-atomic', 'true');
        renderer.setAttribute(el, 'aria-relevant', 'additions text');
        if (politeness !== 'off') {
          renderer.setAttribute(el, 'role', politeness === 'assertive' ? 'alert' : 'status');
        }
        renderer.setAttribute(el, 'aria-live', politeness);
        el.textContent = text;
        renderer.appendChild(hostEl, el);
        span = el;
        spanPoliteness = politeness;
      };

      const injector = inject(Injector);
      let destroyed = false;
      let lastEpoch = 0;

      effect(() => {
        const enabled = this.autoAnnounce();
        const politeness = this.announcePoliteness();
        const text = this.announcement();
        const epoch = this.effectiveScope()?.revealEpoch?.() ?? 0;

        untracked(() => {
          const revealedAgain = epoch !== lastEpoch;
          lastEpoch = epoch;
          if (!enabled) {
            removeSpan();
            return;
          }
          if (span && spanPoliteness !== politeness) {
            removeSpan();
          }
          if (!span) {
            createSpan(politeness, text);
            return;
          }
          if (span.textContent !== text) {
            span.textContent = text;
            return;
          }
          if (!revealedAgain || text === '') {
            return;
          }
          // Same text on a new reveal: clear now, write after render, so the
          // reader sees a change and speaks the errors again.
          const region = span;
          region.textContent = '';
          afterNextRender(
            {
              write: () => {
                if (!destroyed && span === region) {
                  region.textContent = untracked(this.announcement);
                }
              },
            },
            { injector },
          );
        });
      });

      destroyRef.onDestroy(() => {
        destroyed = true;
        removeSpan();
      });
    }

    const registry = inject(CngxErrorRegistry, { optional: true });
    if (!registry) {
      return;
    }
    registerByName(
      this.aggregatorName,
      (name) => registry.registerAggregator(name, this),
      (name) => registry.unregisterAggregator(name, this),
    );
  }
}
