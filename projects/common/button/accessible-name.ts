/**
 * `true` when the host carries a non-blank `aria-label`, `aria-labelledby`
 * or `title`: the attributes an icon-only button can be named by. Read by
 * the development-mode name checks of the icon and close buttons.
 *
 * @internal
 */
export function hasAccessibleName(host: HTMLElement): boolean {
  return ['aria-label', 'aria-labelledby', 'title'].some(
    (attr) => (host.getAttribute(attr) ?? '').trim() !== '',
  );
}
