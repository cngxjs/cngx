import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChildren,
} from '@angular/core';

import { CngxCheckboxIndicator } from '@cngx/common/display';
import { CngxOption } from '@cngx/common/interactive';

import { CngxSelectPanelShell } from '../panel-shell/panel-shell.component';
import { CNGX_SELECT_PANEL_HOST, type CngxSelectPanelHost } from '../panel-host';
import type { CngxSelectOptionDef, CngxSelectOptionGroupDef } from '../option.model';
import {
  CNGX_PANEL_RENDERER_FACTORY,
  type PanelRenderer,
} from '../panel-renderer';
import { isCngxSelectOptionGroupDef } from '../option.model';

/**
 * Panel body sub-component for the flat (non-tree) select family —
 * renders the grouped/flat option loop inside the shared
 * `<cngx-select-panel-shell>` frame. The shell owns the loading /
 * empty / error / refreshing / commit-error surfaces; this component
 * only contributes the options rendering that's specific to a flat
 * listbox.
 *
 * **Why this is a separate component.**
 * Inlining the whole panel in `CngxSelect`'s template pushed it past
 * 340 lines — beyond "readable in one screen". Moving the body here
 * shrinks the main template to ~80 lines focused on the trigger button
 * and the popover/listbox frame.
 *
 * The outer `<div cngxPopover>` and `<div cngxListbox>` stay on
 * `CngxSelect` so the trigger button's `[popover]` / `[cngxListboxTrigger]`
 * template references stay in scope. This sub-component renders ONLY
 * the listbox's children.
 *
 * **Why the `CNGX_SELECT_PANEL_HOST` token.**
 * A direct `inject(CngxSelect)` would create a cyclic type dependency
 * between this file and `select.component.ts`. The token carries the
 * minimal `CngxSelectPanelHost` interface — refactors on `CngxSelect`
 * show up there first, not in this template.
 *
 * **Template signals are pre-resolved.** Every `host.xxxTpl()` is a
 * `TemplateRef | null` — the 3-stage cascade (instance content-child →
 * `CNGX_SELECT_CONFIG.templates.xxx` → library default) is evaluated by
 * the select component. The panel just renders whatever the host hands
 * it.
 *
 * @internal
 */
@Component({
  selector: 'cngx-select-panel',
  exportAs: 'cngxSelectPanel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxOption, CngxCheckboxIndicator, CngxSelectPanelShell, NgTemplateOutlet],
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
      Reusable option-row template — used for both grouped children and
      flat items. Single source of truth for selection class, pending
      class, check indicator, rich label template, and commit-status
      glyph. Keeps the grouped/flat paths from diverging when option-row
      concerns evolve.
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
      >
        @if (host.resolvedShowSelectionIndicator() && host.resolvedSelectionIndicatorPosition() === 'before') {
          @if (host.tpl.check(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: {
              $implicit: opt,
              option: opt,
              selected: host.isSelected(opt),
              indeterminate: host.isIndeterminate(opt),
              variant: host.resolvedSelectionIndicatorVariant(),
              position: 'before'
            }" />
          } @else {
            <cngx-checkbox-indicator
              class="cngx-select__check"
              [variant]="host.resolvedSelectionIndicatorVariant()"
              [checked]="host.isSelected(opt)"
              [indeterminate]="host.isIndeterminate(opt)"
            />
          }
        }
        @if (host.tpl.optionLabel(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: { $implicit: opt, option: opt, selected: host.isSelected(opt), highlighted: isHighlighted(opt) }" />
        } @else {
          {{ opt.label }}
        }
        @if (host.resolvedShowSelectionIndicator() && host.resolvedSelectionIndicatorPosition() === 'after') {
          @if (host.tpl.check(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: {
              $implicit: opt,
              option: opt,
              selected: host.isSelected(opt),
              indeterminate: host.isIndeterminate(opt),
              variant: host.resolvedSelectionIndicatorVariant(),
              position: 'after'
            }" />
          } @else {
            <cngx-checkbox-indicator
              class="cngx-select__check"
              [variant]="host.resolvedSelectionIndicatorVariant()"
              [checked]="host.isSelected(opt)"
              [indeterminate]="host.isIndeterminate(opt)"
            />
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
  `,
  styleUrls: ['../select-base.css', './panel.component.css'],
})
export class CngxSelectPanel<T = unknown> {
  /**
   * Panel-host contract. Cast to the typed interface so template reads
   * like `host.activeView()` are properly checked. Angular provides the
   * concrete `CngxSelect` instance via `{ useExisting: CngxSelect }`,
   * typed here as `CngxSelectPanelHost<T>` — the minimal surface this
   * sub-component needs.
   */
  protected readonly host = inject(CNGX_SELECT_PANEL_HOST) as CngxSelectPanelHost<T>;

  /**
   * Consumer-swappable renderer that decides which options enter the
   * DOM. Defaults to identity (every flat option rendered) via
   * {@link CNGX_PANEL_RENDERER_FACTORY}. Virtualising renderers swap
   * this token via `providers` / `viewProviders` to return a
   * contiguous scroll-window slice of `flatOptions`.
   *
   * Grouped options (`CngxSelectOptionGroupDef`) currently bypass the
   * renderer and render in full — windowing across group boundaries
   * is ambiguous (a half-rendered group header is UX-weird) and the
   * family's grouped use-cases tend to be small curated lists rather
   * than 10k+ records. Flat options run through the renderer
   * transparently.
   *
   * @internal
   */
  protected readonly renderer: PanelRenderer<T> = inject(
    CNGX_PANEL_RENDERER_FACTORY,
  )<T>({ flatOptions: this.host.flatOptions });

  /**
   * Virtualiser metadata the template reads to emit spacer divs +
   * `data-cngx-recycle-index` attributes on each rendered option.
   * `null` when the renderer hasn't opted in (identity default) —
   * the template paths gate on this to keep non-virtualised markup
   * byte-identical to before the extension point landed.
   *
   * @internal
   */
  protected readonly virtualizer = computed(() => this.renderer.virtualizer ?? null);

  /**
   * Items iterated by the template. Grouped paths use
   * `effectiveOptions` verbatim (groups stay intact for correct
   * aria-setsize + aria-posinset per group); flat paths use the
   * renderer's windowed output so virtualisation kicks in
   * transparently when the consumer provides a custom renderer.
   *
   * @internal
   */
  protected readonly renderItems = computed<
    (CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>)[]
  >(() => {
    const effective = this.host.effectiveOptions();
    // If any item is a group, route through `effectiveOptions` as-is —
    // virtualising renderers deliberately don't touch grouped lists.
    const hasGroup = effective.some(isCngxSelectOptionGroupDef);
    if (hasGroup) {
      return [...effective];
    }
    return [...this.renderer.renderOptions()];
  });

  /**
   * All `CngxOption` instances rendered in this panel's view. Exposed
   * to the parent so it can forward them to its outer `CngxListbox`
   * via `[explicitOptions]` — content-projection-scoping prevents the
   * listbox from seeing them as `contentChildren`.
   */
  readonly options = viewChildren(CngxOption);

  /**
   * ActiveDescendantItem projections of `options()`, ready to bind to
   * the outer listbox's `[items]` passthrough input (which forwards to
   * CngxActiveDescendant). AD's own `contentChildren(CNGX_AD_ITEM)`
   * can't see the options because they live in THIS component's view,
   * not in the listbox's projected content. Forwarding via `items`
   * bypasses the scoping boundary cleanly.
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
   * Whether the option identified by `opt` is the one currently
   * highlighted via `CngxActiveDescendant`. Derived from the host's
   * `activeId` plus the locally-rendered `CngxOption` view-children,
   * so the panel stays independent of the listbox directive itself.
   *
   * Consumed by the `optionLabelTpl` context — consumers who project
   * `*cngxSelectOptionLabel` can render a highlight-reactive style
   * (e.g. custom background when keyboard nav lands on a row).
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
}
