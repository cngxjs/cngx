import { afterEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';

import { KINDS, cleanupRoots, log, mount, type Mount } from '../shared/__test-helpers/review-probe-host';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

const f = (m: Mount) =>
  `model=${JSON.stringify(m.readModel())} events=${m.events
    .map((e) => e.name + ((e.payload as any)?.action ? '(' + (e.payload as any).action + ')' : ''))
    .filter((n) => !n.startsWith('openedChange') && !n.startsWith('stateChange'))
    .join(' ')} spoken=${JSON.stringify(m.spoken.map((s) => s.politeness[0] + ':' + s.message.replace(/[⁨⁩]/g, '')))}`;

const altRight = (m: Mount) => {
  const chip = m.el.querySelector<HTMLElement>('[data-reorder-index="0"]')!;
  chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true }));
  m.settle();
};

/**
 * P13 (review 2026-11-03, A22 / H4, OD2). A reorder emits `reordered` /
 * `selectionChange` and speaks "moved" only when the commit succeeds - in both
 * modes, like every other commit kind. On base the optimistic mode emits and
 * announces before the commit settles (and never re-emits on the retried
 * success); the pessimistic mode already holds. OD2 in Phase 2 flips optimistic.
 */
describe('P13 reorder rejected', () => {
  for (const mode of ['optimistic', 'pessimistic'] as const) {
    it(mode, () => {
      const pend: Subject<unknown>[] = [];
      const m = mount(KINDS['reorder'], {
        mode,
        initial: ['red', 'green', 'blue'],
        commit: () => { const s = new Subject<unknown>(); pend.push(s); return s; },
      });
      const reordered = () => m.events.filter((e) => e.name === 'reordered').length;
      const selReorder = () => m.events.filter((e) => e.name === 'selectionChange' && (e.payload as any)?.action === 'reorder').length;
      const moved = () => m.spoken.filter((s) => /moved/i.test(s.message)).length;

      altRight(m);
      log(`P13 ${mode} pending: ${f(m)}`);
      // OD2: nothing is emitted or announced before the commit settles.
      expect(reordered()).toBe(0);
      expect(selReorder()).toBe(0);
      expect(moved()).toBe(0);

      pend[0].error(new Error('reorder denied')); m.settle();
      log(`P13 ${mode} rejection: ${f(m)}`);
      // A rejected reorder stays silent on the success channels.
      expect(reordered()).toBe(0);
      expect(selReorder()).toBe(0);
      expect(moved()).toBe(0);

      m.open();
      (m.el.querySelector('.cngx-select__commit-error .cngx-select__error-retry') as HTMLElement | null)?.click();
      m.settle();
      pend[1]?.next(undefined); pend[1]?.complete(); m.settle();
      log(`P13 ${mode} retry resolved: ${f(m)}`);
      // Exactly one emit of each, once the retried commit resolves.
      expect(reordered()).toBe(1);
      expect(selReorder()).toBe(1);
      expect(moved()).toBe(1);
    });
  }
});
