# Error State

Generic host-element marker that reflects an error flag onto any DOM node. Toggles the `.cngx-error` class hook and the reactive `aria-invalid` / `aria-errormessage` attributes from a single boolean. Purely presentational: it does not own the error, it surfaces it. Inside a `CngxErrorScope` the error shows only while the scope is revealed.

Family: `CngxErrorRegistry` (root store), `CngxErrorAggregator` (groups sources), `CngxErrorScope` (boundary), `CngxErrorSource` (feeds the nearest aggregator), `CngxErrorState` (this - the host-level visual and ARIA reflection).

## Import

```ts
import { CngxErrorState } from '@cngx/common/interactive';
```

## Quick start

```html
<input
  [cngxErrorState]="emailField().invalid()"
  cngxErrorMessageId="email-error"
/>
<span id="email-error" role="alert" [attr.aria-hidden]="emailField().invalid() ? null : 'true'">
  Please enter a valid email.
</span>
```

The signal is invoked at the binding site (canonical Angular pattern) - the directive receives a plain `boolean`, not a signal. Works on cngx, Material, CDK, native HTML, and third-party hosts.

## Accessibility

`aria-invalid` is always emitted as the explicit string `"true"` or `"false"` - cngx convention is that ARIA state attributes stay in the DOM and toggle their value, not their presence.

The error is shown when the flag is `true` and the ancestor `CNGX_ERROR_SCOPE`, if there is one, reports `showErrors()`. Before `reveal()` and after `reset()` the host gets no class and `aria-invalid="false"`. Without a scope the flag alone decides.

`aria-errormessage` references `cngxErrorMessageId` only while the error is shown; otherwise the attribute is absent. Keep the message element in the DOM; hiding its text while valid is the consumer's job, typically via `aria-hidden` on the message itself - see the Quick start.

Do not put `[cngxErrorState]` on a form-field control (`cngxInput` and other `CNGX_FORM_FIELD_CONTROL` hosts): both bind the same ARIA attributes. Dev mode warns with [`CNGX1084`](../../../../core-concepts/error-codes/cngx1084.md).

The directive does not own a live region. Announcement strategy is decided by the consumer (`role="alert"` on the message, `CngxAlertOn` / `CngxToastOn` on a feedback bridge, or the registry's reveal-on-submit flow).

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/error-state/) for inputs and host bindings.
- Stories: `examples/stories/common/interactive/error/state/`.
- Family: `CngxErrorRegistry`, `CngxErrorAggregator`, `CngxErrorScope`, `CngxErrorSource`.
