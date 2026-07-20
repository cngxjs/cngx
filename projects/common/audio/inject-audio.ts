import { InjectionToken, Optional, type Provider, SkipSelf, inject } from '@angular/core';

import {
  CNGX_AUDIO_CONFIG,
  type CngxAudioConfig,
  type CngxAudioFeature,
  foldAudioFeatures,
} from './config/audio-config';
import { CNGX_AUDIO_ENGINE_FACTORY, type CngxAudioEngine } from './engine/audio-engine';

/**
 * The public audio handle — what {@link injectCngxAudio} returns.
 *
 * An alias for {@link CngxAudioEngine} rather than a second interface: the two
 * contracts were member-for-member identical, so a separate declaration was
 * duplication, not indirection. The name is kept because it reads better at
 * call sites (`const audio: CngxAudioHandle = injectCngxAudio()`), and because
 * the engine contract is the one an override implements.
 *
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/inject-audio.ts
 * @since 0.1.0
 */
export type CngxAudioHandle = CngxAudioEngine;

/**
 * The shared engine instance. Lazily built from `CNGX_AUDIO_ENGINE_FACTORY` and
 * memoised per injector so every directive shares one `AudioContext`, mute
 * state, and volume. `@internal` — the public entry point is {@link injectCngxAudio};
 * consumers override the swappable factory, not this instance anchor. To scope
 * audio to a subtree, use {@link provideCngxAudioAt} — it re-provides this token
 * for you alongside the scoped config.
 *
 * @internal
 */
export const CNGX_AUDIO_ENGINE = new InjectionToken<CngxAudioHandle>('CngxAudioEngineInstance', {
  providedIn: 'root',
  factory: () => inject(CNGX_AUDIO_ENGINE_FACTORY)(),
});

/**
 * Resolve the shared audio handle. Must run in an injection context (field
 * initialiser or constructor).
 *
 * ```typescript
 * export class MyToggle {
 *   private readonly audio = injectCngxAudio();
 *   protected readonly muted = this.audio.muted;
 *   protected toggle(): void {
 *     this.audio.setMuted(!this.muted());
 *   }
 * }
 * ```
 *
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/inject-audio.ts
 * @since 0.1.0
 */
export function injectCngxAudio(): CngxAudioHandle {
  return inject(CNGX_AUDIO_ENGINE);
}

/**
 * Component-scope audio config — place in a component's `viewProviders` so a
 * subtree runs its own muted / volume / earcon set, independent of the app-wide
 * `provideCngxAudio(...)`.
 *
 * ```typescript
 * @Component({
 *   selector: 'app-mixer',
 *   viewProviders: [provideCngxAudioAt(withVolume(0.3), withEarcons({ ... }))],
 * })
 * export class Mixer {}
 * ```
 *
 * Returns `Provider[]` (not `EnvironmentProviders`) so it can sit in
 * `viewProviders`. The root `provideCngxAudio` must be registered at
 * **application bootstrap**: {@link CNGX_AUDIO_ENGINE} is `providedIn: 'root'`,
 * so its factory resolves the config from the root injector and a provider
 * registered on a lazy route never reaches it.
 *
 * Features **layer over** the ancestor config (root, or an enclosing scope)
 * rather than replacing it — the `provideMenuConfigAt` pattern. Scalar fields
 * (`muted`, `volume`, `debounceMs`, `respectReducedMotion`) override; `earcons`
 * merge, so a subtree adds or overrides individual earcons without dropping the
 * app-wide registry.
 *
 * The default shared engine is a single, process-global `AudioContext`; this
 * deliberately re-provides {@link CNGX_AUDIO_ENGINE} so the subtree gets an
 * **isolated engine** reading the scoped {@link CNGX_AUDIO_CONFIG} — a
 * config-only override would be inert against the already-built root engine.
 * That engine owns a **second `AudioContext`**, created lazily on its first play
 * and closed with the component's `DestroyRef`. Browsers cap the number of live
 * `AudioContext`s, so reach for this only when a subtree genuinely needs an
 * independent audio scope — per-element `[audioVolume]` / `[audioDisabled]`
 * cover the common case without a second context.
 *
 * @category common/audio
 * @relatedTo provideCngxAudio, injectCngxAudio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/inject-audio.ts
 * @since 0.1.0
 */
export function provideCngxAudioAt(...features: CngxAudioFeature[]): Provider[] {
  return [
    {
      provide: CNGX_AUDIO_CONFIG,
      useFactory: (parent: Partial<CngxAudioConfig> | null): Partial<CngxAudioConfig> => {
        const base = parent ?? {};
        const scoped = foldAudioFeatures(features);
        return { ...base, ...scoped, earcons: { ...base.earcons, ...scoped.earcons } };
      },
      deps: [[new SkipSelf(), new Optional(), CNGX_AUDIO_CONFIG]],
    },
    { provide: CNGX_AUDIO_ENGINE, useFactory: () => inject(CNGX_AUDIO_ENGINE_FACTORY)() },
  ];
}
