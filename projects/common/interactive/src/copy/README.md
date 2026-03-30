# Copy Text and Copy Block

Clipboard copy atoms — forms-free versions for @cngx/common.

## Import

```typescript
import { CngxCopyText, CngxCopyBlock } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxCopyText, CngxCopyBlock } from '@cngx/common/interactive';

@Component({
  selector: 'app-api-key',
  template: `
    <cngx-copy-block [value]="apiKey()" buttonLabel="Copy Key">
      <code>{{ apiKey() }}</code>
    </cngx-copy-block>
  `,
  imports: [CngxCopyBlock],
})
export class ApiKeyComponent {
  apiKey = signal('sk_live_abc123xyz...');
}
```

## API

### CngxCopyText

Directive that copies text on click. Use on a button or clickable element.

#### Inputs

|-|-|-|-|
| cngxCopyText | string | required | The text to copy to the clipboard |
| resetDelay | number | 2000 | Duration in ms to keep `copied` true after a successful copy |

#### Outputs

|-|-|-|
| didCopy | string | Emitted after successful copy with the copied text |
| copyFailed | unknown | Emitted when a copy attempt fails |

#### Signals

- `copied: Signal<boolean>` — True for resetDelay ms after successful copy
- `failed: Signal<boolean>` — True when the last copy attempt failed
- `supported: boolean` — Whether the Clipboard API is available in this environment

### CngxCopyBlock

Component that renders a text/code block with a built-in copy button.

#### Inputs

|-|-|-|-|
| value | string | required | The text value to copy to clipboard |
| buttonLabel | string | 'Copy' | Label for the copy button |
| copiedLabel | string | 'Copied!' | Label shown after successful copy |
| srAnnouncement | string | 'Copied to clipboard' | Screen reader announcement on copy |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

None (state managed internally by CngxCopyText)

#### CSS Custom Properties

- `--cngx-copy-block-gap` (8px) — Gap between content and button
- `--cngx-copy-block-btn-border` (currentColor) — Button border color
- `--cngx-copy-block-btn-bg` (transparent) — Button background
- `--cngx-copy-block-btn-color` (inherit) — Button text color
- `--cngx-copy-block-btn-radius` (4px) — Button border radius
- `--cngx-copy-block-btn-padding` (4px 8px) — Button padding
- `--cngx-copy-block-btn-font-size` (0.75rem) — Button font size
- `--cngx-copy-block-btn-copied-bg` (#e8f5e9) — Button background when copied
- `--cngx-copy-block-btn-copied-border` (#2e7d32) — Button border when copied
- `--cngx-copy-block-btn-copied-color` (#2e7d32) — Button text color when copied

## Accessibility

CngxCopyText and CngxCopyBlock are fully accessible:

- **ARIA roles:** Button carries native semantics; no extra roles needed
- **Keyboard interaction:**
  - `Enter`: Activates copy (native button behavior)
  - `Space`: Activates copy (native button behavior)
  - Focus remains on button after copy
- **Screen reader:**
  - Success/failure emitted via aria-live region (see examples)
  - CngxCopyBlock includes an always-present aria-live polite region
  - Copy success is announced: "Copied to clipboard"
- **Focus management:**
  - Focus stays on the copy button throughout the lifecycle
  - No focus trap

## Composition

CngxCopyText and CngxCopyBlock are orthogonal atoms:

- **Host directives:** None
- **Combines with:** Any state management system (can emit custom output)
- **Provides:** Clipboard write capability without forms dependency

### Example: Composition Pattern

```typescript
// CngxCopyText standalone with SR announcement
<code>{{ apiKey() }}</code>
<button [cngxCopyText]="apiKey()" #cp="cngxCopyText">
  {{ cp.copied() ? 'Copied!' : 'Copy' }}
</button>
<span aria-live="polite" class="sr-only">
  {{ cp.copied() ? 'API key copied to clipboard' : '' }}
</span>

// CngxCopyBlock is a ready-made composition
<cngx-copy-block [value]="apiKey()" buttonLabel="Copy">
  {{ apiKey() }}
</cngx-copy-block>
```

## Styling

### CngxCopyText

No built-in styling. Apply CSS classes to your button based on the `copied()` signal:

```scss
button {
  border: 1px solid currentColor;
  padding: 4px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button.cngx-copy--copied {
  background-color: #e8f5e9;
  border-color: #2e7d32;
  color: #2e7d32;
}
```

### CngxCopyBlock

Uses CSS Custom Properties for theming. Override in your component:

```scss
cngx-copy-block {
  --cngx-copy-block-gap: 12px;
  --cngx-copy-block-btn-bg: var(--color-surface);
  --cngx-copy-block-btn-copied-bg: var(--color-success-light);
}
```

## Examples

### Copy a Token

```typescript
@Component({
  template: `
    <code>{{ token() }}</code>
    <button [cngxCopyText]="token()" #cp="cngxCopyText">
      {{ cp.copied() ? 'Copied!' : 'Copy Token' }}
    </button>
  `,
  imports: [CngxCopyText],
})
export class TokenComponent {
  token = signal('abc123xyz');
}
```

### Copy with Error Handling

```typescript
<button [cngxCopyText]="text" #cp="cngxCopyText">
  @if (cp.failed()) {
    Copy failed — please try again
  } @else {
    {{ cp.copied() ? 'Copied!' : 'Copy' }}
  }
</button>
```

### Using CngxCopyBlock

```typescript
// Code snippet with copy button
<cngx-copy-block [value]="'npm install @cngx/common'" buttonLabel="Copy">
  <code>npm install @cngx/common</code>
</cngx-copy-block>

// API key display
<cngx-copy-block [value]="apiKey()" buttonLabel="Copy Key" copiedLabel="Copied!">
  <span class="mono">{{ apiKey() }}</span>
</cngx-copy-block>
```

### Accessibility-First: Manual SR Region

```typescript
<div>
  <code>{{ secretKey() }}</code>
  <button [cngxCopyText]="secretKey()" #cp="cngxCopyText"
          aria-describedby="copy-status">
    Copy
  </button>
  <span id="copy-status" aria-live="polite" class="sr-only">
    @if (cp.copied()) {
      Secret key copied to clipboard. Keep it safe!
    } @else if (cp.failed()) {
      Copy failed. Please enable clipboard access.
    }
  </span>
</div>
```

### Fallback for Older Browsers

CngxCopyText automatically uses `document.execCommand('copy')` fallback when the Clipboard API is unavailable. You can check `supported` to warn users:

```typescript
<button [cngxCopyText]="text" #cp="cngxCopyText"
        [disabled]="!cp.supported">
  {{ !cp.supported ? 'Copy not supported' : 'Copy' }}
</button>
```

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxCopyText.html)
- Demo: `dev-app/src/app/demos/common/copy-demo/`
- Tests: `projects/common/interactive/src/copy/copy-text.directive.spec.ts`
