import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  linkedSignal,
  viewChildren,
} from '@angular/core';

import { cngxDevWarn } from '@cngx/utils';
import { CngxCheckboxIndicator, CngxRadioIndicator } from '@cngx/common/display';
import { CngxRecyclerPlaceholder } from '@cngx/common/data';
import { CngxOption } from '@cngx/common/interactive';

import { CNGX_SELECT_PANEL_HOST, type CngxSelectPanelHost } from '../../panel-host';
import type { CngxSelectOptionDef, CngxSelectOptionGroupDef } from '../../option.model';
import type { CngxSelectCheckContext } from '../../template-slots';
import {
  CNGX_PANEL_RENDERER_FACTORY,
  type PanelRenderer,
} from '../../panel-renderer';
import { isCngxSelectOptionGroupDef } from '../../option.model';
import { sameArrayContents } from '../compare';

/**
 * Stable empty slice returned while the panel has never opened. Shared so
 * the deferred-render branch never allocates and the `renderItems` equal
 * fn resolves to one reference.
 */
const EMPTY_RENDER_ITEMS: readonly unknown[] = [];

/**
 * Panel body for the flat (non-tree) select family. Renders the
 * grouped/flat option loop only; the surrounding
 * `<cngx-select-panel-shell>` (loading / empty / error / refreshing /
 * commit-error and the action regions) wraps the `cngxListbox` element
 * in the variant template, so the chrome stays a sibling of the listbox
 * rather than a descendant (C4).
 *
 * The outer `<div cngxPopover>` and `<div cngxListbox>` stay on
 * `CngxSelect` so the trigger button's `[popover]` /
 * `[cngxListboxTrigger]` references stay in scope. This sub-component
 * renders the listbox's children only.
 *
 * `CNGX_SELECT_PANEL_HOST` carries the minimal `CngxSelectPanelHost`
 * surface so a direct `inject(CngxSelect)` cyclic type dependency is
 * avoided.
 *
 * Template signals are pre-resolved: every `host.xxxTpl()` is a
 * `TemplateRef | null` - the 3-stage cascade runs in the select
 * component, the panel just renders.
 *
 * @internal
 */
@Component({
  selector: 'cngx-select-panel',
  exportAs: 'cngxSelectPanel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxOption,
    CngxCheckboxIndicator,
    CngxRadioIndicator,
    CngxRecyclerPlaceholder,
    NgTemplateOutlet,
  ],
  host: {
    class: 'cngx-select-panel-host',
  },
  templateUrl: './panel.component.html',
  styleUrls: ['../../select-base.css', './panel.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxSelectPanel<T = unknown> {
  /**
   * Panel-host contract. Cast to the typed interface so template reads
   * like `host.activeView()` typecheck. Angular provides the concrete
   * variant via `useExisting`; this surface is the minimum the panel
   * needs.
   */
  protected readonly host = inject(CNGX_SELECT_PANEL_HOST) as CngxSelectPanelHost<T>;

  /**
   * Consumer-swappable renderer deciding which options enter the DOM.
   * Default identity (every flat option rendered) via
   * {@link CNGX_PANEL_RENDERER_FACTORY}; virtualising renderers swap
   * the token via `providers` / `viewProviders` for a contiguous
   * scroll-window slice.
   *
   * Grouped options bypass the renderer and render in full - windowing
   * across group boundaries is ambiguous and grouped lists tend to be
   * small. Flat options run through the renderer.
   *
   * @internal
   */
  protected readonly renderer: PanelRenderer<T> =
    this.host.panelRenderer ??
    inject(CNGX_PANEL_RENDERER_FACTORY)<T>({ flatOptions: this.host.flatOptions });

  /**
   * Virtualiser metadata the template reads to emit spacer divs and
   * `data-cngx-recycle-index` attributes per rendered option. `null`
   * when the renderer hasn't opted in (identity default); template
   * paths gate on this so non-virtualised markup stays byte-identical.
   *
   * @internal
   */
  protected readonly virtualizer = computed(() => {
    const v = this.renderer.virtualizer;
    if (!v) {
      return null;
    }
    // Spacers and virtual row indices only while the renderer windows the
    // list. Below the auto-virtualize threshold the full list renders, so
    // the panel stays identity-shaped: no spacer divs (which would shift
    // `:nth-of-type`), no `data-cngx-recycle-index`, no `aria-posinset`.
    const rendered = this.renderer.renderOptions().length;
    const total = this.renderer.totalCount?.() ?? rendered;
    return rendered >= total ? null : v;
  });

  /**
   * `true` once the open panel's rendered items contain a group. Read by
   * the spacer gate and the CNGX2028 dev-warn - derived from the already
   * computed `renderItems`, never recomputed inside a render body.
   *
   * @internal
   */
  protected readonly renderedHasGroup = computed(() =>
    this.renderItems().some(isCngxSelectOptionGroupDef),
  );

  /**
   * Virtualiser for the leading/trailing spacer divs only. Grouped lists
   * render in full and bypass the renderer, so emitting recycler spacers
   * around them would reserve scroll height for rows that are all already
   * in the DOM (C2). A grouped render drops both spacers; the flat path
   * keeps the windowed `virtualizer()`.
   *
   * @internal
   */
  protected readonly spacerVirtualizer = computed(() =>
    this.renderedHasGroup() ? null : this.virtualizer(),
  );

  /**
   * Items iterated by the template. Grouped paths use
   * `effectiveOptions` verbatim (groups stay intact for correct
   * aria-setsize / aria-posinset per group); flat paths use the
   * renderer's windowed output so a consumer-provided renderer kicks
   * in transparently.
   *
   * @internal
   */
  protected readonly renderItems = computed<
    (CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>)[]
  >(
    () => {
      // Deferred render (OD5): no option rows until the first open. The
      // listbox element, its id and `aria-controls` target stay mounted
      // in the variant template - only this loop is empty.
      if (!this.hasOpened()) {
        return EMPTY_RENDER_ITEMS as (
          | CngxSelectOptionDef<T>
          | CngxSelectOptionGroupDef<T>
        )[];
      }
      const effective = this.host.effectiveOptions();
      // Any group → route through `effectiveOptions` as-is. Virtualising
      // renderers deliberately don't touch grouped lists.
      const hasGroup = effective.some(isCngxSelectOptionGroupDef);
      if (hasGroup) {
        return [...effective];
      }
      return [...this.renderer.renderOptions()];
    },
    // Element-identity equal so the extra `hasOpened` branch and the
    // fresh spreads above never cascade a new array reference when the
    // contents are unchanged (reference_signal_architecture).
    { equal: (a, b) => sameArrayContents(a, b, Object.is) },
  );

  /**
   * Latches `true` on the panel's first open and stays true. Option rows
   * are deferred until then (OD5): a panel that has never opened renders
   * nothing, which keeps mounting a large closed list cheap. Re-closing
   * after the first open keeps the rows, so re-open is instant.
   *
   * @internal
   */
  private readonly hasOpened = linkedSignal<boolean, boolean>({
    source: () => this.host.panelOpen(),
    computation: (open, previous) => open || previous?.value === true,
  });

  /** Latches so the CNGX2028 dev-warn fires at most once per instance. */
  private warnedGroupedVirtualization = false;

  constructor() {
    // Dev-only: a configured virtualising renderer plus grouped options is a
    // contradiction - the group loop renders every option and the recycler
    // window is dropped (spacerVirtualizer null). Warn once so the misconfig
    // surfaces. The guard strips the message text and the effect in prod.
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      effect(() => {
        const configured = this.renderer.virtualizer !== undefined;
        if (configured && this.renderedHasGroup() && !this.warnedGroupedVirtualization) {
          this.warnedGroupedVirtualization = true;
          cngxDevWarn(
            'CNGX2028',
            'withVirtualization(): grouped select options ignore the configured virtualization; every option renders and the recycler window is dropped. Flatten the options or drop withVirtualization() for this select.',
          );
        }
      });
    }
  }

  /**
   * `CngxOption` instances rendered in this panel's view. Forwarded
   * to the outer `CngxListbox` via `[explicitOptions]` because
   * content-projection scoping hides them from the listbox's
   * `contentChildren`.
   */
  readonly options = viewChildren(CngxOption);

  /**
   * ActiveDescendantItem projections of `options()` for the outer
   * listbox's `[items]` passthrough → CngxActiveDescendant. AD's
   * `contentChildren(CNGX_AD_ITEM)` can't see options living in this
   * component's view, not in the listbox's projected content;
   * forwarding via `items` bypasses the scoping boundary.
   */
  readonly items = computed(() =>
    this.options().map((o) => ({
      id: o.id,
      value: o.value(),
      label: o.label(),
      disabled: o.disabled(),
    })),
  );

  /**
   * `true` when `opt` is the AD-highlighted row. Derived from the
   * host's `activeId` and locally-rendered `CngxOption` view-children
   * - keeps the panel independent of the listbox directive.
   *
   * Read by the `optionLabel` context so consumers projecting
   * `*cngxSelectOptionLabel` can render a highlight-reactive style.
   */
  protected isHighlighted(opt: CngxSelectOptionDef<T>): boolean {
    const highlighted = this.highlightedValue();
    if (!highlighted) {
      return false;
    }
    return this.host.listboxCompareWith()(highlighted.value, opt.value);
  }

  /**
   * Value of the AD-highlighted row, resolved once per `activeId` change
   * instead of once per rendered row. Boxed so an `undefined` option value
   * stays distinguishable from "nothing highlighted".
   */
  private readonly highlightedValue = computed<{ readonly value: unknown } | null>(() => {
    const activeId = this.host.activeId();
    if (!activeId) {
      return null;
    }
    const match = this.options().find((o) => o.id === activeId);
    return match ? { value: match.value() } : null;
  });

  /**
   * Builds the `*cngxSelectCheck` context for an option row. Radio
   * rows omit `indeterminate` because radio is exclusive - consumers
   * narrow on `variant` to read it safely.
   */
  protected checkContextFor(
    opt: CngxSelectOptionDef<T>,
    position: 'before' | 'after',
  ): CngxSelectCheckContext<T> {
    const variant = this.host.resolvedSelectionIndicatorVariant();
    if (variant === 'radio') {
      return {
        $implicit: opt,
        option: opt,
        selected: this.host.isSelected(opt),
        variant,
        position,
      };
    }
    return {
      $implicit: opt,
      option: opt,
      selected: this.host.isSelected(opt),
      indeterminate: this.host.isIndeterminate(opt),
      variant,
      position,
    };
  }
}
