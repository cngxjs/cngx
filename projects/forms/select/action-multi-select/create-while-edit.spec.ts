import { afterEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';

import { KINDS, cleanupRoots, log, mount, type Mount } from '../shared/__test-helpers/review-probe-host';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

const OPTS = [{ value: 'red', label: 'Red' }, { value: 'green', label: 'Green' }, { value: 'blue', label: 'Blue' }];

const fmt = (m: Mount) =>
  `model=${JSON.stringify(m.readModel())} comp=${JSON.stringify((m.v as any).values())} events=${m.events
    .map((e) => e.name + ((e.payload as any)?.action ? '(' + (e.payload as any).action + ')' : ''))
    .filter((n) => !n.startsWith('openedChange') && !n.startsWith('stateChange'))
    .join(',')} spoken=${JSON.stringify(m.spoken.map((s) => s.message.replace(/[⁨⁩]/g, '')))}`;

function setup(withCommit: boolean) {
  const createSubj: Subject<unknown>[] = [];
  const toggleSubj: Subject<unknown>[] = [];
  const m = mount(KINDS['actionMulti'], {
    initial: ['red', 'green'],
    options: OPTS,
    noCommit: !withCommit,
    commit: () => { const s = new Subject<unknown>(); toggleSubj.push(s); return s; },
    extraInputs: '[quickCreateAction]="createFn"',
  });
  (m.h as any).createImpl = (term: string) => { const s = new Subject<unknown>(); createSubj.push(s); return s; };
  m.fixture.detectChanges();
  return { m, createSubj, toggleSubj };
}

/**
 * P12 (review 2026-11-03, A21 / H2 blocker, OD3). A quick-create that resolves
 * while other edits ran must merge its value into the *live* model, never into
 * the snapshot taken when the create was dispatched. On base, A/B/C/E resurrect
 * removed values or drop concurrent ones; D's final happens to coincide. OD3 in
 * Phase 2 merges into `untracked(this.values)` and flips A/B/C/E green.
 */
describe('P12 action-multi-select: create pending then other edits', () => {
  it.fails('A: chip removal during pending create, then create resolves', () => {
    const { m, createSubj } = setup(false);
    (m.v as any).actionCallbacks().commit({ label: 'Purple' }); m.settle();
    const opt = (m.v as any).core.flatOptions().find((o: any) => o.value === 'red');
    (m.v as any).chipRemoveFor(opt)(); m.settle();
    createSubj[0].next('purple'); createSubj[0].complete(); m.settle();
    log(`P12A ${fmt(m)}`);
    expect(m.readModel()).toEqual(['green', 'purple']);
  });

  it.fails('B: toggle other option during pending create, then create resolves', () => {
    const { m, createSubj } = setup(false);
    (m.v as any).actionCallbacks().commit({ label: 'Purple' }); m.settle();
    m.pickAt(2); // blue
    createSubj[0].next('purple'); createSubj[0].complete(); m.settle();
    log(`P12B ${fmt(m)}`);
    expect(m.readModel()).toEqual(['red', 'green', 'blue', 'purple']);
  });

  it.fails('C: with commitAction, chip removal pending + create pending, resolve in both orders', () => {
    const { m, createSubj, toggleSubj } = setup(true);
    (m.v as any).actionCallbacks().commit({ label: 'Purple' }); m.settle();
    const opt = (m.v as any).core.flatOptions().find((o: any) => o.value === 'red');
    (m.v as any).chipRemoveFor(opt)(); m.settle();
    createSubj[0].next('purple'); createSubj[0].complete(); m.settle();
    toggleSubj[0].next(undefined); toggleSubj[0].complete(); m.settle();
    log(`P12C ${fmt(m)}`);
    expect(m.readModel()).toEqual(['green', 'purple']);
  });

  it('D: removal rejected after create resolved', () => {
    const { m, createSubj, toggleSubj } = setup(true);
    (m.v as any).actionCallbacks().commit({ label: 'Purple' }); m.settle();
    const opt = (m.v as any).core.flatOptions().find((o: any) => o.value === 'red');
    (m.v as any).chipRemoveFor(opt)(); m.settle();
    createSubj[0].next('purple'); createSubj[0].complete(); m.settle();
    toggleSubj[0].error(new Error('nope')); m.settle();
    log(`P12D ${fmt(m)}`);
    expect(m.readModel()).toEqual(['red', 'green', 'purple']);
  });

  it.fails('E: clear during pending create', () => {
    const { m, createSubj } = setup(false);
    (m.v as any).actionCallbacks().commit({ label: 'Purple' }); m.settle();
    m.clear();
    createSubj[0].next('purple'); createSubj[0].complete(); m.settle();
    log(`P12E ${fmt(m)}`);
    expect(m.readModel()).toEqual(['purple']);
  });
});
