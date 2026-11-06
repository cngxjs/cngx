/**
 * Attribute that marks a live surface: an always-present outlet whose
 * content must stay perceivable while a modal inerts the rest of the page
 * (a toast or banner outlet, an announcer container). A modal scope such as
 * `CngxDrawerSurface` or `CngxBackdrop` never sets `inert` on an element
 * carrying it, so the outlet keeps its accessibility-tree presence and an
 * announcement written into it is still spoken. An outlet that renders
 * outside the modal sets it on its host element; match it with
 * {@link CNGX_LIVE_SURFACE_SELECTOR}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/live-surface.ts
 * @since 0.1.0
 * @relatedTo CNGX_LIVE_SURFACE_SELECTOR, CngxDrawerSurface, CngxBackdrop
 */
export const CNGX_LIVE_SURFACE_ATTR = 'data-cngx-live-surface';

/**
 * Attribute selector for {@link CNGX_LIVE_SURFACE_ATTR}: matches every live
 * surface that a modal inert scope leaves live.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/live-surface.ts
 * @since 0.1.0
 * @relatedTo CNGX_LIVE_SURFACE_ATTR
 */
export const CNGX_LIVE_SURFACE_SELECTOR = '[data-cngx-live-surface]';
