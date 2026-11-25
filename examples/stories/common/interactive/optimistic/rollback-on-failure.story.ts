import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createOptimistic(): Rollback on failure',
  subtitle: 'When the async action throws, the signal rolls back to the last confirmed value and <code>rolledBack()</code> flips true.',
  description: 'Same factory as the happy-path demo, but the chrome switch "Server fails" makes the save fail. Watch the UI: the signal still flips immediately on click (optimistic write), then after the delay the value snaps back to whichever value the server last confirmed. <code>nameState.error()</code> exposes the rejection reason, <code>nameState.state.status()</code> goes to <code>"error"</code>, and <code>nameState.rolledBack()</code> stays true until the next successful confirm. Concurrent calls cancel the previous in-flight subscription so a rapid click sequence never rolls back to a stale optimistic value. The rollback changes the visible name without user action, so an always-present polite region announces it.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling'],
  apiComponents: [
    'createOptimistic',
  ],
  moduleImports: [
    'import { createOptimistic } from \'@cngx/common/interactive\';',
    "import { map, timer, type Observable } from 'rxjs';",
    "import { failDemoActionWhen } from '../../../../fixtures';",
  ],
  imports: [],
  setup: `
  protected readonly name = signal<string>('Alice');

  // The server call. Emits the value it stored.
  private readonly saveName = (value: string): Observable<string> =>
    timer(700).pipe(map(() => value));

  private readonly nameTuple = createOptimistic<string>(this.name, (value) => this.saveName(value));

  protected readonly applyName = this.nameTuple[0];
  protected readonly nameState = this.nameTuple[1];

  protected setName(value: string): void {
    this.applyName(value);
  }`,
  setupChrome: `  protected readonly shouldFail = signal<boolean>(true);
  // Makes saveName fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'saveName',
    () => this.shouldFail(),
    () => new Error('Server rejected the update'),
  );
  protected readonly errorMessage = computed<string>(() => {
    const err = this.nameState.error();
    if (err instanceof Error) return err.message;
    if (err === undefined) return '-';
    return String(err);
  });`,
  template: `
  <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
    <strong>Current name:</strong>
    <span>{{ name() }}</span>
  </div>
  <div class="demo-inline-actions" style="margin-top:12px">
    <button type="button" (click)="setName('Bob')">Set to Bob</button>
    <button type="button" (click)="setName('Charlie')">Set to Charlie</button>
    <button type="button" (click)="setName('Dani')">Set to Dani</button>
  </div>
  <span class="demo-sr-only" aria-live="polite">{{
    nameState.state.status() === 'error'
      ? 'Update not saved, the name is back to ' + name() + '.'
      : ''
  }}</span>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="shouldFail()" (change)="shouldFail.set($any($event.target).checked)" />
      Server fails
    </label>
  </div>
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
    <div class="event-row">
      <span class="event-label">error</span>
      <span class="event-value">{{ errorMessage() }}</span>
    </div>
  </div>`,
};
