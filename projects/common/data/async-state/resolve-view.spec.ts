import type { AsyncStatus } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';
import { resolveAsyncView, type AsyncView } from './resolve-view';

describe('resolveAsyncView', () => {
  function expectView(
    status: AsyncStatus,
    firstLoad: boolean,
    empty: boolean,
    expected: AsyncView,
  ): void {
    expect(resolveAsyncView(status, firstLoad, empty)).toBe(expected);
  }

  describe('firstLoad = true', () => {
    it('idle -> none', () => {
      expectView('idle', true, false, 'none');
      expectView('idle', true, true, 'none');
    });

    it('loading -> skeleton', () => {
      expectView('loading', true, false, 'skeleton');
      expectView('loading', true, true, 'skeleton');
    });

    it('error -> error', () => {
      expectView('error', true, false, 'error');
      expectView('error', true, true, 'error');
    });

    it('success + empty -> empty', () => {
      expectView('success', true, true, 'empty');
    });

    it('success + !empty -> content', () => {
      expectView('success', true, false, 'content');
    });

    it('refreshing -> skeleton (no content yet)', () => {
      expectView('refreshing', true, false, 'skeleton');
      expectView('refreshing', true, true, 'skeleton');
    });

    it('pending -> skeleton (no content yet)', () => {
      expectView('pending', true, false, 'skeleton');
      expectView('pending', true, true, 'skeleton');
    });
  });

  describe('firstLoad = false', () => {
    it('idle -> content', () => {
      expectView('idle', false, false, 'content');
    });

    it('loading -> content', () => {
      expectView('loading', false, false, 'content');
    });

    it('refreshing -> content', () => {
      expectView('refreshing', false, false, 'content');
    });

    it('pending -> content', () => {
      expectView('pending', false, false, 'content');
    });

    it('success + empty -> empty', () => {
      expectView('success', false, true, 'empty');
    });

    it('success + !empty -> content', () => {
      expectView('success', false, false, 'content');
    });

    it('error -> content+error', () => {
      expectView('error', false, false, 'content+error');
      expectView('error', false, true, 'content+error');
    });
  });
});
