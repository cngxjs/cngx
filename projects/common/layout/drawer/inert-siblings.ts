import { CNGX_LIVE_SURFACE_SELECTOR } from '@cngx/core/utils';

/**
 * @internal How far `createInertSiblings` reaches.
 *
 * - `'siblings'`: the element siblings of the host only (`CngxBackdrop`).
 * - `'outside'`: everything outside the host up to the `within` boundary
 *   (default `document.body`): the siblings of the host and of every
 *   ancestor below the boundary, like a modal dialog (`CngxDrawerSurface`).
 *   Nothing outside the boundary is touched.
 */
export type CngxInertScope = 'siblings' | 'outside';

/**
 * @internal Elements that stay live in every scope:
 *
 * - CDK focus-trap anchors: an inert anchor cannot take focus, so the trap
 *   next to it stops wrapping and Tab leaves the modal.
 * - Live regions, announcer containers (the CDK announcer) and every
 *   element marked with `CNGX_LIVE_SURFACE_ATTR` (the toast and banner
 *   outlets): inert content leaves the accessibility tree, and an
 *   announcement written into it is never spoken.
 * - The CDK overlay container: overlays opened from inside the modal render
 *   there, outside the host.
 * - A visible `CngxBackdrop`: it holds no focusable content, and inerting it
 *   would swallow its `backdropClick`.
 */
const KEEP_LIVE_SELECTOR = [
  '.cdk-focus-trap-anchor',
  '[aria-live]',
  '[role="status"]',
  '[role="alert"]',
  '[role="log"]',
  '.cdk-live-announcer-element',
  CNGX_LIVE_SURFACE_SELECTOR,
  '.cdk-overlay-container',
  '.cngx-backdrop--visible',
].join(', ');

/** @internal Options for {@link createInertSiblings}. */
export interface CngxInertSiblingsOptions {
  /** How far the inert set reaches. Defaults to `'siblings'`. */
  readonly scope?: CngxInertScope;
  /** Keeps further elements live (the backdrop keeps the drawer panel it guards). */
  readonly exclude?: (element: HTMLElement) => boolean;
  /**
   * The boundary of the `'outside'` scope: only elements inside it are
   * inerted. Defaults to `document.body`. A boundary that does not contain
   * the host inerts nothing.
   */
  readonly within?: HTMLElement;
  /**
   * A selector for further elements that stay live like the built-in ones:
   * a match is not inerted, and an element that contains a match is entered
   * instead of being inerted as a whole.
   */
  readonly keepLive?: string;
}

/**
 * @internal Top-layer surfaces that render outside the host after it engaged
 * (a dialog the service appends to `<body>`, a tooltip placed next to its
 * trigger) were opened from inside the modal and stay live. Only late
 * additions get this exemption.
 */
const LATE_LIVE_SELECTOR = 'dialog, [popover]';

/**
 * @internal Marks the elements around `host` as `inert` and returns the
 * release function. Shared by `CngxBackdrop` (`'siblings'`) and
 * `CngxDrawerSurface` (`'outside'`).
 *
 * The set is queried at call time and then followed: an element rendered
 * later next to the host or next to one of its ancestors inside the scope
 * (`@if`, `@defer`, a routed view) is inerted as it arrives, unless it is or
 * holds a `<dialog>` or `[popover]`, which a late addition only is when the
 * modal opened it. Elements that already carry
 * `inert` are skipped and never touched on release, so a consumer-set or
 * other-owner `inert` survives. Focus-trap anchors, live regions, the CDK
 * overlay container, marked live surfaces and a visible backdrop
 * stay live; an element that only contains one of them is not inerted as a
 * whole, its other children are.
 * Release is idempotent and stops following the scope.
 */
export function createInertSiblings(
  host: HTMLElement,
  options: CngxInertSiblingsOptions = {},
): () => void {
  const { scope = 'siblings', exclude = () => false, within, keepLive } = options;
  const root = scope === 'outside' ? (within ?? host.ownerDocument.body) : host.parentElement;
  const liveSelector = keepLive ? `${KEEP_LIVE_SELECTOR}, ${keepLive}` : KEEP_LIVE_SELECTOR;
  const lateLiveSelector = `${liveSelector}, ${LATE_LIVE_SELECTOR}`;
  const targets: HTMLElement[] = [];
  const Observer = host.ownerDocument.defaultView?.MutationObserver;
  const observer = Observer
    ? new Observer((records) => {
        for (const record of records) {
          record.addedNodes.forEach((node) => visit(node, lateLiveSelector));
        }
      })
    : null;

  const keepsLive = (element: HTMLElement, selector: string): boolean =>
    element.matches(selector) || exclude(element);

  const containsLive = (element: HTMLElement, selector: string): boolean =>
    element.contains(host) ||
    Array.from(element.querySelectorAll<HTMLElement>(selector)).some(
      (node) => !host.contains(node),
    );

  const visit = (child: Node, selector: string): void => {
    if (child === host || !(child instanceof HTMLElement) || child.hasAttribute('inert')) {
      return;
    }
    if (keepsLive(child, selector)) {
      return;
    }
    if (containsLive(child, selector)) {
      collect(child, selector);
      return;
    }
    child.setAttribute('inert', '');
    targets.push(child);
  };

  const collect = (container: Element, selector: string): void => {
    observer?.observe(container, { childList: true });
    for (const child of Array.from(container.children)) {
      visit(child, selector);
    }
  };

  if (root && root !== host && root.contains(host)) {
    collect(root, liveSelector);
  }

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    observer?.disconnect();
    targets.forEach((target) => target.removeAttribute('inert'));
  };
}
