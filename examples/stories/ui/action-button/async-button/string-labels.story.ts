import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: String labels',
  subtitle: 'The simplest usage: pass <code>pendingLabel</code>, <code>succeededLabel</code>, <code>failedLabel</code> as strings. Default content is shown when idle.',
  description: 'Two buttons exercise the success and error paths separately so each terminal state is reachable deterministically; both rely on the built-in templates with custom string labels. Variant and tone are the <code>cngxButton</code> axes: <code>cngxActionButton="outline"</code> binds the variant through the selector. Each settle is also spoken through the polite live region next to its button: <code>Saved!</code> for the save, <code>Failed!</code> for the delete. The dashed box below logs both regions.',
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
  setup: `protected readonly saveAction = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
  protected readonly deleteAction = () => new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('403 Forbidden')), 1000),
  );`,
  template: `
  <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
    <button cngxActionButton tone="primary" [action]="saveAction" pendingLabel="Saving..." succeededLabel="Saved!">
      Save Draft
    </button>
    <button cngxActionButton="outline" tone="danger" [action]="deleteAction" pendingLabel="Deleting..." failedLabel="Failed!">
      Delete
    </button>
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
    const index = Array.from(this.hostEl.nativeElement.querySelectorAll('button')).indexOf(button as HTMLButtonElement);
    return ['Save Draft: ', 'Delete: '][index] ?? '';
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
      The last five texts written to the polite live regions next to the buttons, newest last, prefixed with the button. They are spoken as well as painted on the button; two writes in one frame may be voiced once, depending on the screen reader.
    </p>
  </div>`,
};
