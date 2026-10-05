/**
 * @internal Forced-colors support for the Canvas backend. Canvas pixels
 * are never forced by the browser, so the backend paints the system
 * palette itself. Not exported from the public API.
 */

/** @internal The two system colours a forced Canvas paint uses. */
export interface ForcedSystemColors {
  /** `CanvasText` - every mark, stroke and ring. */
  readonly ink: string;
  /** `Canvas` - hatch gaps and hollow-mark interiors. */
  readonly canvas: string;
}

/**
 * @internal Resolve `CanvasText` / `Canvas` to concrete colours through a
 * probe span under `host`. The probe opts out with
 * `forced-color-adjust: none`; without it a forced `color: Canvas` would
 * compute to the forced text colour. Removed right after the read, so the
 * host's DOM is left as it was. Falls back to the keywords when the host
 * resolves nothing (jsdom).
 */
export function resolveSystemColors(host: HTMLElement): ForcedSystemColors {
  const probe = host.ownerDocument.createElement('span');
  probe.style.setProperty('forced-color-adjust', 'none');
  probe.style.display = 'none';
  host.appendChild(probe);
  probe.style.color = 'CanvasText';
  const ink = getComputedStyle(probe).color;
  probe.style.color = 'Canvas';
  const canvas = getComputedStyle(probe).color;
  probe.remove();
  return { ink: ink || 'CanvasText', canvas: canvas || 'Canvas' };
}
