import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuItemSubmenu: two-level submenu',
  subtitle:
    'Open the outer menu (ArrowDown / Enter / Space). Highlight "Open Recent" and press ArrowRight to open the submenu - focus transfers to its first item. ArrowLeft / Escape close. Activating a leaf closes everything.',
  description:
    'Nested menu via <code>cngxMenuItemSubmenu</code> as a companion on a <code>cngxMenuItem</code>. <code>aria-haspopup="menu"</code> and <code>aria-expanded</code> live on the parent item; <code>CngxMenuTrigger</code> drives ArrowRight to push the inner <code>CngxMenu</code> onto its focus stack and ArrowLeft / Escape to pop it. The submenu popover is <code>[exclusive]="false"</code> so opening it does not light-dismiss the outer popover. Outside-click on the outer popover light-dismisses the inner submenu via the same exclusive-popover chain. The Recent submenu wires <code>CNGX_SUBMENU_TRY_FALLBACKS</code> so the popover flips to the opposite edge when the right side clips; the resolved placement appears in the event grid.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu and Menubar Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    },
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
  ],
  apiComponents: ['CngxMenuItemSubmenu', 'CngxMenuTrigger', 'CngxMenu', 'CngxMenuItem'],
  moduleImports: [
    "import { CngxMenu, CngxMenuItem, CngxMenuItemSubmenu, CngxMenuSeparator, CngxMenuTrigger, CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd, CNGX_SUBMENU_TRY_FALLBACKS } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxMenu',
    'CngxMenuItem',
    'CngxMenuItemSubmenu',
    'CngxMenuSeparator',
    'CngxMenuTrigger',
    'CngxMenuItemIcon',
    'CngxMenuItemLabel',
    'CngxMenuItemKbd',
    'CngxPopover',
    'CngxPopoverTrigger',
  ],
  setup: `protected readonly lastAction = signal<string | null>(null);
  protected readonly resolvedPlacement = signal<string>('—');
  protected readonly submenuFallbacks = CNGX_SUBMENU_TRY_FALLBACKS;

  protected onRecentToggle(e: Event, pop: HTMLElement): void {
    if ((e as ToggleEvent).newState !== 'open') {
      this.resolvedPlacement.set('—');
      return;
    }
    // Defer one microtask so the browser settles position-try-fallbacks
    // resolution before the read — afterRender would fire too early on
    // layout-thrash frames.
    queueMicrotask(() => {
      const resolved = getComputedStyle(pop).getPropertyValue('position-area').trim();
      this.resolvedPlacement.set(resolved || '—');
    });
  }`,
  template: `  <button
    type="button"
    [cngxMenuTrigger]="outer"
    [cngxPopoverTrigger]="outerPop"
    [popover]="outerPop"
    [haspopup]="'menu'"
    (click)="outerPop.toggle()"
    aria-label="File menu"
  >
    File
  </button>
  <div cngxPopover #outerPop="cngxPopover" placement="bottom-start">
    <ul
      cngxMenu
      [label]="'File'"
      tabindex="0"
      #outer="cngxMenu"
      (itemActivated)="lastAction.set($any($event)); recentPop.hide(); outerPop.hide()"
    >
      <li cngxMenuItem value="new">
        <span cngxMenuItemIcon>N</span>
        <span cngxMenuItemLabel>New</span>
        <kbd cngxMenuItemKbd>Ctrl+N</kbd>
      </li>
      <li
        cngxMenuItem
        [cngxMenuItemSubmenu]="recentPop"
        [submenuMenu]="recentMenu"
        value="recent"
      >
        <span cngxMenuItemIcon>R</span>
        <span cngxMenuItemLabel>Open Recent</span>
        <kbd cngxMenuItemKbd>&gt;</kbd>
      </li>
      <li cngxMenuSeparator></li>
      <li cngxMenuItem value="save">
        <span cngxMenuItemIcon>S</span>
        <span cngxMenuItemLabel>Save</span>
        <kbd cngxMenuItemKbd>Ctrl+S</kbd>
      </li>
      <li cngxMenuItem value="close">
        <span cngxMenuItemIcon>X</span>
        <span cngxMenuItemLabel>Close</span>
        <kbd cngxMenuItemKbd>Ctrl+W</kbd>
      </li>
    </ul>
  </div>
  <div cngxPopover #recentPop="cngxPopover" placement="right-start" [exclusive]="false"
       [positionTryFallbacks]="submenuFallbacks"
       (toggle)="onRecentToggle($event, recentPop.elementRef.nativeElement)">
    <ul
      cngxMenu
      [label]="'Recent files'"
      tabindex="0"
      #recentMenu="cngxMenu"
      (itemActivated)="lastAction.set($any($event)); recentPop.hide(); outerPop.hide()"
    >
      <li cngxMenuItem value="recent:plan.md">
        <span cngxMenuItemIcon>F</span>
        <span cngxMenuItemLabel>plan.md</span>
      </li>
      <li cngxMenuItem value="recent:notes.txt">
        <span cngxMenuItemIcon>F</span>
        <span cngxMenuItemLabel>notes.txt</span>
      </li>
      <li cngxMenuItem value="recent:CHANGELOG.md">
        <span cngxMenuItemIcon>F</span>
        <span cngxMenuItemLabel>CHANGELOG.md</span>
      </li>
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Resolved submenu placement</span>
      <span class="event-value">{{ resolvedPlacement() }}</span>
    </div>
  </div>`,
};
