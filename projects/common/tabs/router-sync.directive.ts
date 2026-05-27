import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { CNGX_TAB_GROUP_HOST } from './tab-group-host.token';

/**
 * URL deep-linking for tab groups. Bidirectional sync between
 * `activeId` and a URL fragment or query-param. Opt-in via
 * `[cngxTabsFragmentSync]` on the presenter element.
 *
 * - `mode = 'fragment'` (default) → `#tab=settings`
 * - `mode = 'queryParam'` with `paramName = 'tab'` → `?tab=settings`
 *
 * `Router` is optional — without it the directive logs a dev warning
 * via `afterNextRender` and becomes a no-op. Every `router.navigate`
 * and `host.selectById` inside the effects sits in `untracked()`.
 *
 * @category common/tabs
 */
@Directive({
  selector: '[cngxTabsFragmentSync]',
  exportAs: 'cngxTabsFragmentSync',
  standalone: true,
})
export class CngxTabsFragmentSync {
  readonly mode = input<'fragment' | 'queryParam'>('fragment');
  readonly paramName = input<string>('tab');

  private readonly host = inject(CNGX_TAB_GROUP_HOST, { host: true });
  private readonly router = inject(Router, { optional: true });

  constructor() {
    if (!this.router) {
      afterNextRender(() => {
        console.warn(
          'CngxTabsFragmentSync: no Router available — directive is a no-op. ' +
            'Provide @angular/router via provideRouter(...) to enable deep-linking.',
        );
      });
      return;
    }
    const router = this.router;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const initial = this.readUrlValue(router);
      if (initial) {
        untracked(() => this.host.selectById(initial));
      }
    });

    effect(() => {
      const id = this.host.activeId();
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
        // Router rejection (e.g. cancelled navigation) has no recovery path.
        navigation.catch?.(() => undefined);
      });
    });

    const navEnd = toSignal(
      router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
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
        if (next && next !== this.host.activeId()) {
          this.host.selectById(next);
        }
      });
    });
  }

  private readUrlValue(router: Router): string | null {
    if (this.mode() === 'fragment') {
      const fragment = router.routerState.snapshot.root.fragment ?? '';
      return this.parseFragment(fragment);
    }
    return (
      router.routerState.snapshot.root.queryParamMap.get(this.paramName()) ??
      null
    );
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
