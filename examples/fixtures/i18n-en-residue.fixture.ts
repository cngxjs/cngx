// Dependency-free on purpose: the German-pack e2e spec imports it into the
// Playwright (Node) runner, which cannot load the Angular libraries.

/**
 * The EN defaults the residue pages would show without the pack: the negative
 * list the German-pack e2e asserts absent. Copied from the library defaults
 * records, which are internal.
 */
export const EN_RESIDUE_STRINGS = {
  dismiss: 'Dismiss',
  bannerActionFailed: 'Action failed',
  loading: 'Loading',
  progress: 'Progress',
  refreshing: 'Refreshing content',
  searchPlaceholder: 'Search…',
  goalValueText: '73 of 100',
  overflowMore: 'more',
} as const;
