# Keyboard Interactions

Keyboard shortcut, hotkey registry, search input, and click-outside directives.

## Import

```typescript
import {
  CngxKeyboardShortcut,
  CngxHotkeyScope,
  injectHotkey,
  injectHotkeys,
  CngxSearch,
  CngxClickOutside,
  type KeyCombo,
} from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxKeyboardShortcut, CngxSearch, CngxClickOutside } from '@cngx/common/interactive';

@Component({
  selector: 'app-search',
  template: `
    <!-- Keyboard shortcut -->
    <button [cngxKeyboardShortcut]="'mod+s'" (shortcutTriggered)="save()">
      Save
    </button>

    <!-- Debounced search input -->
    <input cngxSearch #search="cngxSearch" placeholder="Search..." />
    <button (click)="search.clear()">Clear</button>
    <span>{{ search.term() }}</span>

    <!-- Click outside dismiss -->
    <div cngxClickOutside (clickOutside)="closeDropdown()" [enabled]="isOpen()">
      <button (click)="isOpen.set(!isOpen())">Toggle</button>
      @if (isOpen()) {
        <ul>
          <li>Option 1</li>
          <li>Option 2</li>
        </ul>
      }
    </div>
  `,
  imports: [CngxKeyboardShortcut, CngxSearch, CngxClickOutside],
})
export class SearchComponent {}
```

## Accessibility

- **ARIA roles:** None (behavioral directives)
- **Keyboard interaction:**
  - CngxKeyboardShortcut: Emits on matching keyboard events
  - CngxSearch: Standard text input keyboard behavior
  - CngxClickOutside: No keyboard interaction (pointer-only)
- **Screen reader:**
  - CngxKeyboardShortcut sets `aria-keyshortcuts` on its host from the combo (`Control+K`, `Meta+K` on macOS) while it is enabled and not muted; do not set it by hand
  - Search input is a standard form control
  - Click-outside is behavioral (no SR announcement needed)
- **Focus management:**
  - All directives preserve focus
  - No focus traps

## Composition

Keyboard directives are orthogonal interaction atoms:

- **Host directives:** None
- **Combines with:** Forms, buttons, overlays, searches
- **Provides:** Keyboard and pointer event handling

### Example: Composition Pattern

```typescript
// Search with shortcut to focus
<button [cngxKeyboardShortcut]="'mod+k'" (shortcutTriggered)="focusSearch()">
  Open search
</button>

<input cngxSearch #search="cngxSearch"
       [value]="search.term()"
       (searchChange)="query.set($event)" />

// Dropdown with click-outside dismiss
<div cngxClickOutside (clickOutside)="closeMenu()" [enabled]="isOpen()">
  <button (click)="isOpen.set(!isOpen())">Menu</button>
  @if (isOpen()) {
    <ul role="menu">
      <li><a role="menuitem" href="/a">Option A</a></li>
      <li><a role="menuitem" href="/b">Option B</a></li>
    </ul>
  }
</div>
```

## Styling

All keyboard directives are behavioral - no built-in styling.

## Examples

### Global Save Shortcut

```typescript
<button [cngxKeyboardShortcut]="'mod+s'" (shortcutTriggered)="save()">
  Save (Cmd+S)
</button>

// Keyboard shortcut fires on Cmd+S (macOS) or Ctrl+S (Windows/Linux)
save() {
  console.log('Saved!');
}
```

### Scoped Escape Handler

```typescript
<dialog #modal="dialog">
  <h2>Confirm Action</h2>
  <p>Are you sure?</p>

  <button [cngxKeyboardShortcut]="'escape'" [shortcutScope]="'self'"
          (shortcutTriggered)="modal.close()">
    Cancel
  </button>
  <button (click)="confirm(); modal.close()">Confirm</button>
</dialog>
```

### Search with Clear Button

```typescript
<div class="search-box">
  <input cngxSearch #search="cngxSearch"
         placeholder="Search items..."
         aria-label="Search" />

  @if (search.hasValue()) {
    <button (click)="search.clear()" aria-label="Clear search">×</button>
  }

  @if (search.term()) {
    <p>Found {{ results().length }} results for "{{ search.term() }}"</p>
  }
</div>
```

### Search with Results

```typescript
readonly searchQuery = signal('');
private readonly [applySearch, searchState] = optimistic(
  this.searchQuery,
  (query) => this.http.get(`/api/search?q=${query}`)
);

<input cngxSearch #search="cngxSearch" placeholder="Search..." />

<ul>
  @for (item of filteredResults(); track item.id) {
    <li>{{ item.name }}</li>
  }
</ul>

// Auto-update results as user types
effect(() => {
  this.searchQuery.set(search.term());
});
```

### Dropdown with Click-Outside Dismiss

```typescript
readonly dropdownOpen = signal(false);

<div class="dropdown">
  <button (click)="dropdownOpen.set(!dropdownOpen())">
    Actions ▼
  </button>

  <div cngxClickOutside (clickOutside)="dropdownOpen.set(false)"
       [enabled]="dropdownOpen()"
       [hidden]="!dropdownOpen()"
       role="menu">
    <a role="menuitem" href="#edit">Edit</a>
    <a role="menuitem" href="#delete">Delete</a>
  </div>
</div>
```

### Modal with Outside Dismiss

```typescript
readonly modalOpen = signal(false);

<div cngxClickOutside (clickOutside)="modalOpen.set(false)"
     [enabled]="modalOpen()"
     class="modal-backdrop"
     [hidden]="!modalOpen()">
  <dialog class="modal">
    <h2>Dialog Title</h2>
    <p>Dialog content</p>
    <button (click)="modalOpen.set(false)">Close</button>
  </dialog>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  }
</style>
```

### Accessibility-First: Keyboard Shortcuts with Labels

```typescript
<div class="command-palette">
  <input cngxSearch #search="cngxSearch"
         placeholder="Search commands..."
         aria-label="Search commands (Cmd+K to focus)" />

  <ul role="listbox">
    @for (cmd of filteredCommands(); track cmd.id) {
      <li role="option" [attr.aria-selected]="cmd.id === selectedId()">
        <span>{{ cmd.name }}</span>
        <kbd>{{ cmd.shortcut }}</kbd>
      </li>
    }
  </ul>
</div>

// Bind keyboard shortcuts to commands
@for (cmd of commands(); track cmd.id) {
  <button [cngxKeyboardShortcut]="cmd.shortcut"
          (shortcutTriggered)="executeCommand(cmd)"
          [hidden]="true" />
}
```

### Command Palette Pattern

```typescript
readonly searchTerm = signal('');
readonly paletteOpen = signal(false);

// Focus search on Cmd+K
<button [cngxKeyboardShortcut]="'mod+k'" (shortcutTriggered)="openPalette()">
  <span class="sr-only">Open command palette</span>
</button>

<div cngxClickOutside (clickOutside)="paletteOpen.set(false)"
     [enabled]="paletteOpen()"
     [hidden]="!paletteOpen()"
     class="command-palette">
  <input cngxSearch #search="cngxSearch"
         placeholder="Type a command..."
         (searchChange)="searchTerm.set($event)" />

  <ul role="listbox">
    @for (cmd of filteredCommands(); track cmd.id) {
      <li role="option" (click)="executeCommand(cmd); paletteOpen.set(false)">
        {{ cmd.name }}
      </li>
    }
  </ul>
</div>

openPalette() {
  this.paletteOpen.set(true);
  setTimeout(() => document.querySelector('input')?.focus());
}
```

### Touch-Friendly Search with Custom Event

```typescript
<!-- Use mousedown for faster mobile response -->
<button cngxClickOutside
        [eventType]="'mousedown'"
        (clickOutside)="handleOutsideClick()">
  Faster outside click detection
</button>
```

## Hotkey Registry

Every shortcut in the app registers into one keymap, `CNGX_HOTKEY_REGISTRY` (root-provided, no setup). It owns a single `keydown` listener on the document, added with the first registration and removed with the last one or on app teardown, and never added on the server. `CngxKeyboardShortcut` is the template entry point; code registers through `injectHotkey` (one binding) or `injectHotkeys` (a `Signal` of bindings, read per keypress, so a changing list needs no re-registration). Both unregister with their injection context, so a routed component's hotkeys leave with the route.

```typescript
readonly save = injectHotkey({
  id: 'editor.save',
  combo: 'mod+s',
  description: this.i18n.save,
  group: this.i18n.editing,
  run: () => this.saveDraft(),
});
```

The binding `id` is the stable identity; a binding with a `description` is listed by the hotkey help, one without it fires but stays unlisted. `CngxKeyboardShortcut` takes the same fields as `shortcutId`, `shortcutDescription` and `shortcutGroup`.

### Scopes

A press resolves from the focused element outwards through the hotkey scopes that contain it:

- `[cngxHotkeyScope]` marks a region. `reach: 'focus'` bindings registered below it (and `[shortcutScope]="'self'"` shortcuts on their host) fire only while focus is inside it.
- `[cngxHotkeyScopeModal]="true"` makes it modal: while focus is inside, global bindings outside it stay quiet. Modal dialogs and drawers provide this scope themselves.
- `[cngxHotkeyScopeActive]="false"` mutes everything registered below it: the bindings never fire and are not listed, without unregistering.
- The deeper scope wins when two bindings match one press (intended shadowing, silent). Two matches at the same depth run the later registration and warn CNGX1077 in dev mode.

### Text Entry

Inside an `input` of type text, search, email, url, tel, password or number, a `textarea`, a `select`, `contenteditable` or an element with `role="textbox"` / `role="searchbox"` (also inside shadow DOM), only combos with `ctrl`, `meta` or `mod`, function keys (`f1`-`f24`) and `escape` fire, for every scope. Bare keys, Shift-only and Alt-only combos never fire there, so `'mod+k'` works while typing and `'/'` types a slash. Escape is exempt so "Escape cancels an inline edit" keeps working; note that an `<input type="search">` also clears itself on Escape.

The rule is fixed by design and has no per-binding switch: one rule keeps WCAG 2.1.4 behaviour the same for every shortcut. To keep a modifier combo quiet in a field, gate it with `enabled` or register it in a scope the field is not part of.

### Layout Pitfalls

- AltGr is reported as Ctrl+Alt on Windows and Linux. A press with AltGr held is character input and never matches a `ctrl`, `alt` or `mod` combo, so `ctrl+alt+*` and `mod+alt+*` cannot be pressed on layouts that type through AltGr (German `€`, `@`); registering one warns CNGX1079. Prefer `mod+shift+*`.
- `alt` and `shift` combos on letters and digits match the physical key when the layout transformed the character (Option+B is `∫` on macOS, Shift+1 is `!`).
- Browser-reserved combos (`mod+w`, `mod+t`, `mod+n`, `mod+q`, `ctrl+tab`, `alt+f4` and their Shift variants) reach the browser first; registering one warns CNGX1078. A malformed combo (`ctrl+`, `hyper+k`) never fires and warns CNGX1080.

## Keyboard Shortcut Syntax

Shortcut strings use modifiers and keys separated by `+`:

**Modifiers:**
- `mod` - Platform-aware: Cmd on macOS, Ctrl elsewhere
- `ctrl` - Control key
- `shift` - Shift key
- `alt` - Alt/Option key
- `meta` - Windows/Command key

**Keys:**
- Single keys: `'a'`, `'1'`, `'escape'` (or `'esc'`), `'enter'`, `'space'`, `'+'` (written `'mod++'` after a modifier)
- Arrow keys: `'arrowup'`, `'arrowdown'`, `'arrowleft'`, `'arrowright'`
- Function keys: `'f1'`, `'f2'`, ... `'f12'`

**Examples:**
- `'mod+s'` - Cmd+S (macOS) or Ctrl+S (Windows/Linux)
- `'ctrl+shift+k'` - Ctrl+Shift+K
- `'escape'` - Escape key alone
- `'enter'` - Enter key alone

## See Also

- [compodocx API documentation](https://cngxjs.github.io/cngx/)
- [CngxLongPress and CngxSwipeDismiss](../gestures/) - Gesture-based interactions
- [parseKeyCombo from @cngx/core/utils](../../../core/utils/) - Keyboard parsing utilities
- Demo: `examples/stories/common/keyboard-demo/`
- Tests: `projects/common/interactive/keyboard/keyboard-shortcut.directive.spec.ts`
