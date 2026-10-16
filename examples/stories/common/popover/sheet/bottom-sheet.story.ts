import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverSheet: Bottom sheet on a phone',
  subtitle:
    'On a touch screen narrower than 48rem the popover opens as a modal bottom sheet; on a desktop it stays anchored to the button. Force a presentation with the radio group to try the sheet on any screen.',
  description:
    'Add <code>cngxPopoverSheet</code> to a <code>cngxPopover</code> and the stylesheet breakpoint decides the presentation. As a sheet the panel is a named <code>role="dialog"</code> with <code>aria-modal</code>: focus moves to the first control inside <code>show()</code>, Tab stays in the sheet, the rest of the page is inert and pinned, and closing returns focus to the button. Swipe the header down, tap above the sheet, use the Android back gesture or the close button. Each of those arrives as <code>closeRequested</code> with a reason; tick "Block close requests" to see the sheet stay open while the reason is still reported. The handle is decorative and hidden from assistive technology.',
  level: 'molecule',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern', 'rtl'],
  apiComponents: [
    'CngxPopoverSheet',
    'CngxPopoverSheetHeader',
    'CngxPopoverSheetTitle',
    'CngxPopoverSheetHandle',
  ],
  moduleImports: [
    "import { CngxPopover, CngxPopoverSheet, CngxPopoverSheetHandle, CngxPopoverSheetHeader, CngxPopoverSheetTitle, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import { CngxCloseButton, CngxSwipeDismiss } from '@cngx/common/interactive';",
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
  ],
  setup: `protected readonly city = signal<string | undefined>(undefined);
  protected readonly cities = [
    'Amsterdam', 'Athens', 'Barcelona', 'Berlin', 'Bratislava', 'Brussels',
    'Budapest', 'Copenhagen', 'Dublin', 'Helsinki', 'Lisbon', 'Ljubljana',
    'Madrid', 'Oslo', 'Paris', 'Prague', 'Rome', 'Stockholm', 'Vienna', 'Warsaw',
  ];`,
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
      (closeRequested)="lastRequest.set($event)"
    >
      <header cngxPopoverSheetHeader cngxSwipeDismiss="down">
        <span cngxPopoverSheetHandle></span>
        <h2 cngxPopoverSheetTitle style="margin: 0; font-size: 1rem; flex: 1">City</h2>
        <cngx-close-button label="Close" (click)="sheet.requestClose('close')" />
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
    </div>
  </div>`,
  setupChrome: `protected readonly presentation = signal<'auto' | 'sheet' | 'fullscreen'>('auto');
  protected readonly dir = signal<'ltr' | 'rtl'>('ltr');
  protected readonly blockClose = signal(false);
  protected readonly escapeCloses = signal(true);
  protected readonly lastRequest = signal<string | undefined>(undefined);`,
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
  </div>`,
};
