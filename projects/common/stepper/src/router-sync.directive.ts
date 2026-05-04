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
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { injectStepperConfig } from './stepper-config';
import { CNGX_STEPPER_HOST } from './stepper-host.token';

/**
 * URL deep-linking for the stepper. Bidirectional sync between the
 * presenter's `activeStepId` and a URL fragment / query-param. Opt-in
 * via `[cngxStepperRouterSync]` on the same element that carries the
 * stepper presenter.
 *
 * - `mode = 'fragment'` (default) → `#step=customer` style.
 * - `mode = 'queryParam'` with `paramName = 'step'` (default) →
 *   `?step=customer` style.
 *
 * Optional `Router` injection: if `@angular/router` is not available,
 * the directive logs a dev warning via `afterNextRender` and becomes
 * a no-op. Consumers without router escape gracefully.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxStepperRouterSync]',
  exportAs: 'cngxStepperRouterSync',
  standalone: true,
})
export class CngxStepperRouterSync {
  // Inputs default to undefined so the cascade resolves through
  // {@link CNGX_STEPPER_CONFIG} when unset (per-instance Input >
  // viewProviders > root > library default).
  protected readonly modeInput = input<
    'fragment' | 'queryParam' | undefined
  >(undefined, { alias: 'mode' });
  protected readonly paramNameInput = input<string | undefined>(undefined, {
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

  constructor() {
    if (!this.router) {
      afterNextRender(() => {
        console.warn(
          'CngxStepperRouterSync: no Router available — directive is a no-op. ' +
            'Provide @angular/router via provideRouter(...) to enable deep-linking.',
        );
      });
      return;
    }
    const router = this.router;

    afterNextRender(() => {
      const initial =
        this.mode() === 'fragment'
          ? router.routerState.snapshot.root.fragment
          : (router.routerState.snapshot.root.queryParamMap.get(this.paramName()) ?? null);
      if (initial) {
        const value = this.mode() === 'fragment' ? this.parseFragment(initial) : initial;
        if (value) {
          this.host.selectById(value);
        }
      }
    });

    effect(() => {
      const id = this.host.activeStepId();
      if (!id) {
        return;
      }
      untracked(() => {
        const navigation =
          this.mode() === 'fragment'
            ? router.navigate([], {
                fragment: `${this.paramName()}=${id}`,
                queryParamsHandling: 'merge',
                replaceUrl: true,
              })
            : router.navigate([], {
                queryParams: { [this.paramName()]: id },
                queryParamsHandling: 'merge',
                replaceUrl: true,
              });
        navigation.catch?.((err: unknown) => this.syncError.emit(err));
      });
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
        const next =
          this.mode() === 'fragment'
            ? this.parseFragment(router.routerState.snapshot.root.fragment ?? '')
            : (router.routerState.snapshot.root.queryParamMap.get(this.paramName()) ?? null);
        if (next && next !== this.host.activeStepId()) {
          this.host.selectById(next);
        }
      });
    });
  }

  private parseFragment(fragment: string): string | null {
    const param = this.paramName();
    const segments = fragment.split('&');
    for (const seg of segments) {
      const [key, val] = seg.split('=');
      if (key === param && val) {
        return val;
      }
    }
    return null;
  }
}
