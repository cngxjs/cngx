import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Template slots',
  subtitle: 'Project <code>cngxPending</code>, <code>cngxSucceeded</code>, <code>cngxFailed</code> templates for full control. The <code>cngxFailed</code> template receives the error as <code>let-err</code>.',
  description: 'Slot-projection escape hatch: replace each terminal-state template with custom markup (Material spinner in the pending slot, retry prompt with the error message in the failed slot). Use when string labels are not enough. The failure is spoken with the text of the rendered <code>cngxFailed</code> template, so a screen reader hears what the button shows; with no succeeded announcement or label bound, success speaks the default succeeded copy. The dashed box below logs what the polite live region next to the button receives.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
    'CngxPending',
    'CngxSucceeded',
    'CngxFailed',
  ],
  moduleImports: [
    'import { CngxActionButton, CngxPending, CngxSucceeded, CngxFailed } from \'@cngx/ui\';',
    'import { MatProgressSpinnerModule } from \'@angular/material/progress-spinner\';',
  ],
  imports: ['CngxActionButton', 'CngxPending', 'CngxSucceeded', 'CngxFailed', 'MatProgressSpinnerModule'],
  setup: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 1200),
  );`,
  template: `
  <button cngxActionButton tone="primary" [action]="submitAction">
    Submit Order
    <ng-template cngxPending>
      <span style="display:inline-flex;align-items:center;gap:6px">
        <mat-spinner diameter="16" /> Processing...
      </span>
    </ng-template>
    <ng-template cngxSucceeded>Order placed!</ng-template>
    <ng-template cngxFailed let-err>{{ err }} - retry?</ng-template>
  </button>`,
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
        buttons.map((b) => (b.getAttribute('aria-busy') ?? '-')).join(', ') || '-',
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
          const entry = { n: count, text: '"' + text + '"' };
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
  });`,
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
      The last five texts written to the polite live region next to the button, newest last. They are spoken as well as painted on the button; two writes in one frame may be voiced once, depending on the screen reader.
    </p>
  </div>`,
};
