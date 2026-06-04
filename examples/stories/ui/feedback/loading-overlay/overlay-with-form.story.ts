import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLoadingOverlay: overlay with form',
  subtitle: 'Click "Save" to overlay the form. Focus inside is saved and restored after loading completes.',
  description: 'Form-disabling overlay: while loading, the wrapped form goes <code>inert</code>, the spinner appears over a backdrop, and focus is saved at open then restored to its original target when loading flips back to false.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'async-state', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
    { label: 'WCAG 2.4.3 Focus Order', href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html' },
  ],
  apiComponents: [
    'CngxLoadingOverlay',
  ],
  moduleImports: [
    'import { CngxLoadingOverlay } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxLoadingOverlay'],
  setup: `protected readonly isLoading = signal(false);
  protected handleLoad(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 3000);
  }`,
  template: `
  <button (click)="handleLoad()" class="chip" type="button" style="margin-bottom:16px">
    {{ isLoading() ? 'Saving...' : 'Save (3s)' }}
  </button>

  <cngx-loading-overlay [loading]="isLoading()" label="Saving form">
    <div class="demo-frame-padded demo-stack">
      <label class="demo-field">
        <span class="demo-label">Name</span>
        <input class="demo-input" placeholder="Jane Doe" />
      </label>
      <label class="demo-field">
        <span class="demo-label">Email</span>
        <input class="demo-input" type="email" placeholder="jane@example.com" />
      </label>
      <button type="button" class="chip">A button inside the overlay</button>
    </div>
  </cngx-loading-overlay>`,
};
