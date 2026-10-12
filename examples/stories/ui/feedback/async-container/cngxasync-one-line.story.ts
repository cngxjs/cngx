import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsync: one line',
  subtitle: 'The simplest usage. One structural directive, no templates, no configuration. Content appears when data arrives.',
  description: 'Bare-minimum binding: <code>*cngxAsync="state; let data"</code> on a single element. No skeleton, no error template, just content rendered when the state succeeds. The story loads once on open. Each "First load" button starts from scratch (loading phase, then content, empty or error); "Refresh" and "Refresh fails" run against the loaded list. Every load takes 1.5s. Without templates every state but content renders nothing, so the stage stays empty during the first load, after an empty result and after a first-load error; a failed refresh keeps the old list.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling', 'composition'],
  apiComponents: ['CngxAsync', 'CngxAsyncContainer'],
  moduleImports: [
    'import { CngxAsync, createManualState, resolveAsyncView } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAsync'],
  setup: `protected readonly simple = createManualState<string[]>();`,
  setupChrome: `private readonly names = ['Alice', 'Bob', 'Charlie'];
  private ticket = 0;
  protected readonly view = computed(() =>
    resolveAsyncView(this.simple.status(), this.simple.isFirstLoad(), this.simple.isEmpty()),
  );
  constructor() {
    this.firstLoad();
  }
  protected firstLoad(): void {
    this.run(true, () => this.simple.setSuccess(this.names));
  }
  protected firstLoadFails(): void {
    this.run(true, () => this.simple.setError('Network error'));
  }
  protected loadsEmpty(): void {
    this.run(true, () => this.simple.setSuccess([]));
  }
  protected refresh(): void {
    this.run(false, () => this.simple.setSuccess([...this.names, 'Diana']));
  }
  protected refreshFails(): void {
    this.run(false, () => this.simple.setError('Network error'));
  }
  private run(fromScratch: boolean, settle: () => void): void {
    const ticket = ++this.ticket;
    if (fromScratch) {
      this.simple.reset();
    }
    this.simple.set(fromScratch ? 'loading' : 'refreshing');
    setTimeout(() => ticket === this.ticket && settle(), 1500);
  }
  protected idle(): void {
    this.ticket++;
    this.simple.reset();
  }`,
  template: `
  <ul *cngxAsync="simple; let data" class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
    @for (name of data; track name) {
      <li class="demo-card-tile">{{ name }}</li>
    }
  </ul>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button (click)="firstLoad()" class="chip" type="button">First load</button>
    <button (click)="loadsEmpty()" class="chip" type="button">First load, empty</button>
    <button (click)="firstLoadFails()" class="chip" type="button">First load fails</button>
    <button (click)="refresh()" class="chip" type="button" [disabled]="simple.isFirstLoad()">Refresh</button>
    <button (click)="refreshFails()" class="chip" type="button" [disabled]="simple.isFirstLoad()">Refresh fails</button>
    <button (click)="idle()" class="chip" type="button">Reset to idle</button>
  </div>
  <div class="event-grid demo-async-readout" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status</span>
      <span class="event-value">{{ simple.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad</span>
      <span class="event-value">{{ simple.isFirstLoad() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Renders</span>
      <span class="event-value">{{ view() === 'none' ? 'nothing (idle)' : view() === 'content' || view() === 'content+error' ? 'content' : 'nothing (no ' + view() + ' template)' }}</span>
    </div>
  </div>`,
};
