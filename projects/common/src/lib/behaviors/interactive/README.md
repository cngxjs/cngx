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

### CngxSwipeDismiss

Detects directional swipe gestures via Pointer Events. Emits when the gesture
exceeds a configurable threshold. Exposes real-time `swiping` and
`swipeProgress` signals for visual feedback during the gesture.

```html
<!-- Close drawer on swipe-left -->
<nav [cngxDrawerPanel]="drawer"
     cngxSwipeDismiss="left" (swiped)="drawer.close()">
  ...
</nav>

<!-- Bottom sheet with drag progress -->
<div cngxSwipeDismiss="down" #swipe="cngxSwipeDismiss"
     [style.transform]="'translateY(' + (swipe.swipeProgress() * 100) + '%)'">
  ...
</div>
```

**Inputs:** `cngxSwipeDismiss` (SwipeDirection: `'left'` | `'right'` | `'up'` | `'down'`, required), `threshold` (number in px, default 50), `enabled` (boolean)
**Signals:** `swiping` (boolean), `swipeProgress` (number 0–1)
**Outputs:** `swiped` (void)

Use cases:
- Drawer swipe-to-close (swipe left to close a left drawer)
- Bottom sheet drag-to-dismiss
- Dismissible notification cards
- Carousel slide gestures
