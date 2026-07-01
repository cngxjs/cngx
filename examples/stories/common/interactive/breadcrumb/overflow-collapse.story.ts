import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Overflow collapse',
  subtitle:
    'A long trail past <code>[maxVisible]</code> collapses its middle crumbs into an ellipsis <code>CngxMenu</code>; the first and last crumbs stay.',
  description:
    'The coordinator computes the collapse set from the projected items and exposes <code>hasCollapsed()</code>; the ellipsis button opens a <code>CngxMenu</code> (in a <code>CngxPopover</code>) listing the hidden crumbs. Collapse marking and the terminal <code>aria-current</code> stay pure derivation.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxBreadcrumb', 'CngxMenu', 'CngxMenuTrigger'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
    'CngxMenu',
    'CngxMenuItem',
    'CngxMenuTrigger',
    'CngxPopover',
    'CngxPopoverTrigger',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    },
  ],
  setup: `protected readonly maxVisible = 4;
  protected readonly crumbs = [
    { label: 'Home', href: '#' },
    { label: 'Catalog', href: '#' },
    { label: 'Books', href: '#' },
    { label: 'Fantasy', href: '#' },
    { label: 'Tolkien', href: '#' },
    { label: 'The Hobbit', href: '' },
  ];`,
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb" [maxVisible]="maxVisible" #bc="cngxBreadcrumb">
    <ol>
      @for (crumb of crumbs; track crumb.label; let first = $first; let last = $last) {
        <li [style.display]="bc.isCollapsed(crumbRef) ? 'none' : null">
          <a cngxBreadcrumbItem #crumbRef="cngxBreadcrumbItem" [attr.href]="last ? null : crumb.href">{{ crumb.label }}</a>
        </li>
        @if (!last) {
          <li cngxBreadcrumbSeparator [style.display]="bc.isCollapsed(crumbRef) ? 'none' : null">/</li>
        }
        @if (first && bc.hasCollapsed()) {
          <li>
            <button
              type="button"
              [cngxMenuTrigger]="ovMenu"
              [cngxPopoverTrigger]="ovPop"
              [haspopup]="'menu'"
              [popover]="ovPop"
              (click)="ovPop.toggle()"
              aria-label="Show collapsed breadcrumbs">
              &hellip;
            </button>
          </li>
          <li cngxBreadcrumbSeparator>/</li>
        }
      }
    </ol>
  </nav>
  <div cngxPopover class="breadcrumb-overflow-menu" #ovPop="cngxPopover">
    <ul cngxMenu [label]="'Collapsed breadcrumbs'" tabindex="0" #ovMenu="cngxMenu">
      @for (item of bc.collapsedItems(); track item) {
        @let itemLabel = item.resolvedLabel();
        <li cngxMenuItem [value]="itemLabel">{{ itemLabel }}</li>
      }
    </ul>
  </div>`,
};
