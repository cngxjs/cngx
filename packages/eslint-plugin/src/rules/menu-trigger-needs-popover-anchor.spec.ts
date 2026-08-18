import { menuTriggerNeedsPopoverAnchor } from './menu-trigger-needs-popover-anchor';
import { createTemplateRuleTester } from '../testing/rule-tester';

createTemplateRuleTester().run('menu-trigger-needs-popover-anchor', menuTriggerNeedsPopoverAnchor, {
  valid: [
    {
      name: 'menu trigger stacked with a bound popover trigger',
      code: `<button [cngxMenuTrigger]="menu" [cngxPopoverTrigger]="pop" (click)="pop.toggle()">Menu</button>`,
    },
    {
      name: 'menu trigger stacked with a plain popover trigger',
      code: `<button cngxMenuTrigger cngxPopoverTrigger>Menu</button>`,
    },
    {
      name: 'a lone popover trigger is fine',
      code: `<button [cngxPopoverTrigger]="pop">Open</button>`,
    },
    {
      name: 'an element with neither trigger',
      code: `<button (click)="run()">Go</button>`,
    },
  ],
  invalid: [
    {
      name: 'bound menu trigger without a popover anchor',
      code: `<button [cngxMenuTrigger]="menu">Menu</button>`,
      errors: [{ messageId: 'menuTriggerNeedsAnchor' }],
    },
    {
      name: 'plain menu trigger without a popover anchor',
      code: `<button cngxMenuTrigger>Menu</button>`,
      errors: [{ messageId: 'menuTriggerNeedsAnchor' }],
    },
  ],
});
