import { computed, effect, inject, untracked, type Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover, CngxPopoverPresentation } from '@cngx/common/popover';

import { cngxDevWarn } from '@cngx/utils';

import { createAutoPanelRenderer, type CngxSelectAutoRecyclerHandle } from './auto-virtualize';
import { CNGX_SELECT_DEFAULTS, type CngxSelectVirtualizationConfig } from '../config';
import { isCngxSelectOptionGroupDef } from '../option.model';
import {
  CNGX_PANEL_RENDERER_FACTORY,
  createIdentityPanelRenderer,
  type PanelRenderer,
} from '../panel-renderer';
import type { CngxSelectCore } from './select-core';

/**
 * Virtualisation wire-up for variants rendering through `CngxSelectPanel`.
 * Resolves the renderer cascade (consumer-supplied → config-driven →
 * identity), surfaces `virtualItemCount`, and installs the AD to renderer
 * `scrollToIndex` bridge for a consumer renderer. Injection context required.
 *
 * @internal
 */
export function setupVirtualization<T, TCommit>(opts: {
  readonly core: CngxSelectCore<T, TCommit>;
  readonly popoverRef: Signal<CngxPopover | undefined>;
  readonly listboxRef: Signal<CngxListbox<unknown> | undefined>;
  readonly virtualization: CngxSelectVirtualizationConfig | null;
  readonly presentation?: Signal<CngxPopoverPresentation>;
  readonly listboxElement?: Signal<HTMLElement | undefined>;
}): {
  readonly panelRenderer: PanelRenderer<T>;
  /** Undefined for a consumer renderer and for `virtualization: null`. */
  readonly autoRecycler: CngxSelectAutoRecyclerHandle | undefined;
  readonly virtualItemCount: Signal<number | undefined>;
  readonly virtualWindowStart: Signal<number>;
} {
  const factory = inject(CNGX_PANEL_RENDERER_FACTORY);
  const injected = factory<T>({
    flatOptions: opts.core.flatOptions,
  });

  // A consumer-provided factory override always wins: its renderer is used
  // verbatim, even without a `virtualizer`, so a deliberate identity-shaped
  // override is not re-wrapped by the config-default auto-virtualizer. Only
  // the default identity factory falls through to config-driven windowing.
  //
  // Detected by reference identity against the token's own default factory:
  // this holds because `CNGX_PANEL_RENDERER_FACTORY` defaults to exactly
  // `createIdentityPanelRenderer`. Providing that same function literal as a
  // `useValue` reads as "no override" and still auto-virtualizes - the
  // documented default behaviour, not a bug.
  const consumerOverride = factory !== createIdentityPanelRenderer;

  // A grouped list bypasses the renderer and renders every row, whatever the
  // renderer's slice says, so AD must not see a window for it.
  const hasGroup = computed<boolean>(() =>
    opts.core.effectiveOptions().some(isCngxSelectOptionGroupDef),
  );

  const usesInjected = consumerOverride || injected.virtualizer !== undefined;
  const auto =
    usesInjected || opts.virtualization === null
      ? undefined
      : createAutoPanelRenderer<T>({
          flatOptions: opts.core.flatOptions,
          hasGroup,
          popoverRef: opts.popoverRef,
          virtualization: opts.virtualization,
          presentation: opts.presentation,
          listboxElement: opts.listboxElement,
        });
  const panelRenderer: PanelRenderer<T> = auto?.renderer ?? injected;

  // Virtual only while the renderer windows the list. Below the
  // auto-virtualize threshold the full list renders, so AD stays
  // non-virtual (plain index space): a small list behaves byte-identically
  // to the identity renderer.
  const virtualItemCount = computed<number | undefined>(() => {
    const v = panelRenderer.virtualizer;
    if (v === undefined || hasGroup()) {
      return undefined;
    }
    const rendered = panelRenderer.renderOptions().length;
    const total = panelRenderer.totalCount?.() ?? rendered;
    return rendered >= total ? undefined : total;
  });

  // Absolute index of the first option the renderer actually rendered - the
  // listbox forwards it to AD's windowStart. Derived from the slice, not
  // from the recycler directly: in threshold-identity mode the full list
  // renders while the attached recycler's startIndex can drift after
  // scrolling, so a full render always reports 0.
  const virtualWindowStart = computed<number>(() => {
    const v = panelRenderer.virtualizer;
    if (v === undefined || hasGroup()) {
      return 0;
    }
    const rendered = panelRenderer.renderOptions().length;
    const total = panelRenderer.totalCount?.() ?? rendered;
    return rendered >= total ? 0 : v.startIndex();
  });

  // AD -> renderer scroll bridge for a consumer renderer, which exposes
  // `scrollToIndex` but no recycler. The auto path connects its recycler from
  // the panel template instead: on a first open its spacers do not exist yet,
  // so a scroll from here would hit a scroller without height.
  const consumerVirtualizer = auto ? undefined : panelRenderer.virtualizer;
  if (consumerVirtualizer) {
    effect(() => {
      const target = opts.listboxRef()?.ad.pendingHighlight();
      if (target != null) {
        untracked(() => consumerVirtualizer.scrollToIndex(target));
      }
    });
  }

  // Dev-only: a grouped list renders in full, so virtualization somebody asked
  // for does nothing there. The default threshold nobody asked for stays quiet:
  // the config reads as explicit when it is not the default object by reference.
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    const requested = auto
      ? opts.virtualization !== CNGX_SELECT_DEFAULTS.virtualization
      : panelRenderer.virtualizer !== undefined;
    if (requested) {
      let warned = false;
      effect(() => {
        if (warned || !opts.popoverRef()?.isVisible() || !hasGroup()) {
          return;
        }
        warned = true;
        cngxDevWarn(
          'CNGX2028',
          'withVirtualization(): grouped select options ignore the configured virtualization; every option renders and the recycler window is dropped. Flatten the options or drop withVirtualization() for this select.',
        );
      });
    }
  }

  return {
    panelRenderer,
    autoRecycler: auto?.autoRecycler,
    virtualItemCount,
    virtualWindowStart,
  };
}
