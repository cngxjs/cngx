# @cngx/common — Interactive Behaviors

Directives for user interaction patterns — click detection, hover tracking,
search input, and text-to-speech.

## Directives

### CngxClickOutside

Detects interactions outside the host element — for dismissing dropdowns,
popovers, and overlays.

```html
<div cngxClickOutside (clickOutside)="close()" [enabled]="isOpen()">
  ...dropdown content...
</div>
```

**Inputs:** `eventType` (`'pointerdown'` | `'click'` | `'mousedown'` | `'touchstart'`, default `'pointerdown'`), `enabled` (boolean)
**Outputs:** `clickOutside` (PointerEvent | MouseEvent | TouchEvent)

### CngxHoverable

Tracks hover state as a signal. Designed as a `hostDirective` composition
primitive — used internally by `CngxTreetableRow` for row highlight.

```html
<div cngxHoverable #h="cngxHoverable" [class.highlight]="h.hovered()">
  Hover me
</div>
```

**Signals:** `hovered` (boolean)

### CngxSearch

Debounced search input directive. Converts DOM `input` events into a
signal-based API with configurable debounce.

```html
<input cngxSearch #search="cngxSearch" [debounceMs]="300" />
<span>Results for: {{ search.term() }}</span>
<button (click)="search.clear()">Clear</button>
```

**Inputs:** `debounceMs` (number, default 300)
**Signals:** `term` (string), `hasValue` (boolean)
**Outputs:** `searchChange` (string)
**Methods:** `clear()`

### CngxSpeak

Read-aloud directive using the browser's SpeechSynthesis API.

This is NOT an accessibility/screen-reader tool. It is a cognitive UX feature
for people with dyslexia, reading difficulties, or anyone who prefers listening.
Screen reader users have their own tools — use `CngxLiveRegion` for a11y.

The directive is purely headless — no DOM, no CSS, no button. The consumer
renders their own UI or uses `CngxSpeakButton` from `@cngx/ui`.

```html
<!-- Headless — own button -->
<p [cngxSpeak]="text" #tts="cngxSpeak">
  {{ text }}
  <button (click)="tts.toggle()">{{ tts.speaking() ? 'Stop' : 'Listen' }}</button>
</p>

<!-- With CngxSpeakButton from @cngx/ui -->
<span [cngxSpeak]="text" #tts="cngxSpeak">{{ text }}</span>
<cngx-speak-button [speakRef]="tts" />
```

**Inputs:** `cngxSpeak` (text), `rate`, `pitch`, `volume`, `lang`, `enabled` (controls auto-speak only)
**Signals:** `speaking` (boolean), `supported` (boolean)
**Methods:** `speak(text)` (ignores `enabled`), `cancel()`, `toggle()`
