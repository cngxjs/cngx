# @cngx/common/a11y

Accessibility behavior directives - focus management, keyboard navigation, live regions, and motion detection.

## CngxRovingTabindex

Implements the [WAI-ARIA roving tabindex](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex) pattern for composite widgets. Only the active item has `tabindex="0"` - all others get `tabindex="-1"`. Arrow keys move focus within the group; Tab leaves it entirely.

```html
<div cngxRovingTabindex orientation="horizontal" [loop]="true" #rv="cngxRovingTabindex">
  <button cngxRovingItem>Cut</button>
  <button cngxRovingItem>Copy</button>
  <button cngxRovingItem>Paste</button>
</div>
```

### CngxRovingTabindex Keyboard

| Key | Action |
|-|-|
| `ArrowRight` / `ArrowDown` | Move to next item (axis-dependent) |
| `ArrowLeft` / `ArrowUp` | Move to previous item (axis-dependent) |
| `Home` | Jump to first enabled item |
| `End` | Jump to last enabled item |
| `Tab` | Leave the group (standard tab order) |

Under a right-to-left document direction (`<html dir="rtl">`, or `provideDirection()`) the horizontal arrows flip: `ArrowLeft` moves to the next item, `ArrowRight` to the previous. `CngxActiveDescendant` follows the same rule.

### Notes

- Disabled items are skipped during arrow-key navigation.
- `activeIndex` is clamped to the valid range when items are added/removed.
- Items are discovered via `contentChildren(CngxRovingItem)`.


## CngxFocusRestore

Captures the previously focused element on init and restores focus when the host is destroyed while focus is inside it or on `<body>`; focus the user moved elsewhere stays put. Prevents focus from falling to `<body>` when dynamic content is removed.

```html
@if (panelOpen()) {
<div cngxFocusRestore>
  Panel content…
  <button (click)="panelOpen.set(false)">Close</button>
</div>
}
```

### Fallback Chain

1. Stored element (if still in DOM)
2. Explicit `fallback` input
3. Nearest focusable ancestor
4. Nothing (focus stays where it is)


## CngxAutofocus

Reactive autofocus for dynamically inserted elements. The native `autofocus` attribute only works on initial page load - this directive handles dialogs, panels, steppers, and conditional views.

```html
@if (showSearch()) {
  <input [cngxAutofocus]="true" placeholder="Search…" />
}
```

### Notes

- Uses `afterNextRender` for initial focus - never synchronous.
- `delay > 0` uses `setTimeout`; `delay === 0` uses `afterNextRender`.
- Tracks `when` transitions via `effect()` - only re-focuses on `false → true`.


## Other Exports

| Export | Kind |
|-|-|
| `CngxAriaExpanded`, `CngxFocusTrap`, `CngxFocusVisible`, `CngxLiveRegion`, `CngxReducedMotion` | Directives |
| `CngxRovingItem` | Item marker for `CngxRovingTabindex` |
| `CngxActiveDescendant` | Directive: `aria-activedescendant` navigation for listbox-like hosts |
| `CngxLiveAnnouncer`, `AriaLivePoliteness` | Root service for imperative announcements, its politeness type |
| `injectScopedLiveRegion`, `CngxScopedLiveRegion`, `CngxPendingAnnouncement` | Live-region pair inside a host element (modal overlays) |
| `CNGX_FOCUSABLE_SELECTOR` | CSS selector of natively focusable elements |
| `CNGX_AD_ITEM`, `ActiveDescendantItem`, `CngxAdItemHandle` | Item registration token and shapes for `CngxActiveDescendant` |
| `CNGX_FOCUS_TRAP_DRIVER`, `CNGX_FOCUS_RESTORE_DRIVER`, `CNGX_ARIA_EXPANDED_DRIVER` (+ `Cngx*Driver` types) | Let a composing directive drive the host directive from its own state |

Details: [focus/README.md](focus/README.md), [aria/README.md](aria/README.md).
