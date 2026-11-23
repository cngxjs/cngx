# Keyboard Interactions

Keyboard shortcut, hotkey registry and search input directives. Outside-press dismissal lives in [CngxClickOutside](../click-outside/).

## Import

```typescript
import {
  CngxKeyboardShortcut,
  CngxHotkeyScope,
  injectHotkey,
  injectHotkeys,
  CngxSearch,
} from '@cngx/common/interactive';
import { type KeyCombo } from '@cngx/core/utils';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxKeyboardShortcut, CngxSearch } from '@cngx/common/interactive';

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
  `,
  imports: [CngxKeyboardShortcut, CngxSearch],
})
export class SearchComponent {}
```

## Accessibility

- **ARIA roles:** None (behavioral directives)
- **Keyboard interaction:**
  - CngxKeyboardShortcut: Emits on matching keyboard events
  - CngxSearch: Standard text input keyboard behavior
- **Screen reader:**
  - CngxKeyboardShortcut sets `aria-keyshortcuts` on its host from the combo (`Control+K`, `Meta+K` on macOS) while it is enabled and not muted; do not set it by hand
  - Search input is a standard form control
- **Focus management:**
  - All directives preserve focus
  - No focus traps

## Composition

Keyboard directives are orthogonal interaction atoms:

- **Host directives:** None
- **Combines with:** Forms, buttons, overlays, searches
- **Provides:** Keyboard event handling

### Example: Composition Pattern

```typescript
// Search with shortcut to focus
<button [cngxKeyboardShortcut]="'mod+k'" (shortcutTriggered)="focusSearch()">
  Open search
</button>

<input cngxSearch #search="cngxSearch"
       [value]="search.term()"
       (searchChange)="query.set($event)" />
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

`'self'` fires only while focus is inside the host, so the shortcut sits on the dialog itself: Escape closes it from any control inside and stays free everywhere else. `#modal` without a value is the `HTMLDialogElement`.

```typescript
<dialog #modal [cngxKeyboardShortcut]="'escape'" [shortcutScope]="'self'"
        (shortcutTriggered)="modal.close()">
  <h2>Confirm Action</h2>
  <p>Are you sure?</p>

  <button (click)="modal.close()">Cancel</button>
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
readonly query = signal('');
// No request while the query is empty.
readonly results = httpResource<readonly Item[]>(() =>
  this.query() ? `/api/search?q=${encodeURIComponent(this.query())}` : undefined,
);

<input cngxSearch (searchChange)="query.set($event)" placeholder="Search..." />

<ul>
  @for (item of results.value() ?? []; track item.id) {
    <li>{{ item.name }}</li>
  }
</ul>
```

### Debounce, flush and cancel

`debounceMs` (default `300`) is the delay between the last `input` event and the `term` / `searchChange` update; `0` or less updates synchronously on every `input` event. A host that handles keys while a term is pending settles it explicitly:

- `flush()` emits the pending term at once, e.g. on Enter so the pick runs against what the user typed.
- `cancel()` drops the pending term, e.g. when a panel closes and must not receive a late write. The input keeps its text.
- `clear()` drops a pending term, empties `term` and the input, and emits `searchChange('')` only when the term was not empty.

`flush()` and `cancel()` return whether a term was pending.

```typescript
<input cngxSearch #search="cngxSearch" [debounceMs]="150"
       (keydown.enter)="search.flush()"
       (keydown.escape)="search.cancel()" />
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

The outside dismissal comes from [CngxClickOutside](../click-outside/).

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

### Help List

`registry.liveGroupsFor(context)` returns the bindings that would fire for a focus context (`null` = the document) as `CngxHotkeyGroup[]`: grouped by `group` (`null` for ungrouped), deduped by `id` with the deeper scope winning, without bindings that lack a `description`, are disabled, sit in a muted scope or are cut off by a modal. Read inside a `computed()` it is reactive, and it returns the previous array while the listing is structurally unchanged.

```typescript
private readonly registry = injectHotkeyRegistry();
readonly groups = computed(() => this.registry.liveGroupsFor(null));
```

### Replacing the Registry

Provide `CNGX_HOTKEY_REGISTRY` with a factory to swap the keymap for the app or isolate a subtree. `createHotkeyRegistry(deps)` needs no injection context (its deps come in as arguments), so a replacement can wrap it; `injectHotkeyRegistryDeps()` supplies the default `DOCUMENT` and macOS flag. The replacement implements `CngxHotkeyRegistry` (`isMac`, `register`, `liveGroupsFor`, `destroy`), resolves scopes through `resolveHotkeyScopeChain`, and calls `destroy()` on teardown so its document listener does not outlive the injector.

`CngxHotkeyRegistryFactory` is the factory signature `createHotkeyRegistry` satisfies; type a replacement against it.

```typescript
// Wrap or replace the default; the type pins the contract.
const myRegistry: CngxHotkeyRegistryFactory = (deps) => createHotkeyRegistry(deps);

providers: [
  {
    provide: CNGX_HOTKEY_REGISTRY,
    useFactory: () => {
      const registry = myRegistry(injectHotkeyRegistryDeps());
      inject(DestroyRef).onDestroy(() => registry.destroy());
      return registry;
    },
  },
]
```

### Scopes

A press resolves from the focused element outwards through the hotkey scopes that contain it:

- `[cngxHotkeyScope]` marks a region. `reach: 'focus'` bindings registered below it (and `[shortcutScope]="'self'"` shortcuts on their host) fire only while focus is inside it.
- `[cngxHotkeyScopeModal]="true"` makes it modal: while focus is inside (or has dropped to the body), global bindings outside it stay quiet and their combos do not reach the browser either. Modal dialogs and drawers provide this scope themselves.
- `[cngxHotkeyScopeActive]="false"` mutes everything registered below it: the bindings never fire and are not listed, without unregistering.
- The deeper scope wins when two bindings match one press (intended shadowing, silent). Two matches at the same depth run the later registration and warn [`CNGX1077`](../../../../core-concepts/error-codes/cngx1077.md) in dev mode.

### Text Entry

Inside a text-entry target (`isTextEntryTarget` from `@cngx/core/utils`: a `textarea`, a `select`, an `input` of any type except button, submit, reset, checkbox, radio, range, color, file, image and hidden, so date, time, month, week and number count; an editable `contenteditable` region; an element with `role="textbox"` / `role="searchbox"`; also inside shadow DOM), only combos with `ctrl`, `meta` or `mod`, function keys (`f1`-`f24`) and `escape` fire, for every scope. Bare keys, Shift-only and Alt-only combos never fire there, so `'mod+k'` works while typing and `'/'` types a slash. Escape is exempt so "Escape cancels an inline edit" keeps working; note that an `<input type="search">` also clears itself on Escape.

The rule is fixed by design and has no per-binding switch: one rule keeps WCAG 2.1.4 behaviour the same for every shortcut. To keep a modifier combo quiet in a field, gate it with `enabled` or register it in a scope the field is not part of.

### Layout Pitfalls

- AltGr is reported as Ctrl+Alt on Windows and Linux. A press with AltGr held is character input and never matches a `ctrl`, `alt` or `mod` combo, so `ctrl+alt+*` and `mod+alt+*` cannot be pressed on layouts that type through AltGr (German `€`, `@`); registering one warns [`CNGX1079`](../../../../core-concepts/error-codes/cngx1079.md). Prefer `mod+shift+*`.
- `alt` and `shift` combos on letters and digits match the physical key when the layout transformed the character (Option+B is `∫` on macOS, Shift+1 is `!`).
- Browser-reserved combos (`mod+w`, `mod+shift+w`, `mod+t`, `mod+shift+t`, `mod+n`, `mod+shift+n`, `mod+q`, `ctrl+tab`, `ctrl+shift+tab`, `ctrl+pagedown`, `ctrl+pageup`, `alt+f4`) reach the browser first; registering one warns [`CNGX1078`](../../../../core-concepts/error-codes/cngx1078.md). A malformed combo (`ctrl+`, `hyper+k`) never fires and warns [`CNGX1080`](../../../../core-concepts/error-codes/cngx1080.md).

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

- [compodocx API documentation](https://cngxjs.github.io/cngx/main/common/interactive/keyboard/)
- [CngxLongPress and CngxSwipeDismiss](../gestures/) - Gesture-based interactions
- [parseKeyCombo from @cngx/core/utils](../../../core/utils/) - Keyboard parsing utilities
- [CngxClickOutside](../click-outside/) - Outside-press dismissal
- Demos: `examples/stories/common/interactive/gestures/keyboard-shortcut/`, `examples/stories/common/interactive/search/`
- Tests: `projects/common/interactive/keyboard/keyboard-shortcut.directive.spec.ts`
