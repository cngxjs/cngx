import * as api from '@cngx/common/audio';
import { describe, expect, it } from 'vitest';

// Guards the public surface: a barrel has no behaviour of its own, but an
// accidental drop of a public export is a breaking change worth catching.
describe('@cngx/common/audio public surface', () => {
  it('exports the factories, tokens, provider, and directive', () => {
    expect(api.injectCngxAudio).toBeTypeOf('function');
    expect(api.provideCngxAudio).toBeTypeOf('function');
    expect(api.createAudioEngine).toBeTypeOf('function');
    expect(api.createToneGenerator).toBeTypeOf('function');
    expect(api.createAutoplayGate).toBeTypeOf('function');
    expect(api.createDebouncer).toBeTypeOf('function');
    expect(api.CNGX_AUDIO_ENGINE_FACTORY).toBeDefined();
    expect(api.CNGX_AUDIO_TONE_GENERATOR_FACTORY).toBeDefined();
    expect(api.CNGX_AUDIO_CONFIG).toBeDefined();
    expect(api.CngxAudio).toBeTypeOf('function');
  });

  it('exports all five with* config features', () => {
    expect(api.withEarcons).toBeTypeOf('function');
    expect(api.withVolume).toBeTypeOf('function');
    expect(api.withMuted).toBeTypeOf('function');
    expect(api.withRespectReducedMotion).toBeTypeOf('function');
    expect(api.withDebounceMs).toBeTypeOf('function');
  });

  it('does not leak internal symbols', () => {
    expect((api as Record<string, unknown>)['CNGX_AUDIO_DEFAULT_EARCONS']).toBeUndefined();
    expect((api as Record<string, unknown>)['CNGX_AUDIO_ENGINE']).toBeUndefined();
  });
});
