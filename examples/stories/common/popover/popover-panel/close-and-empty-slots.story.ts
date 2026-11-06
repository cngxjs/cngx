import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: close and state slots',
  subtitle:
    'Project <code>*cngxPopoverClose</code> to replace the built-in close button and <code>*cngxPopoverLoading</code> / <code>*cngxPopoverError</code> / <code>*cngxPopoverEmpty</code> to replace the default state copy. Tick a state to reach it, untick "Use custom slot templates" to see the defaults.',
  description:
    'The header row, with its title and close control, stays in every view (loading, error, empty and content), so the dialog keeps its accessible name and mouse users keep a way out. Without a slot template each state view shows default copy ("Loading", "Could not load", "Nothing to show"). The copy resolves in this order: the projected slot template, then the <code>[loadingText]</code> / <code>[errorText]</code> / <code>[emptyText]</code> inputs, then <code>withPopoverPanelLabels(...)</code>, then the <code>popover</code> section of the language pack. In the error and empty views <code>aria-describedby</code> points at that surface; loading speaks through <code>aria-busy</code> and its visible text. The close template has no context and owns its own button, so it calls <code>hide()</code> through a template reference and carries its own accessible name (here "Done"). When the panel closes, by "Done", the built-in close or Escape, focus returns to "Recent activity"; a close that moved focus to another control leaves it there. The dashed box below mirrors what a screen reader gets.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'async-state'],
  apiComponents: [
    'CngxPopoverPanel',
    'CngxPopoverClose',
    'CngxPopoverLoading',
    'CngxPopoverError',
    'CngxPopoverEmpty',
  ],
  moduleImports: [
    "import { CngxPopoverBody, CngxPopoverClose, CngxPopoverEmpty, CngxPopoverError, CngxPopoverHeader, CngxPopoverLoading, CngxPopoverPanel, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverClose',
    'CngxPopoverLoading',
    'CngxPopoverError',
    'CngxPopoverEmpty',
  ],
  setup: `protected readonly customSlots = signal(true);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly noActivity = signal(false);`,
  setupChrome: `
  private readonly destroyRef = inject(DestroyRef);
  private readonly panelHost = viewChild('activity', { read: ElementRef });
  protected readonly srName = signal('-');
  protected readonly srDescription = signal('-');
  protected readonly srBusy = signal('-');
  protected readonly focusAfterClose = signal('-');

  private textOf(id: string | null): string {
    const text = id ? document.getElementById(id)?.textContent?.trim() : '';
    return text ? '"' + text + '"' : '-';
  }

  private refreshSr(): void {
    const host = this.panelHost()?.nativeElement as HTMLElement | undefined;
    if (!host) {
      return;
    }
    this.srName.set(this.textOf(host.getAttribute('aria-labelledby')));
    this.srDescription.set(this.textOf(host.getAttribute('aria-describedby')));
    this.srBusy.set(host.getAttribute('aria-busy') ?? '-');
  }

  private readonly listen = afterNextRender(() => {
    const host = this.panelHost()?.nativeElement as HTMLElement | undefined;
    const onFocusIn = () => this.refreshSr();
    let readFocusTimer: ReturnType<typeof setTimeout> | undefined;
    const onToggle = (event: Event) => {
      this.refreshSr();
      if ((event as ToggleEvent).newState !== 'closed') {
        return;
      }
      clearTimeout(readFocusTimer);
      readFocusTimer = setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        const label = active && active !== document.body ? active.textContent?.trim() : '';
        this.focusAfterClose.set(label ? label : 'body (focus lost)');
      });
    };
    const observer = new MutationObserver(() => this.refreshSr());
    if (host) {
      observer.observe(host, { attributes: true, subtree: true, characterData: true, childList: true });
      host.addEventListener('toggle', onToggle);
    }
    document.addEventListener('focusin', onFocusIn);
    this.refreshSr();
    this.destroyRef.onDestroy(() => {
      clearTimeout(readFocusTimer);
      observer.disconnect();
      host?.removeEventListener('toggle', onToggle);
      document.removeEventListener('focusin', onFocusIn);
    });
  });`,
  template: `  <div class="demo-popover-stage">
    <button
      type="button"
      class="chip"
      [cngxPopoverTrigger]="activity.popover"
      (click)="activity.popover.toggle()"
    >
      Recent activity
    </button>
    <cngx-popover-panel
      #activity
      [showClose]="true"
      [loading]="loading()"
      [error]="failed() ? 'Network timeout' : undefined"
      [empty]="noActivity()"
      placement="bottom-start"
    >
      <span cngxPopoverHeader>Recent activity</span>
      <ul cngxPopoverBody class="demo-popover-activity">
        <li>Invoice 1042 was paid</li>
        <li>Anna joined the workspace</li>
      </ul>
      @if (customSlots()) {
        <ng-template cngxPopoverClose>
          <button
            type="button"
            class="demo-popover-close"
            (click)="activity.popover.hide()"
          >
            Done
          </button>
        </ng-template>
        <ng-template cngxPopoverLoading>
          <p class="demo-popover-empty">Fetching the last 7 days...</p>
        </ng-template>
        <ng-template cngxPopoverError let-err>
          <p class="demo-popover-empty">Activity failed to load: {{ err }}</p>
        </ng-template>
        <ng-template cngxPopoverEmpty>
          <p class="demo-popover-empty">Nothing happened in the last 7 days.</p>
        </ng-template>
      }
    </cngx-popover-panel>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
    <label>
      <input
        type="checkbox"
        [checked]="loading()"
        (change)="loading.set($any($event.target).checked)"
      />
      Loading
    </label>
    <label>
      <input
        type="checkbox"
        [checked]="failed()"
        (change)="failed.set($any($event.target).checked)"
      />
      Load error
    </label>
    <label>
      <input
        type="checkbox"
        [checked]="noActivity()"
        (change)="noActivity.set($any($event.target).checked)"
      />
      No activity (empty state)
    </label>
  </div>
  <div class="status-row" style="margin-top:8px">
    <span>With several states ticked, loading beats error, and error beats empty.</span>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>dialog name</dt>
      <dd>{{ srName() }}</dd>
      <dt>dialog description</dt>
      <dd>{{ srDescription() }}</dd>
      <dt>aria-busy</dt>
      <dd>{{ srBusy() }}</dd>
      <dt>focus after close</dt>
      <dd>{{ focusAfterClose() }}</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read from the live attributes of the panel: the name from its aria-labelledby target, the description from its aria-describedby target, and the focused element after the last close. The browser accessibility tree stays the reference.
    </p>
  </div>`,
};
