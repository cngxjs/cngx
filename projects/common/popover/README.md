# @cngx/common/popover

Signal-driven popover, tooltip, and popover panel components built on the native **Popover API** and **CSS Anchor Positioning**. No CDK Overlay, no z-index management, no JavaScript positioning by default.

## Features

- Native Popover API (`popover="manual"` / `popover="auto"`) with Top Layer
- CSS Anchor Positioning (Chrome 125+, Firefox 131+, Safari 18.4+)
- Optional Floating UI fallback for older browsers
- Signal-driven state machine (`closed` -> `opening` -> `open` -> `closing` -> `closed`)
- Transition-aware lifecycle with CSS class hooks
- WCAG 1.4.13 compliant tooltips (dismissable, hoverable, persistent)
- Material theme SCSS with M3 tokens
- Exclusive mode (one popover at a time by default)

## Quick Start

```typescript
import {
  CngxPopover,
  CngxPopoverTrigger,
  CngxTooltip,
} from '@cngx/common/popover';
```

### Tooltip

```html
<button cngxTooltip="Save (Ctrl+S)">Save</button>

<button cngxTooltip="Delete item" tooltipPlacement="bottom" [tooltipDelay]="500">
  Delete
</button>
```

### Click Popover

```html
<button [cngxPopoverTrigger]="pop" (click)="pop.toggle()">Menu</button>
<div cngxPopover #pop="cngxPopover" placement="bottom-start">
  <menu>
    <li><button (click)="pop.hide()">Edit</button></li>
    <li><button (click)="pop.hide()">Delete</button></li>
  </menu>
</div>
```

### Controlled Popover

```html
<div cngxPopover [cngxPopoverOpen]="showErrors()" role="alert">
  {{ errorSummary() }}
</div>
```

## Popover Panel

Rich popover molecule with header/body/footer slots, variant styling, arrow, close button, and async action buttons.

```typescript
import {
  CngxPopoverPanel,
  CngxPopoverTrigger,
  CngxPopoverHeader,
  CngxPopoverBody,
  CngxPopoverFooter,
  CngxPopoverAction,
  providePopoverPanel,
  withCloseButton,
  withArrow,
  withAutoDismiss,
} from '@cngx/common/popover';
import { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';
```

```html
<button [cngxPopoverTrigger]="panel.popover" (click)="panel.popover.toggle()">
  Delete
</button>
<cngx-popover-panel #panel variant="danger" [showClose]="true" [showArrow]="true"
                    [hasFooter]="true" placement="bottom">
  <span cngxPopoverHeader>Delete Item?</span>
  <p cngxPopoverBody>This action cannot be undone.</p>
  <div cngxPopoverFooter>
    <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
    <cngx-popover-action role="confirm" [action]="deleteItem" variant="danger">
      Delete
      <ng-template cngxPending>Deleting...</ng-template>
      <ng-template cngxSucceeded>Deleted!</ng-template>
      <ng-template cngxFailed let-err>{{ err }}</ng-template>
    </cngx-popover-action>
  </div>
</cngx-popover-panel>
```

### Content States

```html
<cngx-popover-panel [loading]="isLoading()" [error]="loadError()">
  <p cngxPopoverBody>Loaded content here</p>
  <ng-template cngxPopoverLoading>Loading...</ng-template>
  <ng-template cngxPopoverError let-err>Failed: {{ err }}</ng-template>
  <ng-template cngxPopoverEmpty>No data found</ng-template>
</cngx-popover-panel>
```

### Custom Close Button

```html
<cngx-popover-panel [showClose]="true">
  <ng-template cngxPopoverClose>
    <button mat-icon-button (click)="panel.popover.hide()">
      <mat-icon>close</mat-icon>
    </button>
  </ng-template>
  ...
</cngx-popover-panel>
```

## Configuration

### Global Defaults

```typescript
providers: [
  providePopoverPanel(
    withCloseButton(),                              // showClose=true globally
    withArrow(),                                     // showArrow=true globally
    withAutoDismiss({ info: 5000, success: 3000 }), // auto-close per variant
    withCloseOnSuccess(300),                         // close after async action success
    withDefaultVariant('default'),                   // default variant
  ),
]
```

### Variants

The `variant` input is a free-form string mapped to CSS class `cngx-popover-panel--{variant}`. Five are pre-themed: `default`, `info`, `success`, `warning`, `danger`. Add custom variants via CSS:

```css
.cngx-popover-panel--beta {
  --cngx-pp-accent: purple;
  --cngx-pp-accent-text: white;
}
```

## Theming

### Material Theme

```scss
@use '@angular/material' as mat;
@use '@cngx/common/popover/tooltip-theme' as tooltip;
@use '@cngx/common/popover/popover-panel-theme' as panel;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include tooltip.theme($theme);
  @include panel.theme($theme);
}
```

### Tooltip Indicator (opt-in)

```scss
@use '@cngx/common/popover/tooltip-indicator' as indicator;

// Touch devices only (recommended)
@include indicator.touch-only();

// Or always visible
@include indicator.always();
```

Customizable via CSS custom properties: `--cngx-tooltip-indicator-size`, `--cngx-tooltip-indicator-gap`, `--cngx-tooltip-indicator-color`, `--cngx-tooltip-indicator-opacity`, `--cngx-tooltip-indicator-icon`.

## Browser Support

### Native Support (zero polyfills needed)

- Chrome 125+
- Firefox 131+
- Safari 18.4+

### Older Browsers

**Popover API polyfill** (required for browsers without `showPopover()`):

```bash
npm install @oddbird/popover-polyfill
```

```typescript
// polyfills.ts
import '@oddbird/popover-polyfill';
```

A DevMode warning is logged automatically when the Popover API is missing.

**CSS Anchor Positioning fallback** (optional, for positioning in older browsers):

```bash
npm install @floating-ui/dom
```

```typescript
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { provideFloatingFallback } from '@cngx/common/popover';

providers: [
  provideFloatingFallback(computePosition, [offset(8), flip(), shift()]),
]
```

The library never imports `@floating-ui/dom` directly. When not provided, positioning falls back to browser defaults. Zero bundle impact for modern browsers.

## API Reference

### Atoms

| Directive | Selector | Description |
|-|-|-|
| `CngxPopover` | `[cngxPopover]` | State machine, native popover lifecycle, transitions, Escape |
| `CngxPopoverTrigger` | `[cngxPopoverTrigger]` | ARIA (`aria-expanded`, `aria-controls`, `aria-haspopup`), anchor positioning |
| `CngxTooltip` | `[cngxTooltip]` | String-input tooltip, hover/focus triggers, delays, SR-friendly |

### Molecules

| Component | Selector | Description |
|-|-|-|
| `CngxPopoverPanel` | `cngx-popover-panel` | Rich panel with slots, variants, arrow, close, content states |
| `CngxPopoverAction` | `cngx-popover-action` | Async footer button with template projections |

### Slot Directives

| Directive | Selector | Description |
|-|-|-|
| `CngxPopoverHeader` | `[cngxPopoverHeader]` | Header content marker |
| `CngxPopoverBody` | `[cngxPopoverBody]` | Body content marker |
| `CngxPopoverFooter` | `[cngxPopoverFooter]` | Footer content marker |
| `CngxPopoverClose` | `ng-template[cngxPopoverClose]` | Custom close button override |

### Content State Templates

| Directive | Selector | Description |
|-|-|-|
| `CngxPopoverLoading` | `ng-template[cngxPopoverLoading]` | Shown when `[loading]="true"` |
| `CngxPopoverEmpty` | `ng-template[cngxPopoverEmpty]` | Shown when `[empty]="true"` |
| `CngxPopoverError` | `ng-template[cngxPopoverError]` | Shown when `[error]` is truthy (context: `$implicit` = error) |

### Async Action Templates (from `@cngx/common/interactive`)

| Directive | Selector | Description |
|-|-|-|
| `CngxPending` | `ng-template[cngxPending]` | Shown during async action execution |
| `CngxSucceeded` | `ng-template[cngxSucceeded]` | Shown after action success |
| `CngxFailed` | `ng-template[cngxFailed]` | Shown after action failure (context: `$implicit` = error) |

### Configuration

| Function | Description |
|-|-|
| `providePopoverPanel(...features)` | Provide global panel configuration |
| `withCloseButton(show?)` | Default `showClose` for all panels |
| `withArrow(show?)` | Default `showArrow` for all panels |
| `withAutoDismiss(timing)` | Auto-close per variant (`{ info: 5000 }`) |
| `withCloseOnSuccess(delay?)` | Auto-close after async action success |
| `withDefaultVariant(variant)` | Default variant string |
| `provideFloatingFallback(fn, middleware?)` | Floating UI positioning fallback |

### CSS Custom Properties

**Tooltip:**
`--cngx-tooltip-bg`, `--cngx-tooltip-color`, `--cngx-tooltip-font-size`, `--cngx-tooltip-padding-block`, `--cngx-tooltip-padding-inline`, `--cngx-tooltip-border-radius`, `--cngx-tooltip-max-width`, `--cngx-tooltip-transition-duration`

**Panel:**
`--cngx-pp-bg`, `--cngx-pp-color`, `--cngx-pp-border-radius`, `--cngx-pp-padding`, `--cngx-pp-max-width`, `--cngx-pp-shadow`, `--cngx-pp-border`, `--cngx-pp-arrow-size`, `--cngx-pp-accent`, `--cngx-pp-accent-text`, `--cngx-pp-header-font-size`, `--cngx-pp-header-font-weight`, `--cngx-pp-footer-gap`
