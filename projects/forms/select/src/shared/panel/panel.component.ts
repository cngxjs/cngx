import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChildren,
} from '@angular/core';

import { CngxCheckboxIndicator, CngxRadioIndicator } from '@cngx/common/display';
import { CngxOption } from '@cngx/common/interactive';

import { CngxSelectPanelShell } from '../panel-shell/panel-shell.component';
import { CNGX_SELECT_PANEL_HOST, type CngxSelectPanelHost } from '../panel-host';
import type { CngxSelectOptionDef, CngxSelectOptionGroupDef } from '../option.model';
import type { CngxSelectCheckContext } from '../template-slots';
import {
  CNGX_PANEL_RENDERER_FACTORY,
  type PanelRenderer,
} from '../panel-renderer';
import { isCngxSelectOptionGroupDef } from '../option.model';

/**
 * Panel body for the flat (non-tree) select family. Renders the
 * grouped/flat option loop inside `<cngx-select-panel-shell>`; the
 * shell owns loading / empty / error / refreshing / commit-error.
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
 * `TemplateRef | null` — the 3-stage cascade runs in the select
 * component, the panel just renders.
 *
 * @internal
 */
@Component({
  selector: 'cngx-select-panel',
  exportAs: 'cngxSelectPanel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxOption, CngxCheckboxIndicator, CngxRadioIndicator, CngxSelectPanelShell, NgTemplateOutlet],
  host: {
    class: 'cngx-select-panel-host',
  },
  template: `
    <cngx-select-panel-shell
      [actionFocusTrapEnabled]="host.actionFocusTrapEnabled?.() ?? false"
      [actionPosition]="host.actionPosition?.() ?? 'bottom'"
    >
      @if (virtualizer(); as v) {
        <div aria-hidden="true" [style.height.px]="v.offsetBefore()"></div>
      }
      @for (item of renderItems(); track $index) {
        @if (host.isGroup(item)) {
          <div class="cngx-select__group" role="group" [attr.aria-label]="item.label">
            @if (host.tpl.optgroup(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl; context: { $implicit: item, group: item }" />
            } @else {
              <div class="cngx-select__group-header" aria-hidden="true">{{ item.label }}</div>
            }
            @for (opt of item.children; track opt.value) {
              <ng-container *ngTemplateOutlet="optionRow; context: { $implicit: opt, groupDisabled: !!item.disabled, virtualIndex: null }" />
            }
          </div>
        } @else {
          <ng-container
            *ngTemplateOutlet="optionRow; context: {
              $implicit: item,
              groupDisabled: false,
              virtualIndex: virtualizer() ? virtualizer()!.startIndex() + $index : null
            }"
          />
        }
      }
      @if (virtualizer(); as v) {
        <div aria-hidden="true" [style.height.px]="v.offsetAfter()"></div>
      }
    </cngx-select-panel-shell>

    <!--
      Option-row template — shared by grouped and flat items. Single
      source of truth for selection class, pending class, check
      indicator, label template, and commit-status glyph.
    -->
    <ng-template #optionRow let-opt let-groupDisabled="groupDisabled" let-virtualIndex="virtualIndex">
      <div
        cngxOption
        [value]="opt.value"
        [disabled]="!!opt.disabled || groupDisabled"
        class="cngx-select__option"
        [class.cngx-select__option--selected]="host.isSelected(opt)"
        [class.cngx-select__option--pending]="host.isCommittingOption(opt)"
        [attr.data-cngx-recycle-index]="virtualIndex"
        [attr.aria-setsize]="virtualIndex !== null ? virtualizer()?.setsize() : null"
        [attr.aria-posinset]="virtualIndex !== null ? virtualIndex + 1 : null"
      >
        @if (host.resolvedShowSelectionIndicator() && host.resolvedSelectionIndicatorPosition() === 'before') {
          @if (host.tpl.check(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: checkContextFor(opt, 'before')" />
          } @else {
            <ng-container *ngTemplateOutlet="defaultIndicator; context: { $implicit: opt }" />
          }
        }
        @if (host.tpl.optionLabel(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: { $implicit: opt, option: opt, selected: host.isSelected(opt), highlighted: isHighlighted(opt) }" />
        } @else {
          {{ opt.label }}
        }
        @if (host.resolvedShowSelectionIndicator() && host.resolvedSelectionIndicatorPosition() === 'after') {
          @if (host.tpl.check(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: checkContextFor(opt, 'after')" />
          } @else {
            <ng-container *ngTemplateOutlet="defaultIndicator; context: { $implicit: opt }" />
          }
        }
        @if (host.isCommittingOption(opt)) {
          @if (host.tpl.optionPending(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: { $implicit: opt, option: opt }" />
          } @else {
            <span aria-hidden="true" class="cngx-select__option-spinner"></span>
          }
        } @else if (host.commitErrorDisplay() === 'inline' && host.showCommitError() && host.isSelected(opt)) {
          @if (host.tpl.optionError(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: { $implicit: opt, option: opt, error: host.commitErrorValue() }" />
          } @else {
            <span aria-hidden="true" class="cngx-select__option-error">!</span>
          }
        }
      </div>
    </ng-template>

    <!--
      Default indicator body — shared by 'before' and 'after' position
      blocks. *cngxSelectCheck overrides win; this template renders
      only when no slot directive is projected.
    -->
    <ng-template #defaultIndicator let-opt>
      @switch (host.resolvedSelectionIndicatorVariant()) {
        @case ('radio') {
          <cngx-radio-indicator
            class="cngx-select__check"
            [checked]="host.isSelected(opt)"
          />
        }
        @case ('checkmark') {
          <cngx-checkbox-indicator
            class="cngx-select__check"
            variant="checkmark"
            [checked]="host.isSelected(opt)"
            [indeterminate]="host.isIndeterminate(opt)"
          />
        }
        @default {
          <cngx-checkbox-indicator
            class="cngx-select__check"
            variant="checkbox"
            [checked]="host.isSelected(opt)"
            [indeterminate]="host.isIndeterminate(opt)"
          />
        }
      }
    </ng-template>
  `,
  styleUrls: ['../select-base.css', './panel.component.css'],
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
   * Grouped options bypass the renderer and render in full — windowing
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
  protected readonly virtualizer = computed(() => this.renderer.virtualizer ?? null);

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
  >(() => {
    const effective = this.host.effectiveOptions();
    // Any group → route through `effectiveOptions` as-is. Virtualising
    // renderers deliberately don't touch grouped lists.
    const hasGroup = effective.some(isCngxSelectOptionGroupDef);
    if (hasGroup) {
      return [...effective];
    }
    return [...this.renderer.renderOptions()];
  });

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
   * — keeps the panel independent of the listbox directive.
   *
   * Read by the `optionLabel` context so consumers projecting
   * `*cngxSelectOptionLabel` can render a highlight-reactive style.
   */
  protected isHighlighted(opt: CngxSelectOptionDef<T>): boolean {
    const activeId = this.host.activeId();
    if (!activeId) {
      return false;
    }
    const match = this.options().find((o) => o.id === activeId);
    if (!match) {
      return false;
    }
    return this.host.listboxCompareWith()(match.value(), opt.value);
  }

  /**
   * Builds the `*cngxSelectCheck` context for an option row. Radio
   * rows omit `indeterminate` because radio is exclusive — consumers
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
