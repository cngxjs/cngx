import {
  afterNextRender,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  type Signal,
} from '@angular/core';

/** One element the mirror reads, named by its visible role in the demo. */
export interface SrMirrorTarget {
  /** Row label in the box, e.g. `main`, `caret`, `chip`. */
  readonly label: string;
  /** CSS selector, resolved inside the story host. The first match is read. */
  readonly selector: string;
}

/** What the accessibility layer exposes for one target element. */
export interface SrMirrorRow {
  readonly label: string;
  /** Explicit `role`, or the implicit one of the tag (`button` for `<button>`). */
  readonly role: string;
  readonly name: string;
  readonly description: string;
  /** `aria-disabled` value, `native` for the `disabled` attribute, or `-`. */
  readonly disabled: string;
  readonly busy: string;
  /** `aria-haspopup` and `aria-expanded`, or `null` when the element has neither. */
  readonly popup: string | null;
}

/** One text a polite or assertive live region received. */
export interface SrMirrorAnnouncement {
  readonly n: number;
  readonly text: string;
}

export interface SrMirror {
  /** One row per target that is currently rendered. */
  readonly rows: Signal<readonly SrMirrorRow[]>;
  /** The last five texts written to a live region in the story, newest last. */
  readonly heard: Signal<readonly SrMirrorAnnouncement[]>;
}

const BOX_SELECTOR = '.cngx-ex-sr-output';

const WATCHED_ATTRIBUTES = [
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-disabled',
  'aria-busy',
  'aria-expanded',
  'aria-haspopup',
  'aria-hidden',
  'disabled',
  'hidden',
  'role',
];

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();

const isHiddenNode = (el: Element): boolean =>
  el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden');

/** Text content without `aria-hidden="true"` and `hidden` subtrees. */
function visibleText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (!(node instanceof Element) || isHiddenNode(node)) {
    return '';
  }
  return Array.from(node.childNodes, visibleText).join('');
}

/**
 * Text of the elements an IDREF list points at. A directly referenced hidden
 * node still contributes its text (accname 1.2, step 2A).
 */
function referencedText(el: Element, attribute: string): string {
  const ids = (el.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
  const doc = el.ownerDocument;
  const texts = ids.map((id) => {
    const target = doc.getElementById(id);
    if (!target) {
      return '';
    }
    return isHiddenNode(target) ? (target.textContent ?? '') : visibleText(target);
  });
  return collapse(texts.join(' '));
}

/** Approximation of the accessible name: labelledby, then aria-label, then content. */
function approximateName(el: Element): string {
  if (el.hasAttribute('aria-labelledby')) {
    const labelled = referencedText(el, 'aria-labelledby');
    if (labelled !== '') {
      return labelled;
    }
  }
  const label = collapse(el.getAttribute('aria-label') ?? '');
  if (label !== '') {
    return label;
  }
  return collapse(visibleText(el));
}

function implicitRole(el: Element): string {
  if (el.tagName === 'BUTTON') {
    return 'button';
  }
  if (el.tagName === 'A' && el.hasAttribute('href')) {
    return 'link';
  }
  return el.tagName.toLowerCase();
}

function readRow(target: SrMirrorTarget, el: Element): SrMirrorRow {
  const description = referencedText(el, 'aria-describedby');
  const haspopup = el.getAttribute('aria-haspopup');
  const expanded = el.getAttribute('aria-expanded');
  const popupParts = [
    haspopup === null ? null : `haspopup=${haspopup}`,
    expanded === null ? null : `expanded=${expanded}`,
  ].filter((part) => part !== null);
  const nativeDisabled = el.hasAttribute('disabled') ? 'native' : '-';
  return {
    label: target.label,
    role: el.getAttribute('role') ?? implicitRole(el),
    name: approximateName(el),
    description: description === '' ? '-' : description,
    disabled: el.getAttribute('aria-disabled') ?? nativeDisabled,
    busy: el.getAttribute('aria-busy') ?? '-',
    popup: popupParts.length > 0 ? popupParts.join(', ') : null,
  };
}

/**
 * Demo chrome for the "Screen reader hears" box: mirrors what the
 * accessibility layer exposes for each target (role, an approximated name,
 * the resolved description, aria-disabled, aria-busy, popup state) and logs
 * live-region writes, live through a MutationObserver on the story host.
 * Call it in a field initializer of the story component.
 */
export function mirrorScreenReader(targets: readonly SrMirrorTarget[]): SrMirror {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  const rows = signal<readonly SrMirrorRow[]>([]);
  const heard = signal<readonly SrMirrorAnnouncement[]>([]);
  let rowsKey = '';

  const readRows = (): void => {
    const next = targets.flatMap((target) => {
      const el = host.querySelector(target.selector);
      return el ? [readRow(target, el)] : [];
    });
    const key = JSON.stringify(next);
    if (key === rowsKey) {
      return;
    }
    rowsKey = key;
    rows.set(next);
  };

  afterNextRender(() => {
    const lastText = new WeakMap<Element, string>();
    let count = 0;
    const logRegion = (region: Element): void => {
      const text = collapse(region.textContent ?? '');
      if (text === lastText.get(region)) {
        return;
      }
      lastText.set(region, text);
      if (text === '') {
        return;
      }
      count += 1;
      const entry = { n: count, text: `"${text}"` };
      heard.update((list) => [...list, entry].slice(-5));
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const el =
          record.target instanceof Element ? record.target : record.target.parentElement;
        if (!el || el.closest(BOX_SELECTOR)) {
          continue;
        }
        const region = el.closest('[aria-live]');
        if (region && host.contains(region)) {
          logRegion(region);
        }
      }
      readRows();
    });
    observer.observe(host, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRIBUTES,
    });
    readRows();
    destroyRef.onDestroy(() => observer.disconnect());
  });

  return { rows: rows.asReadonly(), heard: heard.asReadonly() };
}
