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
 *   change (`role` or `aria-live` set later).
 *
 * @internal
 */
export type CngxAnnouncementOrigin = 'mutation' | 'insertion' | 'became-live';

/**
 * One text a live region exposed, as observed in the DOM.
 *
 * @internal
 */
export interface CngxRecordedAnnouncement {
  /** `Date.now()` when the observer saw the write. */
  readonly time: number;
  /** Whitespace-collapsed text: the whole region when atomic, else the added text. */
  readonly text: string;
  readonly politeness: 'polite' | 'assertive';
  readonly role: string | null;
  /** The region or an ancestor carried `aria-busy="true"` at write time. */
  readonly busy: boolean;
  readonly suppressedBy: CngxAnnouncementSuppression | null;
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
  clear(): void;
  destroy(): void;
}

/** @internal */
interface RegionState {
  lastText: string;
}

/** @internal */
const DEFAULT_LIMIT = 200;

/** @internal */
const LIVE_ROLES = new Set(['status', 'alert', 'log']);

/** @internal */
const ATOMIC_ROLES = new Set(['status', 'alert']);

/** @internal */
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE']);

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
 * descendants is left out, as AT leaves it out.
 *
 * Known limits:
 * - no layout-based visibility (`display:none`, `visibility:hidden`); jsdom
 *   has no layout, so such a write records `suppressedBy: null`;
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

  const record = (region: Element, text: string, origin: CngxAnnouncementOrigin): void => {
    const entry: CngxRecordedAnnouncement = {
      time: Date.now(),
      text,
      politeness: politenessOf(region),
      role: region.getAttribute('role'),
      busy: region.closest('[aria-busy="true"]') !== null,
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
    regions.set(region, { lastText: text });
    if (text !== '') {
      record(region, text, origin);
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
    const added = new Map<Element, string[]>();
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
      const texts = added.get(region) ?? [];
      if (rec.type === 'characterData') {
        texts.push(rec.target.textContent ?? '');
      } else {
        for (const node of Array.from(rec.addedNodes)) {
          texts.push(readText(node, true));
        }
      }
      added.set(region, texts);
    });

    for (const [region, texts] of added) {
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
      const text = isAtomic(region) ? current : normalise(texts.join(' '));
      if (text !== '') {
        record(region, text, 'mutation');
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
    regions.set(region, { lastText: readText(region, false) });
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
 * out the given nodes and their subtrees.
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
    for (const child of Array.from(current.childNodes)) {
      walk(child, false);
    }
  };
  walk(node, true);
  return normalise(parts.join(''));
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
