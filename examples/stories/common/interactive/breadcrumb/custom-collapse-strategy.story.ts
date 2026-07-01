import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Custom collapse strategy',
  subtitle:
    'Override <code>CNGX_BREADCRUMB_COLLAPSE_STRATEGY</code> in <code>viewProviders</code> to keep the first two and last two crumbs, folding everything between into the ellipsis menu.',
  description:
    'The collapse rule is a swappable DI token, not baked into the coordinator. A pure <code>(total) =&gt; Set&lt;number&gt;</code> replaces the default keep-first + last rule per instance - no fork, no flag. This is the extension surface the token exists for.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: ['CngxBreadcrumb', 'CngxMenu'],
  moduleImports: [
    "import { CNGX_BREADCRUMB_COLLAPSE_STRATEGY } from '@cngx/common/interactive';",
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
  viewProviders: [
    `{
      provide: CNGX_BREADCRUMB_COLLAPSE_STRATEGY,
      useValue: (total: number) => {
        const collapsed = new Set<number>();
        for (let i = 2; i < total - 2; i++) {
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
    { label: 'Docs', href: '#' },
    { label: 'Guides', href: '#' },
    { label: 'Components', href: '#' },
    { label: 'Navigation', href: '#' },
    { label: 'Breadcrumb', href: '#' },
    { label: 'Collapse Strategy', href: '' },
  ];`,
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb" #bc="cngxBreadcrumb">
    <ol>
      @for (crumb of crumbs; track crumb.label; let last = $last) {
        <li [style.display]="bc.isCollapsed(crumbRef) ? 'none' : null">
          <a cngxBreadcrumbItem #crumbRef="cngxBreadcrumbItem" [attr.href]="last ? null : crumb.href">{{ crumb.label }}</a>
        </li>
        @if (!last) {
          <li cngxBreadcrumbSeparator [style.display]="bc.isCollapsed(crumbRef) ? 'none' : null">/</li>
        }
        @if ($index === 1 && bc.hasCollapsed()) {
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
