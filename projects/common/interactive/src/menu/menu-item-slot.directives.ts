import { Directive } from '@angular/core';

/**
 * Marker directive for the leading icon position inside a `[cngxMenuItem]`.
 * Applies the BEM class `cngx-menu-item__icon` to the host element. Pure
 * presentational hook — no inputs, no behaviour. Consumers style the
 * position via the BEM selector.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItemIcon]',
  exportAs: 'cngxMenuItemIcon',
  standalone: true,
  host: { class: 'cngx-menu-item__icon' },
})
export class CngxMenuItemIcon {}

/**
 * Marker directive for the primary label position inside a
 * `[cngxMenuItem]`. Applies `cngx-menu-item__label`.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItemLabel]',
  exportAs: 'cngxMenuItemLabel',
  standalone: true,
  host: { class: 'cngx-menu-item__label' },
})
export class CngxMenuItemLabel {}

/**
 * Marker directive for a trailing detail slot inside a `[cngxMenuItem]`
 * — secondary text or a status pill that sits between the label and the
 * keyboard-shortcut hint. Applies `cngx-menu-item__suffix`.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItemSuffix]',
  exportAs: 'cngxMenuItemSuffix',
  standalone: true,
  host: { class: 'cngx-menu-item__suffix' },
})
export class CngxMenuItemSuffix {}

/**
 * Marker directive for the keyboard-shortcut hint position inside a
 * `[cngxMenuItem]`. Applies `cngx-menu-item__kbd`. Typically placed on
 * a `<kbd>` element rendering text like `⌘X`.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItemKbd]',
  exportAs: 'cngxMenuItemKbd',
  standalone: true,
  host: { class: 'cngx-menu-item__kbd' },
})
export class CngxMenuItemKbd {}
