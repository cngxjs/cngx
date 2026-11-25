---
title: "createForwardedAsyncState: state through an input"
whenToUse: "CNGX_STATEFUL is resolved once, when a bridge injects it. A component that receives its CngxAsyncState through an input cannot hand that object over directly: the input can change or be absent. createForwardedAsyncState(this.state) returns one stable object whose members are computed() reads of whatever is bound right now, and a quiet idle state while nothing is. The panel provides it as CNGX_STATEFUL; the bare cngxToastOn in its template toasts a failure of whichever state is bound. Where the component creates the state itself, provide that state directly; forward only what arrives through an input. The chrome rebinds the input and drives both states."
symbols: [CngxAsyncState]
---

# createForwardedAsyncState: state through an input

CNGX_STATEFUL is resolved once, when a bridge injects it. A component that receives its CngxAsyncState through an input cannot hand that object over directly: the input can change or be absent. createForwardedAsyncState(this.state) returns one stable object whose members are computed() reads of whatever is bound right now, and a quiet idle state while nothing is. The panel provides it as CNGX_STATEFUL; the bare cngxToastOn in its template toasts a failure of whichever state is bound. Where the component creates the state itself, provide that state directly; forward only what arrives through an input. The chrome rebinds the input and drives both states.

## Symbols

- `CngxAsyncState`

## Setup

```ts
protected readonly daily = createManualState<string>();
protected readonly weekly = createManualState<string>();
protected readonly bound = signal<CngxAsyncState<string> | undefined>(this.daily);
protected readonly boundLabel = computed(() =>
  this.bound() === this.daily ? 'Daily report' : this.bound() === this.weekly ? 'Weekly report' : 'No report',
);
```

## Wiring

```html
<demo-status-panel [state]="bound()" [label]="boundLabel()" />
```

## File `_status-panel.component.ts`

```ts
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { createForwardedAsyncState } from '@cngx/common/data';
import { CNGX_STATEFUL, type CngxAsyncState } from '@cngx/core/utils';
import { CngxToastOn } from '@cngx/ui/feedback';

/**
 * A panel that receives its async state through an input and publishes it
 * through `CNGX_STATEFUL`. The input can be rebound or unbound at any time,
 * so the panel forwards it: `createForwardedAsyncState` returns one stable
 * object whose members read whatever is bound right now, and an unbound
 * input reads as `idle`. The bare `cngxToastOn` in the template resolves
 * `CNGX_STATEFUL` once and still follows every rebinding.
 */
@Component({
  selector: 'demo-status-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxToastOn],
  providers: [
    {
      provide: CNGX_STATEFUL,
      useFactory: () => ({ state: inject(DemoStatusPanel).forwarded }),
    },
  ],
  template: `
    <p role="status" cngxToastOn toastError="Report failed to load">
      {{ label() }}: {{ forwarded.status() }}
    </p>
  `,
})
export class DemoStatusPanel {
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);
  readonly label = input('No report');

  readonly forwarded = createForwardedAsyncState(this.state);
}
```
