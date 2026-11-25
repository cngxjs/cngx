import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createForwardedAsyncState: state through an input',
  subtitle:
    'A component that gets its state through an input forwards it, so a <code>CNGX_STATEFUL</code> bridge inside it follows every rebinding and reads <code>idle</code> when nothing is bound.',
  description:
    '<code>CNGX_STATEFUL</code> is resolved once, when a bridge injects it. A component that receives its <code>CngxAsyncState</code> through an input cannot hand that object over directly: the input can change or be absent. <code>createForwardedAsyncState(this.state)</code> returns one stable object whose members are <code>computed()</code> reads of whatever is bound right now, and a quiet <code>idle</code> state while nothing is. The panel provides it as <code>CNGX_STATEFUL</code>; the bare <code>cngxToastOn</code> in its template toasts a failure of whichever state is bound. Where the component creates the state itself, provide that state directly; forward only what arrives through an input. The chrome rebinds the input and drives both states.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'composition'],
  apiComponents: ['createForwardedAsyncState', 'createManualState'],
  moduleImports: [
    "import { createManualState } from '@cngx/common/data';",
    "import type { CngxAsyncState } from '@cngx/core/utils';",
    "import { DemoStatusPanel } from './_status-panel.component';",
  ],
  imports: ['DemoStatusPanel'],
  setup: `protected readonly daily = createManualState<string>();
  protected readonly weekly = createManualState<string>();
  protected readonly bound = signal<CngxAsyncState<string> | undefined>(this.daily);
  protected readonly boundLabel = computed(() =>
    this.bound() === this.daily ? 'Daily report' : this.bound() === this.weekly ? 'Weekly report' : 'No report',
  );`,
  setupChrome: `constructor() {
    this.daily.setSuccess('42 orders');
    this.weekly.set('loading');
  }`,
  template: `
  <demo-status-panel [state]="bound()" [label]="boundLabel()" />`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="bound.set(daily)">Bind daily</button>
    <button type="button" class="chip" (click)="bound.set(weekly)">Bind weekly</button>
    <button type="button" class="chip" (click)="bound.set(undefined)">Unbind</button>
  </div>
  <div class="button-row" style="margin-top:8px">
    <button type="button" class="chip" (click)="daily.setError('503')">Daily fails</button>
    <button type="button" class="chip" (click)="weekly.setSuccess('300 orders')">Weekly loads</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">daily</span>
      <span class="event-value">{{ daily.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">weekly</span>
      <span class="event-value">{{ weekly.status() }}</span>
    </div>
  </div>`,
};
