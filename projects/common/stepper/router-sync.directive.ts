import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  output,
  untracked,
  type AfterContentInit,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { injectStepperConfig } from './stepper-config';
import { CNGX_STEPPER_HOST } from './stepper-host.token';

/**
 * URL deep-linking for the stepper. Bidirectional sync between
 * `activeStepId` and a URL fragment / query-param. Opt-in via
 * `[cngxStepperRouterSync]` on the presenter element.
 *
 * - `mode = 'fragment'` (default) → `#step=customer`
 * - `mode = 'queryParam'` with `paramName = 'step'` → `?step=customer`
 *
 * `Router` is optional - without `@angular/router` the directive
 * dev-warns once and becomes a no-op.
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/router-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepperPresenter, CNGX_STEPPER_CONFIG
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-router-sync/deep-linking-with-fragment-queryparam-modes</example-url>
 */
@Directive({
  selector: '[cngxStepperRouterSync]',
  exportAs: 'cngxStepperRouterSync',
  standalone: true,
})
export class CngxStepperRouterSync implements AfterContentInit {
  // Default undefined so the cascade resolves through CNGX_STEPPER_CONFIG.
  // Init-only: the seed and the write effect capture the resolved mode /
  // param on their first run; changing either after init leaves the old
  // URL key behind. Rebuild the directive to change them.
  readonly modeInput = input<'fragment' | 'queryParam' | undefined>(undefined, { alias: 'mode' });
  readonly paramNameInput = input<string | undefined>(undefined, {
    alias: 'paramName',
  });

  private readonly config = injectStepperConfig();

  readonly mode = computed<'fragment' | 'queryParam'>(
    () => this.modeInput() ?? this.config.routerSyncMode ?? 'fragment',
  );
  readonly paramName = computed<string>(
    () => this.paramNameInput() ?? this.config.routerSyncParam ?? 'step',
  );

  /** Emits when a `router.navigate` rejection is observed. */
  readonly syncError = output<unknown>();

  private readonly host = inject(CNGX_STEPPER_HOST, { host: true });
  private readonly router = inject(Router, { optional: true });

  /**
   * Latched once the URL seed has reached a registered step, so the
   * `afterNextRender` fallback cannot run it twice.
   *
   * The latch is load-bearing, not decorative: the seed goes through
   * `selectById` → `select()`, which opens a commit window. Under a
   * pessimistic commit `activeStepIndex` still holds the *previous* index
   * while the action is in flight, so the presenter's `target === previous`
   * bail does not catch the repeat - an unlatched fallback would fire the
   * consumer's commit-action a second time and supersede the first.
   */
  private seeded = false;

  constructor() {
    if (!this.router) {
      afterNextRender(() => {
        console.warn(
          'CngxStepperRouterSync: no Router available - directive is a no-op. ' +
            'Provide @angular/router via provideRouter(...) to enable deep-linking.',
        );
      });
      return;
    }
    const router = this.router;

    // Fallback seed for steps that register after content-init (a dynamic
    // @for over an async step list). Idempotent against the content-init
    // seed via the `seeded` latch.
    afterNextRender(() => this.seedFromUrl(router));

    effect(() => {
      const id = this.host.activeStepId();
      if (!id) {
        return;
      }
      untracked(() => this.writeUrl(router, id));
    });

    const navEnd = toSignal(
      router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      ),
      { initialValue: null },
    );
    effect(() => {
      const e = navEnd();
      if (!e) {
        return;
      }
      untracked(() => {
        const next = this.readUrlValue(router);
        if (next && next !== this.host.activeStepId()) {
          this.host.selectById(next);
        }
      });
    });
  }

  /**
   * Seed from the URL before the stepper renders its panels. `CngxStep`
   * registers in `ngOnInit` (so a bound `[id]` reaches the registry), which
   * runs before the host's `ngAfterContentInit` - the registry is populated
   * by the time this runs, and the host view has not rendered yet, which is
   * what keeps a `panelMode="lazy"` default step from counting its first
   * render as a first activation on a deep link that named another step.
   *
   * Own router guard: the constructor's early return does not stop
   * lifecycle hooks from running.
   */
  ngAfterContentInit(): void {
    if (!this.router) {
      return;
    }
    this.seedFromUrl(this.router);
  }

  private seedFromUrl(router: Router): void {
    if (this.seeded) {
      return;
    }
    const initial = this.readUrlValue(router);
    if (!initial) {
      return;
    }
    // Only latch once the target is actually registered. A seed that found
    // no matching step leaves the fallback armed for steps that register
    // after content-init.
    if (!this.host.stepsOnly().some((n) => n.id === initial)) {
      return;
    }
    this.seeded = true;
    // No explicit URL correction on a refused (linear-blocked / disabled)
    // seed: the activeStepId write effect's first run flushes AFTER this
    // content-init hook and unconditionally reflects the ACTUAL active id
    // into the URL, so a refused deep link is rewritten on the same tick.
    // The refused-seed spec pins that guarantee.
    untracked(() => this.host.selectById(initial));
  }

  /**
   * Reflect `id` into the URL. Fragment mode re-serializes the existing
   * fragment params so foreign state (`#foo=1&step=x`) survives the
   * write; values are URI-encoded symmetric to {@link parseFragment}.
   */
  private writeUrl(router: Router, id: string): void {
    const navigation =
      this.mode() === 'fragment'
        ? router.navigate([], {
            fragment: this.serializeFragment(router, id),
            queryParamsHandling: 'merge',
            replaceUrl: true,
          })
        : router.navigate([], {
            queryParams: { [this.paramName()]: id },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
    navigation.catch?.((err: unknown) => this.syncError.emit(err));
  }

  private serializeFragment(router: Router, id: string): string {
    const param = this.paramName();
    const current = router.routerState.snapshot.root.fragment ?? '';
    const segments = current
      .split('&')
      .filter((seg) => seg !== '' && seg.split('=')[0] !== param);
    segments.push(`${param}=${encodeURIComponent(id)}`);
    return segments.join('&');
  }

  private readUrlValue(router: Router): string | null {
    if (this.mode() === 'fragment') {
      return this.parseFragment(router.routerState.snapshot.root.fragment ?? '');
    }
    return router.routerState.snapshot.root.queryParamMap.get(this.paramName()) ?? null;
  }

  private parseFragment(fragment: string): string | null {
    const param = this.paramName();
    const segments = fragment.split('&');
    for (const seg of segments) {
      const [key, val] = seg.split('=');
      if (key === param && val) {
        return decodeURIComponent(val);
      }
    }
    return null;
  }
}
