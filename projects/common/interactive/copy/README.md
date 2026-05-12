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

- [compodoc API documentation](https://cngxjs.github.io/cngx/)
- Demo: `dev-app/src/app/demos/common/copy-demo/`
- Tests: `projects/common/interactive/copy/copy-text.directive.spec.ts`
