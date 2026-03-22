# @cngx/common — Interactive Behaviors

Directives for user interaction patterns — click detection, hover tracking,
search input, text-to-speech, swipe gestures, disclosure, and navigation atoms.

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

### CngxDisclosure

Generic expand/collapse (disclosure) behavior. Applied to the **trigger**
element. Manages `aria-expanded` and `aria-controls` directly — no need
to compose `CngxAriaExpanded` separately.

Supports controlled (`[cngxDisclosureOpened]`) and uncontrolled modes.
Keyboard: Enter, Space, and click toggle the state.

```html
<button cngxDisclosure #faq="cngxDisclosure" [controls]="'answer-1'">
  Question 1
</button>
@if (faq.opened()) {
  <div id="answer-1">Answer to question 1.</div>
}
```

For CSS transitions, use `[hidden]` instead of `@if` so the DOM is preserved:
```html
<div id="answer-1" [hidden]="!faq.opened()" class="collapsible">…</div>
```

**Inputs:** `cngxDisclosureOpened` (boolean | undefined — controlled), `controls` (string — sets `aria-controls`)
**Signals:** `opened` (boolean)
**Outputs:** `openedChange` (boolean)
**Methods:** `open()`, `close()`, `toggle()`
**Host attrs:** `aria-expanded`, `aria-controls`
**Host events:** click, keydown.enter, keydown.space

Use cases:
- Sidebar nav accordion groups
- FAQ sections
- Collapsible panels
- Settings sections

### CngxNavLink

Navigation link atom. Sets `aria-current="page"` when active (announced
by screen readers), depth-based CSS var for indentation, and ensures
keyboard focusability for `<a>` elements without `href`.

```html
<!-- With Angular Router -->
<a cngxNavLink routerLink="/dashboard" routerLinkActive
   #rla="routerLinkActive" [active]="rla.isActive">
  Dashboard
</a>

<!-- Nested with depth -->
<a cngxNavLink [depth]="1" [active]="false">Nested item</a>
```

**Inputs:** `active` (boolean), `ariaCurrent` (string, default `'page'`), `depth` (number), `scrollOnActive` (boolean, default `true` — scrolls into view when becoming active)
**Host classes:** `cngx-nav-link`, `cngx-nav-link--active`
**Host attrs:** `aria-current` (when active), `tabindex="0"` + `role="link"` (on `<a>` without `href`), `data-initial` (auto-set first letter of text content — used by sidenav mini mode)
**CSS var:** `--cngx-nav-depth`

### CngxNavLabel

Non-interactive section header. No `role="heading"` by default to avoid
inflating the document heading outline. Opt in with `[heading]="true"`.

```html
<span cngxNavLabel>@cngx/common</span>
<span cngxNavLabel [heading]="true" [level]="3">Settings</span>
```

**Inputs:** `heading` (boolean, default `false`), `level` (number, default 3)
**Host class:** `cngx-nav-label`
**Host attrs:** `role="heading"` + `aria-level` (only when `heading` is true)

### CngxNavBadge

Inline badge for nav items. `aria-hidden="true"` by default because badges
typically duplicate info in the link text. Provide `[ariaLabel]` for unique
information (e.g., unread count).

```html
<a cngxNavLink>
  Inbox
  <span cngxNavBadge [value]="3" ariaLabel="3 unread">3</span>
</a>
```

**Inputs:** `value` (string | number | null), `variant` (`'count'` | `'dot'` | `'status'`), `ariaLabel` (string)
**Host classes:** `cngx-nav-badge`, `cngx-nav-badge--{variant}`, `cngx-nav-badge--hidden` (when empty/zero)
**Host attrs:** `aria-hidden="true"` (default), `aria-label` (when `ariaLabel` provided)

### CngxNavGroup

Navigation accordion group composing `CngxDisclosure` as a hostDirective.
Adds depth tracking and CSS classes. When `CNGX_NAV_CONFIG` has
`singleAccordion: true` and `CngxNavGroupRegistry` is provided,
opening one group closes the others in the same scope.

```html
<button cngxNavGroup #group="cngxNavGroup" [controls]="'settings-nav'"
        id="settings-label">
  Settings
</button>
@if (group.disclosure.opened()) {
  <div id="settings-nav" role="group" [attr.aria-labelledby]="'settings-label'">
    <a cngxNavLink [depth]="1">General</a>
    <a cngxNavLink [depth]="1">Security</a>
  </div>
}
```

**Inputs:** `cngxDisclosureOpened` (via hostDirective), `controls` (via hostDirective), `depth` (number)
**Exposed:** `disclosure` (CngxDisclosure instance — use `disclosure.opened()`)
**Host classes:** `cngx-nav-group`, `cngx-nav-group--open`
**CSS var:** `--cngx-nav-depth`

### CNGX_NAV_CONFIG + provideNavConfig

InjectionToken for nav system defaults. Provide at any level.

```typescript
@Component({
  providers: [
    provideNavConfig({ singleAccordion: true, indent: 16 }),
    CngxNavGroupRegistry, // required for singleAccordion
  ],
})
```

**Options:** `indent` (px, default 12), `singleAccordion` (boolean, default false), `animationDuration` (ms, default 150)
