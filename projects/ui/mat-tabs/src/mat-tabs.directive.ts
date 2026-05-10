import {
  afterNextRender,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  inject,
  Injector,
  isDevMode,
  Renderer2,
  type Signal,
  type TemplateRef,
  ViewContainerRef,
  type ComponentRef,
} from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';

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
import { mountLiveRegionAnnouncer } from './decorations/live-region';
import { createRejectionState } from './decorations/rejection-state';
import { CngxMatTabsRegistry } from './mat-tabs-registry.directive';
import { MaterialPrivateSurfaces } from './material-bridge/private-surfaces';

import { createCngxMatTabOverflowDomAdapter } from './overflow/mat-tab-overflow-dom-adapter';

/**
 * Panel-host adapter for the programmatically mounted overflow
 * molecule. Implements the read-mostly {@link CngxTabPanelHost}
 * surface by delegating tabs / activeId / orientation / selectById
 * straight to the directive's `CNGX_TAB_GROUP_HOST` presenter, and
 * stubs the template-projection slots
 * (`labelTemplateFor` / `contentTemplateFor`) to `null` because
 * Material owns label rendering through its own
 * `<mat-tab>.textLabel` input + projected `<mat-tab-content>` —
 * the cngx `*cngxTabLabel` template surface is intentionally absent
 * on the Material variant.
 *
 * Class-shape (not literal-object via `useFactory`) so each stub's
 * body lives at a grep-able call-site and a future telemetry /
 * branded variant can override individual methods via subclass +
 * `useClass` without rewriting the provider tuple. The directive
 * provides this class plus a `useExisting` token binding so
 * downstream injections of `CNGX_TAB_PANEL_HOST` resolve to the
 * single instance Angular instantiates per `[cngxMatTabs]` host.
 *
 * @internal
 */
@Injectable()
export class CngxMatTabsPanelHostAdapter implements CngxTabPanelHost {
  private readonly presenter = inject<CngxTabGroupHost>(CNGX_TAB_GROUP_HOST);

  readonly tabs = this.presenter.tabs;
  readonly activeId = this.presenter.activeId;
  readonly orientation = this.presenter.orientation;

  selectById(id: string): void {
    this.presenter.selectById(id);
  }

  labelTemplateFor(_id: string): TemplateRef<unknown> | null {
    return null;
  }

  contentTemplateFor(_id: string): TemplateRef<unknown> | null {
    return null;
  }
}

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
    // Per-tab handle registry — extracted in Phase 7.1 of
    // `mat-stepper-mat-tabs-hardening-plan` to relieve decompose
    // pressure on this directive's class body. Provides
    // `CNGX_MAT_TABS_REGISTRY_HOST` so per-tab decoration directives
    // (`[cngxMatTabError]` and any future `[cngxMatTab*]`-shaped
    // sibling) reach the registry through a typed token instead of
    // injecting this concrete class.
    CngxMatTabsRegistry,
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
    // molecule. The class lives at the top of this file with the
    // stubs visible at a grep-able call-site; the directive provides
    // it once and binds `CNGX_TAB_PANEL_HOST` via `useExisting` so
    // every downstream injection resolves to the single per-host
    // instance. The cngx-native organism's own
    // `useExisting: CngxTabGroup` provider continues to win for the
    // `<cngx-tab-group>` path because it sits one layer closer in
    // the injector chain (organism @Component vs directive providers
    // here).
    CngxMatTabsPanelHostAdapter,
    {
      provide: CNGX_TAB_PANEL_HOST,
      useExisting: CngxMatTabsPanelHostAdapter,
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
  // Per-tab registry lives on the `[cngxMatTabsRegistry]` host-
  // directive (Phase 7.1 of `mat-stepper-mat-tabs-hardening-plan`).
  // The registry owns `setupsByTab`, the per-tab child injectors, the
  // sync `effect()`, and the destroy cleanup; sibling per-tab
  // directives reach the per-handle slots via
  // `CNGX_MAT_TABS_REGISTRY_HOST` rather than injecting this class.

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

  // Rejection-state bundle — { descriptorText, originLabel,
  // liveAnnouncement } sharing a single source-walk via the
  // `createRejectionState` factory. Keeps the organism under the
  // level-4 LOC guard while preserving pillar-2 phrasing parity
  // with the cngx-native `liveAnnouncement` priority chain.
  private readonly rejectionState = createRejectionState(
    this.presenter,
    this.i18n,
  );

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

    // Mount the polite ARIA live region — pillar-2 parity with the
    // cngx-native `<cngx-tab-group>`'s `<span cngxLiveRegion>`. The
    // helper attaches the span at `document.body` (CDK
    // `LiveAnnouncer` placement convention) so Material's MDC
    // tolerance at the `<mat-tab-group>` host root is irrelevant.
    // Replicates the `CngxLiveRegion` directive's host bindings
    // imperatively because this attribute directive owns no
    // template; keeps textContent in sync with the
    // `liveAnnouncement` signal.
    mountLiveRegionAnnouncer({
      announcement: this.rejectionState.liveAnnouncement,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
    });

    // Decoration projectors — package-private factories own all
    // DOM-mutation state (`decoratedEl`, `decoratedAggregatorEls`,
    // retry counter, etc.) plus the `effect()` registration. The
    // directive only supplies the reactive triggers it owns.
    createMatTabRejectionDecoration({
      hostEl: this.hostEl,
      failedHandleId: this.failedHandleId,
      failedIndex: this.presenter.lastFailedIndex,
      descriptorText: this.rejectionState.descriptorText,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
      contentTemplate: this.rejectionContentTemplate,
      viewContainerRef: this.viewContainerRef,
      originLabel: this.rejectionState.originLabel,
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
          MaterialPrivateSurfaces.MAT_MDC_TAB_HEADER_SELECTOR,
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
}
