# CngxSpeakButton

Cognitive accessibility component connecting to a CngxSpeak directive to control text-to-speech playback.

## Import

```typescript
import { CngxSpeakButton } from '@cngx/ui';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxSpeakButton } from '@cngx/ui';
import { CngxSpeak } from '@cngx/common';

@Component({
  selector: 'app-example',
  template: `
    <p [cngxSpeak]="textContent" #tts="cngxSpeak">
      {{ textContent }}
    </p>
    <cngx-speak-button [speakRef]="tts" />
  `,
  imports: [CngxSpeakButton, CngxSpeak],
})
export class ExampleComponent {
  textContent = 'Click the speaker button to hear this text.';
}
```

## Overview

`CngxSpeakButton` is a ready-made speaker button that connects to a `CngxSpeak` directive via an explicit `[speakRef]` input. It provides:

- **Speaker and stop icons** - Built-in SVGs that toggle based on speaking state
- **Accessible labels** - ARIA labels that reflect the current state ("Read aloud" / "Stop speaking")
- **Cognitive accessibility** - Part of CngxSpeak, targeting dyslexia and reading ease
- **Full theming control** - CSS custom properties for styling, Material theme SCSS integration
- **No ancestor injection** - Explicit `[speakRef]` wiring prevents hidden dependencies

## Accessibility

`CngxSpeakButton` is designed for cognitive accessibility:

- **ARIA labels:** Button label dynamically changes between "Read aloud" (idle) and "Stop speaking" (active).
- **Icon semantics:** SVG icons are marked `aria-hidden="true"` - the text label carries the meaning.
- **CngxSpeak integration:** The underlying `CngxSpeak` directive handles the speech synthesis API, managing pause/resume, focus restoration, and `prefers-reduced-motion` respect.
- **Cognitive focus:** Targets users with dyslexia, ADHD, and reading difficulties by providing auditory reinforcement alongside visual text.

## Composition

`CngxSpeakButton` is a simple wrapper around:

- **CngxSpeak directive** - Provides the `speaking()` signal and `toggle()` method
- **Built-in SVGs** - Speaker icon (idle state) and stop icon (speaking state)
- **CSS custom properties** - Full theming support

No host directives or internal atoms - purely a UI shell for the speech synthesis API.

## Material Theme

Include the theme SCSS in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/speak-button-theme' as speak;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include speak.theme($theme);
}
```

The theme mixin provides:

- Material 3 system color tokens (`--mat-sys-*`) with fallback defaults
- Material 2 palette color mappings
- Automatic theme version detection (M3 vs M2)

## Philosophy: Cognitive Accessibility

CngxSpeak / CngxSpeakButton are part of cngx's commitment to cognitive accessibility. Rather than treating a11y as an audit checkbox, these components embed accessibility into the architecture:

- **Dyslexia support** - Auditory reinforcement helps users with dyslexia parse text more effectively
- **ADHD support** - Multi-modal input (visual + audio) aids concentration and retention
- **Aging users** - Larger, clear button with obvious visual feedback
- **Non-native speakers** - Audio pronunciation aids comprehension

The philosophy is: communication is architecture, not a side effect. Every component owes users clarity at every point in time.
