import {
  afterNextRender,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  isDevMode,
  Renderer2,
  type Signal,
  type TemplateRef,
  untracked,
  ViewContainerRef,
  type ComponentRef,
} from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import type { Subscription } from 'rxjs';

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import {
  CNGX_DOM_ANCHOR_RETRY_FACTORY,
  CNGX_TAB_GROUP_HOST,
  CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  CNGX_TAB_PANEL_HOST,
  CngxTabGroupPresenter,
  injectTabsI18n,
  type CngxTabGroupHost,
  type CngxTabPanelHost,
} from '@cngx/common/tabs';
import { CngxTabOverflow } from '@cngx/ui/tabs';
import { nextUid } from '@cngx/core/utils';

import {
  createMatTabAggregatorDecoration,
  createMatTabRejectionDecoration,
  type CngxMatTabAggregatorErrorEntry,
} from './decorations/decoration-projectors';
import {
  CngxMatTabAggregatorContent,
  type CngxMatTabAggregatorContentContext,
} from './decorations/mat-tab-aggregator-content.directive';
import {
  createMatTabHandle,
  type CngxMatTabHandleSetup,
} from './material-bridge/handle';
import { createCngxMatTabOverflowDomAdapter } from './overflow/mat-tab-overflow-dom-adapter';

/**
 * Material instrumentation directive — attaches to an existing
 * `<mat-tab-group>` and bridges it against a cngx
 * {@link CngxTabGroupPresenter} so consumers gain commit-action
 * lifecycle, `CNGX_STATEFUL` provision (and therefore `<cngx-toast-on />`
 * / `<cngx-banner-on />` composition), and the cngx tab-handle
 * registry — without rewriting their template. One attribute upgrade.
 *
 * Topology is the inverse of the `<cngx-mat-stepper>` thin-wrapper:
 * Material is the host, cngx is the instrumentation layer.
 * `inject(MatTabGroup, { self: true })` resolves directly off the
 * consumer's element. No content projection, no DI ordering issue —
 * `stepper-accepted-debt §1`'s structural blocker on the **adoption**
 * direction does not apply here.
 *
 * Decoration mechanics for the rejection (`--error`) and per-tab
 * aggregator (`--has-errors`) visuals delegate to the
 * package-private projector factories at `./decorations/`. The
 * directive retains only the registry sync (`syncHandles`), the
 * derived computeds the projectors consume, and the public
 * delegators the consumer-template surface needs.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMatTabs]',
  exportAs: 'cngxMatTabs',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['activeIndex', 'orientation', 'loop', 'commitAction', 'commitMode'],
      outputs: ['activeIndexChange'],
    },
  ],
  providers: [
    // Material variant of the overflow molecule's DOM-resolution
    // strategy. Swaps `.cngx-tabs__strip-wrapper` walks for the Material
    // `.mat-mdc-tab-header` → `.mat-mdc-tab-label-container` walk and
    // index-based `.mat-mdc-tab` resolution. Tracked-debt §5.
    {
      provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
      useValue: createCngxMatTabOverflowDomAdapter,
    },
    // Panel-host adapter for the programmatically mounted overflow
    // molecule. The presenter satisfies the read-mostly tabs / activeId
    // / orientation / selectById surface; the template-projection
    // methods (`labelTemplateFor`/`contentTemplateFor`) stub to `null`
    // because Material owns label rendering through its own
    // `<mat-tab>.textLabel` input + projected mat-tab-content — the
    // cngx `*cngxTabLabel` template surface is intentionally absent in
    // the Material variant. The cngx-native organism's own
    // `useExisting: CngxTabGroup` provider continues to win for the
    // `<cngx-tab-group>` path because it sits one layer closer in the
    // injector chain (organism @Component vs directive providers
    // here).
    {
      provide: CNGX_TAB_PANEL_HOST,
      useFactory: (presenter: CngxTabGroupHost): CngxTabPanelHost => ({
        tabs: presenter.tabs,
        activeId: presenter.activeId,
        orientation: presenter.orientation,
        selectById: (id) => presenter.selectById(id),
        labelTemplateFor: () => null,
        contentTemplateFor: () => null,
      }),
      deps: [CNGX_TAB_GROUP_HOST],
    },
  ],
})
export class CngxMatTabs {
  private readonly matTabGroup = inject(MatTabGroup, { self: true });
  private readonly presenter = inject(CNGX_TAB_GROUP_HOST);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly renderer = inject(Renderer2);
  private readonly hostEl =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // Programmatic mount of the cngx overflow molecule. The directive's
  // `providers` swap in the Material DOM adapter so the molecule's
  // IntersectionObserver attaches against `.mat-mdc-tab-label-container`
  // (Material's IO-friendly scroll viewport) rather than the cngx-native
  // `.cngx-tabs__strip` selector. The component lands as a sibling of
  // `<mat-tab-group>` in the parent's view here; the constructor's
  // `afterNextRender` block below physically moves the rendered element
  // into `.mat-mdc-tab-header` so the More button pins to the trailing
  // edge of Material's strip.
  //
  // Passing `injector: this.injector` makes the molecule's parent
  // injector chain inherit from THIS directive's element injector —
  // which carries both the `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY`
  // override and the `CNGX_TAB_PANEL_HOST` wrapper declared on the
  // `@Directive` providers above. Without this, the default
  // `vcr.createComponent` parent-injector resolution would walk the
  // host-template's view container parent, NOT this element's
  // injector — and `inject(CNGX_TAB_PANEL_HOST)` inside the molecule
  // would NG0201.
  private readonly overflowRef: ComponentRef<CngxTabOverflow> = inject(
    ViewContainerRef,
  ).createComponent(CngxTabOverflow, { injector: this.injector });

  private readonly matTabs = contentChildren(MatTab, { descendants: true });
  // Optional consumer-projected slot template — when bound, the
  // aggregator-decoration projector renders an embedded view of it
  // into the SR descriptor span instead of writing the
  // `aggregator.announcement()` string verbatim. See
  // `mat-tab-aggregator-content.directive.ts` JSDoc for the slot's
  // typed context shape and the `tabs-accepted-debt §9` note.
  private readonly aggregatorContentSlot = contentChild(
    CngxMatTabAggregatorContent,
  );
  private readonly aggregatorContentTemplate: Signal<
    TemplateRef<CngxMatTabAggregatorContentContext> | null
  > = computed(() => this.aggregatorContentSlot()?.templateRef ?? null);
  private readonly viewContainerRef = inject(ViewContainerRef);
  // Per-tab registries — strong refs are bounded by the directive's
  // lifetime (every entry is explicitly deleted when the matching
  // MatTab leaves the children set, AND the maps go away on
  // directive destroy). Map (not WeakMap) so the diff loop in
  // `syncHandles` can iterate to find removed tabs without a
  // parallel `Set<MatTab>`.
  private readonly setupsByTab = new Map<MatTab, CngxMatTabHandleSetup>();
  private readonly stateChangeSubsByTab = new Map<MatTab, Subscription>();

  private readonly i18n = injectTabsI18n();

  // Resolves the failed handle's stable id (or `null` when no
  // failure). Collapses spurious effect re-fires when `tabs()`
  // re-emits without a meaningful target change. Default `Object.is`
  // on `string | null` is the correct equality predicate.
  private readonly failedHandleId = computed<string | null>(() => {
    const idx = this.presenter.lastFailedIndex();
    if (idx === undefined) {
      return null;
    }
    return this.presenter.tabs()[idx]?.id ?? null;
  });

  // SR descriptor phrase rendered into the rejection-decoration's
  // hidden `<span>` referenced by `aria-describedby` on the rejected
  // tab. Mirrors the cngx-native organism's `liveAnnouncement`
  // priority chain (tab-group.component.ts:280-304) so the
  // visual+SR phrasing matches across both tab variants:
  //   1. `commitRolledBackTo(originLabel)` when the rollback origin
  //      is resolvable (typical optimistic-mode path).
  //   2. `commitFailedRetry` fallback otherwise — covers the unlabeled
  //      origin tab edge case + the synchronous-rejection path.
  // Empty string between rejections — the projector clears the
  // decoration entirely on `failedHandleId === null`, so this
  // signal's value is only consulted while a rejection is pinned.
  private readonly rejectionDescriptorText = computed<string>(() => {
    const failedIdx = this.presenter.lastFailedIndex();
    if (failedIdx === undefined) {
      return '';
    }
    const originIdx = this.presenter.originIndexDuringCommit();
    if (originIdx !== undefined) {
      const originLabel = this.presenter.tabs()[originIdx]?.label();
      if (originLabel) {
        return this.i18n.commitRolledBackTo(originLabel);
      }
    }
    return this.i18n.commitFailedRetry;
  });

  // Resolves the current set of tabs whose bound aggregator wants
  // reveal. Reads each handle's `errorAggregator()` signal, then the
  // aggregator's `shouldShow()` and `announcement()` — every tracked
  // dependency feeds the projector. Structural `equal` drops re-runs
  // whose returned shape is identical to the previous one.
  private readonly aggregatedErrorTabs = computed<
    readonly CngxMatTabAggregatorErrorEntry[]
  >(
    () => {
      const tabs = this.presenter.tabs();
      const acc: CngxMatTabAggregatorErrorEntry[] = [];
      for (let i = 0; i < tabs.length; i++) {
        const handle = tabs[i];
        const aggregator = handle.errorAggregator();
        if (aggregator?.shouldShow()) {
          acc.push({
            idx: i,
            id: handle.id,
            announcement: aggregator.announcement(),
            count: aggregator.errorCount(),
            label: handle.label() ?? '',
          });
        }
      }
      return acc;
    },
    {
      equal: (a, b) => {
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (
            a[i].idx !== b[i].idx ||
            a[i].id !== b[i].id ||
            a[i].announcement !== b[i].announcement ||
            a[i].count !== b[i].count ||
            a[i].label !== b[i].label
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );

  constructor() {
    effect(() => {
      const tabs = this.matTabs();
      untracked(() => this.syncHandles(tabs));
    });

    // Decoration projectors — package-private factories own all
    // DOM-mutation state (`decoratedEl`, `decoratedAggregatorEls`,
    // retry counter, etc.) plus the `effect()` registration. The
    // directive only supplies the reactive triggers it owns.
    createMatTabRejectionDecoration({
      hostEl: this.hostEl,
      failedHandleId: this.failedHandleId,
      failedIndex: this.presenter.lastFailedIndex,
      descriptorText: this.rejectionDescriptorText,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
    });

    createMatTabAggregatorDecoration({
      hostEl: this.hostEl,
      errorTabs: this.aggregatedErrorTabs,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
      contentTemplate: this.aggregatorContentTemplate,
      viewContainerRef: this.viewContainerRef,
    });

    this.destroyRef.onDestroy(() => {
      for (const sub of this.stateChangeSubsByTab.values()) {
        sub.unsubscribe();
      }
      this.stateChangeSubsByTab.clear();
      this.setupsByTab.clear();
    });

    // Tear down the dynamically created overflow molecule alongside the
    // directive. ComponentRef.destroy() runs the molecule's own
    // DestroyRef callbacks (IntersectionObserver disconnect, rAF
    // cancellation) and removes its rendered element from the DOM.
    this.destroyRef.onDestroy(() => this.overflowRef.destroy());

    // Anchor the molecule's rendered element inside Material's
    // `.mat-mdc-tab-header` so the More button pins to the trailing
    // edge of the strip. Same hook (`afterNextRender`) the aggregator-
    // decoration projector uses for one-shot post-render DOM writes.
    //
    // Retry loop symmetrical to `CngxTabOverflow`'s rAF attach budget:
    // when the consumer wraps `<mat-tab-group>` in a deferred `*ngIf`
    // / `@defer` block, the header may not have rendered on the first
    // afterNextRender frame. Re-schedule via the same hook (passing
    // `injector` because the second invocation is no longer in the
    // constructor's injection context) up to MAX_ANCHOR_ATTEMPTS. The
    // ceiling matches the aggregator-decoration retry cap (5) — well
    // above any normal Material render lag, low enough to dev-warn
    // promptly when the consumer DOM never materialises.
    // Bounded retry via `createDomAnchorRetry` — same counter contract
    // as `CngxTabOverflow`'s rAF attach loop, with `afterNextRender`
    // as the scheduler. afterNextRender is one-shot (no cancellation
    // closure); the factory accepts a noop. Cap at 5 attempts: well
    // above normal Material render lag, low enough to dev-warn
    // promptly when consumer DOM never materialises (e.g.
    // `<mat-tab-group>` gated behind a never-true `*ngIf` / `@defer`).
    //
    // The flex-layout skin in `mat-tabs.css` does the rest: the More
    // button sits next to `.mat-mdc-tab-label-container` rather than
    // overlaying it, so no imperative positioning is needed here.
    const anchorRetry = inject(CNGX_DOM_ANCHOR_RETRY_FACTORY)({
      attempt: () => {
        const headerEl = this.hostEl.querySelector<HTMLElement>(
          '.mat-mdc-tab-header',
        );
        if (!headerEl) {
          return null;
        }
        const overflowEl = this.overflowRef.location
          .nativeElement as HTMLElement;
        this.renderer.addClass(overflowEl, 'cngx-mat-tabs-more');
        this.renderer.appendChild(headerEl, overflowEl);
        return true;
      },
      maxAttempts: 5,
      schedule: (cb) => {
        afterNextRender(cb, { injector: this.injector });
        return () => undefined;
      },
      onGiveUp: () => {
        if (isDevMode()) {
          console.warn(
            '[CngxMatTabs] Could not anchor <cngx-tab-overflow> after 5 ' +
              'attempts — .mat-mdc-tab-header was not found inside the ' +
              'host. The More popover will fall back to a sibling-of-' +
              '<mat-tab-group> position; verify Material rendered the ' +
              'strip (e.g. consumer is not gating <mat-tab-group> behind ' +
              'a never-true *ngIf / @defer).',
          );
        }
      },
    });
    afterNextRender(() => anchorRetry.start());
    this.destroyRef.onDestroy(() => anchorRetry.cancel());

    createMaterialBidirectionalSync({
      presenterIndex: this.presenter.activeIndex,
      readSelectedIndex: () => this.matTabGroup.selectedIndex ?? 0,
      writeSelectedIndex: (i) => {
        this.matTabGroup.selectedIndex = i;
      },
      selectionChange$: this.matTabGroup.selectedIndexChange.asObservable(),
      onMaterialSelection: (i) => this.presenter.select(i),
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }

  private syncHandles(tabs: readonly MatTab[]): void {
    const liveTabs = new Set<MatTab>(tabs);
    for (const tab of tabs) {
      if (this.setupsByTab.has(tab)) {
        continue;
      }
      const setup = createMatTabHandle(tab, () => nextUid('cngx-mat-tab-'));
      this.setupsByTab.set(tab, setup);
      this.presenter.register(setup.handle);
      // Live projection of MatTab.disabled / textLabel via
      // `_stateChanges`. See `handle.ts` for the underscore-prefix
      // coupling note (tracked under `tabs-accepted-debt §5`).
      const sub = tab._stateChanges.subscribe(() => {
        setup.label.set(tab.textLabel);
        setup.disabled.set(tab.disabled);
      });
      this.stateChangeSubsByTab.set(tab, sub);
    }
    // Remove: snapshot entries before the loop so multi-key deletes
    // inside the body never collide with iterator state.
    for (const [tab, setup] of Array.from(this.setupsByTab.entries())) {
      if (liveTabs.has(tab)) {
        continue;
      }
      this.stateChangeSubsByTab.get(tab)?.unsubscribe();
      this.stateChangeSubsByTab.delete(tab);
      this.setupsByTab.delete(tab);
      this.presenter.unregister(setup.handle.id);
    }
  }

  /**
   * Clear the persisted `lastFailedIndex` rejection flag on the
   * presenter — public delegator mirroring the
   * {@link https://cngx.dev/api/CngxTabGroup#clearLastFailed
   * `CngxTabGroup.clearLastFailed()`} pattern so consumers using a
   * template ref (`#mt="cngxMatTabs"`) can dismiss the rejection
   * decoration programmatically without injecting the host token.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }

  /**
   * Look up the per-handle `errorAggregator` writable slot for a
   * given `MatTab`. Returns `undefined` when the tab has not been
   * registered yet — the directive's `contentChildren(MatTab)` query
   * lands during Angular's content-init pass, so a same-microtask
   * injection from a per-tab attribute directive can race the
   * registration. The `[cngxMatTabError]` directive uses this to
   * reach the per-handle slot; race-recovery happens by tracking
   * `presenter.tabs()` in the consumer's effect so a later sync tick
   * re-attempts the lookup.
   *
   * Return type is narrowed to `Pick<CngxMatTabHandleSetup,
   * 'errorAggregator'>` — the rest of the setup (handle, label,
   * disabled writables) is internal bookkeeping the directive owns
   * and should not leak through this access path.
   *
   * @internal — exposed for the in-library `[cngxMatTabError]`
   * directive only. Public consumers should bind `[cngxMatTabError]`
   * on each `<mat-tab>` rather than walking the registry by hand.
   * Re-evaluate when ≥1 documented external consumer needs the
   * per-handle setup directly OR a second `[cngxMatTab*]`-shaped
   * per-tab attribute directive lands. Tracked as
   * `tabs-accepted-debt §7` (convention-only narrowing — TypeScript
   * visibility is `public` because no library-private modifier
   * exists; alternative options are over-abstraction).
   */
  getHandleSetup(
    matTab: MatTab,
  ): Pick<CngxMatTabHandleSetup, 'errorAggregator'> | undefined {
    return this.setupsByTab.get(matTab);
  }
}
