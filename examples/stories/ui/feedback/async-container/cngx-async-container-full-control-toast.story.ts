import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncContainer: full control with toast',
  subtitle: 'Four templates, built-in refresh bar, integrated toast on success/error. Uses <code>createManualState</code> for demo control.',
  description: 'Full surface variant: skeleton, content, empty, and error templates all overridden, plus the integrated toast bridge fires on success/error transitions. The story loads once on open. The "First load" buttons start from scratch and walk skeleton, then content, empty or error; "Refresh" keeps the list on screen under the built-in refresh bar, "Refresh fails" keeps it and adds the error template below. Every load takes 1.5s and ends in a toast.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling', 'composition'],
  apiComponents: [
    'CngxAsyncContainer',
    'CngxAsync',
  ],
  moduleImports: [
    'import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl } from \'@cngx/ui/feedback\';',
    'import { createManualState, resolveAsyncView } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl', 'CngxAsyncErrorTpl'],
  setup: `protected readonly manual = createManualState<string[]>();`,
  setupChrome: `private readonly names = ['Alpha', 'Beta', 'Gamma'];
  private ticket = 0;
  protected readonly view = computed(() =>
    resolveAsyncView(this.manual.status(), this.manual.isFirstLoad(), this.manual.isEmpty()),
  );
  constructor() {
    this.firstLoad();
  }
  protected firstLoad(): void {
    this.run(true, () => this.manual.setSuccess(this.names));
  }
  protected firstLoadFails(): void {
    this.run(true, () => this.manual.setError('Connection refused'));
  }
  protected loadsEmpty(): void {
    this.run(true, () => this.manual.setSuccess([]));
  }
  protected refresh(): void {
    this.run(false, () => this.manual.setSuccess([...this.names, 'Delta']));
  }
  protected refreshFails(): void {
    this.run(false, () => this.manual.setError('Connection refused'));
  }
  private run(fromScratch: boolean, settle: () => void): void {
    const ticket = ++this.ticket;
    if (fromScratch) {
      this.manual.reset();
    }
    this.manual.set(fromScratch ? 'loading' : 'refreshing');
    setTimeout(() => ticket === this.ticket && settle(), 1500);
  }
  protected idle(): void {
    this.ticket++;
    this.manual.reset();
  }`,
  template: `  <cngx-async-container [state]="manual" ariaLabel="Items"
    toastSuccess="Loaded successfully" toastError="Failed to load">

    <ng-template cngxAsyncSkeleton>
      <div class="demo-stack--tight" style="display:flex;flex-direction:column">
        @for (i of [1,2,3]; track i) {
          <div class="demo-skeleton-bar" style="height:24px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
        @for (name of data; track name) {
          <li class="demo-card-tile">{{ name }}</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <div class="demo-empty-state-block--large demo-empty-state-block">
        <p style="margin:0 0 8px;font-size:1.125rem">No items</p>
        <p style="margin:0">Try loading with different parameters.</p>
      </div>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <div class="demo-error-block">
        <p style="margin:0 0 8px;font-size:1.125rem">Load failed</p>
        <p style="margin:0 0 12px;opacity:0.8">{{ err }}</p>
        <button (click)="firstLoad()" class="chip" type="button">Retry</button>
      </div>
    </ng-template>
  </cngx-async-container>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button (click)="firstLoad()" class="chip" type="button">First load</button>
    <button (click)="loadsEmpty()" class="chip" type="button">First load, empty</button>
    <button (click)="firstLoadFails()" class="chip" type="button">First load fails</button>
    <button (click)="refresh()" class="chip" type="button" [disabled]="manual.isFirstLoad()">Refresh</button>
    <button (click)="refreshFails()" class="chip" type="button" [disabled]="manual.isFirstLoad()">Refresh fails</button>
    <button (click)="idle()" class="chip" type="button">Reset to idle</button>
  </div>
  <div class="event-grid demo-async-readout" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status</span>
      <span class="event-value">{{ manual.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad</span>
      <span class="event-value">{{ manual.isFirstLoad() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Renders</span>
      <span class="event-value">{{ view() === 'none' ? 'nothing (idle)' : view() === 'content+error' ? 'content and error templates' : view() + ' template' }}</span>
    </div>
  </div>`,
};
