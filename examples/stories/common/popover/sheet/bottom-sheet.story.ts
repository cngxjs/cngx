import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverSheet: Bottom sheet on a phone',
  subtitle:
    'On a touch screen narrower than 48rem the popover opens as a modal bottom sheet; on a desktop it stays anchored to the button. Force a presentation with the radio group to try the sheet on any screen.',
  description:
    'Add <code>cngxPopoverSheet</code> to a <code>cngxPopover</code> and the stylesheet breakpoint decides the presentation. As a sheet the panel is a named <code>role="dialog"</code> with <code>aria-modal</code>: focus moves to the first control inside <code>show()</code>, Tab stays in the sheet, the rest of the page is inert and pinned, and closing returns focus to the button. Swipe the header down, tap above the sheet, use the Android back gesture or the close button. Each of those arrives as <code>closeRequested</code> with a reason; tick "Block close requests" to see the sheet stay open while the reason is still reported. The handle is decorative and hidden from assistive technology. The footer action always fails after 1.5 s: press it and close the sheet with Escape at once - the failure is still spoken, through the page announcer region, because a reader skips a live region inside a closed sheet.',
  level: 'molecule',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern', 'rtl', 'async-state'],
  apiComponents: [
    'CngxPopoverSheet',
    'CngxPopoverSheetHeader',
    'CngxPopoverSheetTitle',
    'CngxPopoverSheetHandle',
  ],
  moduleImports: [
    "import { CngxPopover, CngxPopoverAction, CngxPopoverSheet, CngxPopoverSheetHandle, CngxPopoverSheetHeader, CngxPopoverSheetTitle, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import { CngxCloseButton } from '@cngx/common/button';",
    "import { CngxFailed, CngxPending, CngxSwipeDismiss } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxPopover',
    'CngxPopoverTrigger',
    'CngxPopoverSheet',
    'CngxPopoverSheetHeader',
    'CngxPopoverSheetTitle',
    'CngxPopoverSheetHandle',
    'CngxCloseButton',
    'CngxSwipeDismiss',
    'CngxPopoverAction',
    'CngxPending',
    'CngxFailed',
  ],
  setup: `protected readonly city = signal<string | undefined>(undefined);
  protected readonly cities = [
    'Amsterdam', 'Athens', 'Barcelona', 'Berlin', 'Bratislava', 'Brussels',
    'Budapest', 'Copenhagen', 'Dublin', 'Helsinki', 'Lisbon', 'Ljubljana',
    'Madrid', 'Oslo', 'Paris', 'Prague', 'Rome', 'Stockholm', 'Vienna', 'Warsaw',
  ];
  protected saveFavourite = () =>
    new Promise<void>((_, reject) => setTimeout(() => reject('Could not save, you are offline'), 1500));`,
  template: `<div class="demo-inline-actions" [attr.dir]="dir()">
    <button type="button" [cngxPopoverTrigger]="pop" (click)="pop.show()">
      {{ city() ?? 'Choose a city' }}
    </button>
    <div
      cngxPopover
      #pop="cngxPopover"
      class="demo-popover-surface"
      placement="bottom-start"
      [cngxPopoverSheet]="presentation()"
      #sheet="cngxPopoverSheet"
      [closeOnRequest]="!blockClose()"
      [closeOnEscape]="escapeCloses()"
      (closeRequested)="handleCloseRequested($event, sheet)"
    >
      <header cngxPopoverSheetHeader cngxSwipeDismiss="down">
        <span cngxPopoverSheetHandle></span>
        <h2 cngxPopoverSheetTitle style="margin: 0; font-size: 1rem; flex: 1">City</h2>
        <button cngxCloseButton aria-label="Close" (click)="sheet.requestClose('close')"></button>
      </header>
      <ul style="margin: 0; padding: 0; list-style: none">
        @for (name of cities; track name) {
          <li>
            <button
              type="button"
              style="display: block; inline-size: 100%; padding: 12px 0; text-align: start"
              (click)="city.set(name); pop.hide()"
            >
              {{ name }}
            </button>
          </li>
        }
      </ul>
      <footer style="position: sticky; inset-block-end: 0; display: flex; justify-content: flex-end; padding-block: 12px; background: var(--cngx-color-surface, #fff)">
        <button cngxPopoverAction="solid" tone="primary" [action]="saveFavourite">
          Save as favourite
          <ng-template cngxPending>Saving...</ng-template>
          <ng-template cngxFailed let-err>{{ err }}</ng-template>
        </button>
      </footer>
    </div>
  </div>`,
  setupChrome: `private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly heard = signal<readonly { n: number; text: string }[]>([]);

  // Logs the real DOM writes into the live region next to the footer action
  // and into the page-level announcer region a closed sheet speaks through.
  private readonly srMirror = afterNextRender(() => {
    const host = this.hostEl.nativeElement;
    const body = host.ownerDocument.body;
    const lastText = new WeakMap<Element, string>();
    let count = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const el = record.target instanceof Element ? record.target : record.target.parentElement;
        const region = el?.closest('[aria-live]');
        if (!region) {
          continue;
        }
        const own = host.contains(region) && region.previousElementSibling?.tagName === 'BUTTON';
        const page = region.parentElement === body && region.getAttribute('aria-live') === 'polite';
        if (!own && !page) {
          continue;
        }
        const text = region.textContent?.trim() ?? '';
        if (text === lastText.get(region)) {
          continue;
        }
        lastText.set(region, text);
        if (text !== '') {
          count += 1;
          const entry = { n: count, text: (own ? 'Sheet action: ' : 'Page region: ') + '"' + text + '"' };
          this.heard.update((list) => [...list, entry].slice(-5));
        }
      }
    });
    observer.observe(body, { childList: true, characterData: true, subtree: true });
    this.destroyRef.onDestroy(() => observer.disconnect());
  });

  protected readonly presentation = signal<'auto' | 'sheet' | 'fullscreen'>('auto');
  protected readonly dir = signal<'ltr' | 'rtl'>('ltr');
  protected readonly blockClose = signal(false);
  protected readonly escapeCloses = signal(true);
  protected readonly lastRequest = signal<string | undefined>(undefined);
  protected handleCloseRequested(reason: string, sheet: { announce(m: string, p?: 'polite' | 'assertive'): void }): void {
    this.lastRequest.set(reason);
    if (this.blockClose()) {
      sheet.announce('Closing is blocked', 'assertive');
    }
  }`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Presentation">
    @for (mode of ['auto', 'sheet', 'fullscreen']; track mode) {
      <label>
        <input type="radio" name="sheet-presentation" [value]="mode"
          [checked]="presentation() === mode"
          (change)="presentation.set($any(mode))" />
        {{ mode }}
      </label>
    }
  </div>
  <div class="button-row" role="radiogroup" aria-label="Direction">
    <label>
      <input type="radio" name="sheet-dir" value="ltr" [checked]="dir() === 'ltr'" (change)="dir.set('ltr')" />
      LTR
    </label>
    <label>
      <input type="radio" name="sheet-dir" value="rtl" [checked]="dir() === 'rtl'" (change)="dir.set('rtl')" />
      RTL
    </label>
  </div>
  <div class="button-row">
    <label>
      <input type="checkbox" [checked]="blockClose()" (change)="blockClose.set(!blockClose())" />
      Block close requests
    </label>
    <label>
      <input type="checkbox" [checked]="escapeCloses()" (change)="escapeCloses.set(!escapeCloses())" />
      Escape closes
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">presentation</span>
      <span class="event-value">{{ sheet.presentation() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ pop.state() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">last close request</span>
      <span class="event-value">{{ lastRequest() ?? 'none' }}</span>
    </div>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (entry of heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The last five texts written to the polite live region next to the footer action, newest last. A failure that settles after the sheet closed shows up as "Page region", the announcer region outside every popover.
    </p>
  </div>`,
};
