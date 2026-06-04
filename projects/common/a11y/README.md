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

### Notes

- Disabled items are skipped during arrow-key navigation.
- `activeIndex` is clamped to the valid range when items are added/removed.
- Items are discovered via `contentChildren(CngxRovingItem)`.


## CngxFocusRestore

Captures the previously focused element on init and restores focus when the host is destroyed. Prevents focus from falling to `<body>` when dynamic content is removed.

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

`CngxAriaExpanded`, `CngxFocusTrap`, `CngxFocusVisible`, `CngxLiveRegion`, `CngxReducedMotion`
