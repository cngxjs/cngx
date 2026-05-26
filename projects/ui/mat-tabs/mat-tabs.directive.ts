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
 * Implements {@link CngxTabPanelHost} for the programmatically
 * mounted overflow popover. Delegates to the directive's
 * `CNGX_TAB_GROUP_HOST` presenter; both template lookups return
 * `null` because Material renders labels through `<mat-tab>` and
 * projected `<mat-tab-content>`.
 *
 * Class instead of factory-returned literal so a telemetry or
 * branded variant can subclass + swap via `useClass`. The directive
 * registers it once and binds `CNGX_TAB_PANEL_HOST` with
 * `useExisting`.
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
 * Attaches to an existing `<mat-tab-group>` and wires it to a
 * {@link CngxTabGroupPresenter} — consumers get the commit-action
 * lifecycle, `CNGX_STATEFUL` (so `<cngx-toast-on />` and
 * `<cngx-banner-on />` compose as children), and the tab-handle
 * registry from one attribute.
 *
 * Topology inverts `<cngx-mat-stepper>`: Material is the host, cngx
 * is the instrumentation layer. `inject(MatTabGroup, { self: true })`
 * resolves on the consumer's own element — no content projection
 * blocker applies here.
 *
 * Rejection (`--error`) and aggregator (`--has-errors`) visuals
 * live in the package-private projector factories under
 * `./decorations/`; this directive supplies their reactive triggers
 * and the delegators consumer templates call.
 *
 * @playground Form error aggregation ./examples/form-errors/form-errors.component.ts
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
    // Provides `CNGX_MAT_TABS_REGISTRY_HOST` so per-tab decoration
    // directives reach the registry through a typed token rather
    // than injecting this concrete class.
    CngxMatTabsRegistry,
  ],
  providers: [
    // Material variant of the overflow molecule's DOM-resolution
    // strategy. Swaps `.cngx-tabs__strip-wrapper` walks for the Material
    // `.mat-mdc-tab-header` → `.mat-mdc-tab-label-container` walk and
    // index-based `.mat-mdc-tab` resolution.
    {
      provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
      useValue: createCngxMatTabOverflowDomAdapter,
    },
    // Panel-host adapter for the programmatically mounted overflow
    // molecule. `useExisting` binding below ensures every injection
    // resolves to the single per-host instance. The cngx-native
    // `<cngx-tab-group>` path keeps its own `useExisting:
    // CngxTabGroup` provider — sits one injector layer closer.
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
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // Field order matters — `overflowRef` reads `viewContainerRef` at
  // class-init time. The VCR also feeds the aggregator-decoration
  // slot path further down.
  private readonly viewContainerRef = inject(ViewContainerRef);

  // Programmatic mount of the cngx overflow molecule.
  // `injector: this.injector` is load-bearing — without it,
  // `vcr.createComponent` walks the host-template's parent VCR for
  // DI resolution, missing this directive's `CNGX_TAB_PANEL_HOST`
  // and `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY` providers, and the
  // molecule NG0201s on `inject(CNGX_TAB_PANEL_HOST)`. The molecule
  // initially lands as a sibling of `<mat-tab-group>`; the
  // `afterNextRender` block below moves it into
  // `.mat-mdc-tab-header`.
  private readonly overflowRef: ComponentRef<CngxTabOverflow> =
    this.viewContainerRef.createComponent(CngxTabOverflow, {
      injector: this.injector,
    });

  private readonly aggregatorContentSlot = contentChild(CngxMatTabAggregatorContent);
  private readonly aggregatorContentTemplate: Signal<TemplateRef<CngxMatTabAggregatorContentContext> | null> =
    computed(() => this.aggregatorContentSlot()?.templateRef ?? null);
  private readonly rejectionContentSlot = contentChild(CngxMatTabRejectionContent);
  private readonly rejectionContentTemplate: Signal<TemplateRef<CngxMatTabRejectionContentContext> | null> =
    computed(() => this.rejectionContentSlot()?.templateRef ?? null);
  private readonly i18n = injectTabsI18n();

  // Identity equal on `string | null` — collapses `tabs()` re-emits
  // that don't change the failed-target id.
  private readonly failedHandleId = computed<string | null>(() => {
    const idx = this.presenter.lastFailedIndex();
    if (idx === undefined) {
      return null;
    }
    return this.presenter.tabs()[idx]?.id ?? null;
  });

  // Bundle shares one source-walk across descriptorText / originLabel
  // / liveAnnouncement — pillar-2 phrasing parity with cngx-native.
  private readonly rejectionState = createRejectionState(this.presenter, this.i18n);

  // Structural equal — drops re-runs whose entry list is shape-
  // identical so the projector doesn't churn on no-op aggregator
  // re-emissions.
  private readonly aggregatedErrorTabs = computed<readonly CngxMatTabAggregatorErrorEntry[]>(
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
    const matTabsConfig = injectMatTabsConfig();

    // Polite live region — attribute directive owns no template, so
    // the helper attaches the span at document.body (CDK
    // LiveAnnouncer convention) and mirrors `CngxLiveRegion`'s host
    // bindings imperatively.
    mountLiveRegionAnnouncer({
      announcement: this.rejectionState.liveAnnouncement,
      renderer: this.renderer,
      injector: this.injector,
      destroyRef: this.destroyRef,
    });

    // Decoration projectors own DOM-mutation state plus `effect()`
    // registration; the directive only supplies reactive triggers.
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

    this.destroyRef.onDestroy(() => this.overflowRef.destroy());

    // Anchor the overflow molecule inside `.mat-mdc-tab-header` so
    // the More button pins to the strip's trailing edge. Bounded
    // `createDomAnchorRetry` covers the deferred-host case
    // (`<mat-tab-group>` gated behind `*ngIf` / `@defer`); the cap
    // dev-warns when consumer DOM never materialises. The
    // flex-layout skin in `mat-tabs.css` handles positioning — no
    // imperative layout work needed.
    const anchorMaxAttempts = matTabsConfig.anchorMaxAttempts;
    const anchorRetry = inject(CNGX_DOM_ANCHOR_RETRY_FACTORY)({
      attempt: () => {
        const headerEl = this.hostEl.querySelector<HTMLElement>(
          MaterialPrivateSurfaces.MAT_MDC_TAB_HEADER_SELECTOR,
        );
        if (!headerEl) {
          return null;
        }
        const overflowEl = this.overflowRef.location.nativeElement as HTMLElement;
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
   * Clears `presenter.lastFailedIndex`, dismissing the rejection
   * decoration. Mirrors `CngxTabGroup.clearLastFailed()` so a
   * template ref (`#mt="cngxMatTabs"`) is enough — no host-token
   * injection needed.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }
}
