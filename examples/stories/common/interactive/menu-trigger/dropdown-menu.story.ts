import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Dropdown menu',
  subtitle: 'Press ArrowDown/Enter/Space to open, Escape to close. Arrow keys navigate, typeahead jumps to matching labels.',
  description: 'Button that opens a CngxMenu inside a CngxPopover. Full keyboard support; activation always closes the menu (menu semantics).',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxMenuTrigger',
    'CngxMenu',
    'CngxMenuItem',
  ],
  moduleImports: [
    'import { CngxMenu, CngxMenuItem, CngxMenuTrigger } from \'@cngx/common/interactive\';',
    'import { CngxPopover, CngxPopoverTrigger } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxMenu', 'CngxMenuItem', 'CngxMenuTrigger', 'CngxPopover', 'CngxPopoverTrigger'],
  setup: `protected readonly lastAction = signal<string | null>(null);`,
  template: `
  <style>
    .trigger { min-width: 160px; padding: 8px 12px; border: 1px solid var(--cngx-color-border, #d0d5dd); border-radius: 6px; background: var(--cngx-color-surface, #fff); color: var(--cngx-color-text, inherit); cursor: pointer; font: inherit; }
    .trigger:focus-visible { outline: 2px solid var(--cngx-color-primary, #4a8cff); outline-offset: 2px; }
    .pop { margin-top: 4px; min-width: 180px; border: 1px solid var(--cngx-color-border, #d0d5dd); border-radius: 6px; background: var(--cngx-color-surface, #fff); color: var(--cngx-color-text, inherit); box-shadow: 0 4px 12px oklch(0 0 0 / 0.12); }
  </style>
  <button
    type="button"
    class="trigger"
    [cngxMenuTrigger]="menu"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'menu'"
    [popover]="pop"
    (click)="pop.toggle()"
    #trigger="cngxMenuTrigger"
  >
    Actions
  </button>
  <div cngxPopover #pop="cngxPopover" class="pop">
    <ul
      cngxMenu
      class="menu"
      [label]="'File actions'"
      tabindex="0"
      (itemActivated)="lastAction.set($any($event))"
      #menu="cngxMenu"
    >
      <li cngxMenuItem value="new">New</li>
      <li cngxMenuItem value="open">Open…</li>
      <li cngxMenuItem value="save">Save</li>
      <li cngxMenuItem value="close">Close</li>
    </ul>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Open</span>
      <span class="event-value">{{ trigger.isOpen() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
  css: `.trigger {
  min-width: 160px;
  padding: 8px 12px;
  border: 1px solid var(--cngx-color-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 6px);
  background: var(--cngx-color-surface, #fff);
  cursor: pointer;
  font: inherit;
}
.trigger:focus-visible {
  outline: 2px solid var(--cngx-color-primary, #4a8cff);
  outline-offset: 2px;
}
.pop {
  margin-top: 4px;
  padding: 4px;
  min-width: 180px;
  border: 1px solid var(--cngx-color-border, #d0d5dd);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.menu {
  list-style: none;
  margin: 0;
  padding: 0;
  outline: none;
}
.menu [cngxMenuItem] {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.cngx-menu-item--highlighted {
  background: var(--cngx-menu-highlight-bg, rgba(74, 140, 255, 0.15));
}`,
};
