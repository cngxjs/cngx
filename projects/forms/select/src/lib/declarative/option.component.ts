import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CNGX_AD_ITEM } from '@cngx/common/a11y';
import { CngxOption } from '@cngx/common/interactive';

/**
 * Declarative-mode option element — wraps the `[cngxOption]` atom with a
 * native-feeling `<cngx-option>` tag.
 *
 * **Intended usage:** inside a consumer-assembled listbox (the "compose
 * yourself" path) — NOT as a direct child of `<cngx-select>` (Angular's
 * content-projection scoping would drop the element and prevent AD
 * registration; use `[options]` data-mode with `<cngx-select>` instead).
 *
 * Supports the same `[value]`, `[disabled]`, and `[label]` inputs as the
 * underlying atom.
 *
 * @example
 * ```html
 * <button type="button" [cngxPopoverTrigger]="pop" [cngxListboxTrigger]="lb"
 *         [popover]="pop" (click)="pop.toggle()">Choose…</button>
 * <div cngxPopover #pop="cngxPopover" placement="bottom">
 *   <div cngxListbox #lb="cngxListbox" [label]="'Color'" [(value)]="color">
 *     <cngx-option [value]="'red'">Rot</cngx-option>
 *     <cngx-option [value]="'green'">Grün</cngx-option>
 *   </div>
 * </div>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-option',
  exportAs: 'cngxSelectOption',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxOption,
      inputs: ['value', 'disabled', 'label'],
    },
  ],
  // hostDirective providers don't propagate — re-expose CNGX_AD_ITEM so the
  // enclosing listbox / active-descendant can discover it.
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxOption }],
  imports: [NgTemplateOutlet],
  template: `
    <ng-content />
    @let s = option.statusSignal();
    @if (s !== null && s.tpl !== null) {
      <span class="cngx-option__status" [attr.data-state]="s.kind">
        <ng-container *ngTemplateOutlet="s.tpl" />
      </span>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--cngx-option-gap, 0.5rem);
      justify-content: var(--cngx-option-status-justify, flex-start);
      padding: var(--cngx-select-option-padding, 0.375rem 0.5rem);
      cursor: pointer;
      border-radius: var(--cngx-select-option-radius, 0.125rem);
    }
    :host([aria-disabled='true']) {
      opacity: 0.5;
      cursor: not-allowed;
    }
    :host(.cngx-option--highlighted) {
      background: var(--cngx-select-option-highlight-bg, rgba(25, 118, 210, 0.1));
    }
    .cngx-option__status {
      margin-inline-start: auto;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
    }
    :host([hidden]) {
      display: none;
    }
  `,
})
export class CngxSelectOption {
  protected readonly option = inject(CngxOption, { self: true });
}
