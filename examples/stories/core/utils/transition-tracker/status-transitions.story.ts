import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createTransitionTracker: status transitions',
  subtitle:
    '<code>createTransitionTracker(() => status())</code> turns a status signal into a reactive <code>current</code> / <code>previous</code> pair, built on <code>linkedSignal</code>. Consumers react to edges such as <code>loading -&gt; success</code> instead of keeping a <code>let previous</code> inside an <code>effect()</code>.',
  description:
    'Here a <code>computed()</code> maps each edge to a toast: <code>loading -&gt; success</code> shows "Saved", any edge into <code>error</code> shows an error toast, and <code>refreshing -&gt; success</code> stays silent because the data was already on screen. The effect only shows what the computed derived, inside <code>untracked()</code>. At mount <code>previous</code> equals <code>current</code>, so no phantom <code>idle -&gt; X</code> edge fires; pass <code>{ seed }</code> to treat the mount as a transition. Setting the same status twice is not a transition. Pick a status directly or run a save or refresh, and watch the edge log.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'behavior'],
  apiComponents: ['CngxToaster'],
  moduleImports: [
    "import { createTransitionTracker, type AsyncStatus } from '@cngx/core/utils';",
    "import { CngxToaster, type ToastConfig } from '@cngx/ui/feedback';",
  ],
  setup: `private readonly toaster = inject(CngxToaster);

  protected readonly status = signal<AsyncStatus>('idle');
  protected readonly transition = createTransitionTracker(() => this.status());

  protected readonly toastForEdge = computed<ToastConfig | null>(() => {
    const current = this.transition.current();
    const previous = this.transition.previous();
    if (current === previous) {
      return null;
    }
    if (current === 'error') {
      return { message: 'Saving failed', severity: 'error' };
    }
    if (current === 'success' && previous === 'loading') {
      return { message: 'Saved', severity: 'success' };
    }
    return null;
  });

  constructor() {
    effect(() => {
      const toast = this.toastForEdge();
      if (toast) {
        untracked(() => this.toaster.show(toast));
      }
    });
  }`,
  template: `  <p>
    Edge: {{ transition.previous() }} -&gt; {{ transition.current() }}
  </p>`,
  setupChrome: `protected readonly statuses: readonly AsyncStatus[] = ['idle', 'loading', 'pending', 'refreshing', 'success', 'error'];
  protected readonly failSave = signal(false);
  protected readonly log = signal<readonly string[]>([]);

  private readonly logEdges = effect(() => {
    const current = this.transition.current();
    const previous = this.transition.previous();
    if (current === previous) {
      return;
    }
    const toast = this.toastForEdge();
    const reaction = toast ? 'toast "' + toast.message + '"' : 'no toast';
    untracked(() => this.log.update((l) => [previous + ' -> ' + current + ': ' + reaction, ...l].slice(0, 8)));
  });

  protected runSave(): void {
    this.status.set('loading');
    setTimeout(() => this.status.set(this.failSave() ? 'error' : 'success'), 1000);
  }

  protected runRefresh(): void {
    this.status.set('refreshing');
    setTimeout(() => this.status.set('success'), 1000);
  }`,
  templateChromeBefore: `<div class="button-row" role="radiogroup" aria-label="Status" style="margin-bottom:8px">
    @for (s of statuses; track s) {
      <label>
        <input type="radio" name="transition-tracker-status" [checked]="status() === s" (change)="status.set(s)" />
        {{ s }}
      </label>
    }
  </div>
  <div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" (click)="runSave()">Run a save</button>
    <button type="button" class="chip" (click)="runRefresh()">Run a refresh</button>
    <label>
      <input type="checkbox" [checked]="failSave()" (change)="failSave.set($any($event.target).checked)" />
      Save fails
    </label>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">transition.current()</span>
      <span class="event-value">{{ transition.current() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">transition.previous()</span>
      <span class="event-value">{{ transition.previous() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">toastForEdge()</span>
      <span class="event-value">{{ toastForEdge()?.message ?? 'null' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">edge log (newest first)</span>
    </div>
    <ol class="demo-loading-config-list" aria-label="Edge log">
      @for (entry of log(); track $index) {
        <li class="event-value">{{ entry }}</li>
      } @empty {
        <li class="event-value">No edge yet</li>
      }
    </ol>
  </div>`,
};
