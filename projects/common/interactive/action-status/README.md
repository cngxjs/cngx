# Action Status

The status layer of an action host. `CngxActionStatusBrain` picks the visible label cell and the settle announcement on top of a co-hosted `cngxAsyncClick`; `CngxActionStatusCell` and `CngxActionStatusStack` render the cells. `CngxAsyncStatus` is the read-only sibling: it reflects a state someone else owns onto any host.

## Import

```ts
import {
  CngxActionStatusBrain,
  CngxActionStatusCell,
  CngxActionStatusStack,
  CngxAsyncStatus,
  provideActionStatusConfig,
  provideActionStatusConfigAt,
  withActionStatusLabels,
  withActionStatusTemplates,
} from '@cngx/common/interactive';
```

## Quick start

An app-written action button on the brain directives. `CngxAsyncClick` runs the action and owns the live region, the brain picks the cell, `CngxActionStatusStack` renders the cells on the host's label span:

```ts
@Component({
  selector: 'button[appSave]',
  imports: [CngxActionStatusStack],
  hostDirectives: [
    CngxButtonBrain,
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    {
      directive: CngxActionStatusBrain,
      inputs: ['pendingLabel', 'succeededLabel', 'failedLabel', 'externalState'],
      outputs: ['outcome'],
    },
  ],
  // A button host gets both host providers from @cngx/common/button.
  providers: [provideButtonHost('appSave', { defaultVariant: 'solid' }), provideActionStatusHost()],
  template: `<span cngxActionStatusStack><ng-content /></span>`,
})
export class SaveButton {}
```

```html
<button appSave [action]="save" pendingLabel="Saving..." succeededLabel="Saved">Save</button>
```

## CngxActionStatusBrain

A selector-less host directive (`exportAs: 'cngxActionStatusBrain'`) that provides `CNGX_ACTION_STATUS`. It renders nothing and sets `data-status` and `data-status-label` on the host.

- **Inputs:** `pendingLabel`, `succeededLabel`, `failedLabel` (a bound `''` switches that cell off), `succeededAnnouncement`, `failedAnnouncement`, `announce` (`'auto'` | `'always'` | `'never'`, default `'auto'`) and `externalState`.
- **Output:** `outcome` emits once per own settle and once per `success` / `error` edge of a bound external state.
- **Cell content**, high to low: the projected `cngxPending` / `cngxSucceeded` / `cngxFailed` template, the bound label, the `templates` of `CNGX_ACTION_STATUS_CONFIG`, the config `labels`, the actionStatus section of the language pack. The English pack is empty, so without any of them a state has no cell.
- **Busy gating:** while the runner's busy visual is held the pending cell shows (or none), the result cells only once it releases, so a run faster than the show delay goes from idle to the result with no pending flash.
- **`externalState`:** bound, the status, `state`, `outcome` and the announcement follow that state, and the own runs speak nothing. Unbinding it or the state going back to `idle` empties the live region.
- Needs a co-hosted `cngxAsyncClick`; without one the first read throws [`CNGX1082`](../../../../core-concepts/error-codes/cngx1082.md).

## CngxActionStatusCell

`[cngxActionStatusCell]="'idle' | 'pending' | 'success' | 'error'"` marks one label cell. It binds `data-active` and `aria-hidden` from the brain's `activeCell()`, so only the active cell is visible and names the host; the others stay mounted and keep the width of the widest label. The `success` and `error` cells register their element, so the settle announcement reads the rendered result text. The cell carries `.cngx-action-status-cell`; a host that writes its cells by hand brings the rule that stacks them and hides the inactive ones.

## CngxActionStatusStack

`span[cngxActionStatusStack]` renders the cells as its direct children: the `idle` cell with the projected content, then the `pending`, `success` and `error` cells the brain's `hasCell()` asks for. `cngxFailed` gets the error as `$implicit`. Its own sheet stacks the cells in one grid cell. `cellClass` puts the host's class on every cell.

## CngxAsyncStatus

`[cngxAsyncStatus]` (`exportAs: 'cngxAsyncStatus'`) reflects an externally-owned `CngxAsyncState` onto its host: a presenter's `commitState`, a resource. It reads a state; `CngxAsyncClick` runs an action.

- **Inputs:** `cngxAsyncStatus` (the state, `null` reflects as idle) and `disableWhilePending`.
- **Signals:** `status()` is the display bucket (`loading` and `refreshing` fold into `pending`), `isBusy()`, `error()`, and `activeTemplate()`, the projected `cngxPending` / `cngxSucceeded` / `cngxFailed` for the current bucket or `null`.
- **Host bindings:** `aria-busy` while busy. With `[disableWhilePending]="true"`, `aria-disabled` while busy and a swallowed activation (click, auxclick, and the click a `<button>` synthesises for Enter and Space). The native `disabled` attribute is never set, so a focused host keeps focus.
- Never put it on the same element as `cngxAsyncClick`: both bind `aria-busy`. Dev mode warns with [`CNGX1019`](../../../../core-concepts/error-codes/cngx1019.md).

The directive has no template of its own, so the host reads it through the export:

```html
<button [cngxAsyncStatus]="presenter.commitState" [disableWhilePending]="true"
        #status="cngxAsyncStatus">
  @switch (status.status()) {
    @case ('pending') { Saving... }
    @case ('error') { Retry }
    @default { Continue }
  }
</button>
```

## Configuration

`provideActionStatusConfig(...)` registers app-wide labels and templates. It merges over the config of the parent injector per key, so a lazy route keeps the root's keys it does not set. `provideActionStatusConfigAt(...)` is the component-scoped twin for `viewProviders`.

```ts
bootstrapApplication(App, {
  providers: [
    provideActionStatusConfig(withActionStatusLabels({ pending: 'Saving...', succeeded: 'Saved' })),
  ],
});
```

`withActionStatusTemplates(...)` takes `TemplateRef`s, which need a live view; build that config with `makeActionStatusConfig` in a `useFactory` below a rendered holder component.

## Accessibility

Only the active cell is exposed; the others are `aria-hidden`. The runner's live region speaks once per settle: the explicit announcement, then the rendered result cell, then the label, then the i18n copy. A co-hosted `CNGX_ANNOUNCEMENT_COVER` (a toast, a close-on-success) keeps the region empty for an outcome it voices itself, unless `announce` is `'always'`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/action-status/) for inputs, signals and tokens.
- Demo: `/#/ui/action-button/async-button/ejected-host`.
- `CngxAsyncClick` (`../async-click/README.md`), the runner the brain sits on.
