import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: dual sidebar master detail',
  subtitle: 'Left sidebar with permanent navigation (<code>push</code> mode). Right sidebar as an overlay detail panel that opens when clicking an item in the content area. Shared backdrop managed by <code>CngxSidenavLayout</code>.',
  description: 'Two <code>cngx-sidenav</code> instances scoped to one <code>cngx-sidenav-layout</code>: a left push-mode nav and a right over-mode detail drawer. Clicking an order opens the detail; closing it leaves the left nav intact.',
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
  setup: `protected readonly leftOpen = signal(true);
  protected readonly rightOpen = signal(false);
  protected readonly selectedItem = signal<string | null>(null);
  protected readonly items = ['Order #1042', 'Order #1043', 'Order #1044', 'Order #1045'];
  protected selectItem(item: string): void {
    this.selectedItem.set(item);
    this.rightOpen.set(true);
  }`,
  template: `  <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav__container--short">
    <cngx-sidenav position="start" [(opened)]="leftOpen" mode="push" width="160px">
      @for (item of ['Orders', 'Products', 'Customers', 'Reports']; track item) {
        <a cngxNavLink class="demo-sidenav__link demo-sidenav__link--plain">
          {{ item }}
        </a>
      }
    </cngx-sidenav>

    <cngx-sidenav-content class="demo-sidenav__content--compact">
      <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">Orders</h3>
      @for (item of items; track item) {
        <div class="demo-sidenav__order-item"
             [class.is-selected]="selectedItem() === item"
             (click)="selectItem(item)">
          {{ item }}
        </div>
      }
    </cngx-sidenav-content>

    <cngx-sidenav position="end" [(opened)]="rightOpen" mode="over" width="280px">
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
    <button class="sort-btn" type="button" (click)="leftOpen.set(!leftOpen())">
      Left: {{ leftOpen() ? 'open' : 'closed' }}
    </button>
    <button class="sort-btn" type="button" (click)="rightOpen.set(!rightOpen())">
      Right: {{ rightOpen() ? 'open' : 'closed' }}
    </button>
  </div>
<div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="leftOpen()">left: {{ leftOpen() ? 'open' : 'closed' }}</span>
    <span class="status-badge" [class.active]="rightOpen()">right: {{ rightOpen() ? 'open' : 'closed' }}</span>
    @if (selectedItem()) {
      <span class="status-badge active">selected: {{ selectedItem() }}</span>
    }
  </div>`,
};
