import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Random outcome',
  subtitle: 'The action resolves or rejects randomly. Click multiple times to see both states. Feedback auto-resets after 2 seconds. Uses string labels - no templates needed.',
  description: 'String-label fast-path: success/failure decided by a random Promise resolver, both terminal states reachable from a single button. Shows the organism has zero boilerplate when you only need the default templates. It sits on the native <code>&lt;button&gt;</code> with the <code>cngxButton</code> axes, and the labels share one cell, so the button keeps the width of its widest label in every state. Pick fast (80 ms) to see idle go straight to the result with no spinner, medium (200 ms) to watch the pending cell held through its dwell and the button refuse a second click until the result lands, or slow (1.5 s) for a long run. The outcome is spoken as well: the polite live region <code>cngxAsyncClick</code> renders next to the button receives the succeeded or failed label, and the dashed box below logs what it receives.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
  ],
  moduleImports: [
    'import { CngxActionButton } from \'@cngx/ui\';',
  ],
  imports: ['CngxActionButton'],
  setup: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), this.latencyMs()),
  );`,
  setupChrome: `
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly latency = signal<'fast' | 'medium' | 'slow'>('medium');
  protected readonly heard = signal<readonly { n: number; text: string }[]>([]);
  protected readonly ariaBusy = signal('-');

  protected latencyMs(): number {
    switch (this.latency()) {
      case 'fast':
        return 80;
      case 'medium':
        return 200;
      default:
        return 1500;
    }
  }

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
  template: `
  <button cngxActionButton tone="primary" [action]="submitAction"
    pendingLabel="Rolling..." succeededLabel="Won!" failedLabel="Lost">
    Roll the Dice
  </button>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <div role="radiogroup" aria-label="Run latency" style="display:inline-flex;gap:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-action-button-latency"
               [checked]="latency() === 'fast'"
               (change)="latency.set('fast')" />
        fast (80 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-action-button-latency"
               [checked]="latency() === 'medium'"
               (change)="latency.set('medium')" />
        medium (200 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-action-button-latency"
               [checked]="latency() === 'slow'"
               (change)="latency.set('slow')" />
        slow (1.5 s)
      </label>
    </div>
  </div>
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
