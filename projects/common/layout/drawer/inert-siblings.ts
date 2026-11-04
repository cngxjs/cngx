/**
 * @internal Marks every element sibling of `host` as `inert` and returns the
 * release function. Shared by `CngxBackdrop` and `CngxDrawerSurface`.
 *
 * The sibling set is queried at call time, so siblings rendered after init
 * (`@if`, `@defer`) are covered by the next call. Siblings that already carry
 * `inert` are skipped and never touched on release, so a consumer-set or
 * other-owner `inert` survives. `exclude` keeps further siblings live (the
 * backdrop keeps the drawer panel it guards). Release is idempotent.
 */
export function createInertSiblings(
  host: HTMLElement,
  exclude: (sibling: HTMLElement) => boolean = () => false,
): () => void {
  const parent = host.parentElement;
  const targets = parent
    ? Array.from(parent.children).filter(
        (child): child is HTMLElement =>
          child !== host &&
          child instanceof HTMLElement &&
          !child.hasAttribute('inert') &&
          !exclude(child),
      )
    : [];
  targets.forEach((target) => target.setAttribute('inert', ''));

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    targets.forEach((target) => target.removeAttribute('inert'));
  };
}
