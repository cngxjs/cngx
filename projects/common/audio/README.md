# @cngx/common/audio

Signal-first audio-feedback system. A thin directive layer over a small Web Audio adapter: earcons synthesised from `OscillatorNode` (zero audio assets), a single shared `AudioContext` behind the engine, and the `provideCngxAudio(...)` aggregator. It is the fourth sense - audition - alongside the sibling feedback primitives `CngxRipple` (visual), `CngxPressable` (tactile), and `CngxSpeak` (spoken).

## What it is

- **`[cngxAudio]`** - an attribute directive that maps DOM events to earcons with the `event:earcon` grammar (`'click:tap'`). No state, no config; drop it on any element.
- **`injectCngxAudio()`** - a typed handle to the shared engine for programmatic control (`play`, `register`, `setMuted`, `setVolume`) plus reactive `muted` / `volume` / `status` / `lastPlayed` signals.
- **`provideCngxAudio(...)`** - the app-level configuration aggregator with `with*` features.
- **Six built-in earcons**, all oscillator-generated: `tap`, `success`, `error`, `warning`, `notification`, `complete`.

## When you reach for it

You want a state change to be *heard*, not just seen. Sound is interaction design first (analogous to a ripple) and accessibility reinforcement second - a non-visual channel that confirms an action landed. Typical reasons:

- A tactile-feeling click on buttons, toggles, and chips.
- Confirming an async outcome audibly (a rising chime on save, a low buzz on failure) so the user does not have to watch a spinner.
- Reinforcing status transitions for users who benefit from a second sensory channel.
- Branded UI sounds (a "sent" swoosh, a "received" ping) without shipping any `.wav`/`.mp3` weight.

You do **not** reach for it for background music, long samples, or spatial audio - it synthesises short earcons, nothing more. For text-to-speech, use `CngxSpeak`; the two compose freely on one element.

## Why it is built this way

- **Web Audio, not the Vibration API.** Vibration is effectively dead (Apple never shipped it, Firefox removed it, Chrome restricts it). Web Audio is universal, needs no permission prompt, and both plays and synthesises.
- **Zero asset weight.** Earcons are oscillator sequences, so the published bundle carries 0 KB of audio. Need real samples? Swap the tone generator (see below) - the engine does not change.
- **One shared `AudioContext`.** Browsers cap the number of contexts. The engine owns exactly one, lazily created on the first allowed play, shared by every directive on the page through the injected handle.
- **Autoplay-policy-safe.** Browsers block audio until a user gesture. The engine arms itself on the first `pointerdown` / `keydown` / `touchstart` and resumes the context only then - no console warnings, no failed playback.
- **Reduced-motion aware.** Sound and motion are both sensory stimulation, so `prefers-reduced-motion: reduce` mutes audio by default. Opt out with `withRespectReducedMotion(false)`.

## Mental model

```
[cngxAudio] directive ──▶ injectCngxAudio() handle ──▶ shared engine (root)
                                                          │
                          ┌───────────────────────────────┼───────────────────────────┐
                          ▼                                ▼                           ▼
                   autoplay gate                     tone generator                debouncer
             (arms on first gesture)          (OscillatorNode synthesis)      (per-name window)
                                                          │
                                                    one AudioContext
                                                     + master gain (volume)
```

Every `play(name)` runs through one central gate in the engine, so the four mute conditions live in a single place rather than scattered across directives:

1. **`prefers-reduced-motion: reduce`** is active (and `respectReducedMotion` is on).
2. The **autoplay gate is not armed** yet (no user gesture has happened).
3. The engine is **globally muted** (`engine.muted()`).
4. Only for `[cngxAudio]`: the element carries **`[audioDisabled]="true"`** (enforced in the directive, since it is per-element).

If none block, the same-name **debouncer** suppresses repeats inside a 100 ms window, then the earcon plays and `lastPlayed` advances.

## Quick start

Bind an event to an earcon - the first click both arms audio and plays:

```html
<button type="button" [cngxAudio]="'click:tap'">Save</button>
<a [cngxAudio]="'pointerenter:notification, click:complete'">Open</a>
```

```ts
import { CngxAudio } from '@cngx/common/audio';

@Component({ imports: [CngxAudio], /* ... */ })
export class Toolbar {}
```

The grammar is `event:earcon`, comma-separated. Bindable DOM events: `click`, `focus`, `blur`, `pointerenter`, `pointerleave`, `submit`, `change`, `input`.

### Programmatic control

```ts
import { injectCngxAudio } from '@cngx/common/audio';

@Component({ /* ... */ })
export class MuteToggle {
  private readonly audio = injectCngxAudio();
  protected readonly muted = this.audio.muted; // Signal<boolean>

  protected toggle(): void {
    this.audio.setMuted(!this.muted());
  }
  protected save(): void {
    // ... your save logic
    this.audio.play('success');
  }
}
```

### App-level configuration

```ts
import {
  provideCngxAudio,
  withVolume,
  withMuted,
  withEarcons,
  withRespectReducedMotion,
  withDebounceMs,
} from '@cngx/common/audio';

bootstrapApplication(App, {
  providers: [
    provideCngxAudio(
      withVolume(0.6),
      withDebounceMs(120),
      withEarcons({
        send: { sequence: [{ freq: 880, duration: 60 }, { freq: 1180, duration: 90 }] },
      }),
    ),
  ],
});
```

Now `[cngxAudio]="'click:send'"` plays your branded earcon everywhere.

### Runtime registration

When earcons are scope-specific (a widget that brings its own sounds), register them on the shared engine at runtime instead of at bootstrap:

```ts
private readonly audio = injectCngxAudio();
constructor() {
  this.audio.register('receive', { sequence: [{ freq: 520, duration: 90 }] });
}
```

## Earcon shape

An earcon is a sequence of tone steps played back-to-back:

```ts
interface ToneStep {
  freq: number;        // Hz
  duration: number;    // ms
  type?: OscillatorType;  // 'sine' (default) | 'square' | 'sawtooth' | 'triangle'
  gain?: number;       // [0, 1] peak, default 0.2
  delay?: number;      // ms of silence before this step
}
```

Each tone carries a 5 ms attack and 30 ms release envelope so `start()`/`stop()` never produce an audible click.

## Swapping the synthesis (samples instead of oscillators)

The engine and the tone generator are boundary-layer DI factories. To play real audio files instead of oscillators, override the tone-generator factory - the engine, directives, and earcon names stay untouched:

```ts
import { CNGX_AUDIO_TONE_GENERATOR_FACTORY } from '@cngx/common/audio';

providers: [
  { provide: CNGX_AUDIO_TONE_GENERATOR_FACTORY, useValue: mySampleBackedFactory },
];
```

`CNGX_AUDIO_ENGINE_FACTORY` is the matching seam for wrapping the engine with telemetry or audit logging.

## Best practices

- **Bind sound to the gesture, not to a lifecycle effect.** `[cngxAudio]="'click:tap'"` is correct; playing inside an `effect()` that reacts to route or data changes fights the autoplay policy and surprises users. For status-driven sound, prefer the Phase 2 `[cngxAudioStatus]` bridge.
- **Keep earcons short (under ~300 ms total).** Earcons confirm, they do not entertain. Long sequences feel laggy and collide with the debounce window.
- **Do not mute by removing the directive.** Use `setMuted(true)` or `[audioDisabled]`; the engine keeps one context and one mute state for the whole page.
- **Respect the user.** Leave `respectReducedMotion` on unless you have a specific reason; expose a mute control somewhere reachable. Audio is opt-out for the user, never a surprise.
- **Volume is a `[0, 1]` scalar.** `setVolume` clamps; `[audioVolume]` on `[cngxAudio]` scales one element without touching the shared master volume.
- **Earcon names are English by default.** Register branded/localised names via `withEarcons` or `register`; the built-ins stay English.
- **One engine per app.** `injectCngxAudio()` returns the shared root instance. Only re-provide it in `viewProviders` if you deliberately want an isolated context for a subtree.

## Testing

Audio is unsniffable in headless/jsdom environments, so assert through the engine, never by listening:

- Unit tests use `createAudioContextMock()` from `@cngx/testing` - a pure stub with assertable `connect` / `start` / `stop` records; no real `AudioContext` is required.
- Read `engine.lastPlayed()` to confirm a play was accepted and `engine.status()` for the context lifecycle.
- End-to-end tests route through the same `lastPlayed()` signal (exposed on `window` under a demo guard) rather than sniffing output.

## Status

Phase 1 ships the engine, the `[cngxAudio]` event-mode directive, the six earcons, `injectCngxAudio`, and `provideCngxAudio`. Phase 2 adds the status-bridge (`[cngxAudioStatus]`), zone (`[cngxAudioZone]`), and pitch (`[cngxAudioPitch]`) directives. Chart sonification is a later release. The public API is stable for adoption; the internal factory composition may evolve.
