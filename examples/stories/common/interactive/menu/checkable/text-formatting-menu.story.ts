import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenuItemCheckbox: text formatting menu',
  subtitle:
    'Checkboxes for independent toggles, radios inside a <code>cngxMenuGroup</code> for exclusive selection.',
  description:
    'Two menuitem roles that carry their own state. <code>cngxMenuItemCheckbox</code> renders <code>role="menuitemcheckbox"</code> with <code>aria-checked</code> bound to a two-way <code>[(checked)]</code>. <code>cngxMenuItemRadio</code> renders <code>role="menuitemradio"</code> and resolves its mutual-exclusion scope through the enclosing <code>cngxMenuGroup</code> (which provides <code>CNGX_MENU_RADIO_GROUP</code>). When wrapped in a <code>CngxMenuTrigger</code> the menu inherits the dismissal-paths defaults (outside-click and blur close the menu).',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu and Menubar Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    },
    {
      label: 'ARIA: menuitemcheckbox role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#menuitemcheckbox',
    },
    {
      label: 'ARIA: menuitemradio role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#menuitemradio',
    },
  ],
  apiComponents: [
    'CngxMenuItemCheckbox',
    'CngxMenuItemRadio',
    'CngxMenuGroup',
    'CngxMenu',
    'CngxMenuSeparator',
  ],
  moduleImports: [
    "import { CngxMenu, CngxMenuGroup, CngxMenuItemCheckbox, CngxMenuItemRadio, CngxMenuSeparator } from '@cngx/common/interactive';",
  ],
  imports: ['CngxMenu', 'CngxMenuGroup', 'CngxMenuItemCheckbox', 'CngxMenuItemRadio', 'CngxMenuSeparator'],
  setup: `protected readonly bold = signal(true);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
  protected readonly alignment = signal<'left' | 'center' | 'right'>('left');`,
  template: `  <ul cngxMenu [label]="'Text formatting'" tabindex="0">
    <li cngxMenuItemCheckbox value="bold" [(checked)]="bold">Bold</li>
    <li cngxMenuItemCheckbox value="italic" [(checked)]="italic">Italic</li>
    <li cngxMenuItemCheckbox value="underline" [(checked)]="underline">Underline</li>
    <li cngxMenuSeparator></li>
    <div cngxMenuGroup [label]="'Alignment'" name="alignment" [(selectedValue)]="alignment">
      <li cngxMenuItemRadio value="left">Left</li>
      <li cngxMenuItemRadio value="center">Center</li>
      <li cngxMenuItemRadio value="right">Right</li>
    </div>
  </ul>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Bold</span>
      <span class="event-value">{{ bold() ? 'on' : 'off' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Italic</span>
      <span class="event-value">{{ italic() ? 'on' : 'off' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Underline</span>
      <span class="event-value">{{ underline() ? 'on' : 'off' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Alignment</span>
      <span class="event-value">{{ alignment() }}</span>
    </div>
  </div>`,
};
