import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBreadcrumb: Truncated labels with tooltip',
  subtitle:
    'Long crumb labels clamp to one line with <code>CngxTruncate</code>; the full text is revealed on hover or keyboard focus via <code>CngxTooltip</code>.',
  description:
    'Truncation and reveal are pure composition on the bare trail - no breadcrumb-specific code. Each link crumb clamps to a fixed width and its full label lives in an accessible <code>role="tooltip"</code> the trigger exposes through <code>aria-describedby</code>.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxBreadcrumb', 'CngxTruncate', 'CngxTooltip'],
  moduleImports: [
    "import { CngxTooltip } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxBreadcrumb',
    'CngxBreadcrumbItem',
    'CngxBreadcrumbSeparator',
    'CngxTruncate',
    'CngxTooltip',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Breadcrumb pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    },
  ],
  setup: `protected readonly crumbs = [
    { label: 'Home', href: '#' },
    { label: 'Enterprise Resource Planning', href: '#' },
    { label: 'Procurement and Vendor Management', href: '#' },
    { label: 'Purchase Order #48213-B', href: '' },
  ];`,
  template: `  <nav cngxBreadcrumb class="cngx-breadcrumb" #bc="cngxBreadcrumb">
    <ol>
      @for (crumb of crumbs; track crumb.label; let last = $last) {
        <li>
          <a
            cngxBreadcrumbItem
            [cngxTruncate]="1"
            [cngxTooltip]="crumb.label"
            tooltipPlacement="bottom"
            [attr.href]="last ? null : crumb.href"
            style="max-width: 12ch;">
            {{ crumb.label }}
          </a>
        </li>
        @if (!last) {
          <li cngxBreadcrumbSeparator>/</li>
        }
      }
    </ol>
  </nav>`,
};
