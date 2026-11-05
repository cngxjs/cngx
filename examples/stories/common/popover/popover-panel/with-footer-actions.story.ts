import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: With footer actions',
  subtitle:
    'Compose <code>cngx-popover-action</code> inside <code>cngxPopoverFooter</code>. <code>role="dismiss"</code> closes the panel; <code>role="confirm"</code> runs an async action with <code>cngxPending</code> / <code>cngxSucceeded</code> / <code>cngxFailed</code> templates.',
  description:
    'A confirm panel pairs a dismiss button with an async confirm. The confirm button drives <code>CngxAsyncClick</code> under the hood, so the projected templates swap based on the returned promise. The first popover resolves in 1.5s and renders the success template; the second rejects after 1s and surfaces the rejection value via <code>cngxFailed</code> with <code>$implicit</code>. Each settle is spoken once through the polite live region of the action itself, with the text the button shows; the dashed box below logs both panels.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverAction'],
  moduleImports: [
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction } from '@cngx/common/popover';",
    "import { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverFooter',
    'CngxPopoverAction',
    'CngxPending',
    'CngxSucceeded',
    'CngxFailed',
  ],
  setup: `protected simulateSave = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
  protected simulateDelete = () => new Promise<void>((_, reject) => setTimeout(() => reject('Permission denied'), 1000));`,
  template: `
  <div class="demo-popover-stage" style="display:flex;gap:16px;flex-wrap:wrap">
    <div>
      <button type="button" [cngxPopoverTrigger]="savePop.popover" (click)="savePop.popover.toggle()" class="chip">
        Save Confirm
      </button>
      <cngx-popover-panel #savePop variant="info" [showClose]="true" [showArrow]="true" placement="bottom">
        <span cngxPopoverHeader>Save Changes?</span>
        <p cngxPopoverBody>Your unsaved changes will be saved to the server.</p>
        <div cngxPopoverFooter>
          <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
          <cngx-popover-action role="confirm" [action]="simulateSave" variant="primary">
            Save
            <ng-template cngxPending>Saving...</ng-template>
            <ng-template cngxSucceeded>Saved!</ng-template>
          </cngx-popover-action>
        </div>
      </cngx-popover-panel>
    </div>

    <div>
      <button type="button" [cngxPopoverTrigger]="delPop.popover" (click)="delPop.popover.toggle()" class="chip">
        Delete Confirm
      </button>
      <cngx-popover-panel #delPop variant="danger" [showClose]="true" [showArrow]="true" placement="bottom">
        <span cngxPopoverHeader>Delete Item?</span>
        <p cngxPopoverBody>This action cannot be undone.</p>
        <div cngxPopoverFooter>
          <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
          <cngx-popover-action role="confirm" [action]="simulateDelete" variant="danger">
            Delete
            <ng-template cngxPending>Deleting...</ng-template>
            <ng-template cngxFailed let-err>{{ err }}</ng-template>
          </cngx-popover-action>
        </div>
      </cngx-popover-panel>
    </div>
  </div>`,
  setupChrome: `
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly heard = signal<readonly { n: number; text: string }[]>([]);
  protected readonly ariaBusy = signal('-');

  // Logs the real DOM writes into the live region next to each async button.
  private readonly srMirror = afterNextRender(() => {
    const host = this.hostEl.nativeElement;
    const lastText = new WeakMap<Element, string>();
    let count = 0;
    const readBusy = (): void => {
      const buttons = Array.from(host.querySelectorAll('button')).filter(
        (b) => b.nextElementSibling?.hasAttribute('aria-live') ?? false,
      );
      this.ariaBusy.set(
        buttons.map((b) => this.srLabel(b) + (b.getAttribute('aria-busy') ?? '-')).join(', ') || '-',
      );
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const el = record.target instanceof Element ? record.target : record.target.parentElement;
        const region = el?.closest('[aria-live]');
        if (!region || !host.contains(region) || region.previousElementSibling?.tagName !== 'BUTTON') {
          continue;
        }
        const text = region.textContent?.trim() ?? '';
        if (text === lastText.get(region)) {
          continue;
        }
        lastText.set(region, text);
        if (text !== '') {
          count += 1;
          const entry = { n: count, text: this.srLabel(region.previousElementSibling) + '"' + text + '"' };
          this.heard.update((list) => [...list, entry].slice(-5));
        }
      }
      readBusy();
    });
    observer.observe(host, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-busy'],
    });
    readBusy();
    this.destroyRef.onDestroy(() => observer.disconnect());
  });

  private srLabel(button: Element | null): string {
    const variant = button?.closest('cngx-popover-panel')?.getAttribute('variant');
    return variant === 'danger' ? 'Delete: ' : 'Save: ';
  }`,
  templateChrome: `
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>aria-busy</dt>
      <dd>{{ ariaBusy() }}</dd>
      @for (entry of heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The last five texts written to the polite live region next to each confirm button, newest last, prefixed with the panel. They are spoken as well as painted on the button; two writes in one frame may be voiced once, depending on the screen reader.
    </p>
  </div>`,
};
