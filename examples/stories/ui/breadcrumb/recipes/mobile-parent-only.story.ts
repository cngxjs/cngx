import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Mobile parent-only',
  subtitle:
    'A swapped <code>CNGX_BREADCRUMB_COLLAPSE_STRATEGY</code> keeps the parent and the current page under a narrow breakpoint and folds every crumb before them into an ellipsis <code>CngxMenu</code>. Narrow the viewport below 640px.',
  description:
    'On small screens the full trail wastes horizontal space, but the current page must stay in it. The keep-tail strategy in <code>viewProviders</code> keeps the last <code>maxVisible</code> crumbs and collapses everything before them, root included; <code>[maxVisible]="narrow.matches() ? 2 : undefined"</code> turns it on only below the breakpoint. The media query drives the count, the strategy decides which crumbs stay, the trio derives the collapse (Pillar 1).',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxBreadcrumb', 'CngxMediaQuery', 'CngxMenu'],
  moduleImports: [
    "import { CNGX_BREADCRUMB_COLLAPSE_STRATEGY } from '@cngx/common/interactive';",
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
  viewProviders: [
    `{
      provide: CNGX_BREADCRUMB_COLLAPSE_STRATEGY,
      useValue: (total: number, maxVisible: number) => {
        const collapsed = new Set<number>();
        if (!maxVisible || total <= maxVisible) {
          return collapsed;
        }
        for (let i = 0; i < total - maxVisible; i++) {
          collapsed.add(i);
        }
        return collapsed;
      },
    }`,
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
    [maxVisible]="narrow.matches() ? 2 : undefined"
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
