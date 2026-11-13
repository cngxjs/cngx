import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNavRail: rail at the inline end',
  subtitle:
    'A rail placed after the page content. side="end" moves the border to the rail edge that faces the content and opens the flyout and the label tooltip toward the content.',
  description:
    'The rail sits at the inline end because it comes last in the DOM; <code>side</code> does not move it, it only turns the parts that depend on the side. The value is logical: under <code>dir="rtl"</code> an end rail is the left one and its tooltip and flyout open to the right. A tooltip that would overflow the viewport flips to the other side of its row. <code>withNavRailSide(\'end\')</code> sets the side app-wide. Without <code>[ariaLabel]</code> an end rail is named by its own copy key (English: <code>Secondary navigation</code>), so it never shares a landmark name with a start rail; this one is named <code>Tools</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxNavRail'],
  moduleImports: [
    "import { CngxNavRail } from '@cngx/ui/nav-rail';",
    "import { CngxNavBadge, CngxNavFooter, CngxNavGroup, CngxNavGroupContent, CngxNavHeader, CngxNavIcon, CngxNavLink, CngxNavMark } from '@cngx/common/interactive';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxNavRail',
    'CngxNavBadge',
    'CngxNavFooter',
    'CngxNavGroup',
    'CngxNavGroupContent',
    'CngxNavHeader',
    'CngxNavIcon',
    'CngxNavLink',
    'CngxNavMark',
    'CngxIcon',
    'MatIconModule',
  ],
  setup: `protected readonly active = signal('/notes');`,
  template: `
  <div class="demo-nav-rail__frame">
    <div class="demo-nav-rail__content">
      <p>Active: <code>{{ active() }}</code></p>
    </div>

    <cngx-nav-rail side="end" ariaLabel="Tools">
      <cngx-nav-header>
        <span cngxNavMark class="demo-nav-rail__mark" aria-hidden="true">T</span>
      </cngx-nav-header>

      <a cngxNavLink href="#" [active]="active() === '/notes'"
         (click)="active.set('/notes'); $event.preventDefault()">
        <cngx-icon cngxNavIcon><mat-icon>sticky_note_2</mat-icon></cngx-icon>
        Notes
        <span cngxNavBadge [value]="3" ariaLabel="3 new">3</span>
      </a>
      <a cngxNavLink href="#" [active]="active() === '/history'"
         (click)="active.set('/history'); $event.preventDefault()">
        <cngx-icon cngxNavIcon><mat-icon>history</mat-icon></cngx-icon>
        History
      </a>

      <button type="button" cngxNavGroup #reports="cngxNavGroup">
        <cngx-icon cngxNavIcon><mat-icon>bar_chart</mat-icon></cngx-icon>
        Reports
      </button>
      <div [cngxNavGroupContent]="reports">
        <div>
          @for (sub of ['Weekly', 'Monthly', 'Yearly']; track sub) {
            <a cngxNavLink href="#" [depth]="1" [active]="active() === '/reports/' + sub"
               (click)="active.set('/reports/' + sub); $event.preventDefault()">{{ sub }}</a>
          }
        </div>
      </div>

      <cngx-nav-footer>
        <span cngxNavMark class="demo-nav-rail__mark" aria-hidden="true">CW</span>
      </cngx-nav-footer>
    </cngx-nav-rail>
  </div>`,
};
