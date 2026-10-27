# CngxActionButton

Async action button on the cngx button core: status labels, visual feedback and optional toast notifications on the native `<button>`.

## Import

```typescript
import { CngxActionButton } from '@cngx/ui/action-button';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxActionButton } from '@cngx/ui/action-button';

@Component({
  selector: 'app-example',
  template: `
    <button cngxActionButton tone="primary" [action]="save" pendingLabel="Saving..." succeededLabel="Saved">
      Save Draft
    </button>
  `,
  imports: [CngxActionButton],
})
export class ExampleComponent {
  save = () => this.http.post('/api/draft', {});
}
```

## Overview

`button[cngxActionButton]` is an attribute component on the native `<button>`. `CngxAsyncClick` runs as a host directive on the same element, so the button carries `aria-busy`, the async state classes and the click guard itself; every attribute you write lands on the real button. The visual axes are the `CngxButton` ones: `cngxActionButton="outline"` binds the variant, `tone` and `size` are inputs, and `provideButtonConfig` / a button group apply as for `cngxButton`.

Three feedback pathways:

1. **Labels** - `pendingLabel`, `succeededLabel`, `failedLabel` strings
2. **Template slots** - `cngxPending`, `cngxSucceeded`, `cngxFailed` directives
3. **State** - bind `btn.state` to any state consumer

The idle content and the status labels render stacked in one cell; only the active one is visible and part of the button name. The button is always as wide as its widest label, so it never jumps after a run. Without a pending label or template, the idle label stays in place under the busy spinner.

## Accessibility

- **Name:** the visible label is the name; inactive labels are `aria-hidden`.
- **Busy:** `aria-busy` while the action (or a bound `[externalState]`) is pending; the button is `aria-disabled` and swallows clicks until it settles.
- **Disabled says why:** `[disabled]` renders `aria-disabled="true"` (the button stays focusable) and `disabledReason` is referenced through `aria-describedby` while disabled.
- **Announcements:** the `cngxAsyncClick` live region next to the button speaks the settle, including an external success or failure: `succeededAnnouncement` -> `succeededLabel` -> the `CNGX_INTERACTIVE_I18N` default, same for failure. A language switch never re-voices a shown announcement.
- **Keyboard:** native button; `Enter` / `Space` run the action, focus stays on the button.

## Composition

- **Host directive:** `CngxAsyncClick` (`action` and `feedbackDuration` forwarded).
- **Core:** the `CngxButton` brain from `@cngx/common/button`; `CNGX_HOST_INTERACTION_STATE` tells the directive about `[disabled]`, an external run and the announcement text.
- **Combines with:** `CngxPending`, `CngxSucceeded`, `CngxFailed`; `CngxToaster` for toast integration; `[cngxToastOn]` on the same element as an alternative to the toast inputs (not both, `CNGX3008`).

```html
<button cngxActionButton #btn="cngxActionButton" [action]="save">Save</button>
<cngx-alert [state]="btn.state" title="Save status" />
```

## Styling

The box, paint, sizes, disabled and busy states come from the `CngxButton` sheet (`--cngx-button-*` tokens). This component only adds the label stack. The `cngxAsyncClick` state classes are still set on the host, but `@cngx/common/theming/components/cngx-async.css` skips `.cngx-button` hosts: pending shows the button's busy ring, and the settle result is the label swap plus the live region (and the optional toast). The `--cngx-async-*` tokens do not tint this button.

## Migrating from `<cngx-action-button>`

- `<cngx-action-button [action]="save">Save</cngx-action-button>` becomes `<button cngxActionButton [action]="save">Save</button>`.
- `variant="primary" | "secondary" | "ghost"` and `ActionButtonVariant` are gone: use `tone="primary"` for the old filled default, `cngxActionButton="outline"` or `"ghost"` for the others.
- `[enabled]="false"` becomes `[disabled]="true"`; `disabledReason` keeps working.
- The `--cngx-action-btn-*` colour, radius and padding tokens are gone; theme the `--cngx-button-*` tokens instead.
- The async state tokens moved to `@cngx/common` and were renamed: `--cngx-action-btn-pending-opacity` -> `--cngx-async-pending-opacity`, `--cngx-action-btn-transition` -> `--cngx-async-transition`, `--cngx-action-btn-succeeded-{bg,color,border}` -> `--cngx-async-success-{bg,color,border}`, `--cngx-action-btn-failed-{bg,color,border}` -> `--cngx-async-error-{bg,color,border}`. The colour tokens have no registered default any more: unset, they follow `--cngx-color-success` / `--cngx-color-danger` in both colour schemes.
