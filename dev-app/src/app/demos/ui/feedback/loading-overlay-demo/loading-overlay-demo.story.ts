import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Loading Overlay',
  navLabel: 'Loading Overlay',
  navCategory: 'feedback',
  description: 'Content container that blocks interaction with inert, renders backdrop + spinner, and manages focus save/restore.',
  apiComponents: ['CngxLoadingOverlay'],
  moduleImports: [
    "import { CngxLoadingOverlay } from '@cngx/ui/feedback';",
  ],
  setup: `
  protected readonly isLoading = signal(false);

  protected handleLoad(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 3000);
  }
  `,
  sections: [
    {
      title: 'Overlay with Form',
      subtitle: 'Click "Save" to overlay the form. Focus inside is saved and restored after loading completes.',
      imports: ['CngxLoadingOverlay'],
      template: `
  <button (click)="handleLoad()" class="chip" style="margin-bottom:16px">
    {{ isLoading() ? 'Saving...' : 'Save (3s)' }}
  </button>

  <cngx-loading-overlay [loading]="isLoading()" label="Saving form">
    <div style="border:1px solid var(--cngx-border,#ddd);border-radius:8px;padding:24px;display:flex;flex-direction:column;gap:12px">
      <input placeholder="Name" style="padding:8px 12px;border:1px solid var(--cngx-border,#ddd);border-radius:6px" />
      <input placeholder="Email" style="padding:8px 12px;border:1px solid var(--cngx-border,#ddd);border-radius:6px" />
      <button type="button" class="chip">A button inside the overlay</button>
    </div>
  </cngx-loading-overlay>`,
    },
  ],
};
