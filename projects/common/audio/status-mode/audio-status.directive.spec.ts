import { Component, computed, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CNGX_STATEFUL,
  type AsyncStatus,
  type CngxAsyncState,
  buildAsyncStateView,
} from '@cngx/core/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_AUDIO_ENGINE, type CngxAudioHandle } from '../inject-audio';
import { CngxAudioStatus } from './audio-status.directive';

function createMockHandle(): CngxAudioHandle {
  return {
    play: vi.fn(),
    tone: vi.fn(),
    sequence: vi.fn(),
    register: vi.fn(),
    armAutoplay: vi.fn(),
    setMuted: vi.fn(),
    setVolume: vi.fn(),
    muted: signal(false),
    volume: signal(1),
    status: signal('idle'),
    lastPlayed: signal(null),
  };
}

function makeState(status: WritableSignal<AsyncStatus>): CngxAsyncState<unknown> {
  return buildAsyncStateView<unknown>({
    status,
    data: computed(() => undefined),
    error: computed(() => undefined),
  });
}

@Component({
  standalone: true,
  imports: [CngxAudioStatus],
  template: `<button
    [cngxAudioStatus]="spec"
    [state]="state"
    [audioVolume]="vol"
    [audioDisabled]="disabled">
    x
  </button>`,
})
class Host {
  spec = 'pending:tap, succeeded:success, failed:error';
  state: CngxAsyncState<unknown> | undefined = undefined;
  vol: number | undefined = undefined;
  disabled = false;
}

function setup(
  config?: { spec?: string; state?: CngxAsyncState<unknown>; disabled?: boolean; vol?: number },
  handle: CngxAudioHandle = createMockHandle(),
  extraProviders: unknown[] = [],
) {
  TestBed.configureTestingModule({
    imports: [Host],
    providers: [
      { provide: CNGX_AUDIO_ENGINE, useValue: handle },
      ...(extraProviders as never[]),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  Object.assign(host, config);
  fixture.detectChanges();
  return { fixture, host, handle };
}

afterEach(() => vi.restoreAllMocks());

describe('CngxAudioStatus directive', () => {
  it('fires the mapped earcon on an idle -> pending transition', () => {
    const status = signal<AsyncStatus>('idle');
    const { handle } = setup({ state: makeState(status) });
    status.set('pending');
    TestBed.flushEffects();
    expect(handle.play).toHaveBeenCalledWith('tap', undefined);
  });

  it('fires success on a pending -> success transition (succeeded alias)', () => {
    const status = signal<AsyncStatus>('pending');
    const { handle } = setup({ state: makeState(status) });
    status.set('success');
    TestBed.flushEffects();
    expect(handle.play).toHaveBeenCalledWith('success', undefined);
  });

  it('fires error on a failure transition (failed alias)', () => {
    const status = signal<AsyncStatus>('pending');
    const { handle } = setup({ state: makeState(status) });
    status.set('error');
    TestBed.flushEffects();
    expect(handle.play).toHaveBeenCalledWith('error', undefined);
  });

  it('does not fire on the initial idle state', () => {
    const status = signal<AsyncStatus>('idle');
    const { handle } = setup({ state: makeState(status) });
    TestBed.flushEffects();
    expect(handle.play).not.toHaveBeenCalled();
  });

  it('does not double-fire when the status is set to the same value', () => {
    const status = signal<AsyncStatus>('idle');
    const { handle } = setup({ state: makeState(status) });
    status.set('pending');
    TestBed.flushEffects();
    status.set('pending');
    TestBed.flushEffects();
    expect(handle.play).toHaveBeenCalledTimes(1);
  });

  it('forwards the per-element audioVolume to play', () => {
    const status = signal<AsyncStatus>('idle');
    const { handle } = setup({ state: makeState(status), vol: 0.5 });
    status.set('pending');
    TestBed.flushEffects();
    expect(handle.play).toHaveBeenCalledWith('tap', 0.5);
  });

  it('does not fire while audioDisabled is true', () => {
    const status = signal<AsyncStatus>('idle');
    const { handle } = setup({ state: makeState(status), disabled: true });
    status.set('pending');
    TestBed.flushEffects();
    expect(handle.play).not.toHaveBeenCalled();
  });

  it('lets an explicit [state] win over an ancestor CNGX_STATEFUL', () => {
    const explicit = signal<AsyncStatus>('idle');
    const ancestor = signal<AsyncStatus>('idle');
    const { handle } = setup({ spec: 'success:complete', state: makeState(explicit) }, createMockHandle(), [
      { provide: CNGX_STATEFUL, useValue: { state: makeState(ancestor) } },
    ]);
    // Only the ancestor moves — the directive watches the explicit input, so nothing fires.
    ancestor.set('success');
    TestBed.flushEffects();
    expect(handle.play).not.toHaveBeenCalled();

    explicit.set('success');
    TestBed.flushEffects();
    expect(handle.play).toHaveBeenCalledWith('complete', undefined);
  });

  it('falls back to an ancestor CNGX_STATEFUL when no [state] is bound', () => {
    const ancestor = signal<AsyncStatus>('idle');
    const { handle } = setup({ spec: 'pending:tap', state: undefined }, createMockHandle(), [
      { provide: CNGX_STATEFUL, useValue: { state: makeState(ancestor) } },
    ]);
    ancestor.set('pending');
    TestBed.flushEffects();
    expect(handle.play).toHaveBeenCalledWith('tap', undefined);
  });

  it('dev-errors once when no state source resolves', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { fixture } = setup({ spec: 'pending:tap', state: undefined });
    await fixture.whenStable();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('No state source'));
  });

  it('dev-errors when a DOM-event key is bound', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const status = signal<AsyncStatus>('idle');
    const { fixture } = setup({ spec: 'click:tap', state: makeState(status) });
    await fixture.whenStable();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('[cngxAudio]'));
  });
});
