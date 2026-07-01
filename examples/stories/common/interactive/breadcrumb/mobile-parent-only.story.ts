import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Mobile parent-only',
  subtitle:
    'A <code>CngxMediaQuery</code> collapses the trail to a single root crumb plus an ellipsis <code>CngxMenu</code> under a narrow breakpoint. Narrow the viewport below 640px.',
  description:
    'On small screens the full trail wastes horizontal space. Binding <code>[maxVisible]="matches() ? 1 : undefined"</code> keeps only the first crumb visible and folds the rest into the overflow menu - the breakpoint drives the count, the trio derives the collapse (Pillar 1).',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxBreadcrumb', 'CngxMediaQuery', 'CngxMenu'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
    'CngxMediaQuery',
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
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#' },
    { label: 'Catalog', href: '#' },
    { label: 'Books', href: '#' },
    { label: 'Fantasy', href: '#' },
    { label: 'The Hobbit', href: '' },
  ];`,
  template: `  <nav
    cngxBreadcrumb
    cngxMediaQuery="(max-width: 640px)"
    class="cngx-breadcrumb"
    [maxVisible]="narrow.matches() ? 1 : undefined"
    #bc="cngxBreadcrumb"
    #narrow="cngxMediaQuery">
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
  <div cngxPopover #ovPop="cngxPopover">
    <ul cngxMenu [label]="'Collapsed breadcrumbs'" tabindex="0" #ovMenu="cngxMenu">
      @for (item of bc.collapsedItems(); track item) {
        @let itemLabel = item.resolvedLabel();
        <li cngxMenuItem [value]="itemLabel">{{ itemLabel }}</li>
      }
    </ul>
  </div>`,
};
