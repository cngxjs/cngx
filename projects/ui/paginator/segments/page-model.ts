// Internal pure page-window math for `cngx-pgn-pages`. Not part of the public
// API - the segment is the only consumer. 0-based throughout (matching the
// brain's `pageIndex`); the rendered display number is `index + 1`.

/** One slot in the rendered page row: a page button or a truncation gap. */
export type PageItem =
  | { readonly kind: 'page'; readonly index: number }
  | { readonly kind: 'gap'; readonly hidden: readonly number[] };

/** The rendered sequence plus the gap count (a cheap structural fingerprint). */
export interface PageWindow {
  readonly pages: readonly PageItem[];
  readonly gaps: number;
}

export interface PageWindowOptions {
  /** Pages shown on each side of the current page. Default 1. */
  readonly siblingCount?: number;
  /** Pages pinned at each end. Default 1. */
  readonly boundaryCount?: number;
}

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return length > 0 ? Array.from({ length }, (_, i) => start + i) : [];
}

/**
 * Compute the windowed page sequence around `current` for `total` pages.
 * A run of more than one hidden page collapses into a `gap` carrying the hidden
 * 0-based indices (the ellipsis menu's options); a single hidden page renders
 * as a plain page button instead of a gap. Derived from the MUI `usePagination`
 * range algorithm, 0-based.
 */
export function pageWindow(
  current: number,
  total: number,
  options: PageWindowOptions = {},
): PageWindow {
  const siblingCount = options.siblingCount ?? 1;
  const boundaryCount = options.boundaryCount ?? 1;
  const count = Math.max(1, total);
  const page = Math.min(Math.max(current, 0), count - 1) + 1; // 1-based, clamped

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : count - 1,
  );

  const startHidden = range(boundaryCount + 1, siblingsStart - 1);
  const endHidden = range(siblingsEnd + 1, count - boundaryCount);

  const itemList: (number | 'start-gap' | 'end-gap')[] = [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? ['start-gap' as const]
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1
      ? ['end-gap' as const]
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];

  let gaps = 0;
  const pages: PageItem[] = itemList.map((entry) => {
    if (entry === 'start-gap') {
      gaps++;
      return { kind: 'gap', hidden: startHidden.map((n) => n - 1) };
    }
    if (entry === 'end-gap') {
      gaps++;
      return { kind: 'gap', hidden: endHidden.map((n) => n - 1) };
    }
    return { kind: 'page', index: entry - 1 };
  });

  return { pages, gaps };
}

/**
 * Structural equality for two page windows. The `equal` fn for the segment's
 * `computed()` - keeps the reference stable across recomputes that yield an
 * identical window, so downstream `@for` does not churn.
 */
export function pageWindowEqual(a: PageWindow, b: PageWindow): boolean {
  if (a === b) {
    return true;
  }
  if (a.gaps !== b.gaps || a.pages.length !== b.pages.length) {
    return false;
  }
  for (let i = 0; i < a.pages.length; i++) {
    const pa = a.pages[i];
    const pb = b.pages[i];
    if (pa.kind !== pb.kind) {
      return false;
    }
    if (pa.kind === 'page' && pb.kind === 'page') {
      if (pa.index !== pb.index) {
        return false;
      }
    } else if (pa.kind === 'gap' && pb.kind === 'gap') {
      if (pa.hidden.length !== pb.hidden.length || pa.hidden.some((h, j) => h !== pb.hidden[j])) {
        return false;
      }
    }
  }
  return true;
}
