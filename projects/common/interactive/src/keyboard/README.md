# Keyboard Interactions

Keyboard shortcut, search input, and click-outside directives.

## Import

```typescript
import {
  CngxKeyboardShortcut,
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

## API

### CngxKeyboardShortcut

Declarative keyboard shortcut handler.

#### Inputs

|-|-|-|-|
| cngxKeyboardShortcut | string | required | Shortcut combo string, e.g. 'mod+s', 'ctrl+shift+k', 'escape' |
| shortcutScope | 'global' \| 'self' | 'global' | 'global' listens on document; 'self' listens only on host |
| enabled | boolean | true | Whether the shortcut is active |

#### Outputs

|-|-|-|
| shortcutTriggered | KeyboardEvent | Emitted when the shortcut fires |

#### Signals

None

#### CSS Custom Properties

None

### CngxSearch

Directive for `<input>` elements with debounced search term tracking.

#### Inputs

|-|-|-|-|
| debounceMs | number | 300 | Debounce delay in milliseconds |

#### Outputs

|-|-|-|
| searchChange | string | Emitted after each debounced input event |

#### Signals

- `term: Signal<string>` — The current debounced search term
- `hasValue: Signal<boolean>` — True when term is non-empty

#### Methods

- `clear(): void` — Clears the search term and resets the input element value

### CngxClickOutside

Emits when the user interacts outside the host element.

#### Inputs

|-|-|-|-|
| eventType | 'pointerdown' \| 'click' \| 'mousedown' \| 'touchstart' | 'pointerdown' | DOM event type to listen for |
| enabled | boolean | true | When false, the directive is disabled and no events are emitted |

#### Outputs

|-|-|-|
| clickOutside | PointerEvent \| MouseEvent \| TouchEvent | Emitted when user interacts outside |

#### Signals

None

## Accessibility

All keyboard directives are fully accessible:

- **ARIA roles:** None (behavioral directives)
- **Keyboard interaction:**
  - CngxKeyboardShortcut: Emits on matching keyboard events
  - CngxSearch: Standard text input keyboard behavior
  - CngxClickOutside: No keyboard interaction (pointer-only)
- **Screen reader:**
  - Announce keyboard shortcuts via aria-label or visible hint text
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

All keyboard directives are behavioral — no built-in styling.

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

## Keyboard Shortcut Syntax

Shortcut strings use modifiers and keys separated by `+`:

**Modifiers:**
- `mod` — Platform-aware: Cmd on macOS, Ctrl elsewhere
- `ctrl` — Control key
- `shift` — Shift key
- `alt` — Alt/Option key
- `meta` — Windows/Command key

**Keys:**
- Single keys: `'a'`, `'1'`, `'escape'`, `'enter'`, `'space'`
- Arrow keys: `'arrowup'`, `'arrowdown'`, `'arrowleft'`, `'arrowright'`
- Function keys: `'f1'`, `'f2'`, ... `'f12'`

**Examples:**
- `'mod+s'` — Cmd+S (macOS) or Ctrl+S (Windows/Linux)
- `'ctrl+shift+k'` — Ctrl+Shift+K
- `'escape'` — Escape key alone
- `'enter'` — Enter key alone

## Implementation Notes

### CngxSearch Debouncing

RxJS is used here legitimately: converting a DOM event stream to a Signal at the API boundary. The raw Observable is never exposed:

```typescript
fromEvent<InputEvent>(inputElement, 'input')
  .pipe(
    map((e) => (e.target as HTMLInputElement).value),
    switchMap((value) => timer(debounceMs).pipe(map(() => value))),
    takeUntilDestroyed()
  )
  .subscribe((term) => {
    termState.set(term);
    searchChange.emit(term);
  });
```

### Click-Outside Logic

CngxClickOutside checks if the event target is outside the host's subtree:

```typescript
if (this.enabled() && !hostElement.contains(eventTarget)) {
  this.clickOutside.emit(event);
}
```

This is cheap and accurate — no z-index or DOM position calculations needed.

### Keyboard Shortcut Matching

Shortcuts are memoized after parsing to avoid re-parsing on every keystroke:

```typescript
private parsedCombo: KeyCombo | null = null;
private parsedComboStr = '';

parseCurrentCombo(): KeyCombo | null {
  const str = this.shortcut();
  if (str !== this.parsedComboStr) {
    this.parsedComboStr = str;
    this.parsedCombo = parseKeyCombo(str);
  }
  return this.parsedCombo;
}
```

Global scope shortcuts skip input elements automatically via `INPUT_TAGS` check.

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxKeyboardShortcut.html)
- [CngxLongPress and CngxSwipeDismiss](../gestures/) — Gesture-based interactions
- [parseKeyCombo from @cngx/core/utils](../../../../../../core/utils/) — Keyboard parsing utilities
- Demo: `dev-app/src/app/demos/common/keyboard-demo/`
- Tests: `projects/common/interactive/src/keyboard/keyboard-shortcut.directive.spec.ts`
