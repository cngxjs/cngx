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
  ];
  protected readonly collapsedCrumbs = this.crumbs.slice(1, this.crumbs.length - (this.maxVisible - 1));
  protected isCollapsedIndex(index: number): boolean {
    return index >= 1 && index < this.crumbs.length - (this.maxVisible - 1);
  }`,
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb" [maxVisible]="maxVisible" #bc="cngxBreadcrumb">
    <ol>
      @for (crumb of crumbs; track crumb.label; let i = $index; let first = $first; let last = $last) {
        @if (!first && !isCollapsedIndex(i)) {
          <li cngxBreadcrumbSeparator>/</li>
        }
        <li [hidden]="isCollapsedIndex(i)">
          <a cngxBreadcrumbItem [attr.href]="last ? null : crumb.href">{{ crumb.label }}</a>
        </li>
        @if (first && bc.hasCollapsed()) {
          <li cngxBreadcrumbSeparator>/</li>
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
        }
      }
    </ol>
  </nav>
  <div cngxPopover #ovPop="cngxPopover">
    <ul cngxMenu [label]="'Collapsed breadcrumbs'" tabindex="0" #ovMenu="cngxMenu">
      @for (crumb of collapsedCrumbs; track crumb.label) {
        <li cngxMenuItem [value]="crumb.label">{{ crumb.label }}</li>
      }
    </ul>
  </div>`,
};
