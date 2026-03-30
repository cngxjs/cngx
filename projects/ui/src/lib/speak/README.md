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

- **Speaker and stop icons** — Built-in SVGs that toggle based on speaking state
- **Accessible labels** — ARIA labels that reflect the current state ("Read aloud" / "Stop speaking")
- **Cognitive accessibility** — Part of CngxSpeak, targeting dyslexia and reading ease
- **Full theming control** — CSS custom properties for styling, Material theme SCSS integration
- **No ancestor injection** — Explicit `[speakRef]` wiring prevents hidden dependencies

## API

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| speakRef | `CngxSpeak` | required | The `CngxSpeak` directive instance to connect to. Must be obtained via template reference variable (`#tts="cngxSpeak"`). |

### Signals

None exposed directly. Use `speakRef().speaking()` to monitor playback state.

### CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-speak-btn-size` | `36px` | Button width and height |
| `--cngx-speak-btn-border-width` | `1px` | Border thickness |
| `--cngx-speak-btn-radius` | `8px` | Border radius |
| `--cngx-speak-btn-bg` | `--cngx-surface` / `#fff` | Default background color |
| `--cngx-speak-btn-color` | `--cngx-text-secondary` / `#666` | Default text/icon color |
| `--cngx-speak-btn-border` | `#ddd` | Default border color |
| `--cngx-speak-btn-transition` | `0.15s` | Color and background transition duration |
| `--cngx-speak-btn-active-color` | `--cngx-accent` / `#f5a623` | Color on hover and when speaking |
| `--cngx-speak-btn-hover-bg` | `--cngx-speak-btn-bg` | Background on hover |
| `--cngx-speak-btn-speaking-color` | `#fff` | Icon/text color while speaking |
| `--cngx-speak-btn-speaking-bg` | `--cngx-accent` | Background while speaking |
| `--cngx-speak-btn-icon-size` | `18px` | Speaker icon width and height |

## Accessibility

`CngxSpeakButton` is designed for cognitive accessibility:

- **ARIA labels:** Button label dynamically changes between "Read aloud" (idle) and "Stop speaking" (active).
- **Icon semantics:** SVG icons are marked `aria-hidden="true"` — the text label carries the meaning.
- **CngxSpeak integration:** The underlying `CngxSpeak` directive handles the speech synthesis API, managing pause/resume, focus restoration, and `prefers-reduced-motion` respect.
- **Cognitive focus:** Targets users with dyslexia, ADHD, and reading difficulties by providing auditory reinforcement alongside visual text.

## Composition

`CngxSpeakButton` is a simple wrapper around:
- **CngxSpeak directive** — Provides the `speaking()` signal and `toggle()` method
- **Built-in SVGs** — Speaker icon (idle state) and stop icon (speaking state)
- **CSS custom properties** — Full theming support

No host directives or internal atoms — purely a UI shell for the speech synthesis API.

## Styling

Override CSS custom properties in your component or globally:

```scss
// Override defaults
:host {
  --cngx-speak-btn-size: 40px;
  --cngx-speak-btn-radius: 20px;
  --cngx-speak-btn-bg: var(--mat-sys-surface-variant, #efefef);
  --cngx-speak-btn-active-color: var(--mat-sys-primary, #1976d2);
}
```

## Examples

### Basic Usage

```typescript
<p [cngxSpeak]="article" #tts="cngxSpeak">
  {{ article }}
</p>
<cngx-speak-button [speakRef]="tts" />
```

### Multiple Text Regions

```typescript
<article [cngxSpeak]="articleText" #article="cngxSpeak">
  <h2>{{ title }}</h2>
  <p>{{ articleText }}</p>
</article>

<aside [cngxSpeak]="sidebarText" #sidebar="cngxSpeak">
  <h3>Related</h3>
  <p>{{ sidebarText }}</p>
</aside>

<div class="controls">
  <cngx-speak-button [speakRef]="article" />
  <cngx-speak-button [speakRef]="sidebar" />
</div>
```

### With Custom Styling

```typescript
<style>
  .speak-btn-custom {
    --cngx-speak-btn-size: 48px;
    --cngx-speak-btn-radius: 12px;
    --cngx-speak-btn-bg: linear-gradient(to right, #e3f2fd, #f3e5f5);
    --cngx-speak-btn-active-color: #6200ea;
    --cngx-speak-btn-speaking-bg: #6200ea;
  }
</style>

<article [cngxSpeak]="content" #tts="cngxSpeak">
  {{ content }}
</article>
<cngx-speak-button [speakRef]="tts" class="speak-btn-custom" />
```

### Conditional Rendering

```typescript
<div>
  <p [cngxSpeak]="description" #desc="cngxSpeak">
    {{ description }}
  </p>
  <!-- Only show button if browser supports Web Speech API -->
  @if (desc.supported()) {
    <cngx-speak-button [speakRef]="desc" />
  } @else {
    <p class="note">Text-to-speech is not supported in your browser.</p>
  }
</div>
```

## Material Theme

Include the theme SCSS in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/ui/speak/speak-button-theme' as speak;

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

- **Dyslexia support** — Auditory reinforcement helps users with dyslexia parse text more effectively
- **ADHD support** — Multi-modal input (visual + audio) aids concentration and retention
- **Aging users** — Larger, clear button with obvious visual feedback
- **Non-native speakers** — Audio pronunciation aids comprehension

The philosophy is: communication is architecture, not a side effect. Every component owes users clarity at every point in time.

## See Also

- [CngxSpeak](../../../common/src/lib/interactive/speak.ts) — The underlying directive
- [compodoc API documentation](../../../../../docs)
- Demo: `dev-app/src/app/demos/ui/speak-button-demo/`
- Tests: `projects/ui/src/lib/speak/speak-button.spec.ts`
