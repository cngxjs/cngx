# Chip Input

Tag-input behaviour on a native `<input>`. Type, press a separator (default: `Enter` or `,`), the directive emits `(tokenCreated)`. Backspace on an empty input emits `(tokenRemoved)` so the consumer drops the last chip. Pasting text with embedded separators emits one token per non-empty fragment. Optional `[validateToken]` runs per-token, supersedes concurrent calls by monotonic id, and exposes its progress as a `CngxStateful<string>` slot that bridges (`<cngx-toast-on />`, `<cngx-banner-on />`) auto-discover.

The directive does not own the chip list. The consumer holds the array, passes it as `[existingTokens]`, and reacts to the two outputs.

## Import

```ts
import { CngxChipInput } from '@cngx/common/interactive';
```

## Quick start

```ts
import { Component, signal } from '@angular/core';
import { CngxChipInput } from '@cngx/common/interactive';
import { CngxChip } from '@cngx/common/display';

@Component({
  selector: 'app-tag-field',
  standalone: true,
  imports: [CngxChipInput, CngxChip],
  template: `
    <div class="chip-strip">
      @for (token of tokens(); track token) {
        <cngx-chip [removable]="true" (remove)="removeToken(token)">{{ token }}</cngx-chip>
      }
      <input
        cngxChipInput
        placeholder="Type a tag and press Enter"
        [existingTokens]="tokens()"
        (tokenCreated)="addToken($event)"
        (tokenRemoved)="popToken()"
      />
    </div>
  `,
})
export class TagField {
  protected readonly tokens = signal<string[]>(['typescript', 'angular']);

  protected readonly addToken = (value: string): void => {
    this.tokens.update((curr) => [...curr, value]);
  };
  protected readonly popToken = (): void => {
    this.tokens.update((curr) => curr.slice(0, -1));
  };
  protected readonly removeToken = (token: string): void => {
    this.tokens.update((curr) => curr.filter((t) => t !== token));
  };
}
```

## Keyboard interaction

| Key | Input state | Behaviour |
|-|-|-|
| `Enter` (default separator) | non-empty | Commit token, clear input. |
| `,` (default separator) | non-empty | Commit token, clear input. |
| any key in `[separators]` | non-empty | Commit token, clear input. |
| `Backspace` | empty | Emit `tokenRemoved`. |
| `Backspace` | non-empty | Default browser deletion. |
| Paste with embedded separator chars | n/a | Splits on the single-char separators, emits one token per non-empty fragment, clears input. |
| Paste without separator chars | n/a | Default paste; input value populates so the user can edit before committing. |

`event.preventDefault()` is called on the separator keydown and on the multi-token paste so the raw character or pasted text never lands in the input.

## Validation slot

The directive provides `CNGX_STATEFUL` via `useExisting`. Its `state.status()` follows `idle -> pending -> success | error` per separator-key invocation. Host attributes mirror that signal:

| State | Host attribute |
|-|-|
| `pending` | `aria-busy="true"` |
| `error` | `aria-invalid="true"` |
| `idle` / `success` | neither attribute set |

Drop a bridge next to the input and it picks up the slot through DI:

```html
<input
  cngxChipInput
  [validateToken]="validateTag"
  (tokenCreated)="addTag($event)"
/>
<cngx-toast-on />
```

Supersede contract: when a second token is committed before the first validation resolves, `validationId` advances and the older resolution is discarded. Only the latest outcome touches the slot and only the latest success emits `tokenCreated`.

## Accessibility

- Place the `<input>` inside a `<label>`, or pair it with a `<label for>` / `aria-label` / `aria-labelledby` like any other native input. The directive does not synthesise a label.
- `aria-busy` and `aria-invalid` are computed from the validation slot. Pair with a visible message bound to `aria-describedby` if rejection is recoverable.
- Backspace-to-remove is silent by default. When chip removal needs to be announced, route `(tokenRemoved)` through an `aria-live` region in the consumer (or use a bridge like `<cngx-toast-on />` keyed off the consumer's state change).
- Chips themselves carry their own ARIA via `CngxChip` / `CngxChipGroup`. The directive only owns the input.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full signature and the `CngxStateful` slot type.
- Stories: `examples/stories/common/interactive/chip-input/`.
- `CngxChip` (`@cngx/common/display`) for the chip atom that renders each token.
- `CngxChipGroup` / `CngxMultiChipGroup` (`@cngx/common/interactive`) when the chip strip needs roving tabindex and group-level keyboard semantics.
