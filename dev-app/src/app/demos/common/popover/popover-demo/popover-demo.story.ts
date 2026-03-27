import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Popover',
  navLabel: 'Popover',
  navCategory: 'popover',
  description:
    'Signal-driven state machine for the native Popover API. CSS Anchor Positioning, transition-aware lifecycle, no CDK Overlay dependency.',
  apiComponents: ['CngxPopover', 'CngxPopoverTrigger'],
  overview:
    '<p><code>[cngxPopover]</code> wraps the browser Popover API with a reactive state machine ' +
    '(<code>closed → opening → open → closing → closed</code>). ' +
    '<code>[cngxPopoverTrigger]</code> provides ARIA wiring (<code>aria-expanded</code>, ' +
    '<code>aria-controls</code>, <code>aria-haspopup</code>). The consumer owns all event handling.</p>',
  moduleImports: [
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import type { PopoverPlacement } from '@cngx/common/popover';",
  ],
  setup: `
  protected readonly menuItems = signal(['Edit', 'Duplicate', 'Archive', 'Delete']);
  protected readonly placements: PopoverPlacement[] = ['bottom', 'bottom-start', 'bottom-end', 'top', 'left', 'right'];
  `,
  sections: [
    {
      title: 'Click Popover',
      subtitle:
        'The consumer binds <code>(click)="pop.toggle()"</code> — the trigger directive only handles ARIA.',
      imports: ['CngxPopover', 'CngxPopoverTrigger'],
      template: `
  <div style="padding-top:20px">
    <button [cngxPopoverTrigger]="pop" (click)="pop.toggle()" class="chip"
            haspopup="menu">
      Actions
    </button>
    <div cngxPopover #pop="cngxPopover" placement="bottom-start"
         style="list-style:none;margin:0">
      <menu style="margin:0;padding:4px 0;min-width:140px">
        @for (item of menuItems(); track item) {
          <li>
            <button (click)="pop.hide()" type="button"
                    style="display:block;width:100%;padding:8px 16px;border:none;background:none;
                           text-align:left;cursor:pointer;font:inherit">
              {{ item }}
            </button>
          </li>
        }
      </menu>
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ pop.state() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isVisible</span>
      <span class="event-value">{{ pop.isVisible() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Placement Variants',
      subtitle:
        'CSS Anchor Positioning handles all placement. No JavaScript repositioning needed.',
      imports: ['CngxPopover', 'CngxPopoverTrigger'],
      template: `
  <div style="display:flex;gap:16px;flex-wrap:wrap;padding:40px 0">
    @for (p of placements; track p) {
      <div>
        <button [cngxPopoverTrigger]="plPop" (click)="plPop.toggle()" class="chip">
          {{ p }}
        </button>
        <div cngxPopover #plPop="cngxPopover" [placement]="p"
             style="padding:8px 12px;font-size:0.8125rem">
          Popover at {{ p }}
        </div>
      </div>
    }
  </div>`,
    },
    {
      title: 'Controlled Open',
      subtitle:
        'Bind <code>[cngxPopoverOpen]</code> to drive the popover reactively — no <code>show()</code>/<code>hide()</code> calls needed.',
      imports: ['CngxPopover', 'CngxPopoverTrigger'],
      template: `
  <div style="display:flex;gap:12px;align-items:center;padding-top:20px">
    <label [cngxPopoverTrigger]="ctrl"
           style="display:flex;align-items:center;gap:6px;font-size:0.875rem;cursor:pointer">
      <input type="checkbox" #chk (change)="0" />
      Show popover
    </label>
    <div cngxPopover #ctrl="cngxPopover" [cngxPopoverOpen]="chk.checked" placement="bottom"
         [exclusive]="false"
         style="padding:8px 12px;font-size:0.8125rem">
      Controlled by checkbox
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ ctrl.state() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Escape & Mode',
      subtitle:
        'Set <code>[closeOnEscape]="false"</code> to prevent Escape dismiss. Set <code>mode="auto"</code> for browser-native light dismiss.',
      imports: ['CngxPopover', 'CngxPopoverTrigger'],
      template: `
  <div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:20px">
    <div>
      <button [cngxPopoverTrigger]="noEsc" (click)="noEsc.toggle()" class="chip">
        No Escape
      </button>
      <div cngxPopover #noEsc="cngxPopover" [closeOnEscape]="false" placement="bottom"
           style="padding:8px 12px;font-size:0.8125rem">
        Escape won't close this. Click the button again.
      </div>
    </div>
    <div>
      <button [cngxPopoverTrigger]="autoPop" (click)="autoPop.toggle()" class="chip">
        Auto mode
      </button>
      <div cngxPopover #autoPop="cngxPopover" mode="auto" placement="bottom"
           style="padding:8px 12px;font-size:0.8125rem">
        Click outside to dismiss (browser light dismiss).
      </div>
    </div>
  </div>`,
    },
  ],
};
