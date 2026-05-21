# Error State

Generic host-element marker that reflects an error flag onto any DOM node. Toggles the `.cngx-error` class hook and the reactive `aria-invalid` / `aria-errormessage` attributes from a single boolean. Purely presentational: it does not own the error, it surfaces it.

Family: `CngxErrorRegistry` (root store), `CngxErrorAggregator` (groups sources), `CngxErrorScope` (boundary), `CngxErrorSource` (feeds the registry), `CngxErrorState` (this - the host-level visual and ARIA reflection).

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

`aria-errormessage` is emitted whenever a non-empty `cngxErrorMessageId` is bound, regardless of the error flag. The id-bearing reference stays stable so the AT relationship survives between valid and invalid states. Visibility of the message element is the consumer's job, typically via `aria-hidden` on the message itself - see the Quick start.

The directive does not own a live region. Announcement strategy is decided by the consumer (`role="alert"` on the message, `CngxAlertOn` / `CngxToastOn` on a feedback bridge, or the registry's reveal-on-submit flow).

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and host bindings.
- Stories: `examples/stories/common/interactive/error-state/`.
- Family: `CngxErrorRegistry`, `CngxErrorAggregator`, `CngxErrorScope`, `CngxErrorSource`.
