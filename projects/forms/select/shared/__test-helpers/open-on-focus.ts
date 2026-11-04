import { describe, expect, it } from 'vitest';

import { provideSelectConfig, withOpenOn } from '../config';

import { type Kind, mount } from './review-probe-host';

/**
 * Shared spec for the openOn-focus cascade (`project-openon-focus-click-toggle`).
 *
 * In a real browser a pointer press on a closed trigger fires `pointerdown`,
 * then `focus`, then `click`. With `openOn: 'focus'` or `'click+focus'` the
 * focus opens the panel; the click that follows must not toggle it straight
 * back closed. The target contract: after the full sequence the panel is open
 * and `openedChange` fired exactly once with `true`.
 *
 * @internal
 */
export function describeOpenOnFocusClick(kind: Kind): void {
  describe(`${kind.name}: openOn focus/click does not toggle itself closed`, () => {
    for (const mode of ['focus', 'click+focus'] as const) {
      it.fails(`${mode}: a pointerdown-focus-click sequence leaves the panel open`, () => {
        const m = mount(kind, { providers: [provideSelectConfig(withOpenOn(mode))] });
        const trigger = m.el.querySelector<HTMLElement>('.cngx-field-trigger');
        if (!trigger) {
          expect.fail(`no trigger for ${kind.name}`);
        }
        trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        trigger.dispatchEvent(new FocusEvent('focus'));
        m.settle();
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        m.settle();

        const opened = m.events.filter((e) => e.name === 'openedChange' && e.payload === true);
        expect(m.v.panelOpen(), `${kind.name} ${mode} panel open`).toBe(true);
        expect(opened.length, `${kind.name} ${mode} openedChange(true) count`).toBe(1);
      });
    }
  });
}
