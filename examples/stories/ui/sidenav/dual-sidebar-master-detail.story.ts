import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: dual sidebar master detail',
  subtitle: 'Left sidebar docked as permanent navigation (<code>side</code> mode, <code>collapsedAs="hidden"</code>). Right sidebar as a non-modal inspector (<code>modality="none"</code>): it overlays the content without a backdrop, so the order list and the left nav stay operable while it is open.',
  description: 'Two <code>cngx-sidenav</code> instances scoped to one <code>cngx-sidenav-layout</code>: a left docked nav that hides to zero width and a right over-mode inspector. <code>modality="none"</code> keeps the page live: no backdrop, no inert, no focus trap. Clicking another order swaps the detail in place (the order buttons name the inspector in <code>aria-controls</code>, so their press is not an outside press); Escape or Close dismisses it.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG - Disclosure', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/' },
  ],
  apiComponents: [
    'CngxSidenav',
    'CngxSidenavLayout',
    'CngxSidenavContent',
  ],
  moduleImports: [
    'import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent } from \'@cngx/ui\';',
    'import { CngxNavLink } from \'@cngx/common\';',
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxNavLink'],
  setup: `protected readonly leftCollapsed = signal(false);
  protected readonly rightOpen = signal(false);
  protected readonly selectedItem = signal<string | null>(null);
  protected readonly items = ['Order #1042', 'Order #1043', 'Order #1044', 'Order #1045'];
  protected selectItem(item: string): void {
    this.selectedItem.set(item);
    this.rightOpen.set(true);
  }`,
  template: `  <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav__container--short">
    <cngx-sidenav position="start" [(collapsed)]="leftCollapsed" mode="side" collapsedAs="hidden" width="160px">
      @for (item of ['Orders', 'Products', 'Customers', 'Reports']; track item) {
        <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">
          {{ item }}
        </a>
      }
    </cngx-sidenav>

    <cngx-sidenav-content class="demo-sidenav__content--compact">
      <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">Orders</h3>
      @for (item of items; track item) {
        <button type="button" class="demo-sidenav__order-item"
                [class.is-selected]="selectedItem() === item"
                [attr.aria-current]="selectedItem() === item ? 'true' : null"
                [attr.aria-controls]="detailNav.id()"
                (click)="selectItem(item)">
          {{ item }}
        </button>
      }
    </cngx-sidenav-content>

    <cngx-sidenav #detailNav position="end" [(opened)]="rightOpen" mode="over" modality="none"
                  ariaLabel="Order details" width="280px">
      <div class="demo-sidenav__detail-pad">
        @if (selectedItem()) {
          <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">{{ selectedItem() }}</h3>
          <p class="demo-sidenav__content-hint">
            Detail view for the selected order. Status, items, shipping info would go here.
          </p>
          <div class="demo-sidenav__detail-actions">
            <button class="sort-btn" type="button" (click)="rightOpen.set(false)">Close</button>
          </div>
        } @else {
          <p class="demo-sidenav__content-hint">Select an order to view details.</p>
        }
      </div>
    </cngx-sidenav>
  </cngx-sidenav-layout>`,
  templateChrome: `<div class="button-row">
    <button class="sort-btn" type="button" (click)="leftCollapsed.set(!leftCollapsed())">
      Left: {{ leftCollapsed() ? 'hidden' : 'shown' }}
    </button>
    <button class="sort-btn" type="button"
            [attr.aria-controls]="detailNav.id()"
            [attr.aria-expanded]="rightOpen()"
            (click)="rightOpen.set(!rightOpen())">
      Right: {{ rightOpen() ? 'open' : 'closed' }}
    </button>
  </div>
<div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="!leftCollapsed()">left: {{ leftCollapsed() ? 'hidden' : 'shown' }}</span>
    <span class="status-badge" [class.active]="rightOpen()">right: {{ rightOpen() ? 'open' : 'closed' }}</span>
    @if (selectedItem()) {
      <span class="status-badge active">selected: {{ selectedItem() }}</span>
    }
  </div>`,
};
