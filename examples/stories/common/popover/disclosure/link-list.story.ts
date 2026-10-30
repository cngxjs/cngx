import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverTrigger: Popover disclosure',
  subtitle:
    'A list of links behind a button: <code>cngxButton</code> plus <code>[cngxPopoverTrigger]</code> with <code>haspopup="none"</code>.',
  description:
    'A popover disclosure shows and hides content that floats over the page. It is not a menu: <code>role="menu"</code> promises arrow-key navigation between commands, and the WAI-ARIA APG reserves it for actions, not for navigation. Links stay plain links in a list, reached with Tab. <code>haspopup="none"</code> keeps <code>aria-haspopup</code> off the button, so a screen reader announces "button, collapsed" and <code>aria-expanded</code> carries the state. The button, Escape or a click elsewhere (<code>[closeOnOutsideClick]="true"</code>) closes the panel. <code>[restoreFocus]="true"</code> brings focus back to the button when the close would leave it nowhere, for example after Escape from a link; a click on another control keeps focus on that control. The caret sits in the <code>cngxButtonEnd</code> slot and is decorative. When the content should push the layout instead of floating, use the inline <code>cngxDisclosure</code>; when the entries are commands, use <code>cngxMenuButton</code>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
    {
      label: 'WAI-ARIA APG: Menu Button Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    },
  ],
  apiComponents: ['CngxPopoverTrigger', 'CngxPopover', 'CngxButton'],
  moduleImports: [
    "import { CngxButton, CngxButtonEnd } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: ['CngxButton', 'CngxButtonEnd', 'CngxIcon', 'CngxPopover', 'CngxPopoverTrigger'],
  template: `
  <div class="demo-popover-stage">
    <button
      type="button"
      cngxButton="outline"
      [cngxPopoverTrigger]="pop"
      [haspopup]="'none'"
      [restoreFocus]="true"
      (click)="pop.toggle()"
    >
      Resources
      <cngx-icon cngxButtonEnd>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </cngx-icon>
    </button>
    <div
      cngxPopover
      #pop="cngxPopover"
      placement="bottom-start"
      [closeOnOutsideClick]="true"
      class="demo-popover-surface"
    >
      <ul class="demo-popover-menu">
        <li><a class="demo-popover-menu-item" href="https://angular.dev/overview" target="_blank" rel="noopener">Angular overview</a></li>
        <li><a class="demo-popover-menu-item" href="https://angular.dev/guide/signals" target="_blank" rel="noopener">Signals guide</a></li>
        <li><a class="demo-popover-menu-item" href="https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/" target="_blank" rel="noopener">Disclosure pattern</a></li>
      </ul>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isVisible</span>
      <span class="event-value">{{ pop.isVisible() }}</span>
    </div>
  </div>`,
};
