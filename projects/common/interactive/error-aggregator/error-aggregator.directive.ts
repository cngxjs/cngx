import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
  Renderer2,
  signal,
  untracked,
} from '@angular/core';
import { createErrorAggregatorContract } from '../error-registry/aggregator-contract';
import { errorSourceMapEqual } from '../error-registry/equal-fns';
import { CngxErrorRegistry } from '../error-registry/error-registry';
import { CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from '../error-scope/error-scope.token';
import {
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
  type CngxErrorAggregatorSourceEntry,
} from './error-aggregator.token';

/**
 * Aggregates one-or-more {@link CngxErrorSource} children into a single
 * live A11y surface.
 *
 * @category common/interactive/error
 *
 * Each registered source contributes a key + a live `Signal<boolean>` +
 * an optional label. Derived signals (`hasError`, `errorCount`,
 * `activeErrors`, `errorLabels`, `shouldShow`, `announcement`) are
 * `computed()` with structural `equal` fns so unrelated re-emissions
 * upstream do not cascade through descendants.
 *
 * Consumers render the SR live region themselves to keep the directive
 * template-free:
 *
 * ```html
 * <fieldset cngxErrorAggregator #agg="cngxErrorAggregator">
 *   <span cngxErrorSource="format" [when]="email().invalid()" label="Format"></span>
 *   <span cngxErrorSource="taken"  [when]="taken()"          label="Already used"></span>
 * </fieldset>
 * <span class="cngx-sr-only" aria-live="polite" aria-atomic="true">
 *   {{ agg.announcement() }}
 * </span>
 * ```
 *
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/error-aggregator/error-aggregator.directive.ts
 * @since 0.1.0
 * @relatedTo CngxErrorSource, CngxErrorScope, CngxErrorState, CngxErrorRegistry
 * <example-url>http://localhost:4200/#/common/interactive/error/aggregator/cngx-card-host-no-scope-errors-visible-immediately</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/error/aggregator/cngx-popover-panel-host</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/error/aggregator/material-mat-tab-label-with-error-count-badge</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/error/aggregator/native-form-scope-reveal-on-submit</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-error-aggregation/per-step-error-badges</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-error-aggregation/per-tab-error-badges</example-url>
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
  });

  readonly hasError = this.contract.hasError;
  readonly errorCount = this.contract.errorCount;
  readonly activeErrors = this.contract.activeErrors;
  readonly errorLabels = this.contract.errorLabels;
  readonly shouldShow = this.contract.shouldShow;
  readonly announcement = this.contract.announcement;

  addSource(entry: CngxErrorAggregatorSourceEntry): void {
    this.contract.addSource(entry);
  }

  removeSource(key: string): void {
    this.contract.removeSource(key);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    const platformId = inject(PLATFORM_ID);

    if (isPlatformBrowser(platformId)) {
      const hostEl = (inject(ElementRef) as ElementRef<HTMLElement>).nativeElement;
      const renderer = inject(Renderer2);

      let span: HTMLSpanElement | null = null;

      effect(() => {
        const enabled = this.autoAnnounce();
        const politeness = this.announcePoliteness();
        const text = this.announcement();

        untracked(() => {
          if (!enabled) {
            if (span?.parentNode === hostEl) {
              renderer.removeChild(hostEl, span);
            }
            span = null;
            return;
          }

          if (!span) {
            const el = renderer.createElement('span') as HTMLSpanElement;
            renderer.setStyle(el, 'position', 'var(--cngx-sr-only-position, absolute)');
            renderer.setStyle(el, 'width', 'var(--cngx-sr-only-size, 1px)');
            renderer.setStyle(el, 'height', 'var(--cngx-sr-only-size, 1px)');
            renderer.setStyle(el, 'overflow', 'var(--cngx-sr-only-overflow, hidden)');
            renderer.setStyle(el, 'clip', 'var(--cngx-sr-only-clip, rect(0, 0, 0, 0))');
            renderer.setStyle(el, 'white-space', 'var(--cngx-sr-only-white-space, nowrap)');
            renderer.setAttribute(el, 'aria-atomic', 'true');
            renderer.setAttribute(el, 'aria-relevant', 'additions text');
            renderer.appendChild(hostEl, el);
            span = el;
          }

          if (politeness === 'off') {
            renderer.removeAttribute(span, 'role');
          } else {
            renderer.setAttribute(span, 'role', politeness === 'assertive' ? 'alert' : 'status');
          }
          renderer.setAttribute(span, 'aria-live', politeness);
          span.textContent = text;
        });
      });

      destroyRef.onDestroy(() => {
        if (span?.parentNode === hostEl) {
          renderer.removeChild(hostEl, span);
        }
        span = null;
      });
    }

    const registry = inject(CngxErrorRegistry, { optional: true });
    if (!registry) {
      return;
    }
    afterNextRender(() => {
      const name = this.aggregatorName();
      if (!name) {
        return;
      }
      registry.registerAggregator(name, this);
      destroyRef.onDestroy(() => registry.unregisterAggregator(name));
    });
  }
}
