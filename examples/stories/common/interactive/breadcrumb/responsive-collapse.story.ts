import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Responsive width-aware collapse',
  subtitle:
    'A <code>CngxResizeObserver</code> on the <code>nav</code> feeds a <code>computed</code> <code>maxVisible</code> - wider container, more crumbs. Drag the right edge to resize.',
  description:
    'No responsive directive is needed: <code>maxVisible</code> is derived from the observed width in a <code>computed()</code> (Pillar 1), and the trio collapses the middle crumbs into the ellipsis <code>CngxMenu</code> purely from that count. This is the recipe an organism can later package as a first-class capability.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxBreadcrumb', 'CngxResizeObserver', 'CngxMenu'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
    'CngxResizeObserver',
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
  setup: `protected readonly ro = viewChild(CngxResizeObserver);
  protected readonly maxVisible = computed(() => {
    const width = this.ro()?.width() ?? 0;
    if (width >= 640) {
      return 6;
    }
    if (width >= 440) {
      return 4;
    }
    return 2;
  });
  protected readonly crumbs = [
    { label: 'Home', href: '#' },
    { label: 'Catalog', href: '#' },
    { label: 'Books', href: '#' },
    { label: 'Fantasy', href: '#' },
    { label: 'Tolkien', href: '#' },
    { label: 'The Hobbit', href: '' },
  ];`,
  template: `  <nav
    cngxBreadcrumb
    cngxResizeObserver
    class="cngx-breadcrumb demo-breadcrumb-resizable"
    [maxVisible]="maxVisible()"
    #bc="cngxBreadcrumb"
    style="resize: horizontal; overflow: auto; min-width: 200px; max-width: 100%; padding: 0.75rem;">
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
