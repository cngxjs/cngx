import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxOptimistic: Basic happy path',
  subtitle: 'Wrap a writable signal with <code>optimistic(signal, action)</code>; the returned <code>apply()</code> sets the value immediately and confirms via the async action.',
  description: 'Pure factory function, not a directive. Takes a <code>WritableSignal&lt;T&gt;</code> and an async <code>action(value)</code>, returns <code>[apply, state]</code>. <code>apply(newValue)</code> writes the new value into the signal immediately (UI updates optimistically), then runs the action; on success the confirmed value is written back, on failure the signal rolls back to the last confirmed value. State surface includes <code>status</code> (idle/pending/success/error) so consumers can wire feedback through any cngx <code>[state]</code>-shaped consumer.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'behavior'],
  apiComponents: [
    'optimistic',
  ],
  moduleImports: [
    'import { optimistic } from \'@cngx/common/interactive\';',
    'import { of } from \'rxjs\';',
    'import { delay } from \'rxjs/operators\';',
  ],
  imports: [],
  setup: `
  protected readonly name = signal<string>('Alice');

  private readonly nameTuple = optimistic<string>(
    this.name,
    (value) => of(value).pipe(delay(700)),
  );

  protected readonly applyName = this.nameTuple[0];
  protected readonly nameState = this.nameTuple[1];

  protected setName(value: string): void {
    this.applyName(value);
  }`,
  template: `
  <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
    <strong>Current name:</strong>
    <span>{{ name() }}</span>
  </div>
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="setName('Bob')">Set to Bob</button>
    <button type="button" (click)="setName('Charlie')">Set to Charlie</button>
    <button type="button" (click)="setName('Dani')">Set to Dani</button>
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">name()</span>
      <span class="event-value">{{ name() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">status</span>
      <span class="event-value">{{ nameState.state.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">rolledBack()</span>
      <span class="event-value">{{ nameState.rolledBack() }}</span>
    </div>
  </div>`,
};
