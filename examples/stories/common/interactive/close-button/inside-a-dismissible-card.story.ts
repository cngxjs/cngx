import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Inside a dismissible card',
  subtitle: 'Composition: the close button positioned absolute in the top-right corner of a card-shaped container. Click handled by the parent component, not the close button.',
  description: 'A common pattern in cngx feedback components (alert, banner, toast) is a dismissible surface with the close affordance pinned to a corner. The close button does not own positioning or surface chrome; the parent owns the layout, the absolute positioning, and the dismiss state. The close button only owns the icon, the accessible name, and the bubbled click. Click the X to hide the card; press Show to restore.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: [
    'CngxCloseButton',
  ],
  moduleImports: [
    'import { CngxCloseButton } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCloseButton'],
  setup: `
  protected readonly visible = signal(true);

  protected handleDismiss(): void {
    this.visible.set(false);
  }`,
  setupChrome: `
  protected handleRestore(): void {
    this.visible.set(true);
  }`,
  template: `
  <div role="status" aria-live="polite"
    style="min-height:9rem; max-width:24rem">
    @if (visible()) {
      <div class="demo-dismissible-card"
        style="position:relative; display:flex; flex-direction:column; gap:4px">
        <strong>Saved successfully</strong>
        <span>Your changes are now live. This card can be dismissed.</span>
        <span style="position:absolute; top:4px; right:4px">
          <cngx-close-button label="Dismiss saved-successfully card"
            (click)="handleDismiss()" />
        </span>
      </div>
    } @else {
      <span>Card dismissed.</span>
    }
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="handleRestore()" [disabled]="visible()">Show</button>
  </div>`,
};
