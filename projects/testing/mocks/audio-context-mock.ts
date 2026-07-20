import { type Mock, vi } from 'vitest';

/**
 * A stubbed `AudioParam`. Records every scheduling call so specs can assert
 * envelope shape (`setValueAtTime` / `linearRampToValueAtTime`) without a real
 * Web Audio engine.
 */
export interface AudioParamMock {
  value: number;
  readonly setValueAtTime: Mock;
  readonly linearRampToValueAtTime: Mock;
  readonly exponentialRampToValueAtTime: Mock;
  readonly cancelScheduledValues: Mock;
}

/** A stubbed `OscillatorNode` with assertable `connect` / `start` / `stop` records. */
export interface OscillatorNodeMock {
  type: OscillatorType;
  readonly frequency: AudioParamMock;
  onended: (() => void) | null;
  readonly connect: Mock;
  readonly disconnect: Mock;
  readonly start: Mock;
  readonly stop: Mock;
  /** The `currentTime`-relative start passed to `start()`, or `null`. */
  readonly startedAt: number | null;
  /** The stop time passed to `stop()`, or `null`. */
  readonly stoppedAt: number | null;
}

/** A stubbed `GainNode` with an assertable `gain` param and connect records. */
export interface GainNodeMock {
  readonly gain: AudioParamMock;
  readonly connect: Mock;
  readonly disconnect: Mock;
}

/**
 * A stubbed `AudioContext`. Enough of the surface for the tone generator and
 * engine to run under vitest/jsdom, plus assertion helpers (`oscillators`,
 * `gains`) and a `advanceTime` hook for scheduling assertions. Cast to
 * `AudioContext` at the call site: `mock as unknown as AudioContext`.
 */
export interface AudioContextMock {
  currentTime: number;
  state: AudioContextState;
  readonly destination: { readonly connect: Mock; readonly disconnect: Mock };
  createOscillator(): OscillatorNodeMock;
  createGain(): GainNodeMock;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
  /** Every oscillator handed out by `createOscillator`, in creation order. */
  readonly oscillators: OscillatorNodeMock[];
  /** Every gain node handed out by `createGain`, in creation order. */
  readonly gains: GainNodeMock[];
  /** Advance `currentTime` by `seconds` (fake scheduling clock). */
  advanceTime(seconds: number): void;
}

function createParam(initial = 0): AudioParamMock {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

function createOscillator(): OscillatorNodeMock {
  let startedAt: number | null = null;
  let stoppedAt: number | null = null;
  return {
    type: 'sine',
    frequency: createParam(440),
    onended: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn((when?: number) => {
      startedAt = when ?? 0;
    }),
    stop: vi.fn((when?: number) => {
      stoppedAt = when ?? 0;
    }),
    get startedAt() {
      return startedAt;
    },
    get stoppedAt() {
      return stoppedAt;
    },
  };
}

function createGain(): GainNodeMock {
  return {
    gain: createParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

/**
 * Create a fresh, assertable `AudioContext` stub. Shared across the tone-
 * generator, engine, and any downstream consumer spec so all Web Audio
 * assertions run against one surface. No real `AudioContext` is required, so
 * it runs unmodified under vitest/jsdom.
 *
 * ```ts
 * const ctx = createAudioContextMock();
 * const gen = createToneGenerator({ context: () => ctx as unknown as AudioContext, destination: () => ctx.destination as unknown as AudioNode });
 * gen.tone(440, 100);
 * expect(ctx.oscillators).toHaveLength(1);
 * expect(ctx.oscillators[0].start).toHaveBeenCalled();
 * ```
 */
export function createAudioContextMock(initialState: AudioContextState = 'suspended'): AudioContextMock {
  const oscillators: OscillatorNodeMock[] = [];
  const gains: GainNodeMock[] = [];
  const destination = { connect: vi.fn(), disconnect: vi.fn() };

  const mock: AudioContextMock = {
    currentTime: 0,
    state: initialState,
    destination,
    createOscillator() {
      const osc = createOscillator();
      oscillators.push(osc);
      return osc;
    },
    createGain() {
      const gain = createGain();
      gains.push(gain);
      return gain;
    },
    resume() {
      mock.state = 'running';
      return Promise.resolve();
    },
    suspend() {
      mock.state = 'suspended';
      return Promise.resolve();
    },
    close() {
      mock.state = 'closed';
      return Promise.resolve();
    },
    oscillators,
    gains,
    advanceTime(seconds: number) {
      mock.currentTime += seconds;
    },
  };

  return mock;
}
