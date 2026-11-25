# Copy Text and Copy Block

Clipboard copy atoms - forms-free versions for @cngx/common.

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

- **ARIA roles:** Button carries native semantics; no extra roles needed
- **Host requirement:** `cngxCopyText` binds `click` only. Put it on a `<button>`; on any other host the consumer supplies `role`, `tabindex` and the `Enter` / `Space` handling
- **Keyboard interaction:**
  - `Enter`: Activates copy (native button behavior)
  - `Space`: Activates copy (native button behavior)
  - Focus remains on button after copy, also on the `execCommand` fallback: the element that had focus before the copy gets it back
- **Screen reader:**
  - `CngxCopyBlock` has one always-present `aria-live="polite"` region. It announces "Copied to clipboard" after a copy and "Copy failed" after a failed one (`copyFailedAnnouncement`); a language switch does not re-voice it
  - `CngxCopyText` has no live region of its own: wire one from `copied()` / `failed()` (see the manual SR region example)
- **Focus management:**
  - Focus stays on the copy button throughout the lifecycle
  - No focus trap

## Composition

CngxCopyText is an atom; CngxCopyBlock is a molecule that composes it:

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

No built-in styling. Bind your own classes from the `copied()` and `failed()` signals, for example `[class.copy--copied]="cp.copied()"` and `[class.copy--failed]="cp.failed()"`:

```scss
button.copy--copied {
  background-color: color-mix(in oklab, var(--cngx-color-success) 12%, transparent);
  border-color: var(--cngx-color-success);
  color: var(--cngx-color-success-text);
}

button.copy--failed {
  background-color: color-mix(in oklab, var(--cngx-color-danger) 12%, transparent);
  border-color: var(--cngx-color-danger);
  color: var(--cngx-color-danger-text);
}
```

### CngxCopyBlock

Uses CSS Custom Properties for theming. Every token inherits, so set it on the block or any ancestor:

```scss
cngx-copy-block {
  --cngx-copy-block-gap: 12px;
  --cngx-copy-block-btn-padding: 6px 12px;
  --cngx-copy-block-btn-bg: var(--color-surface);
  --cngx-copy-block-btn-copied-bg: var(--color-success-light);
  --cngx-copy-block-btn-failed-bg: var(--color-danger-light);
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

`copied()` and `failed()` are never true together. Each stays true for `resetDelay` ms (default 2000) after its attempt, then both are `false` again. `copyFailed` emits the rejection reason of the Clipboard API, or `undefined` when the `execCommand('copy')` fallback reports `false`.

```typescript
<button [cngxCopyText]="text" #cp="cngxCopyText">
  @if (cp.failed()) {
    Copy failed - please try again
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

// Own failure copy (unbound, both follow the interactive language section)
<cngx-copy-block
  [value]="apiKey()"
  failedLabel="Copy blocked"
  failedAnnouncement="The browser blocked clipboard access"
>
  <span class="mono">{{ apiKey() }}</span>
</cngx-copy-block>

// React to the outcome and keep the label longer
<cngx-copy-block
  [value]="apiKey()"
  [resetDelay]="4000"
  (didCopy)="track($event)"
  (copyFailed)="showManualCopyHint()"
>
  <span class="mono">{{ apiKey() }}</span>
</cngx-copy-block>
```

The block forwards `didCopy`, `copyFailed` and `resetDelay` of its inner `CngxCopyText` with the same payloads and default.

A failed copy sets `.cngx-copy-block__button--failed` and paints `--cngx-copy-block-btn-failed-bg` / `-failed-border` / `-failed-color` (12% `--cngx-color-danger`, `--cngx-color-danger`, `--cngx-color-danger-text`).

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

CngxCopyText automatically uses the `document.execCommand('copy')` fallback when the Clipboard API is unavailable. A `false` result counts as a failure. `supported` tells whether the Clipboard API is there; keep the button enabled when it is `false`, or the fallback never runs:

```typescript
<button [cngxCopyText]="text" #cp="cngxCopyText">
  {{ cp.failed() ? 'Copy failed' : 'Copy' }}
</button>
@if (!cp.supported) {
  <small>Your browser copies through the legacy fallback.</small>
}
```

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/copy/)
- Demo: `examples/stories/common/interactive/copy/`
- Tests: `projects/common/interactive/copy/copy-text.directive.spec.ts`
