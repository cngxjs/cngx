# @cngx/common/interactive

Click, gesture, navigation, speech, and async action directives.

## CngxAsyncClick

Async click handler with loading state, auto-disable, and success/error feedback.
Place on any clickable element. Executes the provided async action on click,
tracks pending/succeeded/failed state, auto-disables during execution, and resets
feedback after a configurable duration.

```html
<button [cngxAsyncClick]="saveAction" #ac="cngxAsyncClick">
  @if (ac.pending()) { Saving... }
  @else if (ac.succeeded()) { Saved! }
  @else if (ac.failed()) { Failed }
  @else { Save }
</button>
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxAsyncClick` | `AsyncAction` | required | Async action: `() => Promise \| Observable` |
| `feedbackDuration` | `number` | `2000` | Duration in ms to show success/error state before reset |
| `enabled` | `boolean` | `true` | When `false`, clicks are ignored |
| `succeededAnnouncement` | `string` | `'Action succeeded'` | Label announced to screen readers on success |
| `failedAnnouncement` | `string` | `'Action failed'` | Label announced to screen readers on failure |

### Signals

| Signal | Type | Description |
|-|-|-|
| `pending` | `boolean` | `true` while the action is executing |
| `succeeded` | `boolean` | `true` for `feedbackDuration` ms after success |
| `failed` | `boolean` | `true` for `feedbackDuration` ms after failure |
| `error` | `unknown` | Error value from a failed action (cleared on reset) |
| `status` | `AsyncStatus` | Discriminated lifecycle status: `'idle'`, `'pending'`, `'succeeded'`, `'failed'` |
| `announcement` | `string` | Screen reader announcement for the current state |

### CSS Classes

| Class | When |
|-|-|
| `cngx-async--pending` | Action is executing |
| `cngx-async--succeeded` | Success feedback window |
| `cngx-async--failed` | Error feedback window |

### ARIA

- `aria-busy="true"` when pending
- `aria-disabled="true"` when pending
- Native `disabled` attribute set on `<button>`, `<input>`, `<select>`, `<textarea>` when pending

### Selector

`[cngxAsyncClick]` -- exportAs `"cngxAsyncClick"`

### Notes

- Built-in double-click guard: clicks are ignored while `pending()` is `true`.
- Accepts both `Promise` and `Observable` return types. Observables are converted via `firstValueFrom`.
- Feedback timer is cleared on destroy.
- Guards against state updates after directive destruction.

### Types

```typescript
type AsyncAction = () => Promise<unknown> | Observable<unknown>;
type AsyncStatus = 'idle' | 'pending' | 'succeeded' | 'failed';
```

## Other Exports

`CngxClickOutside`, `CngxDisclosure`, `CngxNavLink`, `CngxNavLabel`, `CngxNavBadge`,
`CngxNavGroup`, `CngxNavGroupRegistry`, `CngxSearch`, `CngxSpeak`, `CngxSwipeDismiss`,
`CngxHoverable`, `CNGX_NAV_CONFIG`, `provideNavConfig`, `injectNavConfig`
