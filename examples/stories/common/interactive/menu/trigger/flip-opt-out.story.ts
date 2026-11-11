import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuTrigger: scoped flip opt-out',
  subtitle:
    'Menus flip above their trigger when the viewport clips them. withTryFallbacks([]) turns that off for one scope; a positionTryFallbacks binding on a popover still wins.',
  description:
    "Every menu trigger claims <code>CngxMenuConfig.tryFallbacks</code> (default <code>CNGX_MENU_TRY_FALLBACKS</code>: <code>flip-block, flip-inline, flip-block flip-inline</code>) as the popover's <code>position-try-fallbacks</code>. This story scopes <code>provideMenuConfigAt(withTryFallbacks([]))</code> in <code>viewProviders</code>, so the left menu keeps its placement and runs past the bottom edge. The right popover binds <code>[positionTryFallbacks]</code> itself, which beats the config, so it still opens above. Scroll until both buttons sit at the bottom of the window, then open each one.",
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxMenuTrigger', 'CngxMenu', 'CngxMenuItem', 'CngxPopover'],
  moduleImports: [
    "import { CNGX_MENU_TRY_FALLBACKS, CngxMenu, CngxMenuItem, CngxMenuTrigger, provideMenuConfigAt, withTryFallbacks } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: ['CngxMenu', 'CngxMenuItem', 'CngxMenuTrigger', 'CngxPopover', 'CngxPopoverTrigger'],
  viewProviders: ['provideMenuConfigAt(withTryFallbacks([]))'],
  setup: `protected readonly flipChain = CNGX_MENU_TRY_FALLBACKS;`,
  template: `  <div class="button-row" style="padding-block-start: 60vh">
    <button
      type="button"
      [cngxMenuTrigger]="stayMenu"
      [cngxPopoverTrigger]="stayPop"
      [haspopup]="'menu'"
      [popover]="stayPop"
      (click)="stayPop.toggle()"
    >
      Config: no flip
    </button>
    <div cngxPopover #stayPop="cngxPopover" placement="bottom-start">
      <ul cngxMenu [label]="'Export'" tabindex="0" #stayMenu="cngxMenu">
        <li cngxMenuItem value="pdf">Export as PDF</li>
        <li cngxMenuItem value="csv">Export as CSV</li>
        <li cngxMenuItem value="xlsx">Export as XLSX</li>
        <li cngxMenuItem value="json">Export as JSON</li>
        <li cngxMenuItem value="print">Print</li>
      </ul>
    </div>

    <button
      type="button"
      [cngxMenuTrigger]="flipMenu"
      [cngxPopoverTrigger]="flipPop"
      [haspopup]="'menu'"
      [popover]="flipPop"
      (click)="flipPop.toggle()"
    >
      Binding: flips
    </button>
    <div
      cngxPopover
      #flipPop="cngxPopover"
      placement="bottom-start"
      [positionTryFallbacks]="flipChain"
    >
      <ul cngxMenu [label]="'Share'" tabindex="0" #flipMenu="cngxMenu">
        <li cngxMenuItem value="link">Copy link</li>
        <li cngxMenuItem value="mail">Send by email</li>
        <li cngxMenuItem value="team">Share with team</li>
        <li cngxMenuItem value="embed">Embed</li>
        <li cngxMenuItem value="qr">Show QR code</li>
      </ul>
    </div>
  </div>`,
};
