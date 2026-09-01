import { effect, untracked, type Injector, type Signal } from '@angular/core';
import { resolveInlineStep, type CngxDirection } from '@cngx/core';

import type { CngxTabGroupHost, CngxTabHandle } from '../tab-group-host.token';

/**
 * Inputs to {@link createTabKeyboardNav}. The organism owns the DOM
 * handle and the presenter contract; the factory runs the APG tablist
 * keyboard model so the organism class stays under the LOC guard.
 * Sibling shape to `createTabDismissals`.
 *
 * @category common/tabs
 */
export interface CngxTabKeyboardNavOptions {
  readonly host: CngxTabGroupHost;
  readonly hostElement: HTMLElement;
  /**
   * Document writing direction. Flips the horizontal-arrow step under
   * `rtl` (APG); the vertical axis and Home/End stay direction-invariant.
   */
  readonly direction: Signal<CngxDirection>;
  /**
   * Enables the rejection focus-release effect. Under a pessimistic
   * commit, focus follows the intended target while the action is in
   * flight; a rejection keeps the roving stop on the origin, so
   * without the release the user is stranded on a `tabindex="-1"`
   * button. Omitted, the effect is skipped (headless usage).
   */
  readonly injector?: Injector;
}

/**
 * Resolved keyboard surface for `<cngx-tab-group>`'s tablist. The
 * organism holds this as one field; the template reads `tabTabindex`
 * for the roving stop and routes the tab buttons' `(keydown)` through
 * `handleKeydown`.
 *
 * @category common/tabs
 */
export interface CngxTabKeyboardNav {
  /**
   * Roving `tabindex` for a tab button: `0` for the selected tab, `-1`
   * for every other. Derived from `host.activeId()` (Pillar 1: a single
   * source, never a second index to keep in sync) so the active tab is
   * the group's lone tab stop and `Tab` always lands on it.
   */
  tabTabindex(tab: CngxTabHandle): 0 | -1;
  /**
   * APG tablist navigation: arrow keys (axis from orientation), Home,
   * and End move between tabs with disabled-skip + loop, activate the
   * target through `host.select()` (automatic activation), and move DOM
   * focus to it. Returns silently for any other key so the caller can
   * chain further handlers (e.g. Delete-to-close).
   */
  handleKeydown(event: KeyboardEvent): void;
}

/**
 * Level-2 helper implementing the WAI-ARIA APG tabs keyboard model for
 * `<cngx-tab-group>` with **automatic activation**: an arrow press moves
 * focus AND activates the target tab in one step, so focus and selection
 * never diverge. Keeps the keyboard logic off the organism class (LOC
 * guard) and out of a competing roving-tabindex state machine.
 *
 * Pillar 1 (Ableitung statt Verwaltung): the tab stop is derived from the
 * presenter's `activeId`, not managed as a second index. Pillar 2
 * (Kommunikation): activation routes through `host.select()`, which owns
 * disabled-skip, loop, commit gating, and the live-region announcement -
 * the keyboard layer adds only focus movement (a DOM concern the
 * presenter, living in `@cngx/common`, must not own).
 *
 * Navigation always originates from the active tab: under automatic
 * activation the focused tab is always the active one, so the clamped
 * active index is the correct origin.
 *
 * @category common/tabs
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/keyboard/tab-keyboard-nav.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroupPresenter, CngxTabGroup, createTabGroupAnnouncements
 */
export function createTabKeyboardNav(
  opts: CngxTabKeyboardNavOptions,
): CngxTabKeyboardNav {
  const clampedActive = (): number => {
    const len = opts.host.tabs().length;
    if (len === 0) {
      return 0;
    }
    return Math.max(0, Math.min(opts.host.activeIndex(), len - 1));
  };

  // Next enabled index in `direction`, honouring `loop`. Mirrors the
  // presenter's `selectNext`/`selectPrevious` geometry but returns the
  // resolved index so the caller can both activate and focus it.
  const step = (direction: 1 | -1): number | null => {
    const tabs = opts.host.tabs();
    const len = tabs.length;
    if (len === 0) {
      return null;
    }
    const loop = opts.host.loop();
    let idx = clampedActive() + direction;
    for (let i = 0; i < len; i++) {
      if (loop) {
        idx = ((idx % len) + len) % len;
      } else if (idx < 0 || idx >= len) {
        return null;
      }
      if (!tabs[idx].disabled()) {
        return idx;
      }
      idx += direction;
    }
    return null;
  };

  // First (direction 1) or last (direction -1) enabled tab, for Home/End.
  const edge = (direction: 1 | -1): number | null => {
    const tabs = opts.host.tabs();
    const len = tabs.length;
    if (direction === 1) {
      for (let i = 0; i < len; i++) {
        if (!tabs[i].disabled()) {
          return i;
        }
      }
    } else {
      for (let i = len - 1; i >= 0; i--) {
        if (!tabs[i].disabled()) {
          return i;
        }
      }
    }
    return null;
  };

  // Focus the tab button for the tab at `index`, keyed off the stable
  // tab id (the rendered `data-tab-id`) rather than a positional
  // `.cngx-tabs__tab[index]` lookup - so a skin that reorders or wraps
  // the tab buttons can't misdirect keyboard focus. `[role="tab"]` is
  // the APG contract every skin must honour, so it survives a class
  // rename too. The button already exists regardless of pending CD, so
  // focus is immediate and never waits on the activation's render.
  const focusTabAt = (index: number): void => {
    const id = opts.host.tabs()[index]?.id;
    if (id == null) {
      return;
    }
    const buttons = Array.from(
      opts.hostElement.querySelectorAll<HTMLElement>('[role="tab"]'),
    );
    buttons.find((button) => button.getAttribute('data-tab-id') === id)?.focus();
  };

  if (opts.injector) {
    effect(
      () => {
        if (opts.host.commitTransition.current() !== 'error') {
          return;
        }
        untracked(() => {
          // Only release focus that this tablist is actually holding on a
          // non-active tab button - never steal focus from elsewhere.
          const focused = document.activeElement;
          if (!(focused instanceof HTMLElement) || !opts.hostElement.contains(focused)) {
            return;
          }
          if (focused.getAttribute('role') !== 'tab') {
            return;
          }
          const activeId = opts.host.activeId();
          if (activeId === null || focused.getAttribute('data-tab-id') === activeId) {
            return;
          }
          const idx = opts.host.tabs().findIndex((tab) => tab.id === activeId);
          if (idx >= 0) {
            focusTabAt(idx);
          }
        });
      },
      { injector: opts.injector },
    );
  }

  return {
    tabTabindex: (tab) => (tab.id === opts.host.activeId() ? 0 : -1),
    handleKeydown: (event) => {
      const horizontal = opts.host.orientation() === 'horizontal';
      const inlineStep = (key: string): number | null => {
        if (!horizontal) {
          return null;
        }
        const dir = resolveInlineStep(key, opts.direction());
        return dir === null ? null : step(dir);
      };
      let target: number | null;
      switch (event.key) {
        case 'ArrowRight':
          target = inlineStep('ArrowRight');
          break;
        case 'ArrowLeft':
          target = inlineStep('ArrowLeft');
          break;
        case 'ArrowDown':
          target = horizontal ? null : step(1);
          break;
        case 'ArrowUp':
          target = horizontal ? null : step(-1);
          break;
        case 'Home':
          target = edge(1);
          break;
        case 'End':
          target = edge(-1);
          break;
        default:
          return;
      }
      if (target === null) {
        return;
      }
      event.preventDefault();
      // Automatic activation: select first (content + aria-selected +
      // announcement follow), then move focus to the same tab button.
      opts.host.select(target);
      focusTabAt(target);
    },
  };
}
