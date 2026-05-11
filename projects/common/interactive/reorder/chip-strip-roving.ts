import {
  effect,
  InjectionToken,
  signal,
  untracked,
  type Signal,
} from '@angular/core';

/**
 * Configuration for {@link createChipStripRoving}.
 *
 * @category interactive
 */
export interface CngxChipStripRovingOptions {
  /**
   * Reactive length of the chip list. When this count shrinks below
   * `activeIndex`, the controller clamps the active index so focus
   * never dangles at a removed position.
   */
  readonly count: Signal<number>;
  /**
   * Element hosting the chip wrappers. Read lazily at `focusAt()` time
   * so the controller doesn't depend on view-init timing. `null` is a
   * legitimate idle state — the controller becomes a no-op focuser.
   */
  readonly container: Signal<HTMLElement | null | undefined>;
  /**
   * Attribute name used to identify each chip wrapper. Combined with
   * the active index into a `[attr="index"]` query. Defaults to
   * `'data-reorder-index'` (matches {@link CngxReorder}'s own item
   * contract, so a single DOM hook covers both the reorder directive
   * and this roving controller).
   */
  readonly indexAttr?: string;
}

/**
 * Controller produced by {@link createChipStripRoving}. Exposes an
 * `activeIndex` signal the consumer binds into
 * `[attr.tabindex]="i === roving.activeIndex() ? 0 : -1"`, plus a
 * keyboard handler and imperative focus helpers.
 *
 * @category interactive
 */
export interface CngxChipStripRovingController {
  /**
   * Current roving position. Clamped to `[0, count - 1]`; resets to
   * `0` when `count` drops to `0`.
   */
  readonly activeIndex: Signal<number>;
  /**
   * Announce that a chip at `index` received focus — typically wired
   * on the chip wrapper's `(focus)`. Idempotent; keeps the active
   * index in sync with whatever the user's focus sequence did (mouse
   * click, Tab into the strip, etc.).
   */
  markFocused(index: number): void;
  /**
   * Keyboard handler for the chip-strip container. Handles plain
   * `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown` / `Home` /
   * `End` — moves `activeIndex` and focuses the chip at the new
   * position. Events carrying any of `Ctrl` / `Alt` / `Meta` are
   * ignored (modifier-gated keys belong to the paired
   * {@link CngxReorder} directive).
   */
  handleKeydown(event: KeyboardEvent): void;
  /**
   * Imperatively set the active index and focus the corresponding
   * chip. Used by consumers to restore focus after a reorder settles
   * on a new position.
   */
  focusAt(index: number): void;
  /**
   * Imperatively set the active index without moving focus. Useful
   * during a reorder's transient pre-render phase where the DOM has
   * not yet re-ordered the chips.
   */
  setActive(index: number): void;
}

/**
 * Signature of the factory behind {@link CNGX_CHIP_STRIP_ROVING_FACTORY}.
 *
 * @category interactive
 */
export type CngxChipStripRovingFactory = (
  opts: CngxChipStripRovingOptions,
) => CngxChipStripRovingController;

/**
 * Plain factory for the chip-strip roving-tabindex controller shared by
 * {@link CngxReorderableMultiSelect} today and by any future
 * reorder-aware chip trigger (e.g. a tag-input with user-defined
 * ordering). Extracted from the component so the same focus-state
 * machine doesn't reappear inline in every variant.
 *
 * **Why not `CngxRovingTabindex`.** That directive uses a host
 * `(keydown)` listener that doesn't check modifier keys. Co-located
 * with {@link CngxReorder} on the same chip-strip element it
 * double-fires on `Ctrl+Arrow` (the reorder emits, then roving also
 * moves focus — racy). This controller deliberately skips
 * modifier-pressed events so the paired reorder directive owns that
 * gesture.
 *
 * **Injection context.** Must be called in an injection context
 * (component constructor / field init) because it installs an
 * `effect()` for the active-index clamp on count shrink.
 *
 * @category interactive
 */
export function createChipStripRoving(
  opts: CngxChipStripRovingOptions,
): CngxChipStripRovingController {
  const attr = opts.indexAttr ?? 'data-reorder-index';
  const activeIndexState = signal<number>(0);

  // Clamp on count shrink — a removed-last-chip or clear-all must not
  // leave `activeIndex` pointing past the end. Reading the signal
  // inside `untracked()` avoids a self-dependency, so the effect's
  // only reactive dep is `count()`.
  effect(() => {
    const len = opts.count();
    untracked(() => {
      const current = activeIndexState();
      if (len === 0) {
        if (current !== 0) {
          activeIndexState.set(0);
        }
      } else if (current >= len) {
        activeIndexState.set(len - 1);
      }
    });
  });

  function focusAt(index: number): void {
    setActive(index);
    const root = opts.container();
    if (!root) {
      return;
    }
    const el = root.querySelector<HTMLElement>(`[${attr}="${index}"]`);
    el?.focus();
  }

  function setActive(index: number): void {
    activeIndexState.set(index);
  }

  function markFocused(index: number): void {
    activeIndexState.set(index);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    const count = opts.count();
    if (count === 0) {
      return;
    }
    const current = activeIndexState();
    let nextIdx: number;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIdx = Math.max(0, current - 1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        nextIdx = Math.min(count - 1, current + 1);
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (nextIdx === current) {
      return;
    }
    focusAt(nextIdx);
  }

  return {
    activeIndex: activeIndexState.asReadonly(),
    markFocused,
    handleKeydown,
    focusAt,
    setActive,
  };
}

/**
 * DI token resolving the factory used to instantiate a
 * {@link CngxChipStripRovingController}. Defaults to
 * {@link createChipStripRoving}; override via
 * `providers: [{ provide: CNGX_CHIP_STRIP_ROVING_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to install telemetry wrappers,
 * a controlled-from-outside focus mode, or a custom keyboard policy
 * without forking the reorderable component.
 *
 * Symmetrical to {@link CNGX_TREE_CONTROLLER_FACTORY} /
 * `CNGX_SELECTION_CONTROLLER_FACTORY`.
 *
 * @category interactive
 */
export const CNGX_CHIP_STRIP_ROVING_FACTORY =
  new InjectionToken<CngxChipStripRovingFactory>('CngxChipStripRovingFactory', {
    providedIn: 'root',
    factory: () => createChipStripRoving,
  });
