import {
  afterNextRender,
  computed,
  contentChild,
  contentChildren,
  createEnvironmentInjector,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  EnvironmentInjector,
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
import { injectMatTabsConfig } from './mat-tabs-config';
import {
  CngxMatTabAggregatorContent,
  type CngxMatTabAggregatorContentContext,
} from './decorations/mat-tab-aggregator-content.directive';
import {
  CngxMatTabRejectionContent,
  type CngxMatTabRejectionContentContext,
} from './decorations/mat-tab-rejection-content.directive';
import { createRejectionState } from './decorations/rejection-state';
import {
  createMatTabHandle,
  type CngxMatTabHandleSetup,
} from './material-bridge/handle';

/**
 * Per-MatTab registry entry. Pairs the cngx setup with a child
 * `EnvironmentInjector` that scopes the lifetime of the per-tab
 * `tab._stateChanges` bridge — destroying the child injector fires
 * its `DestroyRef`, which `takeUntilDestroyed` listens for so the
 * bridge subscription unsubscribes deterministically.
 *
 * @internal
 */
interface CngxMatTabEntry {
  readonly setup: CngxMatTabHandleSetup;
  readonly childInjector: EnvironmentInjector;
}
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
  // Single `ViewContainerRef` injection shared by both the molecule
  // mount below (`overflowRef`) and the aggregator-decoration
  // projector slot path (consumed in the constructor). Field declared
  // ahead of `overflowRef` because TypeScript class fields execute
  // in declaration order — the `overflowRef` initializer reads this
  // field by reference.
  private readonly viewContainerRef = inject(ViewContainerRef);

  private readonly overflowRef: ComponentRef<CngxTabOverflow> =
    this.viewContainerRef.createComponent(CngxTabOverflow, {
      injector: this.injector,
    });

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
  // Optional consumer-projected `*cngxMatTabRejectionContent` slot.
  // When bound, the rejection-decoration projector renders an
  // embedded view of it into the SR descriptor span instead of
  // writing the i18n-resolved fallback string verbatim. Three-stage
  // slot cascade with `CNGX_MAT_TABS_CONFIG.templates.rejection`
  // is the canonical shape; Phase 4 ships the instance + library-
  // default tiers, the middle config tier lands as a follow-up
  // wiring once consumer demand materialises.
  private readonly rejectionContentSlot = contentChild(
    CngxMatTabRejectionContent,
  );
  private readonly rejectionContentTemplate: Signal<
    TemplateRef<CngxMatTabRejectionContentContext> | null
  > = computed(() => this.rejectionContentSlot()?.templateRef ?? null);
  // Per-tab registry — strong refs bounded by the directive's
  // lifetime (every entry is explicitly deleted when the matching
  // MatTab leaves the children set, AND the map goes away on
  // directive destroy). Map (not WeakMap) so the diff loop in
  // `syncHandles` can iterate to find removed tabs without a
  // parallel `Set<MatTab>`.
  //
  // Each entry pairs the cngx setup with a child `EnvironmentInjector`
  // owning the lifetime of the per-tab `toSignal(tab._stateChanges)`
  // bridge. Destroying the child injector when the tab leaves
  // triggers `takeUntilDestroyed` inside `toSignal` so the underlying
  // RxJS subscription unsubscribes deterministically — same cleanup
  // precision as the prior `Map<MatTab, Subscription>` shape, with
  // the imperative subscribe/unsubscribe replaced by a Signal
  // primitive at the public Level-2+ surface.
  private readonly setupsByTab = new Map<MatTab, CngxMatTabEntry>();
  private readonly envInjector = inject(EnvironmentInjector);

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

  // SR descriptor phrase + origin label for the rejection decoration.
  // Both signals share one source-walk (`lastFailedIndex` →
  // `originIndexDuringCommit` → `tabs[idx].label()`) via the
  // package-private `createRejectionState` factory — keeps the
  // organism class body under the level-4 LOC guard while preserving
  // the pillar-2 phrasing parity with the cngx-native organism's
  // `liveAnnouncement` priority chain.
  private readonly rejectionState = createRejectionState(
    this.presenter,
    this.i18n,
  );
  private readonly rejectionDescriptorText: Signal<string> =
    this.rejectionState.descriptorText;
  // Reactive label of the rollback origin — feeds the slot context's
  // `originLabel` field. Sourced from the same factory as
  // `rejectionDescriptorText` so the underlying source-walk happens
  // at most once per state change.
  private readonly rejectionOriginLabel: Signal<string | undefined> =
    this.rejectionState.originLabel;

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
    // Resolve all consumer-tunable knobs once at the top — single
    // canonical surface via `provideMatTabsConfig` /
    // `provideMatTabsConfigAt`. `injectMatTabsConfig` merges with
    // library defaults so call sites read fully populated values.
    const matTabsConfig = injectMatTabsConfig();

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
      contentTemplate: this.rejectionContentTemplate,
      viewContainerRef: this.viewContainerRef,
      originLabel: this.rejectionOriginLabel,
    });

    createMatTabAggregatorDecoration({
      hostEl: this.hostEl,
      errorTabs: this.aggregatedErrorTabs,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
      contentTemplate: this.aggregatorContentTemplate,
      viewContainerRef: this.viewContainerRef,
      onHalfWiredSlot: matTabsConfig.halfWiredSlotSink,
    });

    this.destroyRef.onDestroy(() => {
      for (const entry of this.setupsByTab.values()) {
        // Disposes the per-tab `toSignal(_stateChanges)` bridge.
        entry.childInjector.destroy();
      }
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
    // Bounded retry via `createDomAnchorRetry` — same counter contract
    // as `CngxTabOverflow`'s rAF attach loop, with `afterNextRender`
    // as the scheduler. afterNextRender is one-shot (no cancellation
    // closure); the factory accepts a noop. The retry covers the
    // deferred-host case (`<mat-tab-group>` gated behind a `*ngIf` /
    // `@defer`) where the header is not present on the first frame.
    //
    // Cap is read from `provideMatTabsConfig(withAnchorRetryAttempts(n))`
    // (default 5). The default was chosen empirically: well above
    // normal Material render lag (a single `afterNextRender` is enough
    // on every supported version), low enough to dev-warn promptly
    // when the consumer DOM never materialises (e.g. `<mat-tab-group>`
    // gated behind a never-true `*ngIf` / `@defer`). The `onGiveUp`
    // warning interpolates the resolved cap so the message stays
    // accurate after an override.
    //
    // The flex-layout skin in `mat-tabs.css` does the rest: the More
    // button sits next to `.mat-mdc-tab-label-container` rather than
    // overlaying it, so no imperative positioning is needed here.
    const anchorMaxAttempts = matTabsConfig.anchorMaxAttempts;
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
      maxAttempts: anchorMaxAttempts,
      schedule: (cb) => {
        afterNextRender(cb, { injector: this.injector });
        return () => undefined;
      },
      onGiveUp: () => {
        if (isDevMode()) {
          console.warn(
            `[CngxMatTabs] Could not anchor <cngx-tab-overflow> after ${anchorMaxAttempts} ` +
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
      // Per-tab child `EnvironmentInjector` owns the lifetime of the
      // `toSignal(_stateChanges)` bridge created inside
      // `createMatTabHandle`. Destroying the child injector below
      // when a tab leaves fires the bridge's `takeUntilDestroyed`
      // cleanup so the underlying RxJS subscription unsubscribes
      // deterministically — same per-tab cleanup precision as the
      // prior `Map<MatTab, Subscription>` shape, with the imperative
      // pump replaced by `computed`-derived `label` / `disabled` on
      // the handle. Tracked as `tabs-accepted-debt §5` (Material-
      // private `_stateChanges` coupling).
      const childInjector = createEnvironmentInjector([], this.envInjector);
      const setup = createMatTabHandle(
        tab,
        () => nextUid('cngx-mat-tab-'),
        childInjector,
      );
      this.setupsByTab.set(tab, { setup, childInjector });
      this.presenter.register(setup.handle);
    }
    // Remove: snapshot entries before the loop so multi-key deletes
    // inside the body never collide with iterator state.
    for (const [tab, entry] of Array.from(this.setupsByTab.entries())) {
      if (liveTabs.has(tab)) {
        continue;
      }
      entry.childInjector.destroy();
      this.setupsByTab.delete(tab);
      this.presenter.unregister(entry.setup.handle.id);
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
    return this.setupsByTab.get(matTab)?.setup;
  }
}
