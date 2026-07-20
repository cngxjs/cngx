import { describe, expect, it } from 'vitest';
import { CNGX_AUDIO_DEFAULT_EARCONS } from './default-earcons';

const NAMES = ['tap', 'success', 'error', 'warning', 'notification', 'complete'] as const;

describe('CNGX_AUDIO_DEFAULT_EARCONS', () => {
  it('ships exactly the six documented earcons', () => {
    expect(Object.keys(CNGX_AUDIO_DEFAULT_EARCONS).sort()).toEqual([...NAMES].sort());
  });

  it.each(NAMES)('%s is a non-empty sequence of well-formed tone steps', (name) => {
    const { sequence } = CNGX_AUDIO_DEFAULT_EARCONS[name];
    expect(sequence.length).toBeGreaterThan(0);
    for (const step of sequence) {
      expect(step.freq).toBeGreaterThan(0);
      expect(step.duration).toBeGreaterThan(0);
    }
  });
});
