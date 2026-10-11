import { signal, type Signal } from '@angular/core';

/**
 * Why assistive technology would not speak a recorded write, judged from
 * attributes at write time. `null` means nothing attribute-based suppresses it.
 *
 * @internal
 */
export type CngxAnnouncementSuppression = 'hidden' | 'aria-hidden' | 'inert' | 'aria-modal';

/**
 * How a recorded text reached its region:
 * - `'mutation'`: text changed inside a region that was already live;
 * - `'insertion'`: the region was inserted already holding text;
 * - `'became-live'`: an element holding text became live through an attribute
 *   change (`role` or `aria-live` set later);
 * - `'busy-cleared'`: `aria-busy` cleared on the region or an ancestor after
 *   text was written while busy; the entry holds what AT reads after the flip.
 *
 * @internal
 */
export type CngxAnnouncementOrigin = 'mutation' | 'insertion' | 'became-live' | 'busy-cleared';

/**
 * One text a live region exposed, as observed in the DOM.
 *
 * @internal
 */
export interface CngxRecordedAnnouncement {
  /** `Date.now()` when the observer saw the write. */
  readonly time: number;
  /**
   * Whitespace-collapsed text: the whole region when atomic, else the added
   * text. Text of a block-level element (by HTML default display), a `<br>`
   * or a custom element reads as a separate word; inline text concatenates.
   */
  readonly text: string;
  readonly politeness: 'polite' | 'assertive';
  readonly role: string | null;
  /**
   * The region or an ancestor carried `aria-busy="true"` when the observer
   * saw the write. Always `false` on a `'busy-cleared'` entry.
   */
  readonly busy: boolean;
  readonly suppressedBy: CngxAnnouncementSuppression | null;
  /**
   * How the text reached the region. A write under `aria-busy` records
   * `busy: true`; the text AT reads once busy clears follows as a separate
   * `'busy-cleared'` entry.
   */
  readonly origin: CngxAnnouncementOrigin;
  readonly region: Element;
  readonly owner: string | null;
}

/**
 * Options for {@link createAnnouncementRecorder}.
 *
 * @internal
 */
export interface CngxAnnouncementRecorderOptions {
  /** Subtree to observe. Defaults to the global `document`. */
  readonly root?: Node;
  /** Maximum entries kept; the oldest are dropped first. Defaults to 200. */
  readonly limit?: number;
  /** Names the owner of a region. Defaults to the owning Angular component's class name. */
  readonly owner?: (region: Element) => string | null;
}

/**
 * The handle {@link createAnnouncementRecorder} returns.
 *
 * @internal
 */
export interface CngxAnnouncementRecorder {
  readonly entries: Signal<readonly CngxRecordedAnnouncement[]>;
  /**
   * Empties `entries`. Region state is kept, so a busy flip after `clear()`
   * still records text written while busy before it.
   */
  clear(): void;
  destroy(): void;
}

/** @internal */
interface RegionState {
  lastText: string;
  /** Nodes written while busy since the last non-busy entry; the flip reads their current text. */
  deferred: Set<Node>;
}

/** @internal */
const DEFAULT_LIMIT = 200;

/** @internal */
const LIVE_ROLES = new Set(['status', 'alert', 'log']);

/** @internal */
const ATOMIC_ROLES = new Set(['status', 'alert']);

/** @internal */
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE']);

/**
 * HTML local names whose default display is not inline (`block`,
 * `list-item`, `table-*`) plus `br`. Their text reads as a separate word;
 * custom elements (local name with `-`) are treated the same without being
 * listed. Matched in the HTML namespace only, so SVG / MathML names with a
 * `-` (`font-face`, `annotation-xml`) do not separate.
 *
 * @internal
 */
const SEPARATING_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'caption',
  'center',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'legend',
  'li',
  'main',
  'menu',
  'nav',
  'ol',
  'optgroup',
  'option',
  'p',
  'pre',
  'search',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

/** @internal */
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/** @internal */
const OBSERVED_ATTRIBUTES = [
  'aria-live',
  'role',
  'aria-atomic',
  'aria-busy',
  'hidden',
  'aria-hidden',
  'inert',
  'aria-modal',
  'open',
];

/** @internal */
const CANDIDATE_SELECTOR = '[aria-live],[role]';

/**
 * Records every text a live region exposes, by observing the DOM instead of
 * hooking the code that writes it. Covers `CngxLiveAnnouncer`,
 * `[cngxLiveRegion]` and every template region that bypasses them, with no
 * change at the writing site.
 *
 * A region is an element with `aria-live="polite|assertive"`, or with role
 * `status` / `alert` / `log` and no `aria-live="off"`. Regions are discovered
 * at start and whenever they are inserted or gain the attributes; one that
 * stops being live is dropped. Text present at start is not recorded.
 *
 * Every non-empty text a region exposes is recorded; nothing AT might skip
 * is dropped. Instead each entry carries the facts a caller needs to judge
 * it: `origin`, `busy`, and `suppressedBy` (`hidden`, `aria-hidden` or
 * `inert` on the region or an ancestor, or an open `aria-modal="true"`
 * element the region sits outside of). Clearing a region records nothing,
 * but lets an identical next write count again; an identical write without a
 * clear is one entry. Atomic regions (`aria-atomic="true"`, or role `status`
 * / `alert` without `aria-atomic="false"`) record their whole text, others
 * only the added text. Text inside `hidden` or `aria-hidden="true"`
 * descendants is left out, as AT leaves it out. Text of adjacent block-level
 * elements is separated by a space, decided by tag (HTML default display not
 * inline, plus `<br>` and every custom element), so `<div>Upload failed</div>
 * <div>Alert dismissed</div>` records `'Upload failed Alert dismissed'` while
 * `<strong>3</strong> results` stays `'3 results'`.
 *
 * A write under `aria-busy="true"` (on the region or an ancestor) records
 * `busy: true`. When busy clears and the region's last entry was such a
 * deferred write, the recorder adds a `'busy-cleared'` entry with what AT
 * reads then: an atomic region's whole current text, a non-atomic region's
 * text written while busy that it still holds (earlier history is not
 * repeated; removed or overwritten text is left out). A write landing in the
 * same observer batch as the flip joins that entry; with nothing deferred
 * before it, it records one non-busy `'mutation'` entry instead.
 *
 * Known limits:
 * - no layout-based visibility (`display:none`, `visibility:hidden`); jsdom
 *   has no layout, so such a write records `suppressedBy: null`;
 * - the separator follows the tag, not computed style: an inline tag styled
 *   `display: block` still concatenates with its neighbour, and an inline
 *   custom element gains a space (`Inbox<x-count>3</x-count>` records
 *   `Inbox 3`, where browsers compute `Inbox3`);
 * - a non-atomic `'busy-cleared'` entry joins its texts in write order, like
 *   the mutation path; a node prepended or inserted before earlier busy
 *   writes therefore reads out of DOM order;
 * - a native `showModal()` dialog without `aria-modal` is not seen as modal;
 * - regions inside shadow roots are not observed;
 * - writes are seen when the `MutationObserver` callback runs (a microtask),
 *   and `CngxLiveAnnouncer` writes 16 ms after `announce()`, so a test
 *   advances timers and awaits a microtask before reading `entries`.
 *
 * ```typescript
 * const recorder = createAnnouncementRecorder();
 * announcer.announce('Saved');
 * vi.advanceTimersByTime(16);
 * await Promise.resolve();
 * recorder.entries(); // [{ text: 'Saved', politeness: 'polite', ... }]
 * recorder.destroy();
 * ```
 *
 * @internal
 */
export function createAnnouncementRecorder(
  options: CngxAnnouncementRecorderOptions = {},
): CngxAnnouncementRecorder {
  const limit = Math.max(1, options.limit ?? DEFAULT_LIMIT);
  const resolveOwner = options.owner ?? owningComponentName;
  const entries = signal<readonly CngxRecordedAnnouncement[]>([]);
  const regions = new Map<Element, RegionState>();
  const root = options.root ?? globalThis.document;
  let observer: MutationObserver | null = null;

  const recorder: CngxAnnouncementRecorder & { readonly [Symbol.toStringTag]: string } = {
    entries: entries.asReadonly(),
    clear: () => entries.set([]),
    destroy: () => {
      observer?.takeRecords();
      observer?.disconnect();
      observer = null;
      regions.clear();
    },
    [Symbol.toStringTag]: 'cngx-dev:recorder',
  };

  if (!root || typeof MutationObserver === 'undefined') {
    return recorder;
  }

  const record = (
    region: Element,
    text: string,
    origin: CngxAnnouncementOrigin,
    nodes: readonly Node[],
  ): void => {
    const busy = isBusy(region);
    const state = regions.get(region);
    if (state && busy) {
      for (const node of nodes) {
        state.deferred.add(node);
      }
      // A region that never leaves busy must not grow without bound.
      const excess = state.deferred.size - limit;
      if (excess > 0) {
        for (const oldest of [...state.deferred].slice(0, excess)) {
          state.deferred.delete(oldest);
        }
      }
    } else if (state) {
      state.deferred.clear();
    }
    const entry: CngxRecordedAnnouncement = {
      time: Date.now(),
      text,
      politeness: politenessOf(region),
      role: region.getAttribute('role'),
      busy,
      suppressedBy: suppressionOf(region),
      origin,
      region,
      owner: resolveOwner(region),
    };
    entries.update((list) => {
      const next = [...list, entry];
      return next.length > limit ? next.slice(next.length - limit) : next;
    });
  };

  // A region that appeared in this batch at record `since`. The text it held
  // then is its current text minus what later records in the batch appended.
  // Under fake timers a later write (CngxLiveAnnouncer's 16 ms write after
  // it inserts an empty region) shares the batch, but a browser runs it as a
  // separate task, so it must still read as a mutation. When a later record
  // removed or rewrote text inside the region, the earlier state is not
  // recoverable, so the whole batch counts toward the appearance. Returns the
  // record index up to which the appearance accounts for the region's changes.
  const register = (
    region: Element,
    origin: 'insertion' | 'became-live',
    since: number,
    records: readonly MutationRecord[],
  ): number => {
    const appended = new Set<Node>();
    let rewritten = false;
    for (let i = since + 1; i < records.length && !rewritten; i++) {
      const rec = records[i];
      if (rec.type === 'attributes' || !region.contains(rec.target)) {
        continue;
      }
      if (rec.type === 'characterData' || rec.removedNodes.length > 0) {
        rewritten = true;
        continue;
      }
      for (const node of Array.from(rec.addedNodes)) {
        appended.add(node);
      }
    }
    const text = readText(region, false, rewritten ? undefined : appended);
    regions.set(region, { lastText: text, deferred: new Set() });
    if (text !== '') {
      record(region, text, origin, [region]);
    }
    return rewritten ? records.length : since;
  };

  const closestRegion = (node: Node): Element | null => {
    let current: Element | null = node instanceof Element ? node : node.parentElement;
    while (current) {
      if (regions.has(current)) {
        return current;
      }
      if (current === root) {
        return null;
      }
      current = current.parentElement;
    }
    return null;
  };

  const handle = (records: readonly MutationRecord[]): void => {
    const inserted = new Map<Element, number>();
    const becameLive = new Map<Element, number>();
    const coveredUpTo = new Map<Element, number>();
    const added = new Map<Element, { texts: string[]; nodes: Node[] }>();
    let removedAny = false;

    records.forEach((rec, index) => {
      if (rec.type !== 'childList') {
        return;
      }
      for (const node of Array.from(rec.addedNodes)) {
        if (node instanceof Element && root.contains(node)) {
          for (const region of liveRegionsIn(node)) {
            if (!inserted.has(region)) {
              inserted.set(region, index);
            }
          }
        }
      }
      removedAny ||= rec.removedNodes.length > 0;
    });

    records.forEach((rec, index) => {
      if (rec.type !== 'attributes' || !(rec.target instanceof Element)) {
        return;
      }
      const target = rec.target;
      const live = target.isConnected && isLive(target);
      if (!live) {
        regions.delete(target);
        becameLive.delete(target);
        return;
      }
      if (!regions.has(target) && !inserted.has(target) && !becameLive.has(target)) {
        becameLive.set(target, index);
      }
    });

    for (const [region, since] of inserted) {
      coveredUpTo.set(region, register(region, 'insertion', since, records));
    }
    for (const [region, since] of becameLive) {
      coveredUpTo.set(region, register(region, 'became-live', since, records));
    }

    records.forEach((rec, index) => {
      if (rec.type === 'attributes') {
        return;
      }
      const region = closestRegion(rec.target);
      if (!region || index <= (coveredUpTo.get(region) ?? -1)) {
        return;
      }
      const additions = added.get(region) ?? { texts: [], nodes: [] };
      if (rec.type === 'characterData') {
        additions.texts.push(rec.target.textContent ?? '');
        additions.nodes.push(rec.target);
      } else {
        for (const node of Array.from(rec.addedNodes)) {
          additions.texts.push(readText(node, true));
          additions.nodes.push(node);
        }
      }
      added.set(region, additions);
    });

    for (const [region, { texts, nodes }] of added) {
      const state = regions.get(region);
      if (!state) {
        continue;
      }
      const current = readText(region, false);
      const previous = state.lastText;
      state.lastText = current;
      const hadAdditions = texts.some((text) => text.trim() !== '');
      if (current === '' || current === previous || !hadAdditions) {
        continue;
      }
      // A non-busy write onto text deferred in an earlier batch is the
      // moment AT reads both, so it records one busy-cleared entry.
      const flushes = state.deferred.size > 0 && !isBusy(region);
      let text = normalise(texts.join(' '));
      if (isAtomic(region)) {
        text = current;
      } else if (flushes) {
        text = presentText(region, [...state.deferred, ...nodes]);
      }
      if (text !== '') {
        record(region, text, flushes ? 'busy-cleared' : 'mutation', nodes);
      }
    }

    // Runs after the mutation pass, which already flushed every region
    // written in this batch.
    const cleared: Element[] = [];
    for (const rec of records) {
      if (
        rec.attributeName === 'aria-busy' &&
        rec.target instanceof Element &&
        rec.target.getAttribute('aria-busy') !== 'true'
      ) {
        cleared.push(rec.target);
      }
    }
    for (const [region, state] of regions) {
      if (state.deferred.size === 0 || isBusy(region)) {
        continue;
      }
      // The purge below has not run yet; a region removed in this batch is
      // still in the map but is never read.
      if (!region.isConnected || !root.contains(region)) {
        continue;
      }
      if (!cleared.some((target) => target.contains(region))) {
        continue;
      }
      const text = isAtomic(region)
        ? readText(region, false)
        : presentText(region, [...state.deferred]);
      state.deferred.clear();
      if (text !== '') {
        record(region, text, 'busy-cleared', []);
      }
    }

    if (removedAny) {
      for (const region of regions.keys()) {
        if (!region.isConnected || !root.contains(region)) {
          regions.delete(region);
        }
      }
    }
  };

  for (const region of liveRegionsIn(root)) {
    regions.set(region, { lastText: readText(region, false), deferred: new Set() });
  }

  observer = new MutationObserver(handle);
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: OBSERVED_ATTRIBUTES,
  });

  return recorder;
}

/** @internal */
function isLive(el: Element): boolean {
  const live = el.getAttribute('aria-live');
  if (live === 'polite' || live === 'assertive') {
    return true;
  }
  if (live === 'off') {
    return false;
  }
  return LIVE_ROLES.has(primaryRole(el) ?? '');
}

/** @internal */
function primaryRole(el: Element): string | null {
  const role = el.getAttribute('role')?.trim().split(/\s+/)[0];
  if (!role) {
    return null;
  }
  return role;
}

/** @internal */
function politenessOf(el: Element): 'polite' | 'assertive' {
  const live = el.getAttribute('aria-live');
  if (live === 'polite' || live === 'assertive') {
    return live;
  }
  return primaryRole(el) === 'alert' ? 'assertive' : 'polite';
}

/** @internal */
function isAtomic(el: Element): boolean {
  const atomic = el.getAttribute('aria-atomic');
  if (atomic === 'true' || atomic === 'false') {
    return atomic === 'true';
  }
  return ATOMIC_ROLES.has(primaryRole(el) ?? '');
}

/** @internal */
function suppressionOf(region: Element): CngxAnnouncementSuppression | null {
  if (region.closest('[hidden]')) {
    return 'hidden';
  }
  if (region.closest('[aria-hidden="true"]')) {
    return 'aria-hidden';
  }
  if (region.closest('[inert]')) {
    return 'inert';
  }
  const modals = Array.from(region.ownerDocument.querySelectorAll('[aria-modal="true"]')).filter(
    isOpenModal,
  );
  if (modals.length > 0 && !modals.some((modal) => modal.contains(region))) {
    return 'aria-modal';
  }
  return null;
}

/** @internal */
function isOpenModal(el: Element): boolean {
  if (el.tagName === 'DIALOG' && !el.hasAttribute('open')) {
    return false;
  }
  return el.closest('[hidden],[inert]') === null;
}

/** @internal */
function liveRegionsIn(node: Node): Element[] {
  const found: Element[] = [];
  if (node instanceof Element && isLive(node)) {
    found.push(node);
  }
  if ('querySelectorAll' in node) {
    for (const el of Array.from((node as ParentNode).querySelectorAll(CANDIDATE_SELECTOR))) {
      if (isLive(el)) {
        found.push(el);
      }
    }
  }
  return found;
}

/**
 * Text AT would read from `node`: text nodes, minus `hidden` /
 * `aria-hidden="true"` descendants and script, style and template content.
 * `excludeSelf` applies the same exclusion to `node` itself; `skip` leaves
 * out the given nodes and their subtrees. A separating element's text is
 * padded with spaces, which `normalise` collapses.
 *
 * @internal
 */
function readText(node: Node, excludeSelf: boolean, skip?: ReadonlySet<Node>): string {
  const parts: string[] = [];
  const walk = (current: Node, isSelf: boolean): void => {
    if (skip?.has(current)) {
      return;
    }
    if (current.nodeType === Node.TEXT_NODE) {
      parts.push(current.textContent ?? '');
      return;
    }
    if (!(current instanceof Element)) {
      return;
    }
    if ((!isSelf || excludeSelf) && isExcluded(current)) {
      return;
    }
    const separates = isSeparating(current);
    if (separates) {
      parts.push(' ');
    }
    for (const child of Array.from(current.childNodes)) {
      walk(child, false);
    }
    if (separates) {
      parts.push(' ');
    }
  };
  walk(node, true);
  return normalise(parts.join(''));
}

/** @internal */
function isBusy(region: Element): boolean {
  return region.closest('[aria-busy="true"]') !== null;
}

/**
 * Text of the given nodes still inside `region`, each read once: a node
 * inside another listed node is covered by it. Removed or overwritten nodes
 * contribute nothing, so the result is what the region holds now.
 *
 * @internal
 */
function presentText(region: Element, nodes: readonly Node[]): string {
  const present = [...new Set(nodes)].filter((node) => node.isConnected && region.contains(node));
  const outermost = present.filter(
    (node) => !present.some((other) => other !== node && other.contains(node)),
  );
  return normalise(outermost.map((node) => readText(node, node !== region)).join(' '));
}

/** @internal */
function isExcluded(el: Element): boolean {
  return (
    SKIPPED_TAGS.has(el.tagName) ||
    el.hasAttribute('hidden') ||
    el.getAttribute('aria-hidden') === 'true'
  );
}

/** @internal */
function isSeparating(el: Element): boolean {
  if (el.namespaceURI !== HTML_NAMESPACE) {
    return false;
  }
  return SEPARATING_TAGS.has(el.localName) || el.localName.includes('-');
}

/** @internal */
function normalise(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** @internal */
function owningComponentName(region: Element): string | null {
  const ng = (globalThis as { ng?: { getOwningComponent?: (el: Element) => unknown } }).ng;
  if (typeof ng?.getOwningComponent !== 'function') {
    return null;
  }
  try {
    const component = ng.getOwningComponent(region);
    if (typeof component !== 'object' || component === null) {
      return null;
    }
    return component.constructor.name || null;
  } catch {
    return null;
  }
}
